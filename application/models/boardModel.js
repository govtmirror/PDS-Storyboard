/*
* Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
*/
/**
* Database functions for board
*
* LICENSE: MIT
*
* Changes in version 2.1 (Myyna NodeJS Roles and Users Update):
* - added getBoardsByIdsAndCreator method
* - added getBoardsByCategory method
*
* Changes in version 2.2 (Myyna Web Application List View Update):
* - added logic to diplay items as list and to add extra information
*
* Changes in version 2.3 (Myyna [Bug Bounty]):
* - updated the way the board follower number is calculated
*
* @category cubetboard
* @package Board
* @copyright Copyright (c) 2007-2014 Cubet Technologies. (http://cubettechnologies.com)
* @version 2.3
* @author Rahul P R <rahul.pr@cubettech.com>, MonicaMuranyi, TCSASSEMBLER
* @date 18-Nov-2013
*/

var async = require('async');
var pinModel = system.getModel('pin');
var followerModel = system.getModel('follower');
var userRoleModel = system.getModel('userRole');

var boardModel = {
    /**
    * insert board details
    * @author Rahul P R <rahul.pr@cubettech.com>
    * @date 18-Nov-2013
    */
    insert:function(db_data,callback){
        var collection = mongodb.collection('board');
        collection.insert(db_data,function(err,inserted_data) {
            if (err) return console.error(err);
            console.log('Board inserted !! ');
            callback(inserted_data);
        });
    },
    /**
    * get all boards
    * @author Rahul P R <rahul.pr@cubettech.com>
    * @date 18-Nov-2013
    */
    getBoardAll :function(callback){
        var collection = mongodb.collection('board');
        collection.find({'locked':0}).sort({ timestamp: -1}, function(err, res){
            res.toArray(function(er, data){
                callback(data);
            });
        });
    },
    /**
    * delete board
    * @author Rahul P R <rahul.pr@cubettech.com>
    * @date 18-Nov-2013
    */
    deleteBoard :function(id,callback){
        var collection = mongodb.collection('board');
        collection.remove({'_id':mongo.ObjectID(zid) },function (err, data) {
            //console.log(3);
            if (err) return handleError(err);
            callback(1);
        });
    },
    /**
    * get selected boards
    * @author Rahul P R <rahul.pr@cubettech.com>
    * @date 18-Nov-2013
    */
    getSelectedBoardsBoardOne :function(id,callback){
        var collection = mongodb.collection('board');
        collection.find({'_id':mongo.ObjectID(id),'locked':0 },function (err,res) {
            res.toArray(function(er, data){
                callback(data);
            });
        });
    },
    /**
    * update board
    * @author Rahul P R <rahul.pr@cubettech.com>
    * @date 18-Nov-2013
    */
    updateBoard :function(post_data,callback){
        var collection = mongodb.collection('board');
        collection.update(
            {   '_id' : post_data._id   },
            {'$set':{
                'board_name' : post_data.board_name
                }},
                function (err,data) {
                    if (err) return handleError(err);
                    callback(data);
                });

            },

            /** @author Arya <arya@cubettech.com>
            * @Date 22-11-2013
            *
            * list the details of creator of board by joining user and board collection
            */

            boardCreator:function(user_id,id,callback){
                var collection_name ="board_"+user_id;
                var user_map = function() {
                    emit(this._id, {
                        name: this.name,
                        email: this.email,
                        socket_id:this.socket_id,
                        cost:0
                    });
                }

                var board_map = function() {
                    if (this._id == id) {
                        emit(this.creator, {
                            name:0,
                            email:0,
                            socket_id:0,
                            cost: this.cost
                        });
                    }
                }

                var reduce = function(key, values) {
                    var outs = {
                        name: 0,
                        email: 0,
                        socket_id:0,
                        cost: 0
                    };
                    values.forEach(function(v){
                        if (v.email ) {
                            outs.email = v.email;
                        }
                        if (v.cost ) {
                            outs.cost = v.cost;
                        }
                        if(v.socket_id){
                            outs.socket_id = v.socket_id;
                        }
                        if (v.name ) {
                            outs.name = v.name;
                        }
                    });
                    return outs;
                },

                res = mongodb.collection('board').mapReduce(board_map, reduce, {out: {reduce: collection_name}, scope: {id:id}}, function(err, results){
                    if(err) console.log(err);

                });


                res = mongodb.collection('user').mapReduce(user_map, reduce, {out: {reduce: collection_name}}, function(err, results) {
                    if (err)
                    console.log(err);

                    mongodb.collection(collection_name).find({ 'value.cost':{$ne:0} },function (err,res) {

                        if(res) {
                            //console.log('0'+res);
                            res.toArray(function(er, data){
                                //console.log('1' + data);
                                callback(data);
                            });
                        } else {
                            //console.log('2');
                            callback(0);
                        }
                        mongodb.collection(collection_name).drop();
                    });
                });
            },

            /**
            * get board by id
            * @author Rahul P R <rahul.pr@cubettech.com>
            * @date 18-Nov-2013
            */
            getBoardOne :function(id,callback){
                var collection = mongodb.collection('board');
                collection.find({'_id':mongo.ObjectID(id),'locked':0 },function (err,res) {
                    res.toArray(function(er, data){
                        callback(data);
                    });
                });
            },

            /**
            * Fill boards with extra data
            * @param data the data
            * @param userId the user id
            * @param callback the callback
            */
            fillBoardsWithExtraData :function(data, userId, callback){
                async.each(data, function(board, callbackEach) {
                    async.series([
                        function(callbackSeries){
                            // check if the user follows the board
                            mongodb.collection('followers').findOne({
                                follower_id: mongo.ObjectID(board._id.toHexString()),
                                type:'board',
                                'follow_by':mongo.ObjectID(userId)
                            }, function(err, follower) {
                                if (follower && follower.follower_id) {
                                    board.boardfollow = 1;
                                } else {
                                    board.boardfollow = 0;
                                }
                                callbackSeries();
                            });
                        },
                        function(callbackSeries){
                            // get the users count
                            userRoleModel.findByResource(board._id.toHexString(), function(userRoles) {
                                board.boardfollowcount = userRoles.length;
                                callbackSeries();
                            });
                        },
                        function(callbackSeries){
                            // get the pins count
                            mongodb.collection('pins').count({
                                board_id: mongo.ObjectID(board._id.toHexString())
                            }, function(err, count) {
                                board.boardpinscount = count;
                                callbackSeries();
                            });
                        },
                        function(callbackSeries){
                            // get the creator name
                            mongodb.collection('user').findOne({
                                _id: mongo.ObjectID(board.creator.toHexString())
                            }, function(err, creator) {
                                if (creator && creator.name) {
                                    board.creator_name = creator.name;
                                }
                                callbackSeries();
                            });
                        },
                        function(callbackSeries){
                            // get the creator picture
                            mongodb.collection('user_profile').findOne({
                                user_id: mongo.ObjectID(board.creator.toHexString())
                            }, function(err, creator_detail) {
                                if (creator_detail && creator_detail.pic) {
                                    board.creator_image = creator_detail.pic;
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

                SelectedBoards :function(userId, options, callback){
                  if(typeof options == 'function'){
                    callback = options;
                    options = {skip:0, limit:15};
                  }
                  var collection = mongodb.collection('board');
                  collection.find({'locked':0}, options).sort({timestamp:-1},function (err, res) {
                      res.toArray(function(er, data){
                          boardModel.fillBoardsWithExtraData(data, userId, callback);
                      });
                  });
                },
                /**
                * get boards corresponding to category
                * @author Rahul P R <rahul.pr@cubettech.com>
                * @date 03-Jan-2014
                */
                getBoardIdsByCategory:function(id,callback){
                    var collection = mongodb.collection('board');
                    var boards=[];
                    collection.find({'category_id':mongo.ObjectID(id)},{_id:1},function (err,res) {
                        res.toArray(function(er, data){
                            if(data.length>0) {
                                var i = 0;
                                data.forEach(function(id){
                                    boards.push(id._id);
                                    i++;
                                    if(data.length==i) {
                                        callback(boards);
                                    }
                                });
                            } else{
                                callback(data);
                            }
                        });
                    });
                },
                /**
                * Retrieves all boards from a category
                *
                * @param id The category id
                * @param callback The function to be called after the data is retrieved
                * @since 2.1
                */
                getBoardsByCategory:function(id,callback){
                    mongodb.collection('board').find({
                        category_id: mongo.ObjectID(id)
                    }).toArray(function(err, results) {
                        if(err) {
                            console.error(err);
                        }
                        callback(results);
                    });
                },

                getCategoryByBoardId:function(id,callback){
                    var collection = mongodb.collection('board');
                    collection.findOne({'_id':mongo.ObjectID(id) },function (err,res) {

                        callback(res);

                    });

                },

                getAdminUsers:function(callback){
                    var collection = mongodb.collection('adminuser');
                    var adminusers=[];
                    collection.find({},{_id:1},function (err,res) {

                        res.toArray(function(er, data){

                            if(data.length>0)
                            {
                                var i = 0;

                                data.forEach(function(id){
                                    adminusers.push(id._id);
                                    i++;
                                    if(data.length==i)
                                    {

                                        callback(adminusers);
                                    }
                                });
                            }
                            else{
                                callback(data);
                            }
                        });
                    });
                },
                getBoardPincreation:function(adminusers,callback){

                    var collection = mongodb.collection('board');
                    collection.find({
                        //creator: {
                            //    '$in':adminusers
                            //},
                            'locked':0
                        },function(err, res) {

                            res.toArray(function(er, data) {
                                callback(data)
                            });

                        });


                    },
                    /**
                    * Retrieves all boards that match a board id array or have a specific creator
                    *
                    * @param board_ids The array of board ids to match
                    * @param creator_id The creator id to match
                    * @param callback The function to be called after the data is retrieved
                    * @since 2.1
                    */
                    getBoardsByIdsAndCreator: function(board_ids, creator_id, callback){
                        var collection = mongodb.collection('board');
                        var objIds = [];
                        board_ids.forEach(function(id){
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
                 * Polulates context for board instance
                 * @param {Object}   board Instace of mongodb.collection.findOne
                 * @param {String} login_user_id
                 * @param {Function} callback
                 */
                getBoardContext: function(board, login_user_id, callback){
                    async.parallel({
                        creator: function(cb){
                            mongodb.collection('user').findOne({
                                _id: board.creator
                            }, cb);
                        },
                        creator_profile: function(cb){
                            mongodb.collection('user_profile').findOne({
                                user_id: board.creator
                            }, cb);
                        },
                        followers: function(cb){
                            followerModel.BoardFollowerCount(board._id.toHexString(), login_user_id, function(count) {
                                cb(null, count);
                            });
                        },
                        pins: function(cb){
                            pinModel.getPinsByBoard_not(board._id.toHexString(), function(res) {
                                cb(null, res);
                            });
                        }
                    }, callback);
                }
                };
                
                module.exports = boardModel;
