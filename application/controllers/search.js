/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Controller for searching feature.
 *
 * Changes in version 1.1 (Myyna Web Application Search Improvement):
 * - restructured search method to construct the query based on the new tag structure
 * - added getSearch method which is used to render the search page with no results
 * - added getSearchKeys, getSearchValues, getUsers, getCategories, getBoards, getPins, searchUsers,
 *   searchMyCategories, searchMyBoards, searchMyPins, searchPDSPins, searchAllPins methods
 * - extracted the following methods for reusing: getSearchResults, createQuery
 *
 * Changes in version 1.2 (Myyna [Bug Bounty]):
 * - added pagination
 * - fixed category list
 * - handled tab changing via ajax
 *
 * @author kiril.kartunov, MonicaMuranyi
 * @version 1.2
 */
"use strict";

var path = require('path');
var async = require('async');
var notificationModel = system.getModel('notification');
var PostModel = system.getModel('pin');
var UserModel = system.getModel('user');
var catModel = system.getModel('category');
var mongo = require('mongodb');
system.loadHelper('constants');

// Constants
var PAGE_TITLE = "Search";
var LAYOUT = "default";
var PAGE_TYPE = "list";
var COLLECTION_USER_PROFILE = "user_profile";
var COLLECTION_PINS = "pins";
var COLLECTION_BOARDS = "board";
var COLLECTION_CATEGORIES = "category";
var COLLECTION_USERS = "user";
var TAB_ALL_PINS = 0;
var TAB_PDS_PINS = 1;
var TAB_MY_PINS = 2;
var TAB_MY_BOARDS = 3;
var TAB_MY_CATEGORIES = 4;
var TAB_PEOPLE = 5;
var DEFAULT_PAGE_SIZE = 15;


