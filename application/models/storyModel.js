/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Represents the story model
 *
 * Changes in version 1.1 (Myyna [Bug Bounty]):
 * - removed user_name story field
 *
 * @author MonicaMuranyi
 * @version 1.1
 */
system.loadHelper('timelineHelper');
var storyModel = {

    /**
     * Retrieves the aggregated stories related to a set of user/resource ids
     *
     * @param pageSize The page size
     * @param startTime The start time of the search
     * @param userIds The ids of the users
     * @param followedUsersIds The ids of the followed users
     * @param resourceIds The ids of the resources
     * @param callback The function to be called after the data is retrieved
     * @since 1.0
     */
    findGeneralStories: function(pageSize, startTime, userIds, followedUsersIds, resourceIds, callback){
        mongodb.collection('story').aggregate([
        { 
            $match : {
                $and: [
                    {
                        timestamp: {$lt: startTime}
                    },
                    {
                        $or: [
                            {
                                user_id: { $in: userIds }
                            },
                            {
                                item_id: { $in: userIds }
                            },
                            {
                                $and: [ 
                                    {user_id: { $in: followedUsersIds }},
                                    {action: HELPER.ACTIVITY_VERBS.CREATE},
                                    {item_type: HELPER.ACTIVITY_TYPES.CATEGORY}
                                ]
                            },
                            {
                                $and: [
                                    {item_id: { $in: followedUsersIds }},
                                    {
                                        $or: [
                                            {action: HELPER.ACTIVITY_VERBS.FOLLOW},
                                            {action: HELPER.ACTIVITY_VERBS.UPDATE}
                                        ]
                                    },
                                    {item_type: HELPER.ACTIVITY_TYPES.USER}
                                ]
                            },
                            {
                                item_id: { $in: resourceIds }
                            },
                            {
                                related_item_id: { $in: resourceIds }
                            }
                        ]
                    }
                ]
            }
        },
        {
            $group : { 
                _id : {
                    "user_id": "$user_id",
                    "action": "$action",
                    "item_type": "$item_type",
                    "related_item_id": "$related_item_id",
                    "day": {"$dayOfMonth": "$timestamp"},
                    "hour": {"$hour":"$timestamp"}
                },
                items: {
                    $push: {
                        item_id: "$item_id",
                        item_name: "$item_name",
                        item_image: "$item_image",
                        user_id: "$user_id",
                        updates: "$updates"
                    }
                },
                user_id: { $first: "$user_id" },
                action: { $first: "$action" },
                item_type: { $first: "$item_type" },
                timestamp: { $min: "$timestamp" },
                user_image: { $first: "$user_image" },
                updated_field_type: { $first: "$updated_field_type" },
                updated_field: { $first: "$updated_field" },
                old_value: { $first: "$old_value" },
                new_value: { $first: "$new_value" },
                related_item_type: { $first: "$related_item_type" },
                related_item_id: { $first: "$related_item_id" },
                related_item_name: { $first: "$related_item_name" },
                related_item_image: { $first: "$related_item_image" },
                total : { $sum : 1 }
            }
        },
        {
            $sort: {timestamp : -1 }
        },
        {
            $skip: 0
        },
        {
            $limit: pageSize
        }
        ], function(err, results) {
            if (err){
                console.log(err);
            }
            callback(results);
        });
    },

    /**
     * Retrieves the aggregated stories related to a specific resource
     *
     * @param pageSize The page size
     * @param startTime The start time of the search
     * @param mainResourceId The id of the main resource
     * @param mainResourceType The type of the main resource
     * @param relatedResIds The ids of the related resources the logged in user has access to
     * @param followedUsersIds The ids of the followed users
     * @param callback The function to be called after the data is retrieved
     * @since 1.0
     */
    findSpecificStories: function(pageSize, startTime, mainResourceId, mainResourceType, relatedResIds, followedUsersIds, callback){
        var matchItemId = mainResourceType !== HELPER.ACTIVITY_TYPES.CATEGORY ? [
            {
                item_id: mongo.ObjectID(mainResourceId)
            },
            {
                $or: [
                    {related_item_type: null},
                    {
                        $and: [
                            {item_type: HELPER.ACTIVITY_TYPES.BOARD},
                            {
                                $or: [
                                    {action: HELPER.ACTIVITY_VERBS.FOLLOW},
                                    {action: HELPER.ACTIVITY_VERBS.UNFOLLOW}
                                ]
                            }
                        ]
                    },
                    {related_item_id: {$in: relatedResIds}}
                ]
            }
        ] : [{related_item_id: {$in: relatedResIds}}];
        mongodb.collection('story').aggregate([
        { 
            $match : {
                $and: [
                    {
                        timestamp: {$lt: startTime}
                    },
                    {
                        $or: [
                            {
                                $and: matchItemId
                            },
                            {
                                $and: [
                                    {
                                        $or: [
                                            {user_id: mongo.ObjectID(mainResourceId)},
                                            {user_id: {$in: followedUsersIds}}
                                        ]
                                    },
                                    {
                                        $or: [
                                            {related_item_type: null},
                                            {related_item_id: {$in: relatedResIds}}
                                        ]
                                    },
                                    {
                                        $or: [
                                            {action: HELPER.ACTIVITY_VERBS.REPIN},
                                            {item_type: HELPER.ACTIVITY_TYPES.USER},
                                            {item_type: HELPER.ACTIVITY_TYPES.PIN},
                                            {item_id: {$in: relatedResIds}},
                                            {
                                                $and: [
                                                    {action: HELPER.ACTIVITY_VERBS.CREATE},
                                                    {item_type: HELPER.ACTIVITY_TYPES.BOARD}
                                                ]
                                            },
                                            {
                                                $and: [
                                                    {action: HELPER.ACTIVITY_VERBS.CREATE},
                                                    {item_type: HELPER.ACTIVITY_TYPES.CATEGORY}
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                related_item_id: mongo.ObjectID(mainResourceId)
                            }
                        ]
                    }
                ]
            }
        },
        {
            $group : { 
                _id : {
                    "user_id": "$user_id",
                    "action": "$action",
                    "item_type": "$item_type",
                    "related_item_id": "$related_item_id",
                    "day": {"$dayOfMonth": "$timestamp"},
                    "hour": {"$hour":"$timestamp"}
                },
                items: { 
                    $push: {
                        item_id: "$item_id",
                        item_name: "$item_name",
                        item_image: "$item_image",
                        user_id: "$user_id",
                        updates: "$updates"
                    }
                },
                user_id: { $first: "$user_id" },
                action: { $first: "$action" },
                item_type: { $first: "$item_type" },
                timestamp: { $min: "$timestamp" },
                user_image: { $first: "$user_image" },
                updated_field_type: { $first: "$updated_field_type" },
                updated_field: { $first: "$updated_field" },
                old_value: { $first: "$old_value" },
                new_value: { $first: "$new_value" },
                related_item_type: { $first: "$related_item_type" },
                related_item_id: { $first: "$related_item_id" },
                related_item_name: { $first: "$related_item_name" },
                related_item_image: { $first: "$related_item_image" },
                total : { $sum : 1 } 
            }
        },
        {
            $sort: {timestamp : -1 }
        },
        {
            $skip: 0
        },
        {
            $limit: pageSize
        }
        ], function(err, results) {
            if (err){
                console.log(err);
            }
            callback(results);
        });
    },

    /**
     * Inserts a story
     *
     * @param story The story to be inserted
     * @param callback The function to be called after the data is inserted
     * @since 1.0
     */
    insert: function(story, callback){
        mongodb.collection('story').insert(story, function(err, newStory){
            if(err) {
                console.error(err);
            }
            callback(newStory);
        });
    }
}

module.exports = storyModel;
