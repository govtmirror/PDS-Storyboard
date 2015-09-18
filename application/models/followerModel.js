/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/* 
 * Follower Model 
 ** The MIT License (MIT)
 * @category cubetboard
 * @package pin follower
 *
 * Changes in version 2.1 (Myyna NodeJS Roles and Users Update):
 * - fixed BoardFollowerCount function
 *
 * Changes in version 2.2 (Myyna Activity and Timeline Features):
 * - added findByFollower and findByFollower methods
 *
 * @version 2.2
 * @author Arya <arya@cubettech.com>, MonicaMuranyi
 * @Date 10-11-2013
 */

var followerModel = {
/* 
     * @author Arya <arya@cubettech.com>
     * @Date 10-11-2013
     * @param data to insert
     * @return follower details inserted
     */
insertFollower : function(insert_data,callback){
        
        var follower = {
                        follower_id      :   mongo.ObjectID(insert_data.follower_id),
                        follow_by        :   mongo.ObjectID(insert_data.followed_by),
                        timestamp        :   insert_data.time,
                        type             :   insert_data.follow_type,
                       
                  };
                  

        var collection = mongodb.collection('followers');  
        collection.insert(follower,function(err,newfollower) {
            if (err) return console.error(err);
               
            callback(newfollower);
        });
        
},
/* 
     * @author Arya <arya@cubettech.com>
     * @Date 10-11-2013
     * @param follower details
     * @return 0 if alredy exist otherwise 1
     */
followerCheck : function(insert_data,callback)
  
        {


                var collection = mongodb.collection('followers');  
                collection.find({'follower_id':mongo.ObjectID(insert_data.follower_id), 'follow_by':mongo.ObjectID(insert_data.followed_by),'type':insert_data.follow_type},function (err, res) {
                   if(res)
                {
                res.toArray(function(er, data){
                        //console.log(data);
                    if(data.length>0)
                        callback(0);
                    else{
                        callback(1);
                    }
                });
            }
            else
                    {
                   callback(0);
               }
                });

       },
       /* 
     * @author Arya <arya@cubettech.com>
     * @Date 10-11-2013
     * @param user id,logged userid
     * @return follower details
     */
       BoardFollowerCount :function(id,logged_id,callback){
        var collection = mongodb.collection('followers');  
        collection.find({ 'follower_id': mongo.ObjectID(id), 'follow_by': mongo.ObjectID(logged_id), 'type':'board' },function (err, res) {
            res.toArray(function(er, data){
                callback(data.length);
            });
        });
    },
    /* 
     * @author Arya <arya@cubettech.com>
     * @Date 10-11-2013
     * @param follower details
     * @return 1
     */
    BoardUnfollow :function(form_data,callback){
        var collection = mongodb.collection('followers');  
        collection.remove({'follower_id':mongo.ObjectID(form_data.follower_id),'follow_by':mongo.ObjectID(form_data.followed_by),'type': form_data.follow_type},function (err, data) {
                //console.log(3);
                if (err) return handleError(err);
                callback(1);
            });
    },
    
    /**
     * Retrieves all followed users by follower
     *
     * @param callback The function to be called after the data is retrieved
     * @since 2.2
     */
    findByFollower: function(followerId, callback)
    {
        mongodb.collection('followers').find({follow_by: mongo.ObjectID(followerId)}).toArray(function(err, results) {
            if(err) {
                console.error(err);
            }
            callback(results);
        });
    },

    /**
     * Retrieves all follower users by followed user
     *
     * @param callback The function to be called after the data is retrieved
     * @since 2.2
     */
    findByFollowed: function(followedId, callback)
    {
        mongodb.collection('followers').find({follower_id: mongo.ObjectID(followedId)}).toArray(function(err, results) {
            if(err) {
                console.error(err);
            }
            callback(results);
        });
    }
}


module.exports = followerModel;
