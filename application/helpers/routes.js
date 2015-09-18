/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/* 
 * Routing functions
 * Add your routes functions here 
 *
 * Changes in version 1.1 (Myyna NodeJS Roles and Users Update):
 * - added role_validate function
 * - added searchRoleInHierarchy function
 * - added getAllAuthorizedBoards function
 *
 * - added role_validate_callback function
 *
 * @package Sleek.js
 * @version 1.2
 * 
 * 
 * The MIT License (MIT)

 * Copyright Cubet Techno Labs, Cochin (c) 2013 <info@cubettech.com>

 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * @author Robin <robin@cubettech.com>, MonicaMuranyi
 * @Date 23-10-2013
 */
var path = require('path');
var roleModel = system.getModel('role');
var userRoleModel = system.getModel('userRole');
var boardModel = system.getModel('board');
var categoryModel = system.getModel('category');

/**
 * Searches a specific role recursively using the parent property of the role
 *
 * @param hierarchy The start point role
 * @param roleId The role id to be searched
 * @param callback The function to be called after the search result is decided
 * @since 1.1
 */
function searchRoleInHierarchy(hierarchy, roleId, callback){
    if(hierarchy._id.toHexString() === roleId.toHexString()){
        callback(true);
    } else if(hierarchy.parent === null){
        callback(false);
    } else {
        roleModel.get(hierarchy.parent.toHexString(), function(roles){
            searchRoleInHierarchy(roles[0], roleId, callback);
        });
    }
}

