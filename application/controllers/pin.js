/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/* 
 * Pin Operations
 *
 * Changes in version 2.1 (Myyna NodeJS Roles and Users Update):
 * - modified listByBoard, repinload and listByCategory functions to account for 
 * the new role changes
 *
 * Changes in version 2.2 (Myyna Activity and Timeline Features):
 * - added logic to save story and notify users when liking, unliking, repinning or commenting on a pin
 * - registered activity box section
 *
 * Changes in version 2.3 (Myyna Web Application List View Update):
 * - added logic to diplay items as list and to add extra information
 *
 * Changes in version 2.4 (Myyna [Bug Bounty]):
 * - updated the way the board/categories follower numbers are calculated
 * - removed user_name story field
 *
 * The MIT License (MIT)
 * @category: cubetboard
 * @package pins
 * @version 2.4
 * @author Arya <arya@cubettech.com>, MonicaMuranyi, TCSASSEMBLER
 * @Date 28-10-2013
 */
var PostModel = system.getModel('pin');
var pinModel = system.getModel('imagepin');
var boardModel = system.getModel('board');
var UserModel = system.getModel('user');
var roleModel = system.getModel('role');
var userRoleModel = system.getModel('userRole');
var followerModel = system.getModel('follower');
var notificationModel = system.getModel('notification');
var shareModel = system.getModel('pinShare');
var catModel = system.getModel('category');
var storyModel = system.getModel('story');
var path = require('path');
var async = require('async');
var fs = require('fs');
var fse = require('fs-extra');
var exec = require('child_process').exec;
var formidable = require('formidable');
var _ = require('underscore');
var im = require('imagemagick');