var searchCtrl = {
    /**
     * Render the search page with no results
     *
     * @param req The http request object
     * @param res The http response object
     * @since 1.1
     */
    getSearch: function (req, res) {
        var tab = req.query.tab ? Number(req.query.tab) : TAB_ALL_PINS;
        // Some of the tabs require the user to be logged in
        if((tab > TAB_PDS_PINS) && !req.session.login_user_id){
            req.session.loginmessage = "Please, login to execute user specific search.";
            res.redirect('/login');
        }
        // Get user notifications
        notificationModel.userUnreadnotifications(req.session.login_user_id, function(notifications){
            // Get user image
            mongodb.collection(COLLECTION_USER_PROFILE).findOne({
                user_id: mongo.ObjectID(req.session.login_user_id)
            }, function(user){
                catModel.getCategoryAll(function(categories) {
                    var render_context = {
                        pagetitle: PAGE_TITLE,
                        notifications: notifications,
                        notification_count: notifications? notifications.length : 0,
                        loiginuser: req.session.login_user_name,
                        loggeduser_id: req.session.login_user_id,
                        layout: LAYOUT,
                        type: PAGE_TYPE,
                        user_image: user ? user.pic : null,
                        tab: tab,
                        hideActivity: true,
                        searchPage: true,
                        category: categories
                    };
                    system.loadView(res, path.join('', 'pins/search'), render_context);
                    system.setPartial(path.join('', 'pins/pinheader'), 'pinheader');
                    system.setPartial(path.join('', 'pins/imagePinView'), 'pinviewimage');
                    system.setPartial(path.join('', 'pins/webPinView'), 'pinvieweb');
                    system.setPartial(path.join('', 'pins/pdfPinView'), 'pinviewpdf');
                    system.setPartial(path.join('','timeline/activity'), 'activity');
                });
            });
        });
    },
    /**
     * Search entities based on key/value pairs (tags)
     *
     * @param req The http request object
     * @param res The http response object
     * @since 1.1
     */
    search: function (req, res) {
        var tab = req.body.tab ? Number(req.body.tab) : TAB_ALL_PINS;
        var currentNrOfItems = req.body.currentNrOfItems ? Number(req.body.currentNrOfItems) : 0;
        // Some of the tabs require the user to be logged in 
        if((tab > TAB_PDS_PINS) && !req.session.login_user_id){
            req.session.loginmessage = "Please, login to execute user specific search.";
            res.redirect('/login');
        }
        var tags = req.body.tags;
        getSearchResults(tab, tags, req.session, currentNrOfItems, function(results){
            res.send(system.getCompiledView(path.join('','pins/searchResults'), results));
        });
    },
    /**
     * Retrieves the search keys filtered based on the selected tab
     *
     * @param req The http request object
     * @param res The http response object
     * @since 1.1
     */
    getSearchKeys: function (req, res) {
        var tab = req.query.tab ? Number(req.query.tab) : TAB_ALL_PINS;
        res.send(JSON.parse(JSON.stringify(HELPER.SEARCH_KEYS)));
    },

    /**
     * Retrieves the search values based on the selected key
     *
     * @param req The http request object
     * @param res The http response object
     * @since 1.1
     */
    getSearchValues: function (req, res) {
        var type = req.body.key.type;
        var field = req.body.key.id;
        var name = req.body.key.name;
        // For free text fields we don't show a value suggestion list
        if(req.body.key.freeText === 'true'){
            res.send([]);
        }
        // For PDS type, the suggested values are hard-coded for now
        // In the future, pin_type should be used
        if(field === "PDS.type"){
            res.send([
                {id: "PPI", name: "PPI"},
                {id: "LROC", name: "LROC"}
            ]);
        } else {
            var searchValues = [];
            var searchValuesNames = [];
            // Determine the db collection and the field dynamically based on the
            // mapping between the field type and the db collection name
            var groupDbMapping = HELPER.SEARCH_GROUP_DB_MAPPING[type];
            console.log('groupDbMapping ' + groupDbMapping);
            /*if(type == 'Person' && ['country', 'department', 'interest',
                'organization', 'position', 'university'].indexOf(name) > -1) {
              groupDbMapping = name;
            }*/
            mongodb.collection(groupDbMapping).distinct(HELPER.SEARCH_FIELD_DB_MAPPING[field], function(err, results){
                // The creator values, which are ids, need to be transformed to names
                if(name === 'creator'){
                    mongodb.collection(COLLECTION_USERS).find({
                        _id: {
                            $in: results
                        }
                    }, function(err, users){
                        users.toArray(function(er, data) {
                            for (var i = 0; i < data.length; i++) {
                                searchValues.push({id: data[i]._id, name: data[i].name});
                            }
                            res.send(searchValues);
                        });
                    });
                } else if(['country', 'department', 'interest',
                    'organization', 'position', 'university'].indexOf(name) > -1){
                  mongodb.collection(name).find({
                    _id: {
                      $in: results
                    }
                  }, function(err, lookups){
                    lookups.toArray(function(er, data) {
                      for (var i = 0; i < data.length; i++) {
                        searchValues.push({id: data[i]._id, name: data[i].name});
                      }
                      res.send(searchValues);
                    });
                  });
                } else {
                    for (var i = 0; i < results.length; i++) {
                        if(Array.isArray(results[i])){
                            for (var j = 0; j < results[i].length; j++) {
                                if(searchValuesNames.indexOf(results[i][j]) < 0){
                                    searchValues.push({id: results[i][j], name: results[i][j]});
                                    searchValuesNames.push(results[i][j]);
                                }
                            }
                        } else {
                            if(searchValuesNames.indexOf(results[i]) < 0){
                                searchValues.push({id: results[i], name: results[i]});
                                searchValuesNames.push(results[i]);
                            }
                        }
                    }
                    res.send(searchValues);
                }
            });
        }
    }
};

/**
 * Retrieves the search values based on the selected key
 *
 * @param tab The current tab
 * @param tags The tag array
 * @param session The http session object
 * @param currentNrOfItems The current number of items shown (used for pagination)
 * @param callback The function to be called after retrieveing the results
 * @since 1.1
 */
