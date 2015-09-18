/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Generates pins using PPI products as data source
 *
 * Changes in version 1.1 (Myyna NodeJS PDS PINS Generators Stories Update):
 * - added logic to save stories for added/updated pins
 *
 * Changes in version 1.2 (Myyna [Bug Bounty]):
 * - removed user_name story field
 *  
 * @author MonicaMuranyi
 * @version 1.2
 */
var async = require('async');
var fs = require('fs');
var config = require('./config');
var mongo = require('mongodb');
var im = require('imagemagick');
var path = require('path');
var mongoConfig = require('../../application/config/mongodb.js');
var request = require('request');
var xpath = require('xpath');
var domParser = require('xmldom').DOMParser;
var util = require('util');

var pinModel;
var boardModel;
var userModel;
var storyModel;

// The options for the dom parser
// At the moment we are ignoring errors/warnings as they are a lot of them when parsing
// http://ppi.pds.nasa.gov/ditdos/view?id=pds://PPI/<DATA_SOURCE_ID>/DATA responses
var domParserOptions = {
	/**
	 * locator is always need for error position info
	 */
	locator: {},
	/**
	 * you can override the errorHandler for xml parser
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
	 */
	errorHandler:{
		warning: function(warn){
			// ignore warnings
		},
		error: function(err){
			// ignore errors
		},
		fatalError: function(err){
			// ignore errors
		}
	}
};

