/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Database functions for category
 * 
 * LICENSE: MIT
 *
 * Changes in version 2.1 (Myyna NodeJS Roles and Users Update):
 * - added getCategoriesByIdsOrCreator method
 *
 * Changes in version 2.2 (Myyna Web Application List View Update):
 * - added logic to diplay items as list and to add extra information
 *
 * Changes in version 2.3 (Myyna [Bug Bounty]):
 * - added getCategoriesPaginated method
 * - updated the way the category follower number is calculated
 *
 * @category cubetboard
 * @package category
 * @copyright Copyright (c) 2007-2014 Cubet Technologies. (http://cubettechnologies.com)
 * @version 2.3
 * @author Rahul P R <rahul.pr@cubettech.com>, MonicaMuranyi
 * @date 18-Nov-2013
 */
var async = require('async');
var userRoleModel = system.getModel('userRole');
var boardModel = system.getModel('board');

var categoryModel = {
    /**
     * insert category details
     * @author Rahul P R <rahul.pr@cubettech.com>
     * @date 18-Nov-2013
     */
    insert:function(db_data,callback){
        var collection = mongodb.collection('category');  
        collection.insert(db_data,function(err,inserted_data) {
                if (err) return console.error(err);
                    console.log('Category inserted !! ');
                callback(inserted_data);
        });
    },

    /**
     * Fill categories with extra data
     */
    fillCategoriesWithExtraData :function(data, callback){
      async.each(data, function(category, callbackEach) {
        async.series([
            function(callbackSeries){
              // get the users count
              userRoleModel.findByResource(category._id.toHexString(), function(userRoles) {
                category.categoryfollowcount = userRoles.length;
                callbackEach();
              });
            },
            function(callbackSeries){
              // get the boards count
              mongodb.collection('board').count({
                category_id: mongo.ObjectID(category._id.toHexString())
              }, function(err, count) {
                category.categoryboardscount = count;
                callbackSeries();
              });
            },
            function(callbackSeries){
              // get the creator name
              mongodb.collection('user').findOne({
                _id: mongo.ObjectID(category.creator.toHexString())
              }, function(err, creator) {
                if (creator && creator.name) {
                  category.creator_name = creator.name;
                }
                callbackSeries();
              });
            },
            function(callbackSeries){
              // get the creator picture
              mongodb.collection('user_profile').findOne({
                user_id: mongo.ObjectID(category.creator.toHexString())
              }, function(err, creator_detail) {
                if (creator_detail && creator_detail.pic) {
                  category.creator_image = creator_detail.pic;
                }
                callbackSeries();
              });
            }
          ],
          function(err){
            if(err) {
              console.log(err);
            } else {
              callbackEach();
            }
          });
      }, function(err){
        if(err) {
          console.log(err);
        } else {
          //console.log(data);
          callback(data);
        }
      });
    },

    /**
     * get all categories
     * @author Rahul P R <rahul.pr@cubettech.com>
     * @date 18-Nov-2013
     */
    getCategoryAll :function(callback){
      var collection = mongodb.collection('category');
      collection.find({}, {
        sort: {
          timestamp: -1
        }
      }, function(err, res){
        res.toArray(function(er, data){
          categoryModel.fillCategoriesWithExtraData(data, callback);
        });
      });
    },
    /**
     * delete category
     * @author Rahul P R <rahul.pr@cubettech.com>
     * @date 18-Nov-2013
     */
    deleteCategory :function(id,callback){
        var collection = mongodb.collection('category');  
        collection.remove({'_id':mongo.ObjectID(id) },function (err, data) {
                //console.log(3);
                if (err) return handleError(err);
                callback(1);
            });
    },
    /**
     * get category by id
     * @author Rahul P R <rahul.pr@cubettech.com>
     * @date 18-Nov-2013
     */
    getCategoryOne :function(id,callback){
        var collection = mongodb.collection('category');  
        collection.find({'_id':mongo.ObjectID(id) },function (err,res) {
            res.toArray(function(er, data){
                //console.log(data);
                    callback(data);
            });
        });
    },
    /**
     * uddate category
     * @author Rahul P R <rahul.pr@cubettech.com>
     * @date 18-Nov-2013
     */
    updateCategory :function(con,db_data,callback){
        var collection = mongodb.collection('category');  
        collection.update(con,db_data,function (err,data) {
                if (err) return handleError(err);
                callback(data);
         });
    },
    /**
     * Retrieves all categories that match a category id array or have a specific creator
     *
     * @param cat_ids The array of category ids to match
     * @param creator_id The creator id to match
     * @param callback The function to be called after the data is retrieved
     * @since 2.1
     */
    getCategoriesByIdsOrCreator:function(cat_ids, creator_id, callback){
        var collection = mongodb.collection('category');
        var objIds = [];
        cat_ids.forEach(function(id){
            objIds.push(mongo.ObjectID(id));
        });
        collection.find({ $or: [ { _id: { $in: objIds } }, { creator: mongo.ObjectID(creator_id) } ] },function(err, res) {
            if(err) {
                console.error(err);
            }
            res.toArray(function(er, data) {
                callback(data)
            });
        });
    },
    /**
     * Polulates context for category instance
     * @param {Object}   cat Instance of mongodb.collection.findOne
     * @param {Function} callback
     */
    getCatContext: function(cat, callback){
        async.parallel({
            creator: function(cb){
                mongodb.collection('user').findOne({
                    _id: cat.creator
                }, cb);
            },
            creator_profile: function(cb){
                mongodb.collection('user_profile').findOne({
                    user_id: cat.creator
                }, cb);
            },
            followers: function(cb){
                userRoleModel.findByResource(cat._id.toHexString(), function(userRoles) {
                    cb(null, userRoles);
                });
            },
            boards: function(cb){
                boardModel.getBoardIdsByCategory(cat._id.toHexString(), function(boards){
                    cb(null, boards);
                });
            }
        }, callback);
    },
    /**
     * Retrieves paginated categories 
     *
     * @param skip The number of elements to be skipped
     * @param limit The number of elements to be retrieved
     * @param callback The function to be called after the data is retrieved
     * @since 2.3
     */
    getCategoriesPaginated :function(skip, limit, callback){
      var collection = mongodb.collection('category');
      collection.find({}, {skip: skip, limit: limit}).sort({timestamp:-1},function (err, res) {
          res.toArray(function(er, data){
            categoryModel.fillCategoriesWithExtraData(data, callback);
          });
      });
    }
};

module.exports = categoryModel;