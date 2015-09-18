/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Represents the user role controller
 *
 * Changes in version 1.1 (Myyna Activity and Timeline Features):
 * - added addUserRoleStory method
 * - added logic to save story and notify users when adding or removing a user from a board or category
 *
 * Changes in version 1.2 (Myyna [Bug Bounty]):
 * - removed user_name story field
 *
 * @author MonicaMuranyi
 * @version 1.2
 */
var path = require('path');
var formidable  = require('formidable');
var async  = require('async');
system.loadHelper('constants');
system.loadHelper('routes');
var userModel = system.getModel('user');
var roleModel = system.getModel('role');
var userRoleModel = system.getModel('userRole');
var boardModel = system.getModel('board');
var categoryModel = system.getModel('category');
var storyModel = system.getModel('story');
system.loadHelper('timelineHelper');
var _ = require('underscore');

var userRoleController = {
    /**
     * Prepares the data for user role management popup and loads the view
     *
     * @param req The http request object
     * @param res The http response object
     * @since 1.0
     */
    user_roles_form: function(req, res) {
        var type = req.params.type;
        var resid = req.params.resid;
        userRoleModel.findByResource(resid, function(userRoles) {
            var userIds = [];
            userRoles.forEach(function(userRole){
                userIds.push(userRole.user_id.toHexString());
            });
            async.map(userIds, userModel.getUserSocketId, function(users){
                if(!userIds.length){
                    userIds.push(1);
                }
                async.map(userIds, userModel.SelectedUser, function(notAddedUsers){

                    var data = {
                        layout: 'urlfetch_layout',
                        msg: '',
                        type: type,
                        resid: resid,
                        users: users,
                        notAddedUsers: notAddedUsers
                    }
                    if(type === HELPER.RESOURCE_TYPE.CATEGORY){
                        categoryModel.getCategoryOne(resid, function(categories){
                            data.name = categories[0].category_name;
                            system.loadView(res, path.join('','pin_image/manage_users_form'), data);
                        });
                    } else if(type === HELPER.RESOURCE_TYPE.BOARD) {
                        boardModel.getBoardOne(resid, function(boards){
                            data.name = boards[0].board_name;
                            system.loadView(res, path.join('','pin_image/manage_users_form'), data);
                        });
                    }
                });
            });
        });
    },
    /**
     * Retrieves the user data to be shown in the user management popup
     *
     * @param req The http request object
     * @param res The http response object
     * @since 1.0
     */
    get_users: function(req, res) {
        var type = req.params.type;
        var resid = req.params.resid;
        var action = type === HELPER.RESOURCE_TYPE.CATEGORY ? HELPER.ACTION.MANAGE_CATEGORY_USERS : HELPER.ACTION.MANAGE_BOARD_USERS;
        // Authorization
        HELPER.role_validate(req.session.login_user_id, resid, action.ROLE, res, function(){
            userRoleModel.findByResource(resid, function(userRoles) {
                var userIds = [];
                var userRoleMap = {};
                var roleMap = {};
                userRoles.forEach(function(userRole){
                    var userId = userRole.user_id.toHexString();
                    userIds.push(userId);
                    if(!userRoleMap[userId]){
                        userRoleMap[userId] = [];
                    }
                    userRoleMap[userId].push(userRole);
                });
                userModel.getUsersIn(userIds, function(users){
                    if(!userIds.length){
                        userIds.push(1);
                    }
                    userModel.getUsersExcept(userIds, function(notAddedUsers){
                        var response = {dropdownUsers: [], tableUsers: []};
                        if(users && users.length){


                            var roleIds = []; 

                            users.forEach(function(user, idx){
                                userRoleMap[user._id.toHexString()].forEach(function(user_role){
                                   roleIds.push(user_role.role_id.toHexString());
                                });
                            });
                            roleModel.getRolesIn(roleIds, function(roles){
                                roles.forEach(function(role, idx){
                                    roleMap[role._id] = role;
                                });
                                users.forEach(function(user, idx){
                                    var id = user._id.toHexString();
                                    var user_roles = userRoleMap[id];
                                    user_roles.forEach(function(ur){
                                        var role_name = roleMap[ur.role_id].name;
                                        if(role_name != HELPER.ROLE.OWNER) {
                                            user.role = role_name;
                                            user.button = user._id.toHexString() == req.session.login_user_id ? '' : '<a href="#" class="deleteLink" data-id="' + ur._id + '">Delete</a>';
                                            response.tableUsers.push(_.clone(user));
                                        }
                                    });
                                });
                                if(notAddedUsers && notAddedUsers.length){
                                    notAddedUsers.forEach(function(user){
                                        response.dropdownUsers.push({
                                            id: user._id,
                                            text: user.name
                                        });
                                    });
                                }
                                res.send(response);
                            });
                        }
                    });
                });
            });
        });
    },
    /**
     * Adds a user role
     *
     * @param req The http request object
     * @param res The http response object
     * @since 1.0
     */
    add_user_role: function(req, res) {
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files){
            var userId = fields.userId;
            var resid = fields.resid;
            var type = fields.type;

            var action = type === HELPER.RESOURCE_TYPE.CATEGORY ? HELPER.ACTION.MANAGE_CATEGORY_USERS : HELPER.ACTION.MANAGE_BOARD_USERS;
            // Authorization
            var loginId = req.session.login_user_id;
            var loginName = req.session.login_user_name;
            HELPER.role_validate(loginId, resid, action.ROLE, res, function(){
                if(userId) {
                    userModel.getUserSocketId(userId, function(user){
                        roleModel.getByName(type === HELPER.RESOURCE_TYPE.CATEGORY ? HELPER.ROLE.ADMIN : HELPER.ROLE.CONTRIBUTOR, function(roles){
                            var userRole = {
                                user_id: mongo.ObjectID(user[0]._id.toHexString()),
                                role_id: mongo.ObjectID(roles[0]._id.toHexString()),
                                type: type
                            };
                            if(type === HELPER.RESOURCE_TYPE.CATEGORY){
                                categoryModel.getCategoryOne(resid, function(categories){
                                    userRole.resource_id = mongo.ObjectID(categories[0]._id.toHexString());
                                    addUserRole(userRole, function(newUser){
                                        addUserRoleStory(HELPER.ACTIVITY_VERBS.ADD, user[0], loginId, HELPER.ACTIVITY_TYPES.CATEGORY, 
                                            categories[0]._id, categories[0].category_name, 
                                            categories[0].image, function(){
                                            res.send({
                                                error: 0,
                                                user: user
                                            });
                                        });
                                    });
                                });
                            } else if(type === HELPER.RESOURCE_TYPE.BOARD) {
                                boardModel.getBoardOne(resid, function(boards){
                                    userRole.resource_id = mongo.ObjectID(boards[0]._id.toHexString());
                                    addUserRole(userRole, function(newUser){
                                        addUserRoleStory(HELPER.ACTIVITY_VERBS.ADD, user[0], loginId, HELPER.ACTIVITY_TYPES.BOARD, 
                                            boards[0]._id, boards[0].board_name, boards[0].image, 
                                            function(){
                                            res.send({
                                                error: 0,
                                                user: user
                                            });
                                        });
                                    });
                                });
                            } else {
                                res.send({
                                    error: 1,
                                    msg: 'Resource type invalid: ' + type
                                });
                            }
                        });
                    });
                } else {
                    res.send({
                        error: 1,
                        msg: 'Please select a user to add.'
                    });
                }
            });
        });
    },
    /**
     * Removes a user role
     *
     * @param req The http request object
     * @param res The http response object
     * @since 1.0
     */
    delete_user_role: function(req, res) {
        var id = req.params.id;
        // Authorization
        var userRole;
        userRoleModel.find(id, function(ur) {
	console.log('user role ' + JSON.stringify(ur));
	        userRole = ur;
            var loginId = req.session.login_user_id;
            var action = userRole.type === HELPER.RESOURCE_TYPE.CATEGORY ? HELPER.ACTION.MANAGE_CATEGORY_USERS : HELPER.ACTION.MANAGE_BOARD_USERS;
            HELPER.role_validate(loginId, userRole.resource_id.toHexString(), action.ROLE, res, function(){
                removeUserRole(id, function(err){
                    if(err){
                        res.send({
                            error: 1,
                            msg: err
                        });
                    } else {
                        var loginName = req.session.login_user_name;
                        userModel.getUserSocketId(userRole.user_id.toHexString(), function(user){
                            if(userRole.type === HELPER.RESOURCE_TYPE.CATEGORY){
                                categoryModel.getCategoryOne(userRole.resource_id.toHexString(), function(categories){
                                    addUserRoleStory(HELPER.ACTIVITY_VERBS.DELETE, user[0], loginId, HELPER.ACTIVITY_TYPES.CATEGORY, 
                                        categories[0]._id, categories[0].category_name, categories[0].image, 
                                        function(){
                                        res.send({
                                            error: 0,
                                            msg: ''
                                        });
                                    });
                                });
                            } else if(userRole.type === HELPER.RESOURCE_TYPE.BOARD) {
                                boardModel.getBoardOne(userRole.resource_id.toHexString(), function(boards){
                                    addUserRoleStory(HELPER.ACTIVITY_VERBS.DELETE, user[0], loginId, HELPER.ACTIVITY_TYPES.BOARD, 
                                        boards[0]._id, boards[0].board_name, boards[0].image, 
                                        function(){
                                        res.send({
                                            error: 0,
                                            msg: ''
                                        });
                                    });
                                });
                            }
                        });
                    }
                });
            });
        });
    }
}

