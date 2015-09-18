/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Represents the timeline controller
 *
 * @author MonicaMuranyi, kiril.kartunov
 * @version 1.1
 */
var path = require('path');
system.loadHelper('constants');
system.loadHelper('timelineHelper');
var storyModel = system.getModel('story');
var userRoleModel = system.getModel('userRole');
var userModel = system.getModel('user');
var followerModel = system.getModel('follower');
var boardModel = system.getModel('board');
var categoryModel = system.getModel('category');
var notificationModel = system.getModel('notification');
var pinModel = system.getModel('pin');
var async = require('async');
var cachedAccessibleResources = undefined;
var cachedFollowedUsers = undefined;
var lastItemTime = new Date();

var timelineController = {

    /**
     * Shows the timeline page
     *
     * @param req The http request object
     * @param res The http response object
     * @since 1.0
     */
    showTimeline: function(req, res) {
        categoryModel.getCategoryAll(function(result) {
            userModel.userDetails(req.session.login_user_id, function(user) {
                notificationModel.userUnreadnotifications(req.session.login_user_id, function(notifications) {
                    // DisqusSSO
                    var SSO = null;
                    if(user[0].username){
                        var disqusSignon = require('../helpers/disqusSignon');
                        SSO = disqusSignon({
                            id: user[0]._id,
                            username: user[0].username,
                            email: user[0].email
                        });
                    }
                    req.session.login_user_img = user[0].image;
                    var data = {
                        pagetitle: 'Pins',
                        notifications: notifications,
                        notification_count: notifications.length,
                        loiginuser: req.session.login_user_name,
                        loggeduser_id: req.session.login_user_id,
                        category: result,
                        layout: 'default',
                        type: 'list',
                        user_image: user[0].image,
                        user_id: req.session.login_user_id,
                        hideActivity: true,
                        DEFINES: global.DEFINES,
                        SSO: SSO
                    };
                    system.loadView(res, path.join('','timeline/timeline'), data);
                    system.setPartial(path.join('','pins/pinheader'), 'pinheader');
                });
            });
        });
    },

    /**
     * Retrieves the next timeline itema
     *
     * @param req The http request object
     * @param res The http response object
     * @since 1.0
     */
    getNextTimelineItems: function(req, res) {
        var loginId = req.session.login_user_id;
        if(req.params.restart === "true"){
            lastItemTime = new Date();
            invalidateData();
        }
        loadFollowedUsers(loginId, function(followedUsers){
            if(req.params.pageType === HELPER.ACTIVITY_TYPES.CATEGORY){
                // Check if the user has access to this category
                hasAccessToResource(loginId, req.params.resourceId, req.params.pageType, function(hasAccess){
                    if(hasAccess){
                        // On category page, show board and pin stories also
                        // The pin ids don't need to be retrieved since they have related ids that point to their boards
                        boardModel.getBoardIdsByCategory(req.params.resourceId, function(boardIds){
                            loadDataForActivityBox(req.params.resourceId, req.params.pageType, boardIds, followedUsers, function(data){
                                res.send(data);
                            });
                        });
                    } else {
                        res.send([]);
                    }
                });
            } else if(req.params.pageType === HELPER.ACTIVITY_TYPES.BOARD){
                // Check if the user has access to this board
                hasAccessToResource(loginId, req.params.resourceId, req.params.pageType, function(hasAccess){
                    if(hasAccess){
                        if(cachedAccessibleResources === undefined){
                            // Only show the stories that have related item/related item ids the user has access to
                            loadResourcesAccessibleByUser(loginId, function(resourceIds){
                                loadDataForActivityBox(req.params.resourceId, req.params.pageType, resourceIds, followedUsers, function(data){
                                    res.send(data);
                                });
                            });
                        } else {
                            loadDataForActivityBox(req.params.resourceId, req.params.pageType, cachedAccessibleResources, followedUsers, function(data){
                                res.send(data);
                            });
                        }
                    } else {
                        res.send([]);
                    }
                });
            } else if(req.params.pageType === HELPER.ACTIVITY_TYPES.PIN || 
                req.params.pageType === HELPER.ACTIVITY_TYPES.USER){
                if(cachedAccessibleResources === undefined){
                    // Only show the stories that have related item/related item ids the user has access to
                    loadResourcesAccessibleByUser(loginId, function(resourceIds){
                        loadDataForActivityBox(req.params.resourceId, req.params.pageType, resourceIds, followedUsers, function(data){
                            res.send(data);
                        });
                    });
                } else {
                    loadDataForActivityBox(req.params.resourceId, req.params.pageType, cachedAccessibleResources, followedUsers, function(data){
                        res.send(data);
                    });
                }
            } if(req.params.pageType === 'timeline'){
                if(cachedAccessibleResources === undefined){
                    loadResourcesAccessibleByUser(loginId, function(resourceIds){
                        loadDataForTimeline(loginId, resourceIds, followedUsers, function(data){
                            res.send(data);
                        });
                    });
                } else {
                    loadDataForTimeline(loginId, cachedAccessibleResources, cachedFollowedUsers, function(data){
                        res.send(data);
                    });
                }
            } else {
                // This branch handles pages that don't represent a specific resource.
                // On these pages, the activities will be the same as those shown in the timeline
                if(cachedAccessibleResources === undefined){
                    loadResourcesAccessibleByUser(loginId, function(resourceIds){
                        loadDataForTimeline(loginId, resourceIds, followedUsers, 'activity', function(data){
                            res.send(data);
                        });
                    });
                } else {
                    loadDataForTimeline(loginId, cachedAccessibleResources, cachedFollowedUsers, 'activity', function(data){
                        res.send(data);
                    });
                }
            }
        });
    }
}