var msg = '';
system.loadHelper('pinHelper');
system.loadHelper('myhelper');
system.loadHelper('timelineHelper');
system.getLibrary('helpRegister');
system.loadHelper('routes');
system.loadHelper('constants');
var i = 0;
var check = 0;
var pinController = {

    /*
     * loads pin page     
     * @author Arya <arya@cubettech.com>
     * @Date 29-10-2013
     */
    
    list: function(req, res) {
        //list all categories
        catModel.getCategoryAll(function(result) {
            //list all pins
            PostModel.Pinlists(req.session.login_user_id, function(person) {
                //get the details of the looged in user
                UserModel.userDetails(req.session.login_user_id, function(user) {
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
                    //list the unread notifications of the user
                    notificationModel.userUnreadnotifications(req.session.login_user_id, function(notifications) {
                        req.session.login_user_img = user[0].image;
                        var data = {
                            'data': person,
                            'pagetitle': 'Pins',
                            'notifications': notifications,
                            'notification_count': notifications.length,
                            'loiginuser': req.session.login_user_name,
                            'loggeduser_id': req.session.login_user_id,
                            'category': result,
                            'layout': 'default',
                            'type': 'list',
                            'user_image': user[0].image,
                            'DEFINES': global.DEFINES,
                            'HOST': global.sleekConfig.appHost,
                            'SSO': SSO
                        };

                        system.loadView(res, path.join('','pins/pin'), data);
                        system.setPartial(path.join('','pins/pinheader'), 'pinheader');
                        system.setPartial(path.join('','pins/imagePinView'), 'pinviewimage');
                        system.setPartial(path.join('','pins/webPinView'), 'pinvieweb');
                        system.setPartial(path.join('','pins/pdfPinView'), 'pinviewpdf');
                        system.setPartial(path.join('','timeline/activity'), 'activity');
                        system.setPartial(path.join('','pins/imagePinListView'), 'pinviewimage2');
                        system.setPartial(path.join('','pins/webPinListView'), 'pinvieweb2');
                        system.setPartial(path.join('','pins/pdfPinListView'), 'pinviewpdf2');
                    });
                });
            });

        });
    },
    /*
     * loads most liked pins     
     * @author Arya <arya@cubettech.com>
     * @Date 29-10-2013
     */
    mostLike: function(req, res) {
        //return all categories
        catModel.getCategoryAll(function(result) {
            //return pins in descending order of number of likes
            PostModel.PinMostLiked(req.session.login_user_id, function(pins) {
                //get the details of the looged in user
                UserModel.userDetails(req.session.login_user_id, function(user) {
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
                        'data': pins,
                        'pagetitle': 'Most Liked',
                        'loiginuser': req.session.login_user_name,
                        'loggeduser_id': req.session.login_user_id,
                        'type': 'like',
                        'layout': 'default',
                        'category': result,
                        'user_image': user[0].image,
                        'DEFINES': global.DEFINES,
                        'HOST': global.sleekConfig.appHost,
                        'SSO': SSO
                    };

                    system.loadView(res,path.join('','pins/pin'), data);
                    system.setPartial(path.join('','pins/pinheader'), 'pinheader');
                    system.setPartial(path.join('','pins/imagePinView'), 'pinviewimage');
                    system.setPartial(path.join('','pins/webPinView'), 'pinvieweb');
                    system.setPartial(path.join('','pins/pdfPinView'), 'pinviewpdf');
                    system.setPartial(path.join('','pins/imagePinListView'), 'pinviewimage2');
                    system.setPartial(path.join('','pins/webPinListView'), 'pinvieweb2');
                    system.setPartial(path.join('','pins/pdfPinListView'), 'pinviewpdf2');
                    system.setPartial(path.join('','timeline/activity'), 'activity');
                });
            });
        });
    },
    /*
     * loads most repinned pins     
     * @author Arya <arya@cubettech.com>
     * @Date 29-10-2013
     */
    mostRepin: function(req, res) {
        //return all categories
        catModel.getCategoryAll(function(result) {
            //return pins in descending order of number of repins
            PostModel.PinMostRepinned(req.session.login_user_id, function(person) {
                //get the details of the looged in user
                UserModel.userDetails(req.session.login_user_id, function(user) {
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
                        'data': person,
                        'pagetitle': 'Most Repinned',
                        'loiginuser': req.session.login_user_name,
                        'loggeduser_id': req.session.login_user_id,
                        'type': 'repin',
                        'layout': 'default',
                        'category': result,
                        'user_image': user[0].image,
                        'DEFINES': global.DEFINES,
                        'HOST': global.sleekConfig.appHost,
                        'SSO': SSO
                    };

                    system.loadView(res, 'pins/pin', data);
                    system.setPartial('pins/pinheader', 'pinheader');
                    system.setPartial('pins/imagePinView', 'pinviewimage');
                    system.setPartial('pins/webPinView', 'pinvieweb');
                    system.setPartial(path.join('','pins/pdfPinView'), 'pinviewpdf');
                    system.setPartial(path.join('','pins/imagePinListView'), 'pinviewimage2');
                    system.setPartial(path.join('','pins/webPinListView'), 'pinvieweb2');
                    system.setPartial(path.join('','pins/pdfPinListView'), 'pinviewpdf2');
                    system.setPartial(path.join('','timeline/activity'), 'activity');
                });
            });
        });
    },
    /*
     * page scrolling functionality    
     * @author Arya <arya@cubettech.com>
     * @Date 29-10-2013
     */
    morepins: function(req, res) {
        //set start and end limits for taking data from db
        var start = req.body.startlimit ? req.body.startlimit : 0;
        var end = req.body.endlimit ? req.body.endlimit : 15;
        //specify the type of listing
        var list = req.params.list ? req.params.list : 'list';
        //specify the boardid/categoryid/userid for board/category/user based pin listing 
        var list_id = req.body.type_id ? req.body.type_id : '';
        //return the pins of the specified type of listing
        PostModel.morePinlists(req.session.login_user_id, start, end, list,list_id, function(data) {
            console.log('callback !')
            var data = {
                'data': data,
                'layout': false,
                'include_timeline': 'true'
            };
            if (data) {
                if (req.body.dataMode && req.body.dataMode == 1) {
                    res.send(data);
                } else {
                    system.loadView(res, path.join('', req.body.viewType == 'list' ? 'pins/moredataList' : 'pins/moredataGrid'), data);
                }
            } else {
                //empty response
                res.send('no response');
            }
        });
    },
    /**
     
     
     *loads the html page of pin operation
     * @author Arya <arya@cubettech.com>
     * @Date 29-10-2013
     */
    webpin: function(req, res) {

        //form with upload functionality
        var formidable = require('formidable');
        // return allunblocked boards
        boardModel.getBoardAll(function(boards) {

            var data = {
                'pagetitle': 'Pin page', 
                'boards': boards
            };
            system.loadView(res,path.join('','pins/webpin'), data);
            system.setPartial(path.join('','pins/pinheader'), 'pinheader');

        });

    },
    /*       
     
     *screenshot creation (webshot) and resizing(imagemagick)
     * @author Arya <arya@cubettech.com>
     * @Date 29-10-2013
     
     */

    pins: function(req, res)
    {
        var fs = require("fs");
        var time = new Date().getTime();
        var user_id = req.session.login_user_id;
        var fields = req.body;

        var pin_cat = fields.pin_cat;
        var form_data = {
            'blocked':0,
            "time": time,
            "url": fields.url,
            "board": fields.board_id,
            "description": fields.description,
            "userid": user_id,
            "logged_user": req.session.login_user_name
        };

        // Sometimes pdf pins get mistaken for webpage pins
        // as the app defaults to webpage type of web pins.
        // Thus we try here to minimize those occurrences.
        var p = fields.url.split('.');
        if(p[p.length-1].toLowerCase() == 'pdf'){
            pin_cat = "pdf";
            fields.pin_cat = "pdf";
        }

        // Dispatch...
        if (pin_cat == "webpage"){
            pinController.pin_webpage(form_data, req, res);
        }
        else if (pin_cat == "pdf"){
            pinController.pin_pdf(form_data, req, res);
        }
    },

    /**
     * Pins PDF from web link
     * @param {Object} fields
     * @param {Object} req
     * @param {Object} res
     */
    pin_pdf: function(fields, req, res){
        // We download the file to create the preview.
        var cur_time = new Date().getTime();
        var pdf_file_name = cur_time + '.pdf';
        var pdf_file = DEFINES.PDF_PATH_REL+pdf_file_name;
        var thumb_path = DEFINES.IMAGE_PATH_ORIGINAL_REL+pdf_file_name+'.png';
        var thumb_image = DEFINES.IMAGE_PATH_ORIGINAL+pdf_file_name+'.png';
        var request = require('request');
        var fs = require('fs');

        request({
            url: fields.url,
            encoding: null
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                async.waterfall([
                    function(cb){
                        fs.writeFile(pdf_file, body, cb);
                    },
                    function(cb){
                        exec("gs -dQUIET -dPARANOIDSAFER -dBATCH -dNOPAUSE -dNOPROMPT -sDEVICE=png16m -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -r72 -dFirstPage=1 -dLastPage=1 -sOutputFile="+thumb_path+" "+pdf_file, function (error, stdout, stderr) {
                            if (error) {
                               return cb(err);
                            }
                            cb(null, thumb_image);
                        });
                    },
                    function(thumb_image, cb){
                        var rez_opt = {
                            srcPath: thumb_path,
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
                        // Drop the file
                        fs.unlink(pdf_file);
                        // Create the pin
                        var insert_data = {
                            "board_id"      : mongo.ObjectID(fields.board),
                            "pdf_id"        : fields.url,
                            "thumb"         : thumb_image,
                            "pin_type"      : "pdf",
                            "time"          : new Date(),
                            "image_name"    : pdf_file_name+'.png',
                            "user_id"       : mongo.ObjectID(fields.userid),
                            "pdf_type"      : "web_pdf",
                            "description"   : fields.description,
                            "blocked"       : 0
                        };

                        PostModel.PinCreation(insert_data, function(inserted_data) {
                            inserted_data[0].popStatus = '1';
                            inserted_data[0].pinlike=1;
                            inserted_data[0].loggeduser_id = req.session.login_user_id;
                            inserted_data[0].creator_name = req.session.login_user_name;
                            inserted_data[0].creator_image = req.session.login_user_img;
                            // send details to socket
                            boardModel.getCategoryByBoardId(fields.board, function(catdetails){
                                inserted_data[0].category_id = catdetails.category_id ? catdetails.category_id: '';
                                console.log('before socket emit');
                                getPinDataForWidget(inserted_data[0]._id.toHexString(), req.session.login_user_id, function(data) {
                                  var gridEl = system.getCompiledView(path.join('','pins/moredataGrid'), data);
                                  var listEl = system.getCompiledView(path.join('','pins/moredataList'), data);
                                  sio.sockets.emit('pageview', {
                                    gridEl:gridEl,
                                    listEl:listEl,
                                    pin_type: "pdf",
                                    data: inserted_data[0]
                                  });
                                });
                            });
                            cb(null, inserted_data[0]);
                        });
                    },
                    function(inserted_data, cb){
                        // Create story for the new pin
                        boardModel.getBoardOne(inserted_data.board_id.toHexString(), function(boards){
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
                ], function(){
                    res.redirect('/pins');
                });
            }else{
                res.redirect('/pins');
            }
        });
    },
    
    /*webpage pin operation
     * @author Arya <arya@cubettech.com>
     * @Date 29-10-2013*/
    
    pin_webpage: function(form_data, req, res)
    {
        console.log('form adata ' + JSON.stringify(form_data) )
        //webshot creates the screen shot of the page
        var webshot = require('webshot');
        var im = require('imagemagick');
        var gm = require('gm');
        var time = form_data.time;
        var url = form_data.url;
        var board = form_data.board;
        var user = form_data.userid;
        var loggeduser = form_data.logged_user;
        var imagename = time + '.png';
        var options = {
            screenSize: {
                width: 'all', 
                height: 'all'
            }
        }
        
        var webshot_options = {
            renderDelay:5000
        }
        // save and resize the webpage screenshot based on size requirement
       console.log('trying again to take screenshot stupid ' + DEFINES.IMAGE_PATH_REL + time + '.png')
        webshot(url, DEFINES.IMAGE_PATH_REL + time + '.png', webshot_options, function(err) {
            if (err) { 
                console.log('error in webshote ; ' + err)
               }
            im.identify(DEFINES.IMAGE_PATH_REL + time + '.png', function(err, features) {
console.log('features ' + JSON.stringify(features));
                if (err)
                    throw err
               
                if (features.width >= '415')
                {
                   
                    im.resize({
                        srcPath: DEFINES.IMAGE_PATH_REL + time + '.png',
                        dstPath: path.join(DEFINES.IMAGE_PATH_REL, 'small/' + time + '.png'),
                        width: '415'
                    }, function(err, stdout, stderr) {

                        if (err)
                            throw err;
                        //console.log('resized');
                    });
                }

                else
                {
                    im.resize({
                        srcPath: DEFINES.IMAGE_PATH_REL + time + '.png',
                        dstPath: path.join(DEFINES.IMAGE_PATH_REL,'small/' + time + '.png'),
                        width: '200'
                    }, function(err, stdout, stderr) {

                        if (err)
                            throw err;
                       // console.log('resized');
                    });
                }

                im.resize({
                    srcPath: DEFINES.IMAGE_PATH_REL + time + '.png',
                    dstPath: path.join(DEFINES.IMAGE_PATH_REL,'thumb/' + time + '.png'),
                    width: '20%'
                }, function(err, stdout, stderr) {

                    if (err)
                        throw err;
                    //console.log('resized');
                    // details of pin to save
                    var insert_data = {
                        "board_id": mongo.ObjectID(board),
                        "image_name": imagename,
                        "pin_type": "web_page", // videotype
                        "pin_url": url,
                        "source_url": url,
                        "time": new Date(),
                        "user_id": mongo.ObjectID(user), //logged user_id              
                        "description": form_data.description,
                        'blocked':0
                    };
                    // insert pin details 
                    PostModel.PinCreation(insert_data, function(ress) {
                        ress[0].popStatus = '1' ;
                        ress[0].pinlike=1;
                        ress[0].loggeduser_id = user;
                        ress[0].creator_name = req.session.login_user_name;
                        ress[0].creator_image = req.session.login_user_img;
                        // socket to add the created pin on the listing page
                        boardModel.getCategoryByBoardId(board,function(catdetails){
                          ress[0].category_id = catdetails.category_id ? catdetails.category_id: ''
                          getPinDataForWidget(ress[0]._id.toHexString(), req.session.login_user_id, function(data) {
                              console.log('data ' + JSON.stringify(data));
                            var gridEl = system.getCompiledView(path.join('','pins/moredataGrid'), data);
                            var listEl = system.getCompiledView(path.join('','pins/moredataList'), data);
                            sio.sockets.emit('pageview', {
                              gridEl:gridEl,
                              listEl:listEl,
                              pin_type: "web_page",
                              data: ress[0]
                            });
                          });
                        });
                        // create story for adding a pin
                        boardModel.getBoardOne(board, function(boards){
                            var story = {
                                timestamp: new Date(),
                                user_id: mongo.ObjectID(req.session.login_user_id),
                                user_name: req.session.login_user_name,
                                action: HELPER.ACTIVITY_VERBS.ADD,
                                item_type: HELPER.ACTIVITY_TYPES.PIN,
                                item_id: ress[0]._id,
                                item_name: ress[0].description,
                                item_image: Array.isArray(ress[0].image_name) ? ress[0].image_name[0] : ress[0].image_name,
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
                            });
                        });
                        //get the creator of the board
                        boardModel.boardCreator(user, board, function(boarddata) {

                            // console.log(boarddata);
                            //check wether the logged user and creator are same or not
                            if (boarddata.length > 0)
                            {
                                if (boarddata && (user != boarddata[0]._id))
                                {
                                    //messages of mail and instant notification
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
                                    //send mail notification
                                    HELPER.socketNotification('', 'notification', html, maildata, true);
                                    var notification_data =
                                    {
                                        key: "board_usage"
                                        , 
                                        notification_generator:  mongo.ObjectID(req.session.login_user_id)
                                        , 
                                        notification_acceptor: boarddata[0]._id
                                        , 
                                        notification: instant_msg
                                        , 
                                        status: 1
                                    }
                                    if (boarddata[0].value.socket_id.length > 0) {
                                        //send instant notification    
                                        for(i in boarddata[0].value.socket_id ){
                                            HELPER.socketNotification(boarddata[0].value.socket_id[i], 'notification', instant_msg, '', false);
                                            i++;   
                                        }
                                    }
                                    //log the notification details
                                    notificationModel.NotificationInsertion(notification_data, function(callback) {

                                        });


                                }
                            }
                            //get the followers of the user
                            UserModel.findFollowers(user, "user", function(followers) {
                                if(followers.length>0){
                                    var msg = req.session.login_user_name + " posts a web page pin";

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
                                            notification_generator:  mongo.ObjectID(req.session.login_user_id)
                                            , 
                                            notification_acceptor: followers[l]._id
                                            , 
                                            notification: msg
                                            , 
                                            status: 1
                                        }
                                        //log the notification details
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
                                    
                                        if(boarddata &&(boarddata[0]._id!=followers[i]._id))
                                        {
                                            //console.log(followers[i]._id);
                                            //console.log(boarddata[0]._id);
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
                                                notification_generator:  mongo.ObjectID(req.session.login_user_id)
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
                        res.redirect('/pins');
                    });
                    

                });
            });

        });

    },
    /*
     * create screenshot of webpage during webpage pin operation
     *@author Arya <arya@cubettech.com>
     * @Date 29-10-2013*/
    screenshot: function(req, res) {
        // Sometimes pdf pins get mistaken for webpage pins
        // as the app defaults to webpage type of web pins.
        // Thus we try here to minimize those occurrences.
        var p = req.body.pageurl.split('.');
        if(p[p.length-1].toLowerCase() === 'pdf'){
            return pinController.pdf_screenshot(req.body.pageurl, res);
        }

        var webshot = require('webshot');
        var fs = require('fs');
        var time = new Date().getTime();
         var webshot_options = {
            renderDelay: 5000,
            phantomConfig: {
                'ignore-ssl-errors': 'true',
                'ssl-protocol': 'any',
                'debug': 'true'
            }
        };
        if(req.session.login_user_id)
        {
            var imagename = req.session.login_user_id + '.png';
        }
        else{
            var imagename = time + '.png';
            req.session.temp_imagename = imagename;
        }
           
            
        var options = {
            screenSize: {
                width: 320,
                height: 480
            },
            shotSize: {
                width: 320,
                height: 'all'
            }
        };
        
        console.log('pageurl is ' + req.body.pageurl);
        console.log("path is : " + path.join(DEFINES.IMAGE_PATH_REL,'temp/' + imagename))
        webshot(req.body.pageurl, path.join(DEFINES.IMAGE_PATH_REL,'temp/' + imagename), webshot_options, function(err) {
            if(!err){
                var data = {
                    "image": imagename
                };
                res.send(200, data);
            } else {
                console.log('webshot error ' + err);
                var data = {
                    "error": 'Website does not exist or unable to create screenshot.'
                };
                res.send(200, data);
            }
        });
    },

    pdf_screenshot: function(url, res){

        console.log('pdf_screenshot', url);

        // We download the file to create the preview.
        var cur_time = new Date().getTime();
        var pdf_file_name = cur_time + '.pdf';
        var pdf_file = DEFINES.PDF_PATH_REL+pdf_file_name;
        var thumb_path = path.join(DEFINES.IMAGE_PATH_REL,'temp/' + pdf_file_name + '.png');
        var thumb_image = pdf_file_name + '.png';
        var request = require('request');
        var fs = require('fs');

        request({
            url: url,
            encoding: null
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                async.waterfall([
                    function(cb){
                        fs.writeFile(pdf_file, body, cb);
                    },
                    function(cb){
                        exec("gs -dQUIET -dPARANOIDSAFER -dBATCH -dNOPAUSE -dNOPROMPT -sDEVICE=png16m -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -r72 -dFirstPage=1 -dLastPage=1 -sOutputFile="+thumb_path+" "+pdf_file, function (error, stdout, stderr) {
                            if (error) {
                               return cb(err);
                            }
                            cb(null, thumb_image);
                        });
                    }
                ], function(err){
                    fs.unlink(pdf_file);
                    if(err){
                        res.send(200, {
                            "error": 'Website does not exist or unable to create PDF screenshot.'
                        });
                    }else{
                        res.send(200, {
                            "image": thumb_image
                        });
                    }
                });
            }else{
                res.send(200, {
                    "error": 'Website does not exist or unable to create PDF screenshot.'
                });
            }
        });
    },

    /**
     *
     * shows a pins corresponding to board_id
     *@author Arya <arya@cubettech.com>
     * @Date 10-11-2013*/
    listByBoard: function(req, res) {
        
        var board_id = req.params.bid;
        catModel.getCategoryAll(function(result) {
           
            boardModel.getBoardOne(board_id, function(board) {
                
                if(board.length>0){
                    followerModel.BoardFollowerCount(board_id,req.session.login_user_id, function(count) {
                        userRoleModel.findByResource(board_id, function(userRoles) {
                            userRoleModel.findByUserAndResource(req.session.login_user_id, board_id, function(userRolesBoard) {
                                userRoleModel.findByUserAndResource(req.session.login_user_id, board[0].category_id.toHexString(), function(userRolesCat) {
                                    var canManageUsers = userRolesCat.length || (userRolesBoard.length - count);
                                    boardModel.boardCreator(req.session.login_user_id, board_id, function(creator) {
                                        if (creator && creator.length > 0) {
                                            PostModel.getPinsByBoard_not(board_id, function(person1) {
                                                UserModel.userDetails(creator[0]._id.toHexString(), function(userimage) {
                                                    UserModel.userDetails(req.session.login_user_id, function(user) {
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

                                                        PostModel.getPinsByBoard(req.session.login_user_id, board_id, function(person) {
                                                            var data = {
                                                                'data': person,
                                                                'pagetitle': 'Pins',
                                                                'loiginuser': req.session.login_user_name,
                                                                'loggeduser_id': req.session.login_user_id,
                                                                'category': result,
                                                                'type': 'board',
                                                                'type_id':board_id,
                                                                'board_detail': board[0].board_name,
                                                                'description': board[0].description,
                                                                'board_image': path.join("/boards", board[0].image),
                                                                'followercount': userRoles.length,
                                                                'pincount': person1.length,
                                                                'creator_name': creator[0].value.name,
                                                                'creator_image': userimage[0].image,
                                                                'user_image': user[0].image,
                                                                'board_id':board_id,
                                                                'creator':board[0].creator,
                                                                'can_manage_users': canManageUsers,
                                                                'DEFINES': global.DEFINES,
                                                                'HOST': global.sleekConfig.appHost,
                                                                'SSO': SSO
                                                            };
                                                        
                                                            if(count > 0){
                                                                data.boardfollow = 1;
                                                            } else{
                                                                data.boardfollow = 0;
                                                            }

                                                            system.loadView(res,path.join('','pins/pin'), data);
                                                            system.setPartial(path.join('','pins/pinheader'), 'pinheader');
                                                            system.setPartial(path.join('','pins/imagePinView'), 'pinviewimage');
                                                            system.setPartial(path.join('','pins/webPinView'), 'pinvieweb');
                                                            system.setPartial(path.join('','pins/pdfPinView'), 'pinviewpdf');
                                                            system.setPartial(path.join('','pins/imagePinListView'), 'pinviewimage2');
                                                            system.setPartial(path.join('','pins/webPinListView'), 'pinvieweb2');
                                                            system.setPartial(path.join('','pins/pdfPinListView'), 'pinviewpdf2');
                                                            system.setPartial(path.join('','timeline/activity'), 'activity');
                                                        });
                                                    });
                                                });
                                            });

                                        } else {
                                             PostModel.getPinsByBoard_not(board_id, function(person1) {
                                                    UserModel.userDetails(req.session.login_user_id, function(user) {
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

                                                        PostModel.getPinsByBoard(req.session.login_user_id, board_id, function(person) {
                                                            var data = {
                                                                'data': person,
                                                                'pagetitle': 'Pins',
                                                                'loiginuser': req.session.login_user_name,
                                                                'loggeduser_id': req.session.login_user_id,
                                                                'category': result,
                                                                'type': 'board',
                                                                'type_id':board_id,
                                                                'board_detail': board[0].board_name,
                                                                'description': board[0].description,
                                                                'board_image': path.join("/boards", board[0].image),
                                                                'followercount': count.length,
                                                                'pincount': person1.length,
                                                                'creator_name': 'Admin User',
                                                                'user_image': user[0].image,
                                                                'board_id':board_id,
                                                                'creator':board[0].creator,
                                                                'can_manage_users': canManageUsers,
                                                                'DEFINES': global.DEFINES,
                                                                'HOST': global.sleekConfig.appHost,
                                                                'SSO': SSO
                                                            };
                                                        
                                                            if(count.length>0){
                                                                data.boardfollow = count[0].boardfollow;
                                                            }
                                                            else{
                                                                data.boardfollow = 0;
                                                            }

                                                            system.loadView(res,path.join('','pins/pin'), data);
                                                            system.setPartial(path.join('','pins/pinheader'), 'pinheader');
                                                            system.setPartial(path.join('','pins/imagePinView'), 'pinviewimage');
                                                            system.setPartial(path.join('','pins/webPinView'), 'pinvieweb');
                                                            system.setPartial(path.join('','pins/imagePinListView'), 'pinviewimage2');
                                                            system.setPartial(path.join('','pins/webPinListView'), 'pinvieweb2');
                                                            system.setPartial(path.join('','pins/pdfPinListView'), 'pinviewpdf2');
                                                            system.setPartial(path.join('','timeline/activity'), 'activity');
                                                        });
                                                    });
                                            });
                                        }
                                    });
                                });
                            });
                        });
                    });

                }
            
                else {
                    res.redirect('/404');
                }
            });
        });

    },
    /*
     * popup detail page for pin
     * @author Rahul P R <rahul.pr@cubettech.com>
     * @date 26-nov-2013
     */
    popup: function(req, res) {
        var pid = req.params.pid;
        if(!pid)
        {
            res.redirect('/404');
            return;
        }
        var popup = req.params.popup == 1 ? 1 : 0;
        catModel.getCategoryAll(function(categories) {
            UserModel.userDetails(req.session.login_user_id, function(user) {

                    var SSO = null;
                    if(user[0].username){
                        var disqusSignon = require('../helpers/disqusSignon');
                        SSO = disqusSignon({
                            id: user[0]._id,
                            username: user[0].username,
                            email: user[0].email
                        });
                    }

                    pinModel.getPinsOne(pid, function(result) {
                        HELPER.role_validate_callback(req.session.login_user_id, result.board_id.toHexString(), HELPER.ACTION.EDIT_PIN.ROLE, function(auth_err){
                            if(!result){
                                res.redirect('/404');
                            }
                            var imgCount = (result.image_name) ? result.image_name.length : 1;
                            var data = {
                                'pin': result,
                                'pagetitle': 'Pins',
                                'loiginuser': req.session.login_user_name,
                                'loggeduser_id': req.session.login_user_id,
                                'category': categories,
                                'type': 'list',
                                'user_image': user[0].image,
                                'popup': popup,
                                'imgCount': imgCount,
                                'DEFINES': global.DEFINES,
                                'HOST': global.sleekConfig.appHost,
                                'SSO': SSO,
                                'canEditPin': auth_err ? false : true
                            };
                            if (popup == 1) {
                                data.layout = false;
                            }
                            system.loadView(res, path.join('','pins/popup'), data);
                            if (popup == 0) {
                                system.setPartial(path.join('','pins/pinheader'), 'pinheader');
                                system.setPartial(path.join('','timeline/activity'), 'activity');
                            }
                        });
                    }, req.session.login_user_id, popup);
            });
        });
    },
    /**
     * Render pdf file
     * @param {Object} req
     * @param {Object} res
     */
    pdfview: function(req, res) {
        var fs = require("fs");
        console.log(req.query.pdfid);
        fs.readFile(DEFINES.PDF_PATH_REL+req.query.pdfid, function(err, pdf_data){
            if(err){
                return res.redirect('/404');
            }

            res.writeHead(200, {'Content-Type': 'application/pdf' });
            res.end(pdf_data, 'binary');
        });
    },
    /*
     * more pins pinned by user
     * @author Rahul P R <rahul.pr@cubettech.com>
     * @date 26-nov-2013
     */
    more_userpins: function(req, res) {
        var start = req.body.startlimit;
        var end = req.body.endlimit;
        var cur_pin_id = req.body.cur_pin_id;
        var popStatus = req.body.popup==1 ? 1 : 0 ;
        pinModel.moreUserPinlists(req.session.login_user_id, cur_pin_id, start, end, function(result) {
            //console.log(result);
            var data = {
                'data': result,
                'layout': false
            };
            if (result) {
                system.loadView(res, path.join('', req.body.viewType == 'list' ? 'pins/moredataList' : 'pins/moredataGrid'), data);
            } else {
                res.send(404);
            }
        },popStatus);
    },
    /* 
     * get more pins in a  board on scroll
     * @author Rahul P R <rahul.pr@cubettech.com>
     * @date 26-nov-2013
     */
    morePinsByBoard: function(req, res) {
        var start = req.body.startlimit;
        var end = req.body.endlimit;
        var currentPinId = req.body.currentPinId;
        var popStatus = req.body.popup==1 ? 1 : 0 ;
        pinModel.morePinsByLimit(currentPinId, start, end, function(result) {
            var data = {
                'data': result,
                'layout': false
            };
            if (result) {
                system.loadView(res, path.join('','pins/morePinsByBoard'), data);
            } else {
                res.send(404);
            }
        },popStatus);
    },
    /*
     * get more pins by domain on scroll
     * @author Rahul P R <rahul.pr@cubettech.com>
     * @date 26-nov-2013
     */
    morePinsByDomain: function(req, res) {
        var start = req.body.startlimit;
        var end = req.body.endlimit;
        var currentPinId = req.body.currentPinId;
        var popStatus = req.body.popup==1 ? 1 : 0 ;
        pinModel.moreDomainPinsByLimit(currentPinId, start, end, function(result) {
            var data = {
                'data': result,
                'layout': false
            };
            if (result) {
                system.loadView(res, path.join('','pins/morePinsByBoard'), data);
            } else {
                res.send(404);
            }
        },popStatus);
    },
    /**
     *like a pin
     *@author Arya <arya@cubettech.com>
     * @Date 20-11-2013
     * */
    
    pinLike: function(req, res) {
        var pin_id = req.body.pin_id;
        var user_id = req.session.login_user_id;


        //console.log(pin_id + ' :: ' + user_id);
        var insert_data = {
            "pin_id": mongo.ObjectID(pin_id),
            "user_id": mongo.ObjectID(user_id),
            "timestamp": new Date()
        }

        PostModel.pinLikeCheck(pin_id, user_id, function(checkresult) {
            
            if (checkresult.length == 0) {

                PostModel.insertPinLike(insert_data, function(person) {
                    PostModel.getPinDetails(pin_id, function(pinDetail){
                        boardModel.getBoardOne(pinDetail[0].board_id.toHexString(), function(boards){
                            // create story for liking a pin
                            var story = {
                                timestamp: new Date(),
                                user_id: mongo.ObjectID(user_id),
                                action: HELPER.ACTIVITY_VERBS.LIKE,
                                item_type: HELPER.ACTIVITY_TYPES.PIN,
                                item_id: pinDetail[0]._id,
                                item_name: pinDetail[0].description,
                                item_image: Array.isArray(pinDetail[0].image_name) ? pinDetail[0].image_name[0] : pinDetail[0].image_name,
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
                                HELPER.notifyAboutStory(user_id, newStory[0]);

                                if (person)
                                {
                                    PostModel.getPinCreator(pin_id, function(creator) {

                                        if (creator.length > 0)
                                        {
                                          
                                            if (creator[0]._id != user_id)
                                            {
                                                notificationModel.notificationSendCheck(creator[0]._id,function(settings){
                                                    //console.log(creator[0]._id);
                                                    if(settings[0].like==1){
                                                        var html = '<b>Hi ' + creator[0].value.name + ', </b><br/>' + req.session.login_user_name + ' Liked your pin.<br/>';
                                                        var instant_msg = req.session.login_user_name + ' Liked your pin.';
                                                        var maildata = {
                                                            mailcontent: {
                                                                "subject": "Pin Like",
                                                                "body": html
                                                            },
                                                            "tomail": creator[0].value.email,
                                                            "html": html
                                                        }
                                               
                                                        HELPER.socketNotification('', 'notification', instant_msg, maildata, true);
                                                        var notification_data =
                                                        {
                                                            key: "pin_like"
                                                            , 
                                                            notification_generator: req.session.login_user_id
                                                            , 
                                                            notification_acceptor: creator[0]._id
                                                            , 
                                                            notification: instant_msg
                                                            , 
                                                            status: 1
                                                        }
                                                        notificationModel.NotificationInsertion(notification_data, function(callback) {

                                                            });
                                                        UserModel.UserSettings(creator[0]._id.toHexString(), function(settings){
                                                            if(settings[0].like==1){
                                               
                                                                if(creator[0].value.socket_id.length>0){
                                                                    for(i in creator[0].value.socket_id)
                                                                    {
                                                                        HELPER.socketNotification(creator[0].value.socket_id[i], 'notification', instant_msg, '', false);
                                                    
                                                                        i++;
                                                                    }
                                                                }
                                                            }
                                                        });
                                                    }
                                                });
                                                var data = {
                                                    "data": "inserted"
                                                }
                                                res.send(data);
                                            }
                                            else{
                                                var data = {
                                                    "data": "inserted"
                                                }
                                                res.send(data);
                                            }
                                        }
                                        else
                                        {
                                            res.send({
                                                data: false
                                            });
                                        }
                                    });
                                }
                                else
                                {
                                    res.send({
                                        data: false
                                    });
                                }
                            });
                        });
                    });
                });
            }else{
                res.status(404).end();
            }
        });
    },
    
    /**
     *unlike a pin
     *@author Arya <arya@cubettech.com>
     * @Date 20-11-2013
     * */
    pinUnlike: function(req, res) {
        var pin_id = req.body.pin_id;
        var user_id = req.session.login_user_id;
        var data = {
            "pin_id": mongo.ObjectID(pin_id),
            "user_id": mongo.ObjectID(user_id),
            "timestamp": new Date().getTime()
        }
        PostModel.removePinLike(data, function(person) {

            PostModel.getPinDetails(pin_id, function(pinDetail){
                boardModel.getBoardOne(pinDetail[0].board_id.toHexString(), function(boards){
                    // create story for unliking a pin
                    var story = {
                        timestamp: new Date(),
                        user_id: mongo.ObjectID(user_id),
                        action: HELPER.ACTIVITY_VERBS.UNLIKE,
                        item_type: HELPER.ACTIVITY_TYPES.PIN,
                        item_id: pinDetail[0]._id,
                        item_name: pinDetail[0].description,
                        item_image: Array.isArray(pinDetail[0].image_name) ? pinDetail[0].image_name[0] : pinDetail[0].image_name,
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
                        HELPER.notifyAboutStory(user_id, newStory[0]);
                        if (person)
                        {
                            var data = {
                                "data": "removed"
                            }
                            res.send(data);

                        }
                        else
                        {
                            res.send('no response');
                        }
                    });
                });
            });
        });
    },
    createComment: function(req, res) {

        var pin_id = req.body.pin_id;
        var user_id = req.session.login_user_id;
        var comment = "This is atest Comment"
        var insert_data = {
            "pin_id": mongo.ObjectID(pin_id),
            "user_id": mongo.ObjectID(user_id),
            "comment": comment,
            "timestamp": new Date().getTime()
        }
        PostModel.insertComment(insert_data, function(person) {


            if (person)
            {
                PostModel.getPinCreator(pin_id, function(creator) {
                    if (creator.length > 0 && user_id != creator[0]._id)
                    {
                        var html = '<b>Hi ' + creator[0].value.name + ', </b><br/>' + req.session.login_user_name + ' Liked your pin.<br/>';
                        var maildata = {
                            "tomail": creator[0].value.email,
                            "html": html
                        }

                        HELPER.socketNotification('', 'notification', html, maildata, true);
                        var notification_data =
                        {
                            key: "pin_like"
                            , 
                            notification_generator: req.session.login_user_id
                            , 
                            notification_acceptor: creator[0]._id
                            , 
                            notification: html
                            , 
                            status: 1
                        }
                        notificationModel.NotificationInsertion(notification_data, function(callback) {

                            });

                        HELPER.socketNotification(creator[0].value.socket_id, 'notification', html, '', false);
                    }
                    var data = {
                        "data": "inserted"
                    }
                    res.send(data);
                });
            }
            else
            {
                res.send('no response');
            }
        });

    },
    /**
     *repin a pin
     *@author Arya <arya@cubettech.com>
     * @Date 20-11-2013
     * */
    repin: function(req, res) {

        var pin_id = req.body.pin_id;

        var user_id = req.session.login_user_id;
        var board_id = req.body.board_id;
        var description = req.body.description;
        var level = 0;
        var level_index = 0;
        PostModel.getPinDetails(pin_id, function(pins) {

            if (pins.length > 0)
            {
                PostModel.checkRepin(pin_id, function(repins) {

                    var parent_pin_id = pins[0]._id;
                    var source_pin_id = pins[0]._id;
                    if (repins.length > 0)
                    {
                        for (i in repins)
                        {
                            if (repins[i].level == 0)
                            {
                                level_index = i;
                            }
                            i++;
                        }
                        var source_pin_id = repins[level_index].source_pin_id;
                        level = repins.length;
                    }
                    for (var key in pins[0]) {
                        if (key == '_id') {
                            delete pins[0][key];
                        }
                    }

                    pins[0].user_id = mongo.ObjectID(req.session.login_user_id);
                    pins[0].time = new Date().getTime();
                    pins[0].repin = 1;
                    pins[0].board_id = mongo.ObjectID(board_id);
                    pins[0].description = description;
                    //get the template based on the type of pin
                    PostModel.PinCreation(pins[0], function(newpin) {
                        newpin = newpin[0];

                        getPinDataForWidget(newpin._id.toHexString(), req.session.login_user_id, function(data) {
                          var gridEl = system.getCompiledView(path.join('','pins/moredataGrid'), data);
                          var listEl = system.getCompiledView(path.join('','pins/moredataList'), data);
                          sio.sockets.emit('pageview', {
                            gridEl: gridEl,
                            listEl: listEl,
                            pin_type: newpin.pin_type,
                            data: newpin
                          });
                        });

                        var insertRePin_data = {
                            "pin_id": newpin._id,
                            "parent_pin_id": parent_pin_id,
                            "source_pin_id": source_pin_id,
                            "level": level,
                            "timestamp": new Date().getTime()
                        }
                        PostModel.rePinCreation(insertRePin_data, function(newrepin) {
                            PostModel.getPinDetails(newpin._id.toHexString(), function(pinDetail){
                                console.log("find by biard "+board_id);
                                boardModel.getBoardOne(board_id, function(boards){
                                    //console.log(boards);
                                    // create story for repinning a pin
                                    var story = {
                                        timestamp: new Date(),
                                        user_id: mongo.ObjectID(user_id),
                                        action: HELPER.ACTIVITY_VERBS.REPIN,
                                        item_type: HELPER.ACTIVITY_TYPES.PIN,
                                        item_id: pinDetail[0]._id,
                                        item_name: pinDetail[0].description,
                                        item_image: Array.isArray(pinDetail[0].image_name) ? pinDetail[0].image_name[0] : pinDetail[0].image_name,
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
                                        HELPER.notifyAboutStory(user_id, newStory[0]);
                                        if (newrepin)
                                            res.redirect('back');
                                    });
                                });
                            });
                        });
                    });
                });

            }
        });
    },
    saveCommentStory: function(req, res) {
        var id = req.body.id;
        var comment = req.body.comment;
        var _url = require('url');
        var type = _url.parse(req.body.url).pathname.split('/')[1];
        var user_id = req.session.login_user_id;

        switch(type){
            case 'pin':
                PostModel.getPinDetails(id, function(pinDetail){
                    boardModel.getBoardOne(pinDetail[0].board_id.toHexString(), function(boards){
                        // create story for commenting on a pin
                        var story = {
                            timestamp: new Date(),
                            user_id: mongo.ObjectID(user_id),
                            action: HELPER.ACTIVITY_VERBS.COMMENT,
                            item_type: HELPER.ACTIVITY_TYPES.PIN,
                            item_id: pinDetail[0]._id,
                            item_name: pinDetail[0].description,
                            item_image: Array.isArray(pinDetail[0].image_name) ? pinDetail[0].image_name[0] : pinDetail[0].image_name,
                            updated_field_type: null,
                            updated_field: null,
                            old_value: null,
                            new_value: null,
                            comment: comment,
                            related_item_type: HELPER.ACTIVITY_TYPES.BOARD,
                            related_item_id: boards[0]._id,
                            related_item_name: boards[0].board_name,
                            related_item_image: boards[0].image
                        };
                        storyModel.insert(story, function(newStory){
                            HELPER.notifyAboutStory(user_id, newStory[0]);
                            res.send({});
                        });
                    });
                });
                break;
            case 'board':
                boardModel.getBoardOne(id, function(boards){
                    catModel.getCategoryOne(boards[0].category_id.toHexString(), function(cats){
                        // create story for commenting on a pin
                        var story = {
                            timestamp: new Date(),
                            user_id: mongo.ObjectID(user_id),
                            action: HELPER.ACTIVITY_VERBS.COMMENT,
                            item_type: HELPER.ACTIVITY_TYPES.BOARD,
                            item_id: boards[0]._id,
                            item_name: boards[0].board_name,
                            item_image: boards[0].image,
                            updated_field_type: null,
                            updated_field: null,
                            old_value: null,
                            new_value: null,
                            comment: comment,
                            related_item_type: HELPER.ACTIVITY_TYPES.CATEGORY,
                            related_item_id: cats[0]._id,
                            related_item_name: cats[0].category_name,
                            related_item_image: cats[0].image
                        };
                        storyModel.insert(story, function(newStory){
                            HELPER.notifyAboutStory(user_id, newStory[0]);
                            res.send({});
                        });
                    });
                });
                break;
            case 'category':
                catModel.getCategoryOne(id, function(cats){
                    // create story for commenting on a pin
                    var story = {
                        timestamp: new Date(),
                        user_id: mongo.ObjectID(user_id),
                        action: HELPER.ACTIVITY_VERBS.COMMENT,
                        item_type: HELPER.ACTIVITY_TYPES.CATEGORY,
                        item_id: cats[0]._id,
                        item_name: cats[0].category_name,
                        item_image: cats[0].image,
                        updated_field_type: null,
                        updated_field: null,
                        old_value: null,
                        new_value: null,
                        comment: comment,
                        related_item_type: null,
                        related_item_id: null,
                        related_item_name: null,
                        related_item_image: null
                    };
                    storyModel.insert(story, function(newStory){
                        HELPER.notifyAboutStory(user_id, newStory[0]);
                        res.send({});
                    });
                });
                break;
            default: throw 'Unknown comment story type: '+type;
        }
    },
    /**
     *loads the repin page
     *@author Arya <arya@cubettech.com>
     * @Date 20-11-2013
     * */
    repinload: function(req, res) {
        var pin_id = req.params.pid;
        HELPER.getAllAuthorizedBoards(req.session.login_user_id, HELPER.ACTION.CREATE_PIN.ROLE, function(boards){
            pinModel.getPinsOne(pin_id, function(result) {
                var data = {
                    pin: result,
                    pagetitle: 'Repin',
                    loiginuser: req.session.login_user_name,
                    loggeduser_id: req.session.login_user_id,
                    boards: boards,
                    popup: 0,
                    pin_id: pin_id,
                    layout: false
                };
                system.loadView(res, path.join('','pins/repin'), data);
            });
        });
    },
    /**
     *load the report pin page
     *@author Arya <arya@cubettech.com>
     * @Date 2-12-2013
     * */
    reportPinLoad: function(req, res) {
        var pin_id = req.params.pid;
        // get the details of a single pin
        pinModel.getPinsOne(pin_id, function(result) {
            var data = {
                pin: result,
                pagetitle: 'Report',
                loiginuser: req.session.login_user_name,
                loggeduser_id: req.session.login_user_id,
                popup: 0,
                pin_id: pin_id,
                layout: 'urlfetch_layout'
            };

            system.loadView(res, path.join('','pin_image/report'), data);
        });

    },
    /**
     *report a pin
     *@author Arya <arya@cubettech.com>
     * @Date 2-12-2013
     * */
    report: function(req, res) {

        var pin_id = req.body.pin_id;
        var reason = req.body.reason;
        var rept_message = req.body.rept_message;
        var report_data = {
            "reported": 1,
            "report_by": req.session.login_user_id,
            "report_msg": rept_message,
            "report_reason": reason,
            "pin_id": pin_id
        };
        PostModel.reportPin(report_data, function(result) {
            console.log(result);
            res.end();
        });

    },
    /**
     *make notification as read
     *@author Arya <arya@cubettech.com>
     * @Date 2-12-2013
     * */
    removeNotification: function(req, res) {
        var acceptor = req.session.login_user_id;
        notificationModel.notificationStatusChange(acceptor, function(result) {
            if (result)
                var data = {
                    "data": "updated"
                }
            res.send(data);
        });
    },
    /**
     *list the pins of a particular user
     *@author Arya <arya@cubettech.com>
     * @Date 20-12-2013
     * */
    listByUser: function(req, res) {
        var user_id = req.params.uid;
        UserModel.userFollowDetails(req.session.login_user_id,user_id, function(userdetail) {
          
            catModel.getCategoryAll(function(result) {
                
                PostModel.UserFollowerCount(user_id,function(count){
                    PostModel.getUserPincount(user_id,function(person1) { 
                      
                        PostModel.getPinsByUser(req.session.login_user_id, user_id, userdetail, function(person) {
                            // boardModel.getBoardOne(board_id,function(board){
                   
                     
                            //  boardModel.boardCreator(req.session.login_user_id,board_id, function(creator){ 
                            //console.log(person);
                    
                            // UserModel.userDetails(creator[0]._id.toHexString(),function(userimage) {
                          UserModel.GetUserForDisplay(user_id, function(profileUserData) {
                            UserModel.userDetails(req.session.login_user_id, function(user) {
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
                                var user_data = {
                                    creator_name: userdetail[0].name,
                                    creator_image: userdetail[0].image
                                };
                                var data = {
                                    'data': person,
                                    'pagetitle': 'User Pins',
                                    'loiginuser': req.session.login_user_name,
                                    'loggeduser_id': req.session.login_user_id,
                                    'category': result,
                                    'hidden_data': user_data,
                                    'type': 'user',
                                    'user_detail': userdetail,
                                    // 'description': board[0].description,
                                    // 'board_image': board[0].image,
                                    // 'followercount': count.length,
                                    'pincount': person1.length,
                                    'followcount': count.length,
                                    //'creator_image': userimage[0].image,
                                    'user_image': user[0].image,
                                    'creator_image': userdetail[0].image,
                                    'creator_name': userdetail[0].name,
                                    'userfollow' : userdetail[0].userfollow,
                                    'user': profileUserData[0],
                                    'listuser': user_id,
                                    'type_id': user_id,
                                    'DEFINES': global.DEFINES,
                                    'HOST': global.sleekConfig.appHost,
                                    'SSO': SSO
                                };
                                system.loadView(res, path.join('','pins/pin'), data);
                                system.setPartial(path.join('','pins/pinheader'), 'pinheader');
                                system.setPartial(path.join('','pins/imagePinView'), 'pinviewimage');
                                system.setPartial(path.join('','pins/webPinView'), 'pinvieweb');
                                system.setPartial(path.join('','pins/pdfPinView'), 'pinviewpdf');
                                system.setPartial(path.join('','pins/imagePinListView'), 'pinviewimage2');
                                system.setPartial(path.join('','pins/webPinListView'), 'pinvieweb2');
                                system.setPartial(path.join('','pins/pdfPinListView'), 'pinviewpdf2');
                                system.setPartial(path.join('','timeline/activity'), 'activity');
                            });
                          });
                        });
                    });
                });
            //});
            //});
            // });
            });
        });
    },
    
    /**
     *loads the pins of a particular category
     *@author Arya <arya@cubettech.com>
     * @Date 20-12-2013
     * */
    
    listByCategory: function(req, res) {
        
        var catId = req.params.catid;
        catModel.getCategoryAll(function(result) {
            catModel.getCategoryOne(catId, function(category) {
                userRoleModel.findByResource(catId, function(userRoles) {
                    var canManageUsers = category[0].creator == req.session.login_user_id;
                    if(!canManageUsers){
                        userRoles.forEach(function(userRole){
                            if(userRole.type == HELPER.RESOURCE_TYPE.CATEGORY && userRole.user_id == req.session.login_user_id){
                                canManageUsers = true;
                            }
                        });
                    }
                    UserModel.userDetails(category[0].creator.toHexString(), function(userData) {
                        UserModel.userDetails(req.session.login_user_id, function(user) {
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
                            boardModel.getBoardIdsByCategory(catId, function(boards){
                                if(boards.length>0) {
                                    PostModel.getPinsFromMultipleBoard(req.session.login_user_id, boards, function(pins) {
                                        var data = {
                                            'data': pins,
                                            'category': result,
                                            'pagetitle': 'Pins',
                                            'loiginuser': req.session.login_user_name,
                                            'loggeduser_id': req.session.login_user_id,
                                            'type': 'category',
                                            'type_id': catId,
                                            'user_image': user[0].pic,
                                            'board_detail': category[0].category_name,
                                            'description': category[0].description,
                                            'board_image': category[0].image ? path.join("/categories", category[0].image) : "",
                                            'followercount': userRoles.length,
                                            'pincount': boards.length,
                                            'creator_name': userData[0].name,
                                            'creator_image': userData[0].image,
                                            'can_manage_users': canManageUsers,
                                            'DEFINES': global.DEFINES,
                                            'HOST': global.sleekConfig.appHost,
                                            'SSO': SSO
                                        };

                                        system.loadView(res,path.join('','pins/pin'), data);
                                        system.setPartial(path.join('','pins/pinheader'), 'pinheader');
                                        system.setPartial(path.join('','pins/imagePinView'), 'pinviewimage');
                                        system.setPartial(path.join('','pins/webPinView'), 'pinvieweb');
                                        system.setPartial(path.join('','pins/pdfPinView'), 'pinviewpdf');
                                        system.setPartial(path.join('','pins/imagePinListView'), 'pinviewimage2');
                                        system.setPartial(path.join('','pins/webPinListView'), 'pinvieweb2');
                                        system.setPartial(path.join('','pins/pdfPinListView'), 'pinviewpdf2');
                                        system.setPartial(path.join('','timeline/activity'), 'activity');
                                    });
                                }
                                else{
                                    var data = {                                              
                                        'pagetitle': 'Pins',
                                        'category': result,
                                        'loiginuser': req.session.login_user_name,
                                        'loggeduser_id': req.session.login_user_id,
                                        'type': 'category',
                                        'type_id': catId,
                                        'user_image': user[0].pic,
                                        'board_detail': category[0].category_name,
                                        'description': category[0].description,
                                        'board_image': category[0].image ? path.join("/categories", category[0].image) : "",
                                        'followercount': userRoles.length,
                                        'pincount': 0,
                                        'creator_name': userData[0].name,
                                        'creator_image': userData[0].image,
                                        'can_manage_users': canManageUsers,
                                        'DEFINES': global.DEFINES,
                                        'HOST': global.sleekConfig.appHost,
                                        'SSO': SSO
                                    };
                                               

                                    system.loadView(res,path.join('','pins/pin'), data);
                                    system.setPartial(path.join('','pins/pinheader'), 'pinheader');
                                    system.setPartial(path.join('','pins/imagePinView'), 'pinviewimage');
                                    system.setPartial(path.join('','pins/webPinView'), 'pinvieweb');
                                    system.setPartial(path.join('','pins/pdfPinView'), 'pinviewpdf');
                                    system.setPartial(path.join('','pins/imagePinListView'), 'pinviewimage2');
                                    system.setPartial(path.join('','pins/webPinListView'), 'pinvieweb2');
                                    system.setPartial(path.join('','pins/pdfPinListView'), 'pinviewpdf2');
                                    system.setPartial(path.join('','timeline/activity'), 'activity');
                                }
                            })
                        });  
                    });
                });            
            });
        });
    },

    renderEditPinForm: function(req, res){
        HELPER.getAllAuthorizedBoards(req.session.login_user_id, HELPER.ACTION.EDIT_PIN.ROLE, function(result){
            pinModel.getPinsOne(req.params.pid, function(pin) {
                var data = {
                    layout: 'urlfetch_layout',
                    boards: result,
                    editing: true,
                    pin: pin,
                    pin_thumb: _.isArray(pin.image_name)? pin.image_name[0] : pin.image_name
                }
                system.loadView(res, path.join('','pin_image/addpin'), data);
            });
        });
    },
    
    updatePin: function(req, res){
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            var board_id    = fields.board_id;
            var description = fields.description;
            var filename    = files.upload ? files.upload.name : '' ;
            var fileType    = files.upload ? files.upload.type : '' ;
            var fileSize    = files.upload ? files.upload.size : '' ;
            var meta        = fields.meta ? fields.meta : {};
            var requiredFiledsIfSet = ['description', 'pin_url', 'source_url'];
            var updates = [];
            var maxImageSize = 1;
            
            async.waterfall([
                // Auth
                function(cb){
                    HELPER.role_validate(req.session.login_user_id, board_id, HELPER.ACTION.EDIT_PIN.ROLE, res, cb);
                },
                // Get the pin
                function(cb){
                    mongodb.collection('pins').find({
                        _id:  mongo.ObjectID(req.params.pid)
                    }).toArray(function(e, pins){
                        if(e || !pins){
                            return cb(e || {
                                error: 1,
                                msg: 'Pin '+req.params.pid+' not found'
                            });
                        }
                        cb(null, pins[0]);
                    });
                },
                // Validate inputs
                function(pin, cb){
                    cb = _.once(cb);
                    console.log(fields);
                    // Regular required keys
                    _.find(fields, function(fv, fk){
                        fv = fv.trim();
                        if(requiredFiledsIfSet.indexOf(fk) != -1 && !fv){
                            cb({
                                error: 1,
                                msg: 'Please complete all required fileds.'
                            });
                            return true;
                        }
                        // Update checker
                        if(pin[fk]){
                            var update = false;
                            if(pin[fk].toHexString){
                                if(pin[fk].toHexString() != fv){
                                    update = true;
                                }
                            }else if(pin[fk] != fv){
                                update = true;
                            }

                            if(update){
                                updates.push({
                                    field: fk,
                                    from: pin[fk],
                                    to: fv
                                });
                            }
                        }
                    });
                    // Meta keys are all required
                    if(pin.metadata){
                        var special_fields = ["completed", "pds", "illumination"];
                        _.find(pin.metadata, function(metaV, metaK){
                            if(special_fields.indexOf(metaK) != -1){
                                // Special fields
                                switch(metaK){
                                    case "completed":
                                    case "pds":
                                        if(metaV && typeof fields['meta.'+metaK] == 'undefined'){
                                            updates.push({
                                                field: 'meta.'+metaK,
                                                from: metaV,
                                                to: false
                                            });
                                        }else if(!metaV && typeof fields['meta.'+metaK] == 'string'){
                                            updates.push({
                                                field: 'meta.'+metaK,
                                                from: metaV,
                                                to: true
                                            });
                                        }
                                        break;
                                    case "illumination":
                                        if(metaV === null &&  fields['meta.'+metaK] != 'null'){
                                            updates.push({
                                                field: 'meta.'+metaK,
                                                from: metaV,
                                                to: fields['meta.'+metaK]
                                            });
                                        }
                                        break; 
                                }
                            }else{
                                if(!fields['meta.'+metaK]){
                                    cb({
                                        error: 1,
                                        msg: 'Please complete all meta fileds.'
                                    });
                                    return true;
                                }
                                // Update check
                                if(metaV != fields['meta.'+metaK]){
                                    updates.push({
                                        field: 'meta.'+metaK,
                                        from: metaV,
                                        to: fields['meta.'+metaK]
                                    });
                                }
                            }
                        });
                    }
                    // Continue with
                    cb(null, {
                        pin: pin
                    });
                },
                // Validate file upload
                function(cntx, cb){
                    if(fileType){
                        // IMAGES
                        if (HELPER.typeValid(HELPER.SUPPORTED_FILES.validImage, fileType)){
                            if(fileSize <= ( maxImageSize * 1024 * 1024 ) ){
                                var img_ext = HELPER.get_extension(filename),
                                    imagename = new Date().getTime()+filename;

                                fs.readFile(files.upload.path, function(err, data) {
                                    if(err){
                                        return cb(err);
                                    }
                                    var newPath = DEFINES.IMAGE_PATH_ORIGINAL_REL + imagename;
                                    // write file to folder
                                    fs.writeFile(newPath, data, function(err) {
                                        if(err){
                                            return cb(err);
                                        }
                                        //console.log('renamed complete');
                                        fs.unlink(files.upload.path);
                                        //set image width to 600 px
                                        HELPER.get_img_width(im, newPath, function(width) {
                                            //resizing image
                                            var rez_opt = {
                                                srcPath: DEFINES.IMAGE_PATH_ORIGINAL_REL + imagename,
                                                dstPath: DEFINES.IMAGE_PATH_SMALL_REL + imagename,
                                                width: width
                                            };
                                            im.resize(rez_opt, function(err, stdout, stderr) {
                                                if(err){
                                                    return cb(err);
                                                }
                                                var rez_opt = {
                                                    srcPath: DEFINES.IMAGE_PATH_ORIGINAL_REL + imagename,
                                                    dstPath: DEFINES.IMAGE_PATH_THUMB_REL + imagename,
                                                    width: '600' // pop up image width
                                                };
                                                im.resize(rez_opt, function(err, stdout, stderr) {
                                                    if(err){
                                                        return cb(err);
                                                    }
                                                    updates.push({
                                                        field: 'image',
                                                        to: [imagename]
                                                    });
                                                    cb(null, cntx);
                                                });
                                            });
                                        });
                                    });
                                });
                            }else{
                                return cb({msg: 'Invalid file size'});
                            }
                        } else {
                            return cb({msg: 'Invalid file format'});
                        }
                    }else{
                        cb(null, cntx);
                    }
                },
                // Get the board
                function(cntx, cb){
                    mongodb.collection('board').find({
                        _id:  cntx.pin.board_id
                    }).toArray(function(e, boards){
                        if(e || !boards){
                            return cb(e || {
                                error: 1,
                                msg: 'Board not found'
                            });
                        }
                        cntx.board = boards[0];
                        cb(null, cntx);
                    });
                },
                // Get the new board details if needed
                function(cntx, cb){
                    if(cntx.pin.board_id.toHexString() != board_id){
                        mongodb.collection('board').find({
                            _id:  mongo.ObjectID(board_id)
                        }).toArray(function(e, boards){
                            if(e || !boards){
                                return cb(e || {
                                    error: 1,
                                    msg: 'Board not found'
                                });
                            }
                            cntx.toBoard = boards[0];
                            cb(null, cntx);
                        });
                    }else{
                        cb(null, cntx);
                    }
                },
                // Update
                function(cntx, cb){
                    var db_data = cntx.pin;
                    _.each(updates, function(u, indx){
                        if(u.field.indexOf('meta.') != -1){
                            db_data.metadata[u.field.substring(5)] = u.to;
                        }else if(u.field == 'board_id'){
                            db_data[u.field] = mongo.ObjectID(u.to);
                        }else if(u.field == 'image'){
                            db_data.image_name = u.to;
                            db_data.tmb_image_name = u.to;
                        }else{
                            db_data[u.field] = u.to;
                        }
                    });
                    
                    mongodb.collection('pins').update({
                        _id: mongo.ObjectID(req.params.pid)
                    }, db_data, function(e){
                        if(e){
                            return cb(e);
                        }
                        cntx.undate_data = db_data;
                        cb(null, cntx);
                    });
                },
                // Story
                function(cntx, cb){
                    var story = {
                        timestamp: new Date(),
                        user_id: mongo.ObjectID(req.session.login_user_id),
                        action: HELPER.ACTIVITY_VERBS.UPDATE,
                        item_type: HELPER.ACTIVITY_TYPES.PIN,
                        item_id: cntx.pin._id,
                        item_name: cntx.undate_data.description,
                        item_image: _.isArray(cntx.undate_data.image_name) ? cntx.undate_data.image_name[0] : cntx.undate_data.image_name,
                        updated_field_type: null,
                        updated_field: null,
                        old_value: null,
                        new_value: null,
                        related_item_type: HELPER.ACTIVITY_TYPES.BOARD,
                        related_item_id: cntx.undate_data.board_id,
                        related_item_name: cntx.board.board_name,
                        related_item_image: cntx.board.image,
                        updates: updates
                    };
                    // create story for updating a pin
                    if(cntx.toBoard){
                        var bi;
                        _.find(updates, function(u, i){
                            if(u.field == 'board_id'){
                                bi = i;
                                return true;
                            }
                        });
                        story.updates[bi].field = 'board';
                        story.updates[bi].from = cntx.board.board_name;
                        story.updates[bi].to = cntx.toBoard.board_name;
                        story.action = HELPER.ACTIVITY_VERBS.MOVE;
                        story.related_item_type = null;
                        story.related_item_id = null;
                        story.related_item_name = null;
                        story.related_item_image = null;
                    }
                    storyModel.insert(story, function(newStory){
                        HELPER.notifyAboutStory(req.session.login_user_id, newStory[0]);
                        
                        cntx.undate_data.popStatus = '1' ;
                        cntx.undate_data.pinlike=1;
                        cntx.undate_data.loggeduser_id = req.session.login_user_id;
                        cntx.undate_data.creator_name = req.session.login_user_name;
                        cntx.undate_data.creator_image = req.session.login_user_img;
                        // send details to socket
                        boardModel.getCategoryByBoardId(board_id, function(catdetails){
                          cntx.undate_data.category_id = catdetails.category_id ? catdetails.category_id: '';
                          getPinDataForWidget(req.params.pid, req.session.login_user_id, function(data) {
                            var gridEl = system.getCompiledView(path.join('','pins/moredataGrid'), data);
                            var listEl = system.getCompiledView(path.join('','pins/moredataList'), data);
                            sio.sockets.emit('pin_update', {
                              gridEl: gridEl,
                              listEl: listEl,
                              data: cntx.undate_data
                            });
                          });
                        });
                        //success
                        cb(null, cntx);
                    });
                },
                // Done.
                function(cntx, cb){
                    cb(null, {msg: 'Pin updated successfully.'});
                }
            ], function(e, r){
                if(e){
                    return res.send({
                        error: 1,
                        msg: e.msg || e.message,
                        u: updates
                    });
                }
                res.send(r);
            });
        });
    }
};

