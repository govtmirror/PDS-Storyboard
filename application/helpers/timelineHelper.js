/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
 /**
 * Useful functions for timeline
 *
 * Changes in version 1.2 (Myyna [Bug Bounty]):
 * - the user name of the timeline item is now loaded on demand
 *
 * @author MonicaMuranyi, kiril.kartunov
 * @version 1.2
 */
var path = require('path');
var userRoleModel = system.getModel('userRole');
var userModel = system.getModel('user');
var followerModel = system.getModel('follower');
var boardModel = system.getModel('board');
var categoryModel = system.getModel('category');
var pinModel = system.getModel('pin');
var _ = require('underscore');
var async = require('async');

system.loadHelper('constants');

module.exports = {
    /**
     * Compiles a story for view
     *
     * @param story The story
     * @param [activity] Compile for activity list
     * @param callback
     * @since 1.1
     */
    compileStoryForView: function(story, activity, callback){
        if(typeof activity == 'function'){
            callback = activity;
            activity = null;
        }
        // Retrieve the story user image
        userModel.userDetails(story.user_id.toHexString(), function(userdetail) {
            // The prefix of the image based on the resource type
            var imagePathPrefix = getImagePathPrefix(story.item_type);
            // Holds the aggregated items of the story item
            var items = [];

            if(story.items){
                // Aggregated items are handled here
                story.items.forEach(function(item){
                        items.push({
                            name: item.item_name,
                            image: path.join(imagePathPrefix, "thumb", item.item_image instanceof Array && item.item_image.length>0 ? item.item_image[0] : item.item_image),
                            image_large: path.join(imagePathPrefix, item.item_image instanceof Array && item.item_image.length>0 ? item.item_image[0] : item.item_image),
                            link: path.join("/"+story.item_type, item.item_id + ""),
                            item_type: story.item_type,
                            updates: item.updates,
                            item_id: item.item_id,
                            user_id: item.user_id
                        });
                });
            } else {
                // Non-aggregated items are handled here
                items.push({
                    name: story.item_name,
                    image: path.join(imagePathPrefix, "thumb", story.item_image instanceof Array && story.item_image.length>0 ? story.item_image[0] : story.item_image),
                    image_large: path.join(imagePathPrefix, story.item_image instanceof Array && story.item_image.length>0 ? story.item_image[0] : story.item_image),
                    link: path.join("/"+story.item_type, story.item_id + ""),
                    item_type: story.item_type,
                    item_id: story.item_id,
                    user_id: story.user_id
                });
                
            }
            // The common fields of aggregated/un-aggregated items
            var timelineItem = {
                user_name: userdetail[0].name,
                user_image: path.join(HELPER.IMAGE_PATH_PREFIXES.USER, "thumb", userdetail[0].image),
                user_link: path.join("/user", ""+story.user_id),
                time: formatDate(story.timestamp, items.length > 1),
                timestamp: story.timestamp,
                text: constructText(items.length, story),
                items: items
            };

            if(story.new_value){
                timelineItem.old_value = path.join(HELPER.IMAGE_PATH_PREFIXES.USER, "thumb", story.old_value);
                timelineItem.new_value = path.join(HELPER.IMAGE_PATH_PREFIXES.USER, "thumb", story.new_value);
            }
            // Don't show related item (board) when commenting/liking/unliking pin
            var showRelatedItem = story.action !== HELPER.ACTIVITY_VERBS.COMMENT && 
                story.action !== HELPER.ACTIVITY_VERBS.LIKE && story.action !== HELPER.ACTIVITY_VERBS.UNLIKE;
            if(story.related_item_type !== null && showRelatedItem){
                imagePathPrefix = getImagePathPrefix(story.related_item_type);
                timelineItem.related_item = {
                    link_word: story.item_type === HELPER.ACTIVITY_TYPES.USER ? (story.action === HELPER.ACTIVITY_VERBS.DELETE ? "from" : "to") : "in",
                    type: story.related_item_type,
                    name: story.related_item_name,
                    link: path.join("/"+story.related_item_type, ""+story.related_item_id),
                    image: path.join(imagePathPrefix, "thumb", story.related_item_image),
                };
            }
            // Activity icons in timeline and status bar logic
            _.find(HELPER.ACTIVITY_VERBS, function(v, k){
                if(v == story.action){
                    timelineItem.icon_type = HELPER.ACTIVITY_ICONS[k];
                    if(timelineItem.items.length == 1){
                        var showStatusFor = [
                            HELPER.ACTIVITY_VERBS.CREATE,
                            HELPER.ACTIVITY_VERBS.ADD,
                            HELPER.ACTIVITY_VERBS.UPDATE,
                            HELPER.ACTIVITY_VERBS.REPIN,
                            HELPER.ACTIVITY_VERBS.MOVE,
                            HELPER.ACTIVITY_VERBS.RENAME
                        ];
                        if(showStatusFor.indexOf(story.action) != -1 && story.item_type != HELPER.ACTIVITY_TYPES.USER){
                            timelineItem.showStatusBar = true;
                        }
                    }
                    return;
                }
            });
            // Populate story subject details
            var itm_indx = 0;
            async.eachSeries(timelineItem.items, function(ti, cb){
                switch(ti.item_type){
                    case HELPER.ACTIVITY_TYPES.CATEGORY:
                        categoryModel.getCategoryOne(ti.item_id.toHexString(), function(cat){
                            categoryModel.getCatContext(cat[0], function(e, cntx){
                                timelineItem.items[itm_indx].cntx = cntx;
                                itm_indx++;
                                cb(e);
                            });
                        });
                        break;
                    case HELPER.ACTIVITY_TYPES.BOARD:
                        boardModel.getBoardOne(ti.item_id.toHexString(), function(board){
                            boardModel.getBoardContext(board[0], ti.user_id.toHexString(), function(e, cntx){
                                timelineItem.items[itm_indx].cntx = cntx;
                                itm_indx++;
                                cb(e);
                            });
                        });
                        break;
                    case HELPER.ACTIVITY_TYPES.PIN:
                        pinModel.pinLikeCount(ti.item_id.toHexString(), function(cnt){
                            timelineItem.items[itm_indx].pinLikeCount = cnt;
                            var req = app.get('current_req');
                            if(req){
                                mongodb.collection('pin_like').findOne({
                                    pin_id: ti.item_id,
                                    user_id: mongo.ObjectID(req.session.login_user_id)
                                }, function(e, like){
                                    timelineItem.items[itm_indx].pinlike = like? 1:0;
                                    itm_indx++;
                                    cb();
                                });
                            }else{
                                itm_indx++;
                                cb();
                            }
                        });
                        break;
                    default:
                        itm_indx++;
                        cb();
                        break;
                }
            }, function(e){
                if(e){
                    throw e;
                }
                // Separated templates for activity feed and timeline page
                if(activity){
                    callback(system.getCompiledView(path.join('','timeline/activityItem'), timelineItem));
                }else{
                    callback(system.getCompiledView(path.join('','timeline/timelineItemTemplate'), timelineItem));
                }
            });
        });
    },

    /**
     * Notifies users about a story.
     * The logic is based on the idea of emitting to user or user-resource specific rooms.
     * User roles need to be checked depending on the action performed and resources involved.
     *
     * @param loginId The logged in user id
     * @param story The story
     * @since 1.0
     */
    notifyAboutStory: function(loginId, story){
        // Compile for both timeline and activity
        async.parallel({
            timeline: function(cb){
                this.compileStoryForView(story, function(compiledStory){
                    cb(null, compiledStory);
                });
            }.bind(this),
            activity: function(cb){
                this.compileStoryForView(story, 'activity', function(compiledStory){
                    cb(null, compiledStory);
                });
            }.bind(this)
        }, function(e, compiledStory){

            var item = story.items ? story.items[0] : story;

            // The map that will hold user id - resource id pairs used to construct room names
            var userResourceMap = {};
            // The user which performs the action will always be notified on the resource/profile pages
            userResourceMap[loginId] = [loginId];
            if(loginId !== item.item_id){
                userResourceMap[loginId].push(item.item_id);
            }
            if((item.item_type === HELPER.ACTIVITY_TYPES.USER && (item.action === HELPER.ACTIVITY_VERBS.UPDATE || item.action === HELPER.ACTIVITY_VERBS.FOLLOW || item.action === HELPER.ACTIVITY_VERBS.UNFOLLOW)) || 
                (item.item_type === HELPER.ACTIVITY_TYPES.CATEGORY && item.action === HELPER.ACTIVITY_VERBS.CREATE)){
                // When creating a category or updating/following/unfollowing a user, only the follower users need to be notified
                followerModel.findByFollowed(loginId, function(followerUsers){
                    followerUsers.forEach(function(followerUser){
                        userResourceMap[followerUser.follow_by.toHexString()] = [item.user_id];
                        if(item.user_id !== item.item_id){
                            userResourceMap[followerUser.follow_by.toHexString()].push(item.item_id);
                        }
                    });
                    if(loginId !== item.item_id && item.item_type === HELPER.ACTIVITY_TYPES.USER && (item.action === HELPER.ACTIVITY_VERBS.FOLLOW || item.action === HELPER.ACTIVITY_VERBS.UNFOLLOW)){
                        // When following/unfollowig users, the followed/unfollowed user also needs to e notified
                        userResourceMap[item.item_id] = [item.user_id];
                        if(item.user_id !== item.item_id){
                            userResourceMap[item.item_id].push(item.item_id);
                        }
                    }
                    emitForUserAndResources(userResourceMap, compiledStory);
                });
            } else if(item.item_type === HELPER.ACTIVITY_TYPES.USER){ 
                // Create/Remove user in/from board/category, user picture updated

                // If the user is deleted, then we have to manually add him to the map because
                // no role will be found for him for board/category
                if(item.action === HELPER.ACTIVITY_VERBS.DELETE){
                    userResourceMap[item.item_id] = [item.user_id, item.item_id, item.related_item_id];
                }
                userRoleModel.findByResource(item.related_item_id.toHexString(), function(userRoles) {
                    boardModel.getBoardOne(item.related_item_id.toHexString(), function(boards){
                        // If the user was added/removed from a board
                        userRoles.forEach(function(userRole){
                            if(userRole.user_id.toHexString() != loginId) {
                                userResourceMap[userRole.user_id.toHexString()] = [item.user_id, item.item_id];
                            }
                            userResourceMap[userRole.user_id.toHexString()].push(item.related_item_id);
                        });
                        if(boards.length){
                            userRoleModel.findByResource(boards[0].category_id.toHexString(), function(userRolesCat) {
                                // If the user was added/removed from a category
                                userRolesCat.forEach(function(userRoleCat){
                                    if(!userResourceMap.hasOwnProperty(userRoleCat)){
                                        userResourceMap[userRoleCat.user_id.toHexString()] = [item.user_id, item.item_id, item.related_item_id, boards[0].category_id];
                                    } else {
                                        userResourceMap[userRoleCat.user_id.toHexString()].push(boards[0].category_id);
                                    }
                                });
                                emitForUserAndResources(userResourceMap, compiledStory);
                            });
                        } else {
                            emitForUserAndResources(userResourceMap, compiledStory);
                        }
                    });
                });
            } else if(item.item_type === HELPER.ACTIVITY_TYPES.BOARD){ 
                // Create/Remove/Follow/Unfollow board from category
                if(item.action === HELPER.ACTIVITY_VERBS.CREATE){
                    userRoleModel.findByResource(item.related_item_id.toHexString(), function(userRoles) {
                        // Notify all users that have a role in the category of this board
                        userRoles.forEach(function(userRole){
                            if(userRole.user_id.toHexString() != loginId) {
                                userResourceMap[userRole.user_id.toHexString()] = [item.user_id, item.item_id];
                            }
                            userResourceMap[userRole.user_id.toHexString()].push(item.related_item_id);
                        });
                        emitForUserAndResources(userResourceMap, compiledStory);
                    });
                } else if(item.action === HELPER.ACTIVITY_VERBS.FOLLOW || item.action === HELPER.ACTIVITY_VERBS.UNFOLLOW){
                    userRoleModel.findByResource(item.item_id.toHexString(), function(userRoles) {
                        // Notify all users that have a role in this board
                        userRoles.forEach(function(userRole){
                            if(userRole.user_id.toHexString() != loginId) {
                                userResourceMap[userRole.user_id.toHexString()] = [item.user_id, item.item_id];
                            }
                        });
                        emitForUserAndResources(userResourceMap, compiledStory);
                    });
                } else {
                    userRoleModel.findByResource(item.item_id.toHexString(), function(userRoles) {
                        userRoleModel.findByResource(item.related_item_id.toHexString(), function(userRolesCat) {
                            // Notify all users that have a role in this board
                            userRoles.forEach(function(userRole){
                                if(userRole.user_id.toHexString() != loginId) {
                                    userResourceMap[userRole.user_id.toHexString()] = [item.user_id, item.item_id];
                                }
                            });
                            // Notify all users that have a role in the category of this board
                            userRolesCat.forEach(function(userRoleCat){
                                if(userRoleCat.user_id.toHexString() != loginId) {
                                    if(!userResourceMap.hasOwnProperty(userRoleCat.user_id.toHexString())){
                                        userResourceMap[userRoleCat.user_id.toHexString()] = [item.user_id, item.item_id, item.related_item_id];
                                    } else {
                                        userResourceMap[userRoleCat.user_id.toHexString()].push(item.related_item_id);
                                    }
                                }
                            });
                            emitForUserAndResources(userResourceMap, compiledStory);
                        });
                    });
                }
            } else if(item.item_type === HELPER.ACTIVITY_TYPES.PIN){ 
                // Add/Remove/Like/Comment/Repin pin from/to board
                userRoleModel.findByResource(item.related_item_id.toHexString(), function(userRoles) {
                    boardModel.getBoardOne(item.related_item_id.toHexString(), function(boards){
                        userRoleModel.findByResource(boards[0].category_id.toHexString(), function(userRolesCat) {
                            // Notify all users that have a role in this board
                            userRoles.forEach(function(userRole){
                                if(userRole.user_id.toHexString() != loginId) {
                                    userResourceMap[userRole.user_id.toHexString()] = [item.user_id, item.item_id, item.related_item_id];
                                } else {
                                    userResourceMap[userRole.user_id.toHexString()].push(item.related_item_id);
                                }
                            });
                            // Notify all users that have a role in the category of this board
                            userRolesCat.forEach(function(userRoleCat){
                                if(!userResourceMap.hasOwnProperty(userRoleCat)){
                                    userResourceMap[userRoleCat.user_id.toHexString()] = [item.user_id, item.item_id, item.related_item_id, boards[0].category_id];
                                } else {
                                    userResourceMap[userRoleCat.user_id.toHexString()].push(boards[0].category_id);
                                }
                            });
                            emitForUserAndResources(userResourceMap, compiledStory);
                        });
                    });
                });
            } else if (item.item_type === HELPER.ACTIVITY_TYPES.CATEGORY){ 
                // Create/Delete category
                userRoleModel.findByResource(item.item_id.toHexString(), function(userRoles) {
                    // Notify all users that have a role in this category
                    userRoles.forEach(function(userRole){
                        if(userRole.user_id.toHexString() != loginId) {
                            userResourceMap[userRole.user_id.toHexString()] = [item.user_id, item.item_id];
                        }
                    });
                    emitForUserAndResources(userResourceMap, compiledStory);
                });
            }
        });
    }
};

