/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
 /**
 * Holds application constants
 *
 * Changes in version 1.1 (Myyna Activity and Timeline Features):
 * - added ACTIVITY_VERBS, ACTIVITY_TYPES, IMAGE_PATH_PREFIXES and TIMELINE_PAGE_SIZE constants
 * Changes in version 1.2 (Myyna Web Application Editing Assets With Realtime Update):
 * - added ACTIONS(EDIT_CATEGORY,EDIT_BOARD,EDIT_PIN)
 * Changes in version 1.2 (Myyna Web Application Search Improvement):
 * - added SEARCH_GROUP_DB_MAPPING, SEARCH_FIELD_DB_MAPPING, SEARCH_KEYS constants
 * Changes in version 1.3 (Myyna [Bug Bounty]):
 * - removed constants from SUPPORTED_FILES
 *
 * @author MonicaMuranyi, kiril.kartunov
 * @version 1.3
 */
var constants = {
	RESOURCE_TYPE: {
		CATEGORY: "category",
		BOARD: "board"
	},
	ROLE: {
		FOLLOWER: "follower",
		CONTRIBUTOR: "contributor",
		ADMIN: "admin",
		OWNER: "owner"
	},
	ACTION: {
		CREATE_BOARD_IN_CATEGORY: {
			ROLE: "admin"
		},
		MANAGE_CATEGORY_USERS: {
			ROLE: "admin"
		},
		MANAGE_BOARD_USERS: {
			ROLE: "contributor"
		},
		CREATE_PIN: {
			ROLE: "contributor"
		},
		EDIT_CATEGORY: {
			ROLE: "admin"
		},
		EDIT_BOARD: {
			ROLE: "contributor"
		},
		EDIT_PIN: {
			ROLE: "contributor"
		}
	},
	ACTIVITY_VERBS: {
		CREATE: "Created",
		DELETE: "Deleted",
		ADD: "Added",
		UPDATE: "Updated",
		REPIN: "Repined",
		LIKE: "Liked",
		UNLIKE: "Unliked",
		COMMENT: "Commented",
		FOLLOW: "Followed",
		UNFOLLOW: "Unfollowed",
        MOVE: "Moved",
        RENAME: "Renamed"
	},
	ACTIVITY_ICONS: {
		CREATE: "icon_plus",
		DELETE: "icon_multip",
		ADD: "icon_plus",
		UPDATE: "icon_write",
		REPIN: "icon_fixed",
		LIKE: "icon_praise",
		UNLIKE: "Unliked",
		COMMENT: "icon_letter",
		FOLLOW: "icon_fresh",
		UNFOLLOW: "icon_unfresh",
        MOVE: "icon_write",
        RENAME: "icon_write"
	},
	ACTIVITY_TYPES: {
		CATEGORY: "category",
		BOARD: "board",
		PIN: "pin",
		USER: "user"
	},
	IMAGE_PATH_PREFIXES: {
		CATEGORY: "/categories",
		BOARD: "/boards",
		PIN: "/pins/images",
		USER: "/user_images"
	},
	TIMELINE_PAGE_SIZE: 20,
    SUPPORTED_FILES:{
        // supported upload formats
        validImage: ['image/jpeg','image/pjpeg','image/png','image/gif'],
        validPdf: ['application/pdf']
    },
  SEARCH_GROUP_DB_MAPPING: {
    "Person": "user",
    "Pin": "pins",
    "Board": "board",
    "Category": "category",
    "PDS": "pins",
    "PDSMetadata": "pins"
  },
  SEARCH_FIELD_DB_MAPPING: {
    "Person.name": "name",
    "Person.username": "username",
    "Person.country": "country",
    "Person.department": "affiliation_department",
    "Person.interest": "interests",
    "Person.organization": "affiliation_name",
    "Person.position": "affiliation_position",
    "Person.university": "affiliation_name",
    "Pin.type": "pin_type",
    "Pin.description": "description",
    "Pin.creator": "user_id",
    "Board.name": "board_name",
    "Board.description": "description",
    "Board.creator": "creator",
    "Category.name": "category_name",
    "Category.description": "description",
    "Category.creator": "creator",
    "PDS.type": "metadata.pds",
    "PDSMetadata.id": "metadata.id",
    "PDSMetadata.name": "metadata.name",
    "PDSMetadata.authority": "metadata.AUTHORITY",
    "PDSMetadata.missionName": "metadata.MISSION_NAME",
    "PDSMetadata.pds_version": "metadata.PDS_VERSION",
    "PDSMetadata.volumes": "metadata.VOLUMES",
    "PDSMetadata.volume_id": "metadata.VOLUME_ID",
    "PDSMetadata.volume_name": "metadata.VOLUME_NAME",
    "PDSMetadata.volume_series_name": "metadata.VOLUME_SERIES_NAME",
    "PDSMetadata.volume_set_id": "metadata.VOLUME_SET_ID",
    "PDSMetadata.volume_set_name": "metadata.VOLUME_SET_NAME",
    "PDSMetadata.spacecraft_name": "metadata.SPACECRAFT_NAME",
    "PDSMetadata.instrument_name": "metadata.INSTRUMENT_NAME",
    "PDSMetadata.target_name": "metadata.TARGET_NAME",
    "PDSMetadata.keyword": "metadata.keyword",
    "PDSMetadata.mission_id": "metadata.mission_id",
    "PDSMetadata.camera_type": "metadata.camera_type",
    "PDSMetadata.product_type": "metadata.product_type",
    "PDSMetadata.camera_spec": "metadata.camera_spec"
	},
	SEARCH_KEYS: {
	    "Person":[
	        {
	            "id":"Person.name",
	            "name":"name",
	            "freeText":false
	        },
	        {
	            "id":"Person.username",
	            "name":"username",
	            "freeText":false
	        },
          {
              "id":"Person.country",
              "name":"country",
              "freeText":false
          },
          {
              "id":"Person.department",
              "name":"department",
              "freeText":false
          },
          {
              "id":"Person.interest",
              "name":"interest",
              "freeText":false
          },
          {
              "id":"Person.organization",
              "name":"organization",
              "freeText":false
          },
          {
              "id":"Person.position",
              "name":"position",
              "freeText":false
          },
          {
              "id":"Person.university",
              "name":"university",
              "freeText":false
          }
	    ],
	    "Pin":[
	        {
	            "id":"Pin.type",
	            "name":"type",
	            "freeText":false
	        },
	        {
	            "id":"Pin.description",
	            "name":"description",
	            "freeText":true
	        },
	        {
	            "id":"Pin.creator",
	            "name":"creator",
	            "freeText":false
	        }
	    ],
	    "Board":[
	        {
	            "id":"Board.name",
	            "name":"name",
	            "freeText":false
	        },
	        {
	            "id":"Board.description",
	            "name":"description",
	            "freeText":true
	        },
	        {
	            "id":"Board.creator",
	            "name":"creator",
	            "freeText":false
	        }
	    ],
	    "Category":[
	        {
	            "id":"Category.name",
	            "name":"name",
	            "freeText":false
	        },
	        {
	            "id":"Category.description",
	            "name":"description",
	            "freeText":true
	        },
	        {
	            "id":"Category.creator",
	            "name":"creator",
	            "freeText":false
	        }
	    ],
	    "PDS":[
	        {
	            "id":"PDS.type",
	            "name":"type",
	            "freeText":false
	        }
	    ],
	    "PDS Metadata":[
	        {
	            "id":"PDSMetadata.id",
	            "name":"id",
	            "freeText":false
	        },
	        {
	            "id":"PDSMetadata.name",
	            "name":"name",
	            "freeText":false
	        },
	        {
	            "id":"PDSMetadata.authority",
	            "name":"authority",
	            "freeText":false
	        },
	        {
	            "id":"PDSMetadata.missionName",
	            "name":"mission name",
	            "freeText":false
	        },
	        {
	            "id":"PDSMetadata.mission_id",
	            "name":"mission id",
	            "freeText":false,
	            "number":true
	        },
	        {
	            "id":"PDSMetadata.camera_type",
	            "name":"camera type",
	            "freeText":false
	        },
	        {
	            "id":"PDSMetadata.pds_version",
	            "name":"pds version",
	            "freeText":false
	        },
	        {
	            "id":"PDSMetadata.volumes",
	            "name":"volumes",
	            "freeText":false
	        },
	        {
	            "id":"PDSMetadata.volume_id",
	            "name":"volume id",
	            "freeText":false
	        },
	        {
	            "id":"PDSMetadata.volume_name",
	            "name":"volume name",
	            "freeText":false
	        },
	        {
	            "id":"PDSMetadata.volume_series_name",
	            "name":"volume series name",
	            "freeText":false
	        },
	        {
	            "id":"PDSMetadata.volume_set_id",
	            "name":"volume set id",
	            "freeText":false
	        },
	        {
	            "id":"PDSMetadata.volume_set_name",
	            "name":"volume set name",
	            "freeText":false
	        },
	        {
	            "id":"PDSMetadata.spacecraft_name",
	            "name":"spacecraft name",
	            "freeText":false
	        },
	        {
	            "id":"PDSMetadata.instrument_name",
	            "name":"instrument name",
	            "freeText":false
	        },
	        {
	            "id":"PDSMetadata.target_name",
	            "name":"target name",
	            "freeText":false
	        },
	        {
	            "id":"PDSMetadata.keyword",
	            "name":"keyword",
	            "freeText":false
	        }
	    ]
	}
};
module.exports = constants;