(function () {
    var argv = require('minimist')(process.argv.slice(2));
    // Validate input data and show usage
    if (!argv.query || argv.h || argv.help) {
        console.error('--query option is required');
        console.info('Example usage: node generate-pins-from-ppi --query=SPACECRAFT_NAME:\(Galileo\)');
        console.info('For more details about the --query argument, see Readme.md, section "Generate pins from PPI"');
        process.exit();
    }
	mongo.connect('mongodb://'+ (mongoConfig.dbHost ? mongoConfig.dbHost : 'localhost') + ':'+(mongoConfig.dbPort ? config.dbPort : '27017') +'/' + mongoConfig.dbName, function(err, mongodb) {
	    if(err) {
	    	throw err;
		}
		console.log('mongodb is connected');
		pinModel = mongodb.collection('pins');
		boardModel = mongodb.collection('board');
		userModel = mongodb.collection('user');
		storyModel = mongodb.collection('story');

		// Verify the configured board and user exist in db
	    boardModel.find({'_id':mongo.ObjectID(config.board_id),'locked':0 }).toArray(function(er, boards){
       		if(er) {
		    	throw er;
			}
	        userModel.find({'_id':mongo.ObjectID(config.user_id)}).toArray(function(er, users){
   				if(er) {
			    	throw er;
				}
   				if(!boards || !boards.length){
   					throw new Error("The configured board id " + config.board_id + " does not exist.");
   				}
   				if(!users || !users.length){
   					throw new Error("The configured user id " + config.user_id + " does not exist.");
   				}
			    // Construct the main data source url
			    var url = util.format(config.ppi_products_service_url, argv.query);
				console.log('Datasource url: ' + url);
			    request.get({
			        url: url
			    }, function (err, response) {
			    	var dom = new domParser(domParserOptions).parseFromString(response.body);
					var nodes = xpath.select("//doc[not(starts-with(str[@name='slot']/text(), '/archive22'))]", dom);
					if(!nodes.length) {
						console.info("No data found for query " + argv.query);
						process.exit();
					} else {
					    var pinsToCreate = [];
					    async.eachSeries(nodes, function (node, cb) {

					    	var prodId = xpath.select('str[@name="id"]/text()', node);
					    	var id = prodId[0].toString();
					    	id = id.replace(/\//g, '');
					    	pinModel.find({"metadata.id": id}).toArray(function(err, results) {
					            if(err) {
					                throw err;
					            }
					    		if(!results[0]){
					    			console.log("\nCreating pin " + id + "\n");
					    			createPin(node, id, function(err, pin){
							        	if (err) {
								      		throw err;
								      	}
							        	pinsToCreate.push(pin);
							        	cb();
							        });
					    		} else {
					    			console.log("\nPin with id " + id + " already exists.");
					    			console.log("\nUpdating pin " + id + "\n");
					    			updatePin(results[0], node, function(err, pin){
							        	if (err) {
								      		throw err;
								      	}
								        saveStory(pin, true, boards[0], users[0], function(){
									      	delete pin._id;
									      	pinModel.update({"metadata.id": id}, {$set: pin}, function(err, status){
									        	if (err) {
										      		throw err;
										      	}
									        	cb();
									        });
							        	});
							        });
					    		}
					    	});
					    }, function (err) {
					    	if(pinsToCreate.length) {
								pinModel.insert(pinsToCreate, function (err, results) {
					                if (err) {
					                	throw err;
					                }
					                async.each(results, function (result, cb) {
									    saveStory(result, false, boards[0], users[0], cb);
									}, function () {
									    console.log("\nCreated " + pinsToCreate.length + " pins from PPI products.");
		                				process.exit();
									});
					            });
					    	} else {
					    		process.exit();
					    	}
					    });
					}
			    });
				
		    });
	    });
	});
})();

/**
 * Costructs a pin based on a doc xml tag
 *
 * @param xmlNode The xml tag
 * @param id The PPI id
 * @param callback The function to be called after the pin is constructed
 * @since 1.0
 */
function createPin(xmlNode, id, callback){
	var pin = {
		board_id: mongo.ObjectID(config.board_id),
		pin_type: config.pin_type,
		user_id: mongo.ObjectID(config.user_id),
		domain: config.domain,
		time: new Date(),
		blocked: 0,
		ppi: true
	};

	pin.metadata = {};
	pin.metadata.id = id;

	fs.readFile(config.placeholder_image, function(err, data) {

		var imageName = config.image_prefix + id + '.png';
		var imagePath = path.join(__dirname, config.imageFolder + '/pins/images/' + imageName);
		var smallImagePath = path.join(__dirname, config.imageFolder + '/pins/images/small/' + imageName);
	    var tmbImagePath = path.join(__dirname, config.imageFolder + '/pins/images/thumb/' + imageName);
		
		fs.writeFile(imagePath, data, function(err) {
			if (err) {
	      		callback(err, null);
	      	} else {
				// Generate preview image
				var small_rez_opt = {
			      srcPath: imagePath,
			      dstPath: smallImagePath,
			      width: 300 // width of small image
			    };
			    im.resize(small_rez_opt, function (err, stdout, stderr) {
			    	if (err) {
			      		callback(err, null);
			      	} else {
				      	var tmb_rez_opt = {
					        srcPath: imagePath,
					        dstPath: tmbImagePath,
					        width: 120, // width of image
					        height: 120 // height of image
				      	};
				      	im.resize(tmb_rez_opt, function (err, stdout, stderr) {
					        if (err) {
					        	callback(err, null);
							} else {
								pin.image_name = [imageName];
						        pin.tmb_image_name = [imageName];
						        pin.image_width = config.imageWidth;
						        updatePin(pin, xmlNode, callback);
							}
				      	});
			      	}
			    });
	      	}
		});
	});
}

/**
 * Updates a pin based on a doc xml tag
 *
 * @param pin The pin
 * @param xmlNode The xml tag
 * @param callback The function to be called after the pin is constructed
 * @since 1.0
 */
function updatePin(pin, xmlNode, callback){
	
    // Strings metdata
    var strMeta = xpath.select('str[@name!="q" and @name!="id"]', xmlNode);
    for (var i = 0; i < strMeta.length; i++) {
    	var strMetaName = xpath.select("@name", strMeta[i]);
    	var strMetaValue = xpath.select("text()", strMeta[i]);
    	if(strMetaName[0].value == "description"){
    		pin.description = strMetaValue.toString();
    	} else if(strMetaName[0].value == "slot"){
    		pin.metadata[strMetaName[0].value] = config.domain + strMetaValue.toString();    		
    	} else {
    		pin.metadata[strMetaName[0].value] = strMetaValue.toString();
    	}
    };

    // Arrays metdata
    var arrMeta = xpath.select("arr", xmlNode);
    for (var i = 0; i < arrMeta.length; i++) {
    	var arrMetaName = xpath.select("@name", arrMeta[i]);
    	var arrayMeta = [];
    	var arrMetaValue = xpath.select("str", arrMeta[i]);
    	for (var j = 0; j < arrMetaValue.length; j++) {
    		var subStrMetaValue = xpath.select("text()", arrMetaValue[j]);
    		arrayMeta.push(subStrMetaValue.toString());
    	}
    	pin.metadata[arrMetaName[0].value] = arrayMeta;
    };

	var dataSetIds = xpath.select("arr[@name='DATA_SET_ID']/str/text()", xmlNode);
						        
    if(dataSetIds && dataSetIds.length === 1){
    	var url = util.format(config.lbl_url, dataSetIds[0].toString());
        // Determine pin url
        request.get({
	        url: url
	    }, function (err, response) {
	    	if (err) {
	      		callback(err, null);
	      	} else {
	      		var dom = new domParser(domParserOptions).parseFromString(response.body);
				var leafs = xpath.select('//leaf[@type="TEXT" and substring(@term, string-length(@term) - string-length(".LBL") + 1) = ".LBL"]/@term', dom);
				if(leafs.length) {
					pin.pin_url = util.format(config.pin_url, dataSetIds[0].toString(), leafs[0].value.substring(0, leafs[0].value.length - 4));
				} else {
		        	pin.pin_url = util.format(config.pin_without_leaf_url, dataSetIds[0].toString());
				}
				pin.source_url = pin.pin_url;
				console.log("Pin url: " + pin.pin_url);
				callback(null, pin);
			}
	    });
    } else {
    	pin.pin_url = (dataSetIds && dataSetIds.length > 0 ? util.format(config.pin_without_leaf_url, dataSetIds[0].toString()) : config.domain);
    	pin.source_url = pin.pin_url;
    	console.log("Pin url: " + pin.pin_url);
    	callback(null, pin);
    }
}

/**
 * Saves a story for the created/updated pin
 *
 * @param pin The pin
 * @param updated Flag indicating if pin was created or updated
 * @param board The board of the pin
 * @param user The user that added the pin
 * @param callback The function to be called after the pin is constructed
 * @since 1.1
 */
function saveStory(pin, updated, board, user, callback){
    var story = {
        timestamp: new Date(),
        user_id: pin.user_id,
        action: updated ? "Updated" : "Added",
        item_type: "pin",
        item_id: pin._id,
        item_name: pin.description,
        item_image: Array.isArray(pin.image_name) ? pin.image_name[0] : pin.image_name,
        updated_field_type: null,
        updated_field: null,
        old_value: null,
        new_value: null,
        related_item_type: "board",
        related_item_id: board._id,
        related_item_name: board.board_name,
        related_item_image: board.image
    };
    storyModel.insert(story, function(newStory){
    	callback();
    });
}