/**
 * Emits a compiled story to all the room name combinations that can
 * be constructed using the user-resources map
 *
 * @param userResourceMap The user-resources map
 * @param {Object} compiledStory The compiled story that will e emitted
 * @since 1.0
 * @since 1.1 compiledStory is Object
 */
function emitForUserAndResources(userResourceMap, compiledStory){
    console.log("userResourceMap " + JSON.stringify(userResourceMap))
    for (var userId in userResourceMap) {
        if (userResourceMap.hasOwnProperty(userId)) {
            sio.sockets.emit('timeline_data-' + userId, compiledStory.timeline);
            sio.sockets.emit('activity_data-' + userId, compiledStory.activity);
            for (var i = 0; i < userResourceMap[userId].length; i++) {
                sio.sockets.emit('activity_data-' + userId + '-' + userResourceMap[userId][i], compiledStory.activity);
            }
        }
    }
}

/**
 * Constructs the starting text of the timeline item based on different properties of the story
 * 
 * @param nrOfItems The number of story sub items (> 1 if aggregated)
 * @param story The story
 * @since 1.0
 */
function constructText(nrOfItems, story){
    var text = "";
//        updatesMap = {};
    if(nrOfItems > 1){
        if(story.action === HELPER.ACTIVITY_VERBS.COMMENT){
            text += "Added";
        } else {
            text += story.action;
        }
//        story.items.forEach(function(item){
//            updatesMap[item.item_id] = typeof updatesMap[item.item_id] != 'undefined'? updatesMap[item.item_id] + 1 : 0;
//        });
//        if(Object.keys(updatesMap).length == 1){
//            return text + " " + story.items.length + " times " + story.item_type + ": ";
//        }
        text += " " + nrOfItems;
        if(story.action === HELPER.ACTIVITY_VERBS.COMMENT){
            text += " comments on pins";
        } else if (story.item_type === HELPER.ACTIVITY_TYPES.CATEGORY){
            text += " categories";
        } else {
            text += " " + story.item_type + "s";
        }
        text += ": ";
    } else {
        if(story.action === HELPER.ACTIVITY_VERBS.UPDATE && story.item_type === HELPER.ACTIVITY_TYPES.USER){
            text += story.action + " " + story.updated_field;
        } else {
            text += story.action + (story.action === HELPER.ACTIVITY_VERBS.COMMENT ? " on" : "") + " " + story.item_type;
        }
    }
    return text;
}