/**
 * Get pin data for widget.
 * @param pinId the pin id
 * @param login_user_id the user id
 * *param callback the callback
 */
var getPinDataForWidget = function(pinId, login_user_id, callback) {
  PostModel.getPinDetails(pinId, function(pins) {
    var pin = pins[0];
    boardModel.getBoardOne(pin.board_id.toHexString(), function(boarddata) {
      UserModel.userDetails(pin.user_id.toHexString(), function(user) {
        PostModel.pinLikeCheck(pin._id.toHexString(), login_user_id, function(likecheck) {
          PostModel.pinLikeCount(pin._id.toHexString(), function(likecount) {
            if (likecheck.length > 0) {
              pin.pinlike = 0;
            } else {
              pin.pinlike = 1;
            }
            pin.pinlikecount = likecount;
            pin.image_name = pin.image_name[0];
            pin.creator_name = user[0].name;
            pin.loggeduser_id = login_user_id;
            pin.popStatus = '1';
            pin.creator_image = user[0].image;
            pin.board_name = boarddata[0].board_name;
            pin.board_image = boarddata[0].image;

            var data = {
              'data': pins,
              'layout': false,
              'include_timeline': 'true'
            };
            //console.log(data);
            callback(data);
          });
        });
      });
    });
  });
};

module.exports = pinController;
