/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Represents the Role model
 * 
 * @author MonicaMuranyi
 * @version 1.0
 */
var roleModel = {

    /**
     * Retrieves all roles
     *
     * @param callback The function to be called after the data is retrieved
     * @since 1.0
     */
    list: function(callback)
    {
        mongodb.collection('role').find().toArray(function(err, results) {
            if(err) {
                console.error(err);
            }
            callback(results);
        });
    },
    /**
     * Retrieves a role by it's id
     *
     * @param name The id of the role
     * @param callback The function to be called after the data is retrieved
     * @since 1.0
     */
    get: function(id, callback)
    {
        mongodb.collection('role').find({_id: mongo.ObjectID(id)}).toArray(function(err, results) {
            if(err) {
                console.error(err);
            }
            callback(results);
        });
    },
    /**
     * Retrieves all roles that match an array of ids
     *
     * @param user_ids The array of role ids to match
     * @param callback The function to be called after the data is retrieved
     * @since 1.0
     */
    getRolesIn: function(ids, callback)
    {
        var collection = mongodb.collection('role');
        var objIds = [];
        ids.forEach(function(id){
            objIds.push(mongo.ObjectID(id));
        });
        collection.find({
            _id: {
                $in: objIds
                }
            }, function(err, res) {
                if(err) {
                    console.error(err);
                }
                res.toArray(function(er, data) {
                    callback(data);
                });
            }
        );
    },
    /**
     * Retrieves a role by it's name
     *
     * @param name The name of the role
     * @param callback The function to be called after the data is retrieved
     * @since 1.0
     */
    getByName: function(name, callback)
    {
        mongodb.collection('role').find({name: name}).toArray(function(err, results) {
            if(err) {
                console.error(err);
            }
            callback(results);
        });
    }
}

module.exports = roleModel;