function getSearchResults(tab, tags, session, currentNrOfItems, callback){
    // Get user notifications
    notificationModel.userUnreadnotifications(session.login_user_id, function(notifications){
        // Get user image
        mongodb.collection(COLLECTION_USER_PROFILE).findOne({
            user_id: mongo.ObjectID(session.login_user_id)
        }, function(user){
            // The search page data
            var render_context = {
                pagetitle: PAGE_TITLE,
                notifications: notifications,
                notification_count: notifications? notifications.length : 0,
                loiginuser: session.login_user_name,
                loggeduser_id: session.login_user_id,
                layout: LAYOUT,
                type: PAGE_TYPE,
                user_image: user? user.pic : null,
                tab: tab,
                searchPage: true
            };
            if(tab === TAB_ALL_PINS){
                // All pins
                searchAllPins(tags, currentNrOfItems, function(results){
                    render_context.results = {
                        pins: results.items,
                        totalCount: results.totalCount
                    };
                    callback(render_context);
                    
                });
            } else if(tab === TAB_PDS_PINS){
                // PDS pins
                searchPDSPins(tags, currentNrOfItems, function(results){
                    render_context.results = {
                        pins: results.items,
                        totalCount: results.totalCount
                    };
                    callback(render_context);
                });
            } else if(tab === TAB_MY_PINS){
                // My pins
                searchMyPins(tags, session.login_user_id, currentNrOfItems, function(results){
                    render_context.results = {
                        pins: results.items,
                        totalCount: results.totalCount
                    };
                    callback(render_context);
                });
            } else if(tab === TAB_MY_BOARDS){
                // My boards
                searchMyBoards(tags, session.login_user_id, currentNrOfItems, function(results){
                    render_context.results = {
                        boards: results.items,
                        totalCount: results.totalCount
                    };
                    callback(render_context);
                });
            } else if(tab === TAB_MY_CATEGORIES){
                // My categories
                searchMyCategories(tags, session.login_user_id, currentNrOfItems, function(results){
                    render_context.results = {
                        categories: results.items,
                        totalCount: results.totalCount
                    };
                    callback(render_context);
                });
            } else {
                // People
                searchUsers(tags, session.login_user_id, currentNrOfItems, function(results){
                    render_context.results = {
                        users: results.items,
                        totalCount: results.totalCount
                    };
                    callback(render_context);
                });
            }
        });
    });
}

/**
 * Searches all pins
 *
 * @param tags The tag array
 * @param callback The function to be called after retrieveing the results
 * @since 1.1
 */
function searchAllPins(tags, currentNrOfItems, callback){
    createQuery(tags, function(searchQuery){
        getPinsPaginated(searchQuery, currentNrOfItems, callback);
    })
}

/**
 * Searches PDS pins
 *
 * @param tags The tag array
 * @param callback The function to be called after retrieveing the results
 * @since 1.1
 */
function searchPDSPins(tags, currentNrOfItems, callback){
    createQuery(tags, function(searchQuery){
        searchQuery.push({
            $or: [
                {'metadata.pds': true},
                {ppi: true}
            ]
        });
        getPinsPaginated(searchQuery, currentNrOfItems, callback);
    })
}

/**
 * Searches current user's pins
 *
 * @param tags The tag array
 * @param loginId The login id
 * @param callback The function to be called after retrieveing the results
 * @since 1.1
 */
function searchMyPins(tags, loginId, currentNrOfItems, callback){
    createQuery(tags, function(searchQuery){
        searchQuery.push({
            user_id: mongo.ObjectID(loginId)
        });
        getPinsPaginated(searchQuery, currentNrOfItems, callback);
    })
}

/**
 * Searches current user's boards
 *
 * @param tags The tag array
 * @param loginId The login id
 * @param callback The function to be called after retrieveing the results
 * @since 1.1
 */
