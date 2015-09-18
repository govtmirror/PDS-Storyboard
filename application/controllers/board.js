/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Controller for adding board
 *
 * Changes in version 2.1 (Myyna NodeJS Roles and Users Update):
 * - modified board_form function to filter the categories based on the logged in user's role
 * - modified board_action function to perform authorization before the actual logic
 *
 * Changes in version 2.2 (Myyna Activity and Timeline Features):
 * - added logic to save story and notify users when creating, following or unfollowing a board
 *
 * Changes in version 2.3 (Myyna Web Application List View Update):
 * - added logic to diplay items as list and to add extra information
 *
 * Changes in version 2.4 (Myyna [Bug Bounty]):
 * - removed user_name story field
 * - added logic to sanitze image names
 *
 * LICENSE: MIT
 *
 * @category cubetboard
 * @package Board
 * @copyright Copyright (c) 2007-2014 Cubet Technologies. (http://cubettechnologies.com)
 * @version 2.4
 * @author Rahul P R <rahul.pr@cubettech.com>, MonicaMuranyi, kiril.kartunov
 * @Date 18-Nov-2013
 */

var 
boardModel      = system.getModel('board'),
catModel        = system.getModel('category'),
costModel       = system.getModel('cost'),
roleModel       = system.getModel('role'),
userRoleModel   = system.getModel('userRole'),
storyModel      = system.getModel('story'),
fs              = require('fs'),
path            = require('path'),
formidable      = require('formidable'),
boardImagePath  = path.join(appPath,'/uploads/boards/'),
im              = require('imagemagick'),
UserModel       = system.getModel('user'),
FollowerModel   = system.getModel('follower'),
notificationModel = system.getModel('notification'),
async = require('async'),
maxImageSize    = 500 ,//size in Kb
_ = require('underscore'),
validImage      = ['image/jpeg','image/pjpeg','image/png'];
system.loadHelper('myhelper');
system.loadHelper('constants');
system.loadHelper('routes');
system.loadHelper('timelineHelper');

var boardController = {
    /**
     * shows a form to add board
     * @author Rahul P R <rahul.pr@cubettech.com>
     * @Date 18-Nov-2013
     */
    board_form: function(req, res) {
        roleModel.getByName(HELPER.ROLE.ADMIN, function(roles){
            var loginId = req.session.login_user_id;
            userRoleModel.findByUserAndRole(loginId, roles[0]._id.toHexString(), function(userRoles){
                var catIds = [];
                userRoles.forEach(function(userRole){
                    catIds.push(userRole.resource_id.toHexString());
                });
                catModel.getCategoriesByIdsOrCreator(catIds, loginId, function(categories) {
                    costModel.getCostAll(function(cost) {
                        var data = {
                            layout: 'urlfetch_layout',
                            msg: '',
                            categories: categories,
                            cost: cost,
                            posted_data: []
                        };
                        system.loadView(res, path.join('','pin_image/board_form'), data);
                    });
                });
            });
        });
    },
    /**
     *  retrieve posted data from form & insert details to db
     *  @author Rahul P R <rahul.pr@cubettech.com>
     *  @Date 18-Nov-2013
     */
    board_action: function(req, res) {
        var form = new formidable.IncomingForm();
        var user = req.session.login_user_id;
        form.parse(req, function(err, fields, files) {
            var 
            cur_time        = new Date(),
            fileSize        = files.board_img ? files.board_img.size : 0 ,
            fileType        = files.board_img ? files.board_img.type : '' ,
            img_name        = files.board_img ? HELPER.sanitizeImageName(files.board_img.name) : '' ,
            img_name_time   = cur_time.getTime() + '_' + img_name,
            img_path        = files.board_img ? files.board_img.path : '' ,
            // cost         = fields.cost,
            board_name      = fields.board_name ? fields.board_name : '' ,
            description     = fields.description ? fields.description : '' ,
            category_id     = fields.category_id ? fields.category_id : '' ,
            newPath         = boardImagePath + img_name,
            tmb_name        = img_name_time,
            tmb_path        = boardImagePath + tmb_name,
            tmb_path2       = path.join(boardImagePath , 'thumb/' + tmb_name);
            
            var process = function() {
                if (category_id == '' ||
                      //cost =='' ||
                      board_name == '' ||
                      description == '' ||
                      img_name == '') {
                    var data = {
                        error   : 1,
                        msg     : 'Please fix the errors below.'
                    } ;
                    if (category_id == '') {
                      data.msgCategory = 'Category is required';
                    }
                    if (board_name == '') {
                      data.msgName = 'Board Name is required';
                    }
                    if (description == '') {
                      data.msgDescription = 'Category Description is required';
                    }
                    if (img_name == '') {
                      data.msgImage = 'Category Image is required';
                    }
                    res.send(data);
                    
                } else if (!HELPER.typeValid(validImage,fileType)) {
                    var data = {
                        error   : 1,
                        msg     : 'Please fix the errors below.'
                    } ;
                    data.msgImage = 'Invalid image format';
                    res.send(data);
                } else if(fileSize  >  maxImageSize * 1024 ) {
                    var data = {
                        error   : 1,
                        msg     : 'Please fix the errors below.'
                    } ;
                    data.msgImage = 'Image size should less than ' + maxImageSize + ' Kb' ;
                    res.send(data);
                } else {
                    // save images to folder
                    fs.readFile(img_path, function(err, data) {
                        // write file to folder
                        fs.writeFile(newPath, data, function(err) {
                            //  console.log('renamed complete');
                            fs.unlink(img_path);
                            //  resize options
                            var rez_opt = {srcPath: newPath,
                                dstPath: tmb_path,
                                width: 400 // width of image
                            };
                            var rez_opt2 = {srcPath: newPath,
                                dstPath: tmb_path2,
                                width: 120, // width of image
                                height: 120 // height of image
                            };
                            im.resize(rez_opt, function(err, stdout, stderr) {
                                im.resize(rez_opt2, function(err2, stdout2, stderr2) {
                                    if (err)
                                        throw err;
                                    //delete uploaded image
                                    fs.unlink(newPath, function() {
                                    });
                                    var db_data = {
                                        locked :0,
                                        board_name: fields.board_name,
                                        description: fields.description,
                                        category_id: mongo.ObjectID(category_id),
                                        //cost            :   fields.cost,
                                        cost: 1,
                                        image: tmb_name,
                                        creator: mongo.ObjectID(req.session.login_user_id),
                                        timestamp : cur_time
                                    };
                                    //insert to database
                                    boardModel.insert(db_data, function(inserted_data) {
                                        catModel.getCategoryOne(category_id, function(categories){
                                            // create story for adding a board
                                            var story = {
                                                timestamp: inserted_data[0].timestamp,
                                                user_id: mongo.ObjectID(req.session.login_user_id),
                                                action: HELPER.ACTIVITY_VERBS.CREATE,
                                                item_type: HELPER.ACTIVITY_TYPES.BOARD,
                                                item_id: inserted_data[0]._id,
                                                item_name: inserted_data[0].board_name,
                                                item_image: inserted_data[0].image,
                                                updated_field_type: null,
                                                updated_field: null,
                                                old_value: null,
                                                new_value: null,
                                                related_item_type: HELPER.ACTIVITY_TYPES.CATEGORY,
                                                related_item_id: categories[0]._id,
                                                related_item_name: categories[0].category_name,
                                                related_item_image: categories[0].image
                                            };
                                            storyModel.insert(story, function(newStory){
                                                HELPER.notifyAboutStory(req.session.login_user_id, newStory[0]);
                                                roleModel.getByName(HELPER.ROLE.OWNER, function(roles){
                                                    var userRole = {
                                                        user_id: mongo.ObjectID(req.session.login_user_id),
                                                        role_id: mongo.ObjectID(roles[0]._id.toHexString()),
                                                        resource_id: mongo.ObjectID(inserted_data[0]._id.toHexString()),
                                                        type: HELPER.RESOURCE_TYPE.BOARD
                                                    };

                                                    userRoleModel.insert(userRole, function(){});

                                                    //send notification to followers of board creator
                                                    UserModel.findFollowers(user, "user", function(followers)
                                                    {

                                                        var msg = req.session.login_user_name + " creates a board";

                                                        for (i in followers)
                                                        {
                                                            //console.log(followers[i])

                                                            HELPER.socketNotification(followers[i].value.socket_id, 'notification', msg, '', false);

                                                            var notification_data =
                                                                    {
                                                                        key: "board creation"
                                                                        , notification_generator: req.session.login_user_id
                                                                        , notification_acceptor: followers[i]._id
                                                                        , notification: msg
                                                                        , status: ""
                                                                    }
                                                            notificationModel.NotificationInsertion(notification_data, function(callback)
                                                            {

                                                            });
                                                            i++;
                                                        }
                                                    });
                                                });
                                                // Add board to `/boards` page in realtime.
                                                var emitToSock = _.once(function(){
                                                  var render_data = _.extend(inserted_data[0], {
                                                      loggeduser_id: req.session.login_user_id
                                                  });
                                                  // add data needed for the widgets
                                                  boardModel.getBoardOne(render_data._id.toHexString(), function(oneBoard){
                                                    boardModel.fillBoardsWithExtraData(oneBoard, req.session.login_user_id, function(boards) {
                                                      var board = boards[0];
                                                      UserModel.userDetails(board.creator.toHexString(), function(user) {
                                                        board.creator_name = user[0].name;
                                                        board.creator_image = user[0].image;
                                                        sio.sockets.emit('board_item', {
                                                          gridEl: system.getCompiledView(path.join('','pins/boardWidget'), board),
                                                          listEl: system.getCompiledView(path.join('','pins/boardListWidget'), board),
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
            };
          if(category_id == '') {
            process();
          } else {
            // Authorization
            HELPER.role_validate(req.session.login_user_id, category_id, HELPER.ACTION.CREATE_BOARD_IN_CATEGORY.ROLE, res, function () {
              process();
            });
          }
        });
    },
    /**
     *  get all boards
     *  @author Rahul P R <rahul.pr@cubettech.com>
     *  @Date 18-Nov-2013
     */
    getboard: function(req, res) {
        boardModel.getBoardAll(function(boards) {
            var data = {
                layout: 'urlfetch_layout',
                boards: boards
            }
            system.loadView(res, path.join('','pin_image/view_board'), data);
        });
    },
    /**
     *  delete board 
     *  @author Rahul P R <rahul.pr@cubettech.com>
     *  @Date 18-Nov-2013
     */
    delete_board: function(req, res) {
        var id = req.params.id;
        boardModel.deleteBoard(id, function(flag) {
            if (flag === 1) {
                res.redirect('/get_board');
            } 
        });
    },
  /**
   *  List all board except logged user's
   *  @author Arya <arya@cubettech.com>
   *  @Date 22-11-2013
   */
  boardList: function(req, res){
    catModel.getCategoryAll(function(categories) {
      boardModel.SelectedBoards(req.session.login_user_id, function(boards) {
        UserModel.userDetails(req.session.login_user_id, function(user) {
          var SSO = null;
          if(user[0].username){
            var disqusSignon = require('../helpers/disqusSignon');
            // set the SSO information
            SSO = disqusSignon({
              id: user[0]._id,
              username: user[0].username,
              email: user[0].email
            });
          }

          boards.forEach(function(board){
            board.loggeduser_id = req.session.login_user_id;
          });
          var data = {
            'data': boards,
            'pagetitle': 'Boards',
            'loiginuser': req.session.login_user_name,
            'loggeduser_id':req.session.login_user_id,
            'category': categories,
            'user_image': user[0].image,
            'user_name': user[0].name,
            'user_id': user[0]._id,
            'DEFINES': global.DEFINES,
            'HOST': global.sleekConfig.appHost,
            'SSO': SSO

          };
          //console.log(data);
          system.loadView(res, path.join('','pins/boardlist'), data);
          system.setPartial(path.join('','pins/pinheader'), 'pinheader');
          system.setPartial(path.join('','pins/boardWidget'), 'boardWidget');
          system.setPartial(path.join('','pins/boardListWidget'), 'boardListWidget');
        });
      });
    });
  },
    /**
     *  follows a particular board
     *  @author Arya <arya@cubettech.com>
     *  @Date 22-11-2013
     */
    followBoard: function(req, res) {
        var insert_data = {
                    "follower_id": req.body.board_id,
                    "followed_by": req.session.login_user_id,
                    "time": new Date().getTime(),
                    "followed_by_name": req.session.login_user_name,
                    "follow_type": "board"
                }
        FollowerModel.followerCheck(insert_data, function(res1)
            {
                if (res1)
                {
                    FollowerModel.insertFollower(insert_data, function(ress) {

                        if (ress)
                        {
                            boardModel.getBoardOne(req.body.board_id,function(boardcreator){
				                catModel.getCategoryOne(boardcreator[0].category_id.toHexString(), function(categories) {
                                    // create story for follow a board
	                                var story = {
	                                    timestamp: new Date(),
	                                    user_id: mongo.ObjectID(req.session.login_user_id),
	                                    action: HELPER.ACTIVITY_VERBS.FOLLOW,
	                                    item_type: HELPER.ACTIVITY_TYPES.BOARD,
	                                    item_id: boardcreator[0]._id,
	                                    item_name: boardcreator[0].board_name,
	                                    item_image: boardcreator[0].image,
	                                    updated_field_type: null,
	                                    updated_field: null,
	                                    old_value: null,
	                                    new_value: null,
	                                    related_item_type: HELPER.ACTIVITY_TYPES.CATEGORY,
	                                    related_item_id: categories[0]._id,
	                                    related_item_name: categories[0].category_name,
	                                    related_item_image: categories[0].image
	                                };
	                                storyModel.insert(story, function(newStory){
	                                    HELPER.notifyAboutStory(req.session.login_user_id, newStory[0]);
	                                    roleModel.getByName(HELPER.ROLE.FOLLOWER, function(roles){
	                                        var userRole = {
	                                            user_id: mongo.ObjectID(req.session.login_user_id),
	                                            role_id: mongo.ObjectID(roles[0]._id.toHexString()),
	                                            resource_id: mongo.ObjectID(boardcreator[0]._id.toHexString()),
	                                            type: HELPER.RESOURCE_TYPE.BOARD
	                                        };
	                                        userRoleModel.insert(userRole, function(){
	                                            if(boardcreator && boardcreator[0].creator == req.session.login_user_id){
	                                                var msg = insert_data.followed_by_name + " followed his/her own board";
	                                            }
	                                            else{
	                                                var msg = insert_data.followed_by_name + " followed your board";
	                                            }

	                                            UserModel.getUserSocketId(req.body.user_id, function(user) {

	                                                if (user.length > 0)
	                                                {
	                                                    var notification_data =
	                                                    {
	                                                        key: "board_follow"
	                                                        ,
	                                                        notification_generator: req.session.login_user_id
	                                                        ,
	                                                        notification_acceptor:  mongo.ObjectID(req.body.user_id)
	                                                        ,
	                                                        notification: msg
	                                                        ,
	                                                        status: 1
	                                                    }
	                                                    UserModel.UserSettings(user[0]._id.toHexString(), function(settings){

	                                                        if(settings[0].follow==1){
	                                                            HELPER.socketNotification(user[0].socket_id, 'notification', msg, '', false);
	                                                        }
	                                                        else{

	                                                            notification_data.status=0;
	                                                        }
	                                                        notificationModel.NotificationInsertion(notification_data, function(callback) {

	                                                            });
	                                                    });

	                                                    var data = {
	                                                        "data": "inserted"
	                                                    };
	                                                    res.send(200, data);
	                                                } else {
	                                                    var data = {
	                                                        "data": "inserted"
	                                                    };
	                                                    res.send(200, data);
	                                                }
	                                            });
	                                        });

	                                    });
	                                });

                                });
                            });
                        }
                    });
                }
            else
            {
                res.send(200, false);
                console.log('already followed');
            }
        });
    },
    /**
     *  unfollows a particular board
     *  @author Arya <arya@cubettech.com>
     *  @Date 22-11-2013
     */
    unFollowBoard: function(req, res) {
        var insert_data =
                {
                    "follower_id": req.body.board_id,
                    "followed_by": req.session.login_user_id,
                    "follow_type": "board"
                }
        FollowerModel.BoardUnfollow(insert_data, function(remove) {
            boardModel.getBoardOne(req.body.board_id,function(boardcreator){
                catModel.getCategoryOne(boardcreator[0].category_id.toHexString(), function(categories){
	console.log('board ' + JSON.stringify(boardcreator));
	console.log('categories ' + JSON.stringify(categories[0]));

                    // create story for unfollowing board
                    var story = {
                        timestamp: new Date(),
                    	user_id: mongo.ObjectID(req.session.login_user_id),
	                    action: HELPER.ACTIVITY_VERBS.UNFOLLOW,
	                    item_type: HELPER.ACTIVITY_TYPES.BOARD,
	                    item_id: boardcreator[0]._id,
	                    item_name: boardcreator[0].board_name,
	                    item_image: boardcreator[0].image,
	                    updated_field_type: null,
	                    updated_field: null,
	                    old_value: null,
	                    new_value: null,
	                    related_item_type: HELPER.ACTIVITY_TYPES.CATEGORY,
	                    related_item_id: categories[0]._id,
	                    related_item_name: categories[0].category_name,
                        related_item_image: categories[0].image,
                   };
			storyModel.insert(story, function(newStory){
	                    HELPER.notifyAboutStory(req.session.login_user_id, newStory[0]);
	                    roleModel.getByName(HELPER.ROLE.FOLLOWER, function(roles){
	                        userRoleModel.removeByRoleResAndUser(roles[0]._id.toHexString(), boardcreator[0]._id.toHexString(), req.session.login_user_id, function(){
	                            var data = {"data": "removed"};
	                            res.send(200, data);
	                        });
	                    });
	                });
	            });
            });
        });
    },

    renderEditBoardForm: function(req, res){
        roleModel.getByName(HELPER.ROLE.ADMIN, function(roles){
            var loginId = req.session.login_user_id;
            userRoleModel.findByUserAndRole(loginId, roles[0]._id.toHexString(), function(userRoles){
                var catIds = [];
                userRoles.forEach(function(userRole){
                    catIds.push(userRole.resource_id.toHexString());
                });
                catModel.getCategoriesByIdsOrCreator(catIds, loginId, function(categories) {
                    costModel.getCostAll(function(cost) {
                        boardModel.getBoardOne(req.params.bid, function(board){
                            var data = {
                                layout: 'urlfetch_layout',
                                msg: '',
                                categories: categories,
                                cost: cost,
                                posted_data: board[0] || {},
                                editing: true
                            };
                            system.loadView(res, path.join('','pin_image/board_form'), data);
                        });
                    });
                });
            });
        });
    },
    
    updateBoard: function(req, res){
        var form = new formidable.IncomingForm();
        var user = req.session.login_user_id;
        form.parse(req, function(err, fields, files) {
            var 
            cur_time        = new Date(),
            fileSize        = files.board_img ? files.board_img.size : 0 ,
            fileType        = files.board_img ? files.board_img.type : '' ,
            img_name        = files.board_img ? files.board_img.name : '' ,
            img_name_time   = cur_time.getTime() + '_' + img_name,
            img_path        = files.board_img ? files.board_img.path : '' ,
            // cost         = fields.cost,
            board_name      = fields.board_name ? fields.board_name.trim() : '' ,
            description     = fields.description ? fields.description.trim() : '' ,
            category_id     = fields.category_id ? fields.category_id.trim() : '' ,
            newPath         = boardImagePath + img_name,
            tmb_name        = img_name_time,
            tmb_path        = boardImagePath + tmb_name,
            tmb_path2       = path.join(boardImagePath , 'thumb/' + tmb_name);
            

            if (category_id == '' ||
                board_name == '' ||
                description == '') 
            {
                var data = {
                  error   : 1,
                  msg     : 'Please fix the errors below.'
                } ;
                if (category_id == '') {
                  data.msgCategory = 'Category is required';
                }
                if (board_name == '') {
                  data.msgName = 'Board Name is required';
                }
                if (description == '') {
                  data.msgDescription = 'Category Description is required';
                }
                res.send(data);
            } else if (fileType && !HELPER.typeValid(validImage,fileType)) {
                var data = {
                  error   : 1,
                  msg     : 'Please fix the errors below.'
                } ;
                data.msgImage = 'Invalid image format';
                res.send(data);
            } else if(fileType && fileSize  >  maxImageSize * 1024 ) {
                var data = {
                  error   : 1,
                  msg     : 'Please fix the errors below.'
                } ;
                data.msgImage = 'Image size should less than ' + maxImageSize + ' Kb' ;
                res.send(data);
            } else {
                async.waterfall([
                    function(cb){
                        HELPER.role_validate(req.session.login_user_id, req.params.bid, HELPER.ACTION.EDIT_BOARD.ROLE, res, cb);
                    },
                    function(cb){
                        if(fileType){
                            // save images to folder
                            fs.readFile(img_path, function(err, data) {
                                // write file to folder
                                fs.writeFile(newPath, data, function(err) {
                                    //  console.log('renamed complete');
                                    fs.unlink(img_path);
                                    //  resize options
                                    var rez_opt = {srcPath: newPath,
                                        dstPath: tmb_path,
                                        width: 400 // width of image
                                    };
                                    var rez_opt2 = {srcPath: newPath,
                                        dstPath: tmb_path2,
                                        width: 120, // width of image
                                        height: 120 // height of image
                                    };
                                    im.resize(rez_opt, function(err, stdout, stderr) {
                                        im.resize(rez_opt2, function(err2, stdout2, stderr2) {
                                            if (err)
                                                throw err;
                                            //delete uploaded image
                                            fs.unlink(newPath, function() {
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
                        mongodb.collection('board').find({
                            _id: mongo.ObjectID(req.params.bid)
                        }).toArray(cb);
                    },
                    function(boards, cb){
                        mongodb.collection('category').find({
                            _id: boards[0].category_id
                        }).toArray(function(e, cats){
                            if(e){
                                return cb(e);
                            }
                            cb(null, {
                                board: boards,
                                cat: cats
                            });
                        });
                    },
                    function(con, cb){
                        var db_data = {
                            board_name: fields.board_name,
                            description: fields.description,
                            category_id: mongo.ObjectID(fields.category_id),
                            timestamp : con.board[0].timestamp,
                            locked: con.board[0].locked,
                            cost: con.board[0].cost,
                            creator: con.board[0].creator,
                            image: fileType? tmb_name: con.board[0].image
                        };
                        //update to database
                        mongodb.collection('board').update({
                            _id: con.board[0]._id
                        }, db_data, function(e) {
                            if(e){
                                return cb(e);
                            }
                            catModel.getCategoryOne(category_id, function(categories){
                                // create story for updating a board
                                var story = {
                                    timestamp: new Date(),
                                    user_id: mongo.ObjectID(req.session.login_user_id),
                                    action: HELPER.ACTIVITY_VERBS.UPDATE,
                                    item_type: HELPER.ACTIVITY_TYPES.BOARD,
                                    item_id: con.board[0]._id,
                                    item_name: fields.board_name,
                                    item_image: fileType? tmb_name: con.board[0].image,
                                    updated_field_type: null,
                                    updated_field: null,
                                    old_value: null,
                                    new_value: null,
                                    related_item_type: HELPER.ACTIVITY_TYPES.CATEGORY,
                                    related_item_id: categories[0]._id,
                                    related_item_name: categories[0].category_name,
                                    related_item_image: categories[0].image,
                                    updates: []
                                };
                                if(con.board[0].board_name != fields.board_name){
                                    story.updates.push({
                                        field: 'name',
                                        from: con.board[0].board_name,
                                        to: fields.board_name
                                    });
                                    story.action = HELPER.ACTIVITY_VERBS.RENAME;
                                }
                                if(con.board[0].description != fields.description){
                                    story.updates.push({
                                        field: 'description',
                                        from: con.board[0].description,
                                        to: fields.description
                                    });
                                }
                                if(fileType && con.board[0].image != tmb_name){
                                    story.updates.push({
                                        field: 'image',
                                        from: con.board[0].image,
                                        to: tmb_name
                                    });
                                }
                                if(con.board[0].category_id.toHexString() != fields.category_id){
                                    story.updates.push({
                                        field: 'category',
                                        from: con.cat[0].category_name,
                                        to: categories[0].category_name
                                    });
                                    story.action = HELPER.ACTIVITY_VERBS.MOVE;
                                }
                                storyModel.insert(story, function(newStory){
                                    HELPER.notifyAboutStory(req.session.login_user_id, newStory[0]);

                                        //send notification to followers of board creator
                                        UserModel.findFollowers(user, "user", function(followers){

                                            var msg = req.session.login_user_name + " updates a board";

                                            for (var i in followers)
                                            {
                                                HELPER.socketNotification(followers[i].value.socket_id, 'notification', msg, '', false);
                                                var notification_data = {
                                                    key: "board creation"
                                                    , notification_generator: req.session.login_user_id
                                                    , notification_acceptor: followers[i]._id
                                                    , notification: msg
                                                    , status: ""
                                                };
                                                        
                                                notificationModel.NotificationInsertion(notification_data, function(){});
                                                i++;
                                            }
                                        });
                                    // Update board to `/boards` page in realtime.
                                    var render_data,
                                    emitToSock = _.once(function(){
                                      render_data = _.extend(con.board[0], db_data, {
                                          loggeduser_id: req.session.login_user_id
                                      });
                                      // add data needed for the widgets
                                      boardModel.getBoardOne(render_data._id.toHexString(), function(oneBoard){
                                        boardModel.fillBoardsWithExtraData(oneBoard, req.session.login_user_id, function(boards) {
                                          var board = boards[0];
                                          UserModel.userDetails(board.creator.toHexString(), function(user) {
                                            board.creator_name = user[0].name;
                                            board.creator_image = user[0].image;
                                            sio.sockets.emit('board_update', {
                                              gridEl: system.getCompiledView(path.join('','pins/boardWidget'), board),
                                              listEl: system.getCompiledView(path.join('','pins/boardListWidget'), board),
                                              data: render_data
                                            });
                                          });
                                        });
                                      });
                                    });
                                    emitToSock();
                                    // respond...
                                    res.send(render_data._id.toHexString());
                                });
                            });
                        });
                    }
                ], function(e, r){
                    
                });
            }
        }); 
    },
    /**
     * Boards list pagination
     * @param {Object} req
     * @param {Object} res
     * @since 2.4
     */
    moreBoards: function(req, res){
        //set start and end limits for taking data from db
        var start = req.body.startlimit ? req.body.startlimit : 0;
        var end = req.body.endlimit ? req.body.endlimit : 15;
        var view = req.params.view;

        boardModel.SelectedBoards(req.session.login_user_id, {skip: start, limit: end}, function(boards) {
            var data = {
                'data': boards,
                layout: false
            };
            system.loadView(res, path.join('','pins/'+(view == 'list'? 'moredataBoardsList' : 'moredataBoardsGrid')), data);
        });
    }
};

module.exports = boardController;
