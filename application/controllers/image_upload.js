/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * controller for uploading all type of pins from computer
 *
 * Changes in version 2.1 (Myyna NodeJS Roles and Users Update):
 * - modified addpin function to account for the new role changes
 * - modified addimg function to perform authorization before the actual logic
 *
 * Changes in version 2.2 (Myyna Activity and Timeline Features):
 * - added logic to save story and notify users when adding a pin
 *
 * Changes in version 2.3 (Myyna [Bug Bounty]):
 * - removed user_name story field
 * 
 * Changes in version 2.4 (Myyna [Bug Bounty]):
 * - added logic to sanitze image names
 * 
 * Changes in version 2.5 (Myyna [Bug Bounty]):
 * - removed audio/video pins
 *
 * LICENSE: MIT
 *
 * @category cubetboard
 * @package Pins
 * @subpackage image,audio,video
 * @copyright Copyright (c) 2007-2014 Cubet Technologies. (http://cubettechnologies.com)
 * @version 2.4
 * @author Rahul P R <rahul.pr@cubettech.com>, MonicaMuranyi, kiril.kartunov
 * @date 18-Nov-2013
 */

var fs = require('fs');
var fse = require('fs-extra');
var exec = require('child_process').exec;
var url = require('url');
var http = require('http');
var path = require('path');
var util = require('util');
var sys = require('sys');
var formidable = require('formidable');
var im = require('imagemagick');
var img_arr = []; // image array
var tmb_img_arr = []; // thumb image array
var imagepinModel = system.getModel('imagepin');
var PostModel = system.getModel('pin');
var boardModel = system.getModel('board');
var roleModel = system.getModel('role');
var UserModel = system.getModel('user');
var userRoleModel = system.getModel('userRole');
var storyModel = system.getModel('story');
var async = require('async');

system.loadHelper('myhelper');
system.loadHelper('routes');
system.loadHelper('timelineHelper');
system.loadHelper('constants');

var 
maxImageSize = 1,//size in Mb
maxAudioSize = 5,
maxVideoSize = 10,
maxPdfSize = 5,
// supported formats
validImage   = HELPER.SUPPORTED_FILES.validImage,
validPdf     = HELPER.SUPPORTED_FILES.validPdf;

var imageController = {
    /**
     * shows a form for adding pin from computer and from web
     * @author Rahul P R <rahul.pr@cubettech.com>
     * @date 27-Dec-2013
     */
    addpin: function(req, res) {
        HELPER.getAllAuthorizedBoards(req.session.login_user_id, HELPER.ACTION.CREATE_PIN.ROLE, function(result){
            var data = {
                layout: 'urlfetch_layout',
                boards: result
            };
            system.loadView(res, path.join('','pin_image/addpin'), data);
        });
    },
    /**
     * shows a form to browse image
     * @author Rahul P R <rahul.pr@cubettech.com>
     * @date 18-Nov-2013
     */
    browse_image: function(req, res) {
        boardModel.getBoardAll(function(result) {
            var data = {
                layout: 'urlfetch_layout',
                boards: result
            }
            var htm = system.getCompiledView(path.join('','pin_image/browse_form'), data);
            res.send(htm);
        });
    },
    /**
     *  retrieve posted data
     *  @author Rahul P R <rahul.pr@cubettech.com>
     *  @date 03-Dec-2013
     */
    upload_action: function(req, res) {
        var form = new formidable.IncomingForm();
        var i = 0;
        imageController.addimg(i, imagepinModel, form, req, res, function(status) {
            if (status == 1) {
                res.redirect('/pins');
            }
        });
    },
    /**
     * this function uploads all images to DEFINES.IMAGE_PATH_ORIGINAL_REL,
     * insert details to database
     * @author Rahul P R <rahul.pr@cubettech.com>
     * @date 03-Dec-2013
     * @param i,imagepinModel,form,req,res
     */
    addimg: function(i, imagepinModel, form, req, res, callback) {
        form.parse(req, function(err, fields, files) {
            var urltitle    = '' ;
            var hostname    = '' ;
            var board_id    = fields.board_id ;
            var description = fields.description ;
            var cur_time    = new Date() ;
            var fileName    = files.upload ? HELPER.sanitizeImageName(files.upload.name) : '' ; 
            var fileType    = files.upload ? files.upload.type : '' ;
            var fileSize    = files.upload ? files.upload.size : '' ;

            var process = function() {
              //do this only if image exists
              if(fileName =='' || board_id =='' || description =='') {
                var data = {
                  error   : 1,
                  msg     : 'Please fix the errors below'
                };
                if (board_id == '') {
                  data.msgBoard = 'Board is required';
                }
                if (description == '') {
                  data.msgDescription = 'Description is required';
                }
                if (fileName == '') {
                  data.msgImage = 'File is required';
                }
                res.send(data);
              } else {
                // image
                // check file format
                if (HELPER.typeValid(validImage,fileType))
                {
                  // check file size
                  if(fileSize > ( maxImageSize * 1024 * 1024 ) ) {
                    var data = {
                      error   : 1,
                      msg     : 'Please fix the errors below'
                    };
                    data.msgImage = 'Image file size should be <= ' + maxImageSize + 'Mb';
                    res.send(data);
                  } else {
                    //add filename to image array & thumb array
                    img_arr.push(fileName);
                    tmb_img_arr.push(fileName);
                    fs.readFile(files.upload.path, function(err, data) {
                      var newPath = DEFINES.IMAGE_PATH_ORIGINAL_REL + fileName;
                      // write file to folder
                      fs.writeFile(newPath, data, function(err) {
                        //console.log('renamed complete');
                        fs.unlink(files.upload.path);
                        //set image width to 415 or 300 px
                        HELPER.get_img_width(im, newPath, function(width) {
                          //resizing image
                          var rez_opt = {
                            srcPath: DEFINES.IMAGE_PATH_ORIGINAL_REL + fileName,
                            dstPath: DEFINES.IMAGE_PATH_SMALL_REL + fileName,
                            width: width,
                          };
                          im.resize(rez_opt, function(err, stdout, stderr) {

                            var rez_opt = {
                              srcPath: DEFINES.IMAGE_PATH_ORIGINAL_REL + fileName,
                              dstPath: DEFINES.IMAGE_PATH_THUMB_REL + fileName,
                              width: '600' // pop up image width
                            };
                            im.resize(rez_opt, function(err, stdout, stderr) {

                              if (err)
                                throw err;
                              // console.log('resized');
                              //insert data to db after image upload completed
                              var db_data = {
                                board_id        : mongo.ObjectID(board_id),
                                image_name      : img_arr,
                                tmb_image_name  : tmb_img_arr,
                                pin_type        : "image", // for type image
                                pin_url         : urltitle,
                                source_url      : urltitle,
                                time            : cur_time,
                                user_id         : mongo.ObjectID(req.session.login_user_id),
                                description     : description,
                                domain          : hostname,
                                image_width     : width,
                                blocked         : 0
                              };
                              imagepinModel.insert(db_data, function(inserted_data) {
                                PostModel.pinLikeCount(inserted_data[0]._id.toHexString(), function(likecount) {
                                  inserted_data[0].pinlikecount = likecount;
                                  boardModel.getBoardOne(board_id, function(boards){
                                    // create story for adding a pin
                                    var story = {
                                      timestamp: new Date(),
                                      user_id: mongo.ObjectID(req.session.login_user_id),
                                      action: HELPER.ACTIVITY_VERBS.ADD,
                                      item_type: HELPER.ACTIVITY_TYPES.PIN,
                                      item_id: inserted_data[0]._id,
                                      item_name: inserted_data[0].description,
                                      item_image: Array.isArray(inserted_data[0].image_name) ? inserted_data[0].image_name[0] : inserted_data[0].image_name,
                                      updated_field_type: null,
                                      updated_field: null,
                                      old_value: null,
                                      new_value: null,
                                      related_item_type: HELPER.ACTIVITY_TYPES.BOARD,
                                      related_item_id: boards[0]._id,
                                      related_item_name: boards[0].board_name,
                                      related_item_image: boards[0].image
                                    };
                                    storyModel.insert(story, function(newStory){
                                      HELPER.notifyAboutStory(req.session.login_user_id, newStory[0]);
                                      inserted_data[0].popStatus = '1' ;
                                      inserted_data[0].pinlike=0;
                                      inserted_data[0].loggeduser_id = req.session.login_user_id;
                                      inserted_data[0].creator_name = req.session.login_user_name;
                                      inserted_data[0].creator_image = req.session.login_user_img;
                                      var gridEl = system.getCompiledView(path.join('','pins/imagePinView'), inserted_data[0]);
                                      var listEl = system.getCompiledView(path.join('','pins/imagePinListView'), inserted_data[0]);
                                      // send details to socket
                                      boardModel.getCategoryByBoardId(board_id,function(catdetails){
                                        inserted_data[0].category_id = catdetails.category_id ? catdetails.category_id: '';
                                        sio.sockets.emit('pageview', {
                                          pin_type: 'image',
                                          gridEl: gridEl,
                                          listEl: listEl,
                                          data:inserted_data[0]
                                        });
                                      });

                                      //send notifications
                                      imageController.notificationMail(req,board_id);
                                      //success
                                      callback(1);
                                    });
                                  });
                                });
                              });
                              //clearing arrays
                              img_arr = [];
                              tmb_img_arr = [];

                            });
                          });
                          /*end resizing*/
                        });
                      });
                    });
                  }
                }
                // pdf
                else if(HELPER.typeValid(validPdf,fileType)){
                  if(fileSize > (maxPdfSize * 1024 * 1024 ) ) {
                    var data = {
                      error   : 1,
                      msg     : 'Please fix the errors below'
                    };
                    data.msgImage = 'Pdf file size should be <= ' + maxPdfSize + 'Mb';
                    res.send(data);
                  } else {
                    var pdf_file_name = new Date().getTime()+'.pdf';
                    var newPath = DEFINES.PDF_PATH_REL + pdf_file_name;

                    if(!board_id){
                      return res.send({
                        error   : 1,
                        msg     : 'Please, select a board for the pin!'
                      });
                    }

                    async.waterfall([
                      function(cb){
                        // Read the file
                        fs.readFile(files.upload.path, cb);
                      },
                      function(pdf_file_data, cb){
                        // Save the file to uploads
                        fs.writeFile(newPath, pdf_file_data, cb);
                      },
                      function(cb){
                        // rm temp upload file
                        fs.unlink(files.upload.path);

                        // create thumb of the pdf
                        var thumb_path = DEFINES.IMAGE_PATH_ORIGINAL_REL+pdf_file_name+'.png';
                        var thumb_image = DEFINES.IMAGE_PATH_ORIGINAL+pdf_file_name+'.png';
                        exec("gs -dQUIET -dPARANOIDSAFER -dBATCH -dNOPAUSE -dNOPROMPT -sDEVICE=png16m -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -r72 -dFirstPage=1 -dLastPage=1 -sOutputFile="+thumb_path+" "+newPath, function (error, stdout, stderr) {
                          if (error) {
                            return cb(err);
                          }
                          cb(null, thumb_image);
                        });
                      },
                      function(thumb_image, cb){
                        var rez_opt = {
                          srcPath: DEFINES.IMAGE_PATH_ORIGINAL_REL + pdf_file_name+'.png',
                          dstPath: DEFINES.IMAGE_PATH_THUMB_REL + pdf_file_name+'.png',
                          width: 200,
                        };
                        im.resize(rez_opt, function(err, stdout, stderr) {
                          if(err){
                            return cb(err);
                          }
                          cb(null, thumb_image);
                        });
                      },
                      function(thumb_image, cb){
                        // Create the pin
                        var insert_data = {
                          "board_id"      : mongo.ObjectID(board_id),
                          "pdf_id"        : pdf_file_name,
                          "thumb"         : thumb_image,
                          "image_name"    : pdf_file_name+'.png',
                          "pin_type"      : "pdf",
                          "time"          : new Date(),
                          "user_id"       : mongo.ObjectID(req.session.login_user_id),
                          "pdf_type"      : "local_pdf",
                          "description"   : fields.description,
                          "blocked"       : 0
                        };

                        PostModel.PinCreation(insert_data, function(inserted_data) {
                          inserted_data[0].popStatus = '1';
                          inserted_data[0].pinlike=1;
                          inserted_data[0].loggeduser_id = req.session.login_user_id;
                          inserted_data[0].creator_name = req.session.login_user_name;
                          inserted_data[0].creator_image = req.session.login_user_img;
                          var gridEl = system.getCompiledView(path.join('','pins/pdfPinView'), inserted_data[0]);
                          var listEl = system.getCompiledView(path.join('','pins/pdfPinListView'), inserted_data[0]);
                          // send details to socket
                          boardModel.getCategoryByBoardId(board_id,function(catdetails){
                            inserted_data[0].category_id = catdetails.category_id ? catdetails.category_id: '';
                            sio.sockets.emit('pageview', {
                              pin_type: 'pdf',
                              gridEl: gridEl,
                              listEl: listEl,
                              data:inserted_data[0]
                            });
                          });
                          imageController.notificationMail(req, board_id);
                          cb(null, inserted_data[0]);
                        });
                      },
                      function(inserted_data, cb){
                        // Create story for the new pin
                        boardModel.getBoardOne(board_id, function(boards){
                          // create story for adding a pin
                          var story = {
                            timestamp: new Date(),
                            user_id: mongo.ObjectID(req.session.login_user_id),
                            user_name: req.session.login_user_name,
                            action: HELPER.ACTIVITY_VERBS.ADD,
                            item_type: HELPER.ACTIVITY_TYPES.PIN,
                            item_id: inserted_data._id,
                            item_name: inserted_data.description,
                            item_image: Array.isArray(inserted_data.image_name) ? inserted_data.image_name : inserted_data.image_name,
                            updated_field_type: null,
                            updated_field: null,
                            old_value: null,
                            new_value: null,
                            related_item_type: HELPER.ACTIVITY_TYPES.BOARD,
                            related_item_id: boards[0]._id,
                            related_item_name: boards[0].board_name,
                            related_item_image: boards[0].image
                          };
                          storyModel.insert(story, function(newStory){
                            HELPER.notifyAboutStory(req.session.login_user_id, newStory[0]);
                            cb();
                          });
                        });
                      }
                    ], function(err){
                      if(err){
                        console.log('pdf async err is', err);
                        return res.send({
                          error: 1,
                          msg: err
                        });
                      }
                      // done.
                      callback(1);
                    });
                  }
                } else {
                  var data = {
                    error   : 1,
                    msg     : 'Please fix the errors below'
                  };
                  data.msgImage = 'Invalid file format';
                  res.send(data);
                }
              }
            };

            if(board_id == '') {
              process();
            } else {
              // Authorization
              HELPER.role_validate(req.session.login_user_id, board_id, HELPER.ACTION.CREATE_PIN.ROLE, res, function () {
                process();
              });
            }
        }); 
    },
    /**
     * send notification mails to board creator, followers
     * @author Rahul P R <rahul.pr@cubettech.com>
     * @date 03-Dec-2013
     * @param req, board_id
     */
    notificationMail: function(req, board_id) {
        var
        user = req.session.login_user_id,
        loggeduser = req.session.login_user_name,
        board = board_id,
        followerModel = system.getModel('follower'),
        notificationModel = system.getModel('notification'),
        UserModel = system.getModel('user'),
        boardModel = system.getModel('board');

        boardModel.boardCreator(user, board, function(boarddata) {
            //check whether the logged user and creator are same or not
            if (boarddata.length > 0)
            {
                if (boarddata && user != boarddata[0]._id)
                {
                    var html = '<b>Hi ' + boarddata[0].value.name + ', </b><br/>' + loggeduser + ' Creates a pin using your board.<br/>';
                    var instant_msg = loggeduser + ' Creates a pin using your board.';
                    var maildata = {
                        mailcontent: {
                            "subject": "Board Usage",
                            "body": html
                        },
                        "tomail": boarddata[0].value.email,
                        "html": html
                    }
                    HELPER.socketNotification('', 'notification', html, maildata, true);
                    if (boarddata[0].value.socket_id.length > 0) {

                        for(i in boarddata[0].value.socket_id ){
                            HELPER.socketNotification(boarddata[0].value.socket_id[i], 'notification', instant_msg, '', false);
                            i++;   
                        }
                    }
                    var notification_data =
                    {
                        key: "board usage"
                        , 
                        notification_generator: req.session.login_user_id
                        , 
                        notification_acceptor: boarddata[0]._id
                        , 
                        notification: instant_msg
                        , 
                        status: 1
                    }
                    notificationModel.NotificationInsertion(notification_data, function(callback) {
                        });

                }
            }
            UserModel.findFollowers(user, "user", function(followers) {
                if(followers.length>0){
                    var msg = req.session.login_user_name + " posts a pin";

                    for (l in followers)
                    {
                        //console.log(followers[i])
                        if (followers[l].value.socket_id.length > 0) {

                            for(j in followers[l].value.socket_id ){
                                HELPER.socketNotification(followers[l].value.socket_id[j], 'notification', msg, '', false);
                                j++;
                            }
                        }
                        var notification_data =
                        {
                            key: "pincreation"
                            , 
                            notification_generator: req.session.login_user_id
                            , 
                            notification_acceptor: followers[l]._id
                            , 
                            notification: msg
                            , 
                            status: 1
                        }
                        notificationModel.NotificationInsertion(notification_data, function(callback) {

                            });
                        l++;
                    }
                }

            });
            UserModel.findFollowers(board, 'board', function(followers) {
                 if(followers.length>0){
                    var msg = req.session.login_user_name + " use the board you followed";
                    var i = 0,j=0;
                    for (i in followers)
                    {
                        if(boarddata && (boarddata[0]._id!=followers[i]._id))
                        {
                            //console.log(followers)
                            if (followers[i].value.socket_id.length > 0) {

                                for(j in followers[i].value.socket_id ){
                                    HELPER.socketNotification(followers[i].value.socket_id[j], 'notification', msg);
                                    j++;
                                }
                            }
                            var notification_data =
                            {
                                key: "pincreation"
                                , 
                                notification_generator: req.session.login_user_id
                                , 
                                notification_acceptor: followers[i]._id
                                , 
                                notification: msg
                                , 
                                status: 1
                            }
                            notificationModel.NotificationInsertion(notification_data, function(callback) {

                                });
                        }
                        i++;
                    }
                }
             });            
        });
    }
};

module.exports = imageController;
