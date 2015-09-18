/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
 /**
 * Category controller
 *
 * Changes in version 2.1 (Myyna NodeJS Roles and Users Update):
 * - modified category_action function to more resemble the corresponding board creation function
 * - added categoryList function
 *
 * Changes in version 2.2 (Myyna Activity and Timeline Features):
 * - added logic to save story and notify users when creating a category
 *
 * Changes in version 2.3 (Myyna Web Application List View Update):
 * - added logic to diplay items as list and to add extra information
 *
 * Changes in version 2.4 (Myyna [Bug Bounty]):
 * - added moreCategories method
 * - removed user_name story field
 * - added logic to sanitze image names
 *
 * LICENSE: MIT
 *
 * @category cubetboard
 * @package Category
 * @copyright Copyright (c) 2007-2014 Cubet Technologies. (http://cubettechnologies.com)
 * @version 2.4
 * @author Rahul P R <rahul.pr@cubettech.com>, MonicaMuranyi
 * @Date 18-Nov-2013
 */

var catModel    = system.getModel('category');
var roleModel      = system.getModel('role');
var UserModel       = system.getModel('user');
var userRoleModel   = system.getModel('userRole');
var storyModel = system.getModel('story');
var fs          = require('fs'); 
var formidable  = require('formidable');
var im          = require('imagemagick');
var path            = require('path');
var catImagePath = path.join(appPath ,'/uploads/categories/');
var maxImageSize    = 500;
var validImage      = ['image/jpeg','image/pjpeg','image/png'];
var _ = require('underscore');
var async = require('async');

system.loadHelper('timelineHelper');
system.loadHelper('routes');
system.loadHelper('constants');

var INITIAL_PAGE_SIZE = 15;
var DEFAULT_PAGE_SIZE = 5;