/**
 * Adds a user role
 *
 * @param userRole The user role object to be added
 * @param callback The function to be called after the user role has been added
 * @since 1.0
 */
function addUserRole(userRole, callback){
    userRoleModel.insert(userRole, callback);
}

/**
 * Removes a user role
 *
 * @param userRoleId The id of the user role to be removed
 * @param callback The function to be called after the user role has been removed
 * @since 1.0
 */
function removeUserRole(userRoleId, callback){
    userRoleModel.remove(userRoleId, callback);
}

/**
 * Adds a user role story
 *
 * @param action The action that was performed (add/remove)
 * @param user The user that was added or removed
 * @param loginId The id of the user that performed the action
 * @param resType The resource type (board/category)
 * @param resId The resource id
 * @param resName The resource name
 * @param resImage The resource image
 * @param callback The function to be called after the user role has been removed
 * @since 1.1
 */
function addUserRoleStory(action, user, loginId, resType, resId, resName, resImage, callback){
    userModel.userDetails(user._id.toHexString(), function(addedUserDetail) {
        // create story for adding/removing a user role
        var story = {
            timestamp: new Date(),
            user_id: mongo.ObjectID(loginId),
            action: action,
            item_type: HELPER.ACTIVITY_TYPES.USER,
            item_id: user._id,
            item_name: user.name,
            item_image: addedUserDetail[0].image,
            updated_field_type: null,
            updated_field: null,
            old_value: null,
            new_value: null,
            related_item_type: resType,
            related_item_id: resId,
            related_item_name: resName,
            related_item_image: resImage
        };
        storyModel.insert(story, function(newStory){
            HELPER.notifyAboutStory(loginId, newStory[0]);
            callback();
        });
    });
}

module.exports = userRoleController;