function searchMyBoards(tags, loginId, currentNrOfItems, callback){
    createQuery(tags, function(searchQuery){
        // Find user roles
        mongodb.collection('user_role').find({
            user_id: mongo.ObjectID(loginId),
            type: /board/i
        },function(err, results){
            if(err) {
                throw err;
            }
            results.toArray(function(er, userRoles) {
                // Only search pins the current user has access to
                var currentUserBoardIds = [];
                for (var i = 0; i < userRoles.length; i++) {
                    if(!isObjectIdInArray(currentUserBoardIds, userRoles[i].resource_id)){
                        currentUserBoardIds.push(userRoles[i].resource_id);
                    }
                };
                searchQuery.push({
                    board_id: {$in: currentUserBoardIds}
                });
                // Get the pins based on the search query, then get the boards associated with them
                getPins(searchQuery, function(result){
                    var boardIds = [];
                    for (var i = 0; i < result.length; i++) {
                        if(!isObjectIdInArray(boardIds, result[i].board_id)){
                            boardIds.push(result[i].board_id);
                        }
                    }
                    // Get the total count of boards
                    mongodb.collection(COLLECTION_BOARDS).count({  
                        _id:  {$in: boardIds}
                    }, function(err, count){
                        if(err) {
                            throw err;
                        }
                        // Get the boards associated with the found pins
                        mongodb.collection(COLLECTION_BOARDS).find({  
                            $query:{  
                                _id:  {$in: boardIds}
                            },
                            $orderby:{  
                                timestamp:-1
                            }
                        }, [], { skip: currentNrOfItems, limit: DEFAULT_PAGE_SIZE }, function(err, results){
                            if(err) {
                                throw err;
                            }
                            results.toArray(function(er, boards) {
                                callback({items: boards, totalCount: count});
                            });
                        });
                    });
                });
            });
        });
    });
}

/**
 * Searches current user's categories
 *
 * @param tags The tag array
 * @param loginId The login id
 * @param callback The function to be called after retrieveing the results
 * @since 1.1
 */