var categoryController = {
    /**
     *  shows a form to add category
     *  @author Rahul P R <rahul.pr@cubettech.com>
     *  @Date 18-Nov-2013
     */
    category_form:function(req, res){
       var data = {
            layout  : 'urlfetch_layout',
            msg     : '',
            posted_data : []
        };
        system.loadView(res, path.join('','pin_image/category_form'), data);
    },
    /**
     *  insert details to db and save image
     *  @author Rahul P R <rahul.pr@cubettech.com>
     *  @Date 18-Nov-2013
     */
    category_action:function(req, res){
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            var 
            cur_time        = new Date(),
            fileSize        = files.cat_img ? files.cat_img.size : 0 ,
            fileType        = files.cat_img ? files.cat_img.type : '' ,
            img_name        = files.cat_img ? HELPER.sanitizeImageName(files.cat_img.name) : '' ,
            img_name_time   = cur_time.getTime() + '_' + img_name,
            img_path        = files.cat_img ? files.cat_img.path : '' ,
            category        = fields.category ? fields.category : '' ,
            description     = fields.description ? fields.description : '' ,
            newPath         = catImagePath + img_name,
            tmb_name        = img_name_time,
            tmb_path        = catImagePath + tmb_name,
            tmb_path2       = path.join(catImagePath , 'thumb/' + tmb_name);
            
            if (category == '' || description == '' || img_name == ''){
                var data = {
                    error   : 1,
                    msg     : 'Please fix the errors below'
                };
                if (category == '') {
                  data.msgName = 'Category Name is required';
                }
                if (description == '') {
                  data.msgDescription = 'Category Description is required';
                }
                if (img_name == '') {
                  data.msgImage = 'Category Image is required';
                }
                res.send(data);
                
            } else if (!HELPER.typeValid(validImage,fileType)){
                var data = {
                    error   : 1,
                    msg     : 'Please fix the errors below'
                };
                data.msgImage = 'Invalid image format';
                res.send(data);
            } else if(fileSize  >  maxImageSize * 1024 ){
                var data = {
                    error   : 1,
                    msg     : 'Please fix the errors below'
                };
                data.msgImage = 'Image size should less than ' + maxImageSize + ' Kb' ;
                res.send(data);
            } else {
                // save images to folder
                fs.readFile(img_path, function(err, data){
                    // write file to folder
                    fs.writeFile(newPath, data, function(err){
                        fs.unlink(img_path);
                        //  resize options
                        var rez_opt = {srcPath: newPath,
                            dstPath: tmb_path,
                            width: 400
                        };
                        var rez_opt2 = {srcPath: newPath,
                            dstPath: tmb_path2,
                            width: 120,
                            height: 120
                        };
                        im.resize(rez_opt, function(err, stdout, stderr){
                            im.resize(rez_opt2, function(err2, stdout2, stderr2){
                                if (err)
                                    throw err;
                                //delete uploaded image
                                fs.unlink(newPath, function(){
                                });
                                var db_data = {
                                    category_name: fields.category,
                                    description: fields.description,
                                    image: tmb_name,
                                    creator: mongo.ObjectID(req.session.login_user_id),
                                    timestamp : cur_time
                                };
                                //insert to database
                                catModel.insert(db_data,function(inserted_data){
                                    // create story for adding a category
                                    var story = {
                                        timestamp: inserted_data[0].timestamp,
                                        user_id: mongo.ObjectID(req.session.login_user_id),
                                        action: HELPER.ACTIVITY_VERBS.CREATE,
                                        item_type: HELPER.ACTIVITY_TYPES.CATEGORY,
                                        item_id: inserted_data[0]._id,
                                        item_name: inserted_data[0].category_name,
                                        item_image: inserted_data[0].image,
                                        updated_field_type: null,
                                        updated_field: null,
                                        old_value: null,
                                        new_value: null,
                                        related_item_type: null,
                                        related_item_id: null,
                                        related_item_name: null,
                                        related_item_image: null
                                    };
                                    storyModel.insert(story, function(newStory){
                                        HELPER.notifyAboutStory(req.session.login_user_id, newStory[0]);
                                        roleModel.getByName(HELPER.ROLE.OWNER, function(roles){
                                            var userRole = {
                                                user_id: mongo.ObjectID(req.session.login_user_id),
                                                role_id: mongo.ObjectID(roles[0]._id.toHexString()),
                                                resource_id: mongo.ObjectID(inserted_data[0]._id.toHexString()),
                                                type: HELPER.RESOURCE_TYPE.CATEGORY
                                            };
                                            userRoleModel.insert(userRole, function(){});
                                            // Add category to `/categories` page in realtime.
                                            var emitToSock = _.once(function(){
                                              // add data needed for the widgets
                                              catModel.getCategoryOne(inserted_data[0]._id.toHexString(), function(oneCategory){
                                                catModel.fillCategoriesWithExtraData(oneCategory, function(categories) {
                                                  var category = categories[0];
                                                  UserModel.userDetails(category.creator.toHexString(), function(user) {
                                                    category.creator_name = user[0].name;
                                                    category.creator_image = user[0].image;
                                                    sio.sockets.emit('new_cat', {
                                                      gridEl: system.getCompiledView(path.join('','pins/catWidget'), category),
                                                      listEl: system.getCompiledView(path.join('','pins/catListWidget'), category),
                                                      data: inserted_data[0]
                                                    });
                                                  });
                                                });
                                              });
                                            });
                                            emitToSock();
                                            // respond...
                                            res.send(inserted_data[0]._id.toHexString());
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            }
        });
    },
    /**
     * update category
     * @author Rahul P R <rahul.pr@cubettech.com>
     * @Date 18-Nov-2013
     */
    category_update:function(req, res){
        var con     = {'_id'            : req.body._id      };
        var db_data = {'category_name'  : req.body.category };
        catModel.update(con,db_data,function(updated_data){
            res.redirect('/success');
        });
    },
    /**
     * get all categories
     * @author Rahul P R <rahul.pr@cubettech.com>
     * @Date 18-Nov-2013
     */
    getcategory:function(req, res){
        catModel.getCategoryAll(function(categories){
            var data = {
                layout: 'urlfetch_layout',
                categories : categories
            }
            system.loadView(res, path.join('','pin_image/view_category'),data);
        });
    },
    /**
     * delete category
     * @author Rahul P R <rahul.pr@cubettech.com>
     * @Date 18-Nov-2013
     */
    delete_category:function(req, res){
        var _id = req.params.id ;
        catModel.getCategoryOne(_id,function(data){
            catModel.deleteCategory(_id,function(flag){
                if(flag===1){
                    //delete image if any
                    if (typeof data.cat_img != 'undefined' && data.cat_img!='') {
                        fs.unlink(catImagePath + data.cat_img);
                    }
                    res.redirect('/get_category');
                }else{
                    // not deleted
                }
            });
        });
    },
    /**
     * Prepares the data for category list page and loads the view
     *
     * @param req The http request object
     * @param res The http response object
     * @since 2.1
     */
    categoryList: function(req, res){
      catModel.getCategoriesPaginated(0, INITIAL_PAGE_SIZE, function(result) {
        var loginId = req.session.login_user_id;
        UserModel.userDetails(loginId, function(user) {
          // set the SSO information
          var SSO = null;
          if(user[0].username){
            var disqusSignon = require('../helpers/disqusSignon');
            SSO = disqusSignon({
              id: user[0]._id,
              username: user[0].username,
              email: user[0].email
            });
          }

          var data = {
            'data': result,
            'loiginuser': req.session.login_user_name,
            'loggeduser_id': loginId,
            'category': result,
            'user_image': user[0].image,
            'DEFINES': global.DEFINES,
            'HOST': global.sleekConfig.appHost,
            'SSO': SSO
          };
          system.loadView(res, path.join('','pins/categorylist'), data);
          system.setPartial(path.join('','pins/pinheader'), 'pinheader');
          system.setPartial(path.join('','pins/catWidget'), 'catWidget');
          system.setPartial(path.join('','pins/catListWidget'), 'catListWidget');
        });
      });
    },
    
    renderEditCatForm: function(req, res){
        catModel.getCategoryOne(req.params.catid, function(cat){
           var data = {
                layout: 'urlfetch_layout',
                msg: '',
                posted_data: cat[0] || {},
               editing: true
            };
            system.loadView(res, path.join('','pin_image/category_form'), data);
        });
    },
    
    updateCategory: function(req, res){
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            var 
            cur_time        = new Date(),
            fileSize        = files.cat_img ? files.cat_img.size : 0 ,
            fileType        = files.cat_img ? files.cat_img.type : '' ,
            img_name        = files.cat_img ? files.cat_img.name : '' ,
            img_name_time   = cur_time.getTime() + '_' + img_name,
            img_path        = files.cat_img ? files.cat_img.path : '' ,
            category        = fields.category ? fields.category.trim() : '' ,
            description     = fields.description ? fields.description.trim() : '' ,
            newPath         = catImagePath + img_name,
            tmb_name        = img_name_time,
            tmb_path        = catImagePath + tmb_name,
            tmb_path2       = path.join(catImagePath , 'thumb/' + tmb_name);

            if (category == '' || description == ''){
                var data = {
                  error   : 1,
                  msg     : 'Please fix the errors below'
                };
                if (category == '') {
                  data.msgName = 'Category Name is required';
                }
                if (description == '') {
                  data.msgDescription = 'Category Description is required';
                }
                res.send(data);

            } else if (fileType && !HELPER.typeValid(validImage,fileType)){
                var data = {
                  error   : 1,
                  msg     : 'Please fix the errors below'
                };
                data.msgImage = 'Invalid image format';
                res.send(data);
            } else if(fileType && fileSize  >  maxImageSize * 1024 ){
                var data = {
                  error   : 1,
                  msg     : 'Please fix the errors below'
                };
                data.msgImage = 'Image size should less than ' + maxImageSize + ' Kb' ;
                res.send(data);
            } else {
                async.waterfall([
                    function(cb){
                        HELPER.role_validate(req.session.login_user_id, req.params.catid, HELPER.ACTION.EDIT_CATEGORY.ROLE, res, cb);
                    },
                    function(cb){
                        if(fileType){
                            // save images to folder
                            fs.readFile(img_path, function(err, data){
                                // write file to folder
                                fs.writeFile(newPath, data, function(err){
                                    fs.unlink(img_path);
                                    //  resize options
                                    var rez_opt = {srcPath: newPath,
                                        dstPath: tmb_path,
                                        width: 400
                                    };
                                    var rez_opt2 = {srcPath: newPath,
                                        dstPath: tmb_path2,
                                        width: 120,
                                        height: 120
                                    };
                                    im.resize(rez_opt, function(err, stdout, stderr){
                                        im.resize(rez_opt2, function(err2, stdout2, stderr2){
                                            if (err)
                                                throw err;
                                            //delete uploaded image
                                            fs.unlink(newPath, function(){
                                            });
                                            
                                            cb();
                                        });
                                    });
                                });
                            });
                        }else{
                            cb();
                        }
                    },
                    function(cb){
                        mongodb.collection('category').find({
                            _id: mongo.ObjectID(req.params.catid)
                        }).toArray(cb);
                    },
                    function(cat, cb){
                        var db_data = {
                            category_name: fields.category,
                            description: fields.description,
                            image: fileType? tmb_name: cat[0].image,
                            creator: cat[0].creator,
                            timestamp: cat[0].timestamp
                        };
                        //insert to database
                        mongodb.collection('category').update({
                            _id: cat[0]._id
                        }, db_data, function(e){
                            if(e){
                                return cb(e);
                            }
                            // create story for adding a category
                            var story = {
                                timestamp: new Date(),
                                user_id: mongo.ObjectID(req.session.login_user_id),
                                action: HELPER.ACTIVITY_VERBS.UPDATE,
                                item_type: HELPER.ACTIVITY_TYPES.CATEGORY,
                                item_id: cat[0]._id,
                                item_name: fields.category,
                                item_image: fileType? tmb_name: cat[0].image,
                                related_item_type: null,
                                related_item_id: null,
                                related_item_name: null,
                                related_item_image: null,
                                updates: []
                            };
                            if(cat[0].category_name != fields.category){
                                story.updates.push({
                                    field: 'name',
                                    from: cat[0].category_name,
                                    to: fields.category
                                });
                                story.action = HELPER.ACTIVITY_VERBS.RENAME;
                            }
                            if(cat[0].description != fields.description){
                                story.updates.push({
                                    field: 'description',
                                    from: cat[0].description,
                                    to: fields.description
                                });
                            }
                            if(fileType && cat[0].image != tmb_name){
                                story.updates.push({
                                    field: 'image',
                                    from: cat[0].image,
                                    to: tmb_name
                                });
                            }
                            
                            storyModel.insert(story, function(newStory){
                                HELPER.notifyAboutStory(req.session.login_user_id, newStory[0]);
                                // Update category on `/categories` page in realtime.
                                var emitToSock = _.once(function(){
                                  // add data needed for the widgets
                                  catModel.getCategoryOne(cat[0]._id.toHexString(), function(oneCategory){
                                    catModel.fillCategoriesWithExtraData(oneCategory, function(categories) {
                                      var category = categories[0];
                                      UserModel.userDetails(category.creator.toHexString(), function(user) {
                                        category.creator_name = user[0].name;
                                        category.creator_image = user[0].image;
                                        sio.sockets.emit('update_cat', {
                                          gridEl: system.getCompiledView(path.join('','pins/catWidget'), category),
                                          listEl: system.getCompiledView(path.join('','pins/catListWidget'), category),
                                          data: _.extend(cat[0], db_data)
                                        });
                                      });
                                    });
                                  });
                                });
                                emitToSock();
                                // respond...
                                res.send(cat[0]._id.toHexString());
                            });
                        });
                    }
                ], function(e){
                    if(e){
                        var data = {
                            error   : 1,
                            msg     : e.message
                        };
                        return res.send(data);
                    }
                    
                });
            }
        });
    },
    /**
     * Loads paginated categories
     *
     * @param req The http request object
     * @param res The http response object
     * @since 2.4
     */
    moreCategories: function(req, res){
        var skip = req.body.skip ? Number(req.body.skip) : 0;
        var limit = req.body.limit ? Number(req.body.limit) : DEFAULT_PAGE_SIZE;
        var view = req.params.view;
        catModel.getCategoriesPaginated(skip, limit, function(categories) {
            var data = {
                data: categories,
                layout: false
            };
            system.loadView(res, path.join('','pins/'+(view == 'list'? 'moredataCategoriesList' : 'moredataCategoriesGrid')), data);
        });
    }
};

module.exports = categoryController;