//define route functions here
module.exports = {
    login_validate:function(req, res, next) {
        if (!req.session.login_user_id) {
            req.session.loginmessage = "Please login to continue."
            res.redirect('/login');
        } else {
            next();
        }
    },
    userLoginPreCheck: function(req, res, next) {
        if (req.session.login_user_id){
            res.redirect('/pins');
        }
        else {
            next();
        }
    },
    adminLoginPreCheck: function(req, res, next) {
        res.locals.layout = 'adminlogin';
        if (!req.session.admin_user_id) {
            next();
        } else {
            res.redirect('/admin/dashboard');
        }
    },
    adminLoginCheck: function(req, res, next) {
        res.locals.layout = 'admin';
        res.locals.loggedUser = req.session.admin_user;
        if (!req.session.admin_user_id) {
            //            next();
            res.redirect('/admin');
        } else {
            next();
        }
    },
    /**
     * Performs authorization based on user role for a specific action on a specific resource
     *
     * @param userId The user id
     * @param resId The resource id
     * @param actionRole The action role
     * @param res The http response object
     * @param callback The function to be called after authorization succeeded
     * @since 1.1
     */
    role_validate:function(userId, resId, actionRole, res, callback) {
        // Get the lowest role needed by the action
        // We can get it's parent roles recursively using the parent property
        roleModel.getByName(actionRole, function(roles){
            // Get all the user roles associated with a specific user and a specific resource
            userRoleModel.findByUserAndResource(userId, resId, function(userRoles){
                if(userRoles.length) {
                    userRoles.forEach(function(userRole){
                        searchRoleInHierarchy(roles[0], userRole.role_id, function(authorized){
                            if(authorized) {
                                // The user is authorized to perform the action on the resource
                                callback();
                            } else {
                                // If the resource is a board, try to get the roles associated with its category
                                // and check if the user is authorized
                                if(userRoles.length && userRoles[0].type == HELPER.RESOURCE_TYPE.BOARD){
                                    boardModel.getBoardOne(resId, function(boards){
                                        if(!boards.length){
                                            res.send(404, {success : false, message : 'The board with id ' + resId +" does not exist"});
                                        } else {
                                            userRoleModel.findByUserAndResource(userId, boards[0].category_id.toHexString(), function(userRoles){
                                                userRoles.forEach(function(userRole){
                                                    searchRoleInHierarchy(roles[0], userRole.role_id, function(authorized){
                                                        if(authorized){
                                                            callback();
                                                        }
                                                    });
                                                });
                                                res.send(401, {success : false, message : 'Not Authorized'});
                                            });
                                        }
                                    });
                                } else {
                                    res.send(401, {success : false, message : 'Not Authorized'});
                                }
                            }
                        });
                    });
                } else {
                    boardModel.getBoardOne(resId, function(boards){
                        if(!boards.length){
                            res.send(404, {success : false, message : 'The board with id ' + resId +" does not exist"});
                        } else {
                            userRoleModel.findByUserAndResource(userId, boards[0].category_id.toHexString(), function(userRoles){
                                var count = 0;
                                var res = false;
                                userRoles.forEach(function(userRole){
                                    if(!res) {
                                        searchRoleInHierarchy(roles[0], userRole.role_id, function(authorized){
                                            res = res || authorized;
                                            count++;
                                            if(res && count == userRoles.length){
                                                callback();
                                            } else if(count == userRoles.length) {
                                                res.send(401, {success : false, message : 'Not Authorized'});
                                            }
                                        });
                                    }
                                });
                            });
                        }
                    });
                }
            });
        });
    },
    /**
     * Performs authorization based on user role for a specific action on a specific resource
     *
     * @param userId The user id
     * @param resId The resource id
     * @param actionRole The action role
     * @param callback The function to be called after authorization succeeded
     * @since 1.2
     */
    role_validate_callback: function(userId, resId, actionRole, callback) {
        // Get the lowest role needed by the action
        // We can get it's parent roles recursively using the parent property
        roleModel.getByName(actionRole, function(roles){
            // Get all the user roles associated with a specific user and a specific resource
            userRoleModel.findByUserAndResource(userId, resId, function(userRoles){
                if(userRoles.length) {
                    userRoles.forEach(function(userRole){
                        searchRoleInHierarchy(roles[0], userRole.role_id, function(authorized){
                            if(authorized) {
                                // The user is authorized to perform the action on the resource
                                callback();
                            } else {
                                // If the resource is a board, try to get the roles associated with its category
                                // and check if the user is authorized
                                if(userRoles.length && userRoles[0].type == HELPER.RESOURCE_TYPE.BOARD){
                                    boardModel.getBoardOne(resId, function(boards){
                                        if(!boards.length){
                                            callback({success : false, message : 'The board with id ' + resId +" does not exist"});
                                        } else {
                                            userRoleModel.findByUserAndResource(userId, boards[0].category_id.toHexString(), function(userRoles){
                                                userRoles.forEach(function(userRole){
                                                    searchRoleInHierarchy(roles[0], userRole.role_id, function(authorized){
                                                        if(authorized){
                                                            callback();
                                                        }
                                                    });
                                                });
                                                callback({success : false, message : 'Not Authorized'});
                                            });
                                        }
                                    });
                                } else {
                                    callback({success : false, message : 'Not Authorized'});
                                }
                            }
                        });
                    });
                } else {
                    boardModel.getBoardOne(resId, function(boards){
                        if(!boards.length){
                            callback({success : false, message : 'The board with id ' + resId +" does not exist"});
                        } else {
                            userRoleModel.findByUserAndResource(userId, boards[0].category_id.toHexString(), function(userRoles){
                                var count = 0;
                                var res = false;
                                userRoles.forEach(function(userRole){
                                    if(!res) {
                                        searchRoleInHierarchy(roles[0], userRole.role_id, function(authorized){
                                            res = res || authorized;
                                            count++;
                                            if(res && count == userRoles.length){
                                                callback();
                                            } else if(count == userRoles.length) {
                                                callback({success : false, message : 'Not Authorized'});
                                            }
                                        });
                                    }
                                });
                                callback({success : false, message : 'Not Authorized'});
                            });
                        }
                    });
                }
            });
        });
    },
    /**
     * Retrieves all authorized boards for a specific user and a specific action
     *
     * @param userId The user id
     * @param actionRole The action role
     * @param callback The function to be called after the data is retrieved
     * @since 1.1
     */
    getAllAuthorizedBoards: function(userId, actionRole, callback){
        var res = [];
        var boardIds = [];
        roleModel.getByName(actionRole, function(roles){
            userRoleModel.findByUserAndType(userId, HELPER.RESOURCE_TYPE.BOARD, function(userRolesBoard){
                userRoleModel.findByUserAndType(userId, HELPER.RESOURCE_TYPE.CATEGORY, function(userRolesCategory){
                    var userRoles = userRolesBoard.concat(userRolesCategory);
                    if(userRoles.length) {
                        var count = 0;
                        userRoles.forEach(function(userRole){
                            count++;
                            searchRoleInHierarchy(roles[0], userRole.role_id, function(authorized){
                                if(userRole.type === HELPER.RESOURCE_TYPE.BOARD) {
                                    boardModel.getBoardOne(userRole.resource_id.toHexString(), function(boards){
                                        if(authorized){
                                            if(boardIds.indexOf(boards[0]._id.toHexString()) < 0) {
                                                boardIds.push(boards[0]._id.toHexString());
                                                res.push(boards[0]);
                                            }
                                        }
                                        if(count === userRoles.length) {
                                            callback(res);
                                        }
                                    });
                                } else {
                                    boardModel.getBoardsByCategory(userRole.resource_id.toHexString(), function(boards){
                                        if(boards.length) {
                                            boards.forEach(function(board){
                                                if(authorized){
                                                    if(boardIds.indexOf(board._id.toHexString()) < 0) {
                                                        boardIds.push(board._id.toHexString());
                                                        res.push(board);
                                                    }
                                                }
                                                if(count === userRoles.length) {
                                                    callback(res);
                                                }
                                            });
                                        } else {
                                            if(count === userRoles.length) {
                                                callback(res);
                                            }
                                        }
                                    });
                                }
                            });
                        });
                    } else {
                        callback(res);
                    }
                });
            });
        });
    },
    DefineLocals: function(req, res, next){
        system.loadHelper('siteWide');
        if(!DEFINES.title) {
            var settingsModel = system.getModel(path.join('','admin/settings'));
            settingsModel.getGeneralSettings({},function(settings){
                HELPER.updateConfigs(settings);
            });
        }
        
        res.locals.siteLayout = DEFINES.site_layout;
        res.locals.siteUrl = sleekConfig.siteUrl;
        if(req.route.path.indexOf(':') != -1){
            var paths = req.route.path.split('/:');
            res.locals.sideMenu = paths[0];
        } else {
            res.locals.sideMenu = req.route.path; 
        }
        next();
    }
    
}