function searchMyCategories(tags, loginId, currentNrOfItems, callback){
    createQuery(tags, function(searchQuery){
        mongodb.collection('user_role').find({
            user_id: mongo.ObjectID(loginId),
            type: /category/i
        },function(err, results){
            if(err) {
                throw err;
            }
            results.toArray(function(er, userRoles) {
                var currentUserCatIds = [];
                for (var i = 0; i < userRoles.length; i++) {
                    if(!isObjectIdInArray(currentUserCatIds, userRoles[i].resource_id)){
                        currentUserCatIds.push(userRoles[i].resource_id);
                    }
                };
                /*searchQuery.push({
                    _id: {$in: currentUserCatIds}
                });*/

                // Get the pins based on the search query, then get the categories associated with them (via boards)
                getPins(searchQuery, function(result){
                    var boardIds = [];
                    for (var i = 0; i < result.length; i++) {
                        if(!isObjectIdInArray(boardIds, result[i].board_id)){
                            boardIds.push(result[i].board_id);
                        }
                    }
                    // Get the boards associated with the found pins
                    mongodb.collection(COLLECTION_BOARDS).find({  
                        $query:{  
                            _id:  {$in: boardIds}
                        }
                    }, function(err, results){
                        if(err) {
                            throw err;
                        }
                        results.toArray(function(er, boards) {
                            var categoryIds = [];
                            for (var i = 0; i < boards.length; i++) {
                                if(!isObjectIdInArray(categoryIds, boards[i].category_id) && isObjectIdInArray(currentUserCatIds, boards[i].category_id)){
                                    categoryIds.push(boards[i].category_id);
                                }
                            }
                            // Get the total count of categories
                            mongodb.collection(COLLECTION_CATEGORIES).count({  
                                _id:  {$in: categoryIds}
                            }, function(err, count){
                                if(err) {
                                    throw err;
                                }
                                // Get the categories associated with the found pins
                                mongodb.collection(COLLECTION_CATEGORIES).find({  
                                    $query: {
                                        _id:  {$in: categoryIds}
                                    },
                                    $orderby:{  
                                        timestamp:-1
                                    }
                                }, [], { skip: currentNrOfItems, limit: DEFAULT_PAGE_SIZE }, function(err, results){
                                    if(err) {
                                        throw err;
                                    }
                                    results.toArray(function(er, categories) {
                                        callback({items: categories, totalCount: count});
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

/**
 * Searches users
 *
 * @param tags The tag array
 * @param loginId The login id
 * @param callback The function to be called after retrieveing the results
 * @since 1.1
 */
function searchUsers(tags, loginId, currentNrOfItems, callback){
    createQuery(tags, function(searchQuery){
        // Get the pins based on the search query, then get the categories associated with them (via boards)
        getPins(searchQuery, function(result){
            var creatorIds = [];
            for (var i = 0; i < result.length; i++) {
                if(!isObjectIdInArray(creatorIds, result[i].user_id)){
                    creatorIds.push(result[i].user_id);
                }
            }
            // Get the total count of users
            mongodb.collection(COLLECTION_USERS).count({  
                _id:  {$in: creatorIds}
            }, function(err, count){
                if(err) {
                    throw err;
                }
                // Get the users associated with the found pins
                mongodb.collection(COLLECTION_USERS).find({  
                    $query:{  
                        _id:  {$in: creatorIds}
                    },
                    $orderby:{  
                        name: 1
                    }
                }, [], { skip: currentNrOfItems, limit: DEFAULT_PAGE_SIZE }, function(err, results){
                    if(err) {
                        throw err;
                    }
                    results.toArray(function(er, users) {
                        populateUsers(users, loginId, function(populatedUsers){
                            callback({items: populatedUsers, totalCount: count});
                        });
                    });
                });
            });
        });
    });
}

/**
 * Populate users with extra details for UI
 *
 * @param users The users array
 * @param callback The function to be called after populating the users
 * @since 1.2
 */
function populateUsers(users, loginId, callback){
    var index = 0;
    // Additional user details
    async.eachSeries(users, function(user, loop_cb){
        async.parallel({
            image: function(cb){
                mongodb.collection(COLLECTION_USER_PROFILE).findOne({
                    user_id: user._id
                }, cb);
            },
            pincount: function(cb){
                PostModel.getUserPincount(user._id.toHexString(), function(res){
                    cb(null, res);
                });
            },
            followercount: function(cb){
                PostModel.UserFollowerCount(user._id.toHexString(), function(res){
                    cb(null, res);
                });
            },
            userfollow: function(cb){
                UserModel.userFollowDetails(loginId, user._id.toHexString(), function(res) {
                    cb(null, res);
                });
            }
        }, function(e, popul){
            if(e){
                return loop_cb(e);
            }
            users[index].image = popul.image.pic;
            users[index].pincount = popul.pincount.length;
            users[index].followercount = popul.followercount.length;
            users[index].userfollow = popul.userfollow[0].userfollow;
            index++;
            loop_cb();
        });
    }, function(err){
        if(err){
            throw err;
        }
        callback(users);
    });
}

/**
 * Searches users
 *
 * @param tags The tag array
 * @param callback The function to be called after retrieveing the results
 * @since 1.1
 */
function createQuery(tags, callback){
    var tagMap = {};
    var distinctTags = [];
    // The main search query
    var searchQuery = [];
    if(tags){
        // Organize tags in a temporary map that associates each field id with a list of values
        // which will be OR-ed
        for (var i = 0; i < tags.length; i++) {
            var tag = tags[i];
            var value = null;
            if(tag.key.name === "creator") {
              value = mongo.ObjectID(tag.value.id);
            } else if(['country', 'department', 'interest',
              'organization', 'position', 'university'].indexOf(tag.key.name) > -1) {
              value = mongo.ObjectID(tag.value.id);
            } else if(tag.key.number === "true") {
              value = Number(tag.value.name);
            } else {
              value = tag.value.name;
            }
            if(tagMap.hasOwnProperty(tag.key.id) && tagMap[tag.key.id].indexOf(value) < 0){
                tagMap[tag.key.id].push(value);
            } else if(!tagMap.hasOwnProperty(tag.key.id)){
                tagMap[tag.key.id] = [value];
                distinctTags.push(tag);
            }
        }
        async.each(distinctTags, function (tag, cb) {
            var userIds = [];
            var boardIds = [];
            var pinIds = [];
            var boardIdsFromCategories = [];
            var values = tagMap[tag.key.id];
            if(tag.key.name === "search"){
                // "search" tags will be used in mongodb text search
                searchQuery.push({
                    $text:{
                        $search: '\"'+tag.value.name+'\"'
                    }
                });
                cb();
            } else {
                var query = {};
                var freeTextTerms = [];
                if(tag.key.freeText === "true"){
                    // Free text fields will be used in non-exact search
                    for (var i = 0; i < values.length; i++) {
                        var freeTextTerm = {};
                        freeTextTerm[HELPER.SEARCH_FIELD_DB_MAPPING[tag.key.id]] = new RegExp(values[i], 'i');
                        freeTextTerms.push(freeTextTerm);
                    };
                    query = {
                        $or: freeTextTerms
                    }
                } else if(tag.key.id === "PDS.type"){
                    // For now the LROC and PPI search query uses the "metadata.pds" and "ppi" fields
                    if(values.length === 1){
                        if(tag.value.name === "LROC"){
                            query = {
                                $and: [
                                    {"metadata.pds": true},
                                    { "ppi" : { "$exists" : false } }
                                ]
                            }
                        } else {
                            query = {
                                "ppi" : true
                            }
                        }
                    } else {
                      query = {
                        $or: [
                          {"metadata.pds": true},
                          { "ppi": true }
                        ]
                      }
                    }
                } else {
                    query[tag.key.name === "creator" ? "_id" : HELPER.SEARCH_FIELD_DB_MAPPING[tag.key.id]] = {$in: values};
                }
                var type = tag.key.name === "creator" ? COLLECTION_USERS : HELPER.SEARCH_GROUP_DB_MAPPING[tag.key.type];
                mongodb.collection(type).find(query
                , function(err, results){
                    if(err) {
                        throw err;
                    }
                    results.toArray(function(err, res) {
                        if(tag.key.type === "Person" || tag.key.name === "creator"){
                            // Tags with type "Person" or field "creator" will be used to get user ids
                            for (var i = 0; i < res.length; i++) {
                                userIds.push(res[i]._id);
                            }
                            searchQuery.push({
                                user_id: {$in: userIds}
                            });
                        } else if(tag.key.type === "Board"){
                            // Tags with type "Board" will be used to get board ids
                            for (var i = 0; i < res.length; i++) {
                                boardIds.push(res[i]._id);
                            }
                            searchQuery.push({
                                board_id: {$in: boardIds}
                            });
                        } else if(tag.key.type === "Pin" || tag.key.type === "PDS" || 
                            tag.key.type === "PDSMetadata"){
                            // Tags with type "Pin", "PDS" or "PDS Metadata" will be used to get pin ids
                            for (var i = 0; i < res.length; i++) {
                                pinIds.push(res[i]._id);
                            }
                            searchQuery.push({
                                _id: {$in: pinIds}
                            });
                        } else if(tag.key.type === "Category"){
                            // Tags with type "Category" will be used to get category ids
                            var catIds = [];
                            for (var i = 0; i < res.length; i++) {
                                catIds.push(res[i]._id);
                            }
                            mongodb.collection(COLLECTION_BOARDS).find({  
                                category_id: {$in: catIds}
                            }, function(err, results){
                                if(err) {
                                    throw err;
                                }
                                results.toArray(function(err, boards) {
                                    // Category ids will be used to get board ids
                                    for (var i = 0; i < boards.length; i++) {
                                        boardIdsFromCategories.push(boards[i]._id);
                                    }
                                    searchQuery.push({
                                        board_id: {$in: boardIdsFromCategories}
                                    });
                                });
                            });
                        }
                        cb();
                    });
                });
            }
        }, function () {
            callback(searchQuery);
        });
    } else {
        // If there are no tags, retrieve all data
        callback(searchQuery);
    }
}

/**
 * Retrieves DEFAULT_PAGE_SIZE pins based on the constructed query
 *
 * @param query The query
 * @param skip The number of items that need to be skipped
 * @param callback The function to be called after retrieveing the results
 * @since 1.2
 */
function getPinsPaginated(query, skip, callback){
    if(!query.length){
        query.push({});
    }
    mongodb.collection(COLLECTION_PINS).ensureIndex({
        "$**": "text"
    }, function(index){
        mongodb.collection(COLLECTION_PINS).count({  
            $and: query
        }, function(err, count){
            mongodb.collection(COLLECTION_PINS).find({  
                $query:{  
                    $and: query
                },
                $orderby:{  
                    time:-1
                }
            }, [], { skip: skip, limit: DEFAULT_PAGE_SIZE }, function(err, results){
                if(err) {
                    throw err;
                }
                results.toArray(function(er, pins) {
                    populatePins(pins, function(res){
                        var result = {items: res, totalCount: count};
                        callback(result);
                    });
                });
            });
        });
    });
}

/**
 * Retrieves pins based on the constructed query
 *
 * @param query The query
 * @param callback The function to be called after retrieveing the results
 * @since 1.1
 */
function getPins(query, callback){
    if(!query.length){
        query.push({});
    }
    mongodb.collection(COLLECTION_PINS).ensureIndex({
        "$**": "text"
    }, function(index){
        mongodb.collection(COLLECTION_PINS).find({  
            $query:{  
                $and: query
            }
        }, function(err, results){
            if(err) {
                throw err;
            }
            results.toArray(function(er, pins) {
                populatePins(pins, callback);
            });
        });
    });
}

/**
 * Populate pins with extra details for UI
 *
 * @param pins The pins array
 * @param callback The function to be called after populating the pins
 * @since 1.2
 */
function populatePins(pins, callback){
    var index = 0;
    // Additional pin details
    async.eachSeries(pins, function(r, loop_cb){
        async.parallel({
            creator_name: function(cb){
                mongodb.collection(COLLECTION_USERS).findOne({
                    _id: r.user_id
                }, cb);
            },
            creator_image: function(cb){
                mongodb.collection(COLLECTION_USER_PROFILE).findOne({
                    user_id: r.user_id
                }, cb);
            },
            board_name: function(cb){
                mongodb.collection(COLLECTION_BOARDS).findOne({
                    _id: r.board_id
                }, cb);
            }
        }, function(e, popul){
            if(e){
                return loop_cb(e);
            }
            pins[index].creator_name = popul.creator_name.name;
            pins[index].creator_image = popul.creator_image.pic;
            pins[index].board_name = popul.board_name.board_name;
            pins[index].board_image = popul.board_name.image;
            index++;
            loop_cb();
        });
    }, function(err){
        if(err){
            throw err;
        }
        callback(pins);
    });
}

/**
 * Determines if an object id is in an array of object ids
 *
 * @param array The array of object ids
 * @param objectID The object id to be searched
 * @since 1.2
 */
function isObjectIdInArray(array, objectID){
    for(var i = 0; i < array.length; i++) {
        if (array[i].equals(objectID)) {
            return true;
        }
    }
    return false;
}

module.exports = searchCtrl;