/**
 * Checks if the logged in user has access to a specific resource
 *
 * @param loginId The logged in user id
 * @param resId The resource id
 * @param callback The function to be called after the check
 * @since 1.0
 */
function hasAccessToResource(loginId, resId, resType, callback){
    userRoleModel.findByUserAndResource(loginId, resId, function(userRoles){
        if(userRoles.length > 0) {
            callback(true);
        } else if(resType === HELPER.ACTIVITY_TYPES.BOARD) {
            // If the resource is a board and the user does not a have a user role associated with it,
            // find if he has a user role associated with the board's category
            boardModel.getBoardOne(resId, function(boards){
                userRoleModel.findByUserAndResource(loginId, boards[0].category_id.toHexString(), function(userRoles){
                    callback(userRoles.length > 0);
                });
            });
        } else {
            callback(false);
        }
    });
}

/**
 * Retrieves and compiles timeline items for the activity box
 *
 * @param resourceId The resource id of the current page (undefined if it's not a resource page)
 * @param resourceType The resource type of the current page (undefined if it's not a resource page)
 * @param resourceIds The resource ids the user has access to
 * @param followedUsers The users followed by the logged in user 
 * @param callback The function to be called after the data was retrieved and compiled
 * @since 1.0
 */
function loadDataForActivityBox(resourceId, resourceType, resourceIds, followedUsers, callback){
    storyModel.findSpecificStories(HELPER.TIMELINE_PAGE_SIZE, lastItemTime, resourceId, resourceType, resourceIds, followedUsers, function(stories) {
        var timelineItems = [];
        var count = 0;
        async.eachSeries(stories, function(story, cb){
            lastItemTime = new Date(story.timestamp);
            HELPER.compileStoryForView(story, 'activity', function(compiledStory){
                count++
                timelineItems.push(compiledStory);
                if(count === stories.length){
                    callback(timelineItems);
                } else {
                    cb();
                }
            });
        });
    });
}

/**
 * Retrieves and compiles items for the timeline page
 *
 * @param userId The logged in user id
 * @param resourceIds The resource ids the user has access to
 * @param followedUsers The users followed by the logged in user
 * @param [template] Compile for activity feed
 * @param callback The function to be called after the data was retrieved and compiled
 * @since 1.0
 */
function loadDataForTimeline(userId, resourceIds, followedUsers, template, callback){
    if(typeof template === 'function'){
        callback = template;
        template = null;
    }
    var userIds = [mongo.ObjectID(userId)];
    var followedUsersIds = [];
    followedUsers.forEach(function(followedUser){
        followedUsersIds.push(followedUser.follower_id);
    });
    storyModel.findGeneralStories(HELPER.TIMELINE_PAGE_SIZE, lastItemTime, userIds, followedUsersIds, resourceIds, function(stories) {
        var timelineItems = [];
        var count = 0;
        async.eachSeries(stories, function(story, cb){
            lastItemTime = new Date(story.timestamp);
            HELPER.compileStoryForView(story, template, function(compiledStory){
                count++
                timelineItems.push(compiledStory);
                if(count === stories.length){
                    callback(timelineItems);
                } else {
                    cb();
                }
            });
        });
    });
}

/**
 * Retrieves the resource ids associated with a specific user
 *
 * @param userId The user id
 * @param callback The function to be called after the data was retrieved
 * @since 1.0
 */
function loadResourcesAccessibleByUser(userId, callback){
    var accessibleResources = [];
    userRoleModel.findByUser(userId, function(userRoles){
        var count = 0;
        userRoles.forEach(function(userRole){
            accessibleResources.push(userRole.resource_id);
            if(userRole.type === HELPER.RESOURCE_TYPE.CATEGORY){
                // get boards
                boardModel.getBoardIdsByCategory(userRole.resource_id.toHexString(), function(boardIds){
                    count++;
                    accessibleResources = accessibleResources.concat(boardIds);
                    if (count === userRoles.length){
                        cachedAccessibleResources = accessibleResources;
                        callback(accessibleResources);
                    }
                });
            } else {
                count++;
            } 
            if (count === userRoles.length){
                cachedAccessibleResources = accessibleResources;
                callback(accessibleResources);
            }
        });
    });
}

/**
 * Retrieves the users followed by a specific user
 *
 * @param userId The user id
 * @param callback The function to be called after the data was retrieved
 * @since 1.0
 */
function loadFollowedUsers(userId, callback){
    followerModel.findByFollower(userId, function(followedUsers){
        cachedFollowedUsers = followedUsers;
        callback(followedUsers);
    });
}

/**
 * Invalidates some chached data. This happens when the page is reloaded.
 * Needed for the consistency of the loaded timeline items and for better performance.
 *
 * @since 1.0
 */
function invalidateData(){
    cachedAccessibleResources = undefined;
    cachedFollowedUsers = undefined;
}

module.exports = timelineController;
