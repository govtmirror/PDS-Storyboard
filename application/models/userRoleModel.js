/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Represents the user role model
 *
 * Changes in version 1.1 (Myyna Activity and Timeline Features):
 * - added removeByRoleResAndUser method
 *
 * @author MonicaMuranyi
 * @version 1.1
 */
var userRoleModel = {

    /**
     * Retrieves all user roles
     *
     * @param callback The function to be called after the data is retrieved
     * @since 1.0
     */
    list: function(callback)
    {
        mongodb.collection('user_role').find().toArray(function(err, results) {
            if(err) {
                console.error(err);
            }
            callback(results);
        });
    },

    /**
     * Retrieves the user roles related to a resource 
     *
     * @param resId The resource id
     * @param callback The function to be called after the data is retrieved
     * @since 1.0
     */
    findByResource: function(resId, callback)
    {
        mongodb.collection('user_role').find({resource_id: mongo.ObjectID(resId)}).toArray(function(err, results) {
            if(err) {
                console.error(err);
            }
            callback(results);
        });
    },

    /**
     * Retrieves the user roles related to a user 
     *
     * @param userId The user id
     * @param callback The function to be called after the data is retrieved
     * @since 1.0
     */
    findByUser: function(userId, callback)
    {
        mongodb.collection('user_role').find({user_id: mongo.ObjectID(userId)}).toArray(function(err, results) {
            if(err) {
                console.error(err);
            }
            callback(results);
        });
    },

    /**
     * Retrieves the user roles related to a user and a specific type
     *
     * @param userId The user id
     * @param type The type of the resource
     * @param callback The function to be called after the data is retrieved
     * @since 1.0
     */
    findByUserAndType: function(userId, type, callback)
    {
        mongodb.collection('user_role').find({
            user_id: mongo.ObjectID(userId),
            type: type
        }).toArray(function(err, results) {
            if(err) {
                console.error(err);
            }
            callback(results);
        });
    },

    /**
     * Retrieves the user roles related to a user and a specific role
     *
     * @param userId The user id
     * @param roleId The role id
     * @param callback The function to be called after the data is retrieved
     * @since 1.0
     */
    findByUserAndRole: function(userId, roleId, callback)
    {
        mongodb.collection('user_role').find({
            user_id: mongo.ObjectID(userId),
            role_id: mongo.ObjectID(roleId)
        }).toArray(function(err, results) {
            if(err) {
                console.error(err);
            }
            callback(results);
        });
    },

    /**
     * Retrieves the user roles related to a user and a resource
     *
     * @param userId The user id
     * @param resId The resource id
     * @param callback The function to be called after the data is retrieved
     * @since 1.0
     */
    findByUserAndResource: function(userId, resId, callback)
    {
        mongodb.collection('user_role').find({
            user_id: mongo.ObjectID(userId),
            resource_id: mongo.ObjectID(resId)
        }).toArray(function(err, results) {
            if(err) {
                console.error(err);
            }
            callback(results);
        });
    },

    /**
     * Retrieves the user roles related to a user, a resource and a specific role
     *
     * @param userId The user id
     * @param resId The resource id
     * @param roleId The role id
     * @param callback The function to be called after the data is retrieved
     * @since 1.0
     */
    findByUserAndResourceAndRole: function(userId, resId, roleId, callback)
    {
        mongodb.collection('user_role').find({
            user_id: mongo.ObjectID(userId),
            resource_id: mongo.ObjectID(resId),
            role_id: mongo.ObjectID(roleId)
        }).toArray(function(err, results) {
            if(err) {
                console.error(err);
            }
            callback(results);
        });
    },

    /**
     * Finds a user role by id
     *
     * @param userRole The user role to be inserted
     * @param callback The function to be called after the data is inserted
     * @since 1.0
     */
    find: function(id, callback){
        mongodb.collection('user_role').find({
            _id: mongo.ObjectID(id)
        }).toArray(function(err, results) {
            if(err) {
                console.error(err);
            }
            callback(results[0]);
        });
    },

    /**
     * Inserts a user role
     *
     * @param userRole The user role to be inserted
     * @param callback The function to be called after the data is inserted
     * @since 1.0
     */
    insert: function(userRole, callback){
        mongodb.collection('user_role').insert(userRole, {safe:true}, function(err, newUser){
            if(err) {
                console.error(err);
            }
            callback(newUser[0]);
        });
    },

    /**
     * Removes a user role
     *
     * @param id The id of the user role to be removed
     * @param callback The function to be called after the data is removed
     * @since 1.0
     */
    remove: function(id, callback){
        mongodb.collection('user_role').remove({ _id:mongo.ObjectID(id) }, function(err) {
            if(err) {
                console.error(err);
            }
            callback(err);
        });
    },

    /**
     * Removes a user role by it's user, resource and role
     *
     * @param roleId The role id
     * @param resId The resource id
     * @param userId The user id
     * @param callback The function to be called after the data is removed
     * @since 1.1
     */
    removeByRoleResAndUser: function(roleId, resId, userId, callback){
        mongodb.collection('user_role').remove({ 
            user_id:mongo.ObjectID(userId),
            role_id:mongo.ObjectID(roleId),
            resource_id:mongo.ObjectID(resId)
         }, function(err) {
            if(err) {
                console.error(err);
            }
            callback(err);
        });
    }
}

module.exports = userRoleModel;