/**
 * Constructs the image path prefix based on the type of the resource
 * 
 * @param type The resource type
 * @since 1.0
 */
function getImagePathPrefix(type){
    if(type === HELPER.ACTIVITY_TYPES.CATEGORY){
        return HELPER.IMAGE_PATH_PREFIXES.CATEGORY;
    } 
    if(type === HELPER.ACTIVITY_TYPES.BOARD){
        return HELPER.IMAGE_PATH_PREFIXES.BOARD;
    } 
    if(type === HELPER.ACTIVITY_TYPES.PIN){
        return HELPER.IMAGE_PATH_PREFIXES.PIN;
    } 
    if(type === HELPER.ACTIVITY_TYPES.USER){
        return HELPER.IMAGE_PATH_PREFIXES.USER;
    }
    return "";
}

/**
 * Formats a date for view
 * 
 * @param date The date to be formatted
 * @param notShowMinutes Flag that indicates if the date shouldn't have minute precision 
 * (true for aggregated stories)
 * @since 1.0
 */
function formatDate(date, notShowMinutes){
    var monthNames = [
      "January", "February", "March",
      "April", "May", "June", "July",
      "August", "September", "October",
      "November", "December"
  ];
  date = new Date(date);
  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();
  var hours = date.getHours();
  var minutes = date.getMinutes();
  if(notShowMinutes){
    minutes = 0;
  }
  return ("0" + hours).slice(-2) + ":" + ("0" + minutes).slice(-2) + ", " + day + " " + monthNames[monthIndex] + " " + year;
}
