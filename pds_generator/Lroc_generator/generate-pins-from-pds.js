/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Generates pins using Lroc products as data source
 *
 * Changes in version 1.1 (Myyna NodeJS PDS PINS Generators Stories Update):
 * - added logic to save stories for added/updated pins
 *
 * Changes in version 1.2 (Myyna [Bug Bounty]):
 * - removed user_name story field
 * 
 * @author TCSASSEMBLER, MonicaMuranyi
 * @version 1.2
 */
var async = require('async');
var _ = require('underscore');
var http = require('http');
var fs = require('fs');
var exec = require('child_process').exec;
var config = require('./config');
var mongo = require('mongodb');
var im = require('imagemagick');
var fse = require('fs-extra');
var path = require('path');
var mongoConfig = require('../../application/config/mongodb.js');

var PAGE_SIZE = 100;
var pinImageFolder = path.join(__dirname, '../../uploads/pins/images');
var placeholderImagePath = path.join(__dirname, '../../uploads/pins/images/'+config.placeholder_image);

var boardModel;
var userModel;
var storyModel;

/**
 * Check the config object for completeness
 * cb(err)
 */
function checkConfig (cb) {
  if (!config.db_host)
    cb(new Error("Please specify the database host (db_host) in config.js"));
  if (!config.db_user)
    cb(new Error("Please specify the database username (db_user) in config.js"));
  if (!config.db_pass)
    cb(new Error("Please specify the database password (db_pass) in config.js"));
  if (!config.db_name)
    cb(new Error("Please specify the database name (db_name) in config.js"));
  if (!config.db_table_name)
    cb(new Error("Please specify the database table name (db_table_name) in config.js"));
  if (!config.image_path_in)
    cb(new Error("Please specify the path the images will be downloaded to (image_path_in) in config.js"));
  if (!config.image_path_tmp)
    cb(new Error("Please specify the path the images will be processed in (image_path_in) in config.js"));
  if (!config.image_path_out)
    cb(new Error("Please specify the path the converted images will be saved to (image_path_out) in config.js"));
  if (!config.run_sh_path)
    cb(new Error("Please specify the path to run.sh (run_sh_path) in config.js"));
  if (!config.moon_map_path)
    cb(new Error("Please specify the path to moon.map (moon_map_path) in config.js"));
  if (!config.user_id)
    cb(new Error("Please specify the user_id (user_id) in config.js"));
  if (!config.board_id)
    cb(new Error("Please specify the board_id (board_id) in config.js"));

  // Create image paths
  [config.image_path_in, config.image_path_tmp, config.image_path_out].forEach(function (path) {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
  });

  cb(null);
}

function copy_placeholder_image(cb) {

  var placeholderSrcPath = path.join(__dirname, config.placeholder_image);
  fse.copy(placeholderSrcPath, placeholderImagePath, function (err) {
    if (err) return cb(err);

    var smallImagePath = path.join(pinImageFolder, '/small/' + config.placeholder_image);
    var tmbImagePath = path.join(pinImageFolder, '/thumb/' + config.placeholder_image);

    var small_rez_opt = {
      srcPath: placeholderImagePath,
      dstPath: smallImagePath,
      width: 300 // width of small image
    };
    im.resize(small_rez_opt, function (err, stdout, stderr) {
      if (err) return cb(err);
      var tmb_rez_opt = {
        srcPath: placeholderImagePath,
        dstPath: tmbImagePath,
        width: 120, // width of image
        height: 120 // height of image
      };
      im.resize(tmb_rez_opt, function (err, stdout, stderr) {
        console.log("copied placeholder image!");
        cb(err);
      });
    });

  });
}

/**
 * Connect to the mysql database
 * cb(err, connection)
 */
function db_connect (cb) {
  var c = require('mysql').createConnection({
    host: config.db_host,
    user: config.db_user,
    password: config.db_pass,
    database: config.db_name
  });
  c.connect(function (err) {
    cb(err, c);
  });
}

/**
 * Connect to the mongodb
 * @param cb(err, mongo_connection)
 */
function mongodb_connect (cb) {
  var mongoUrl = 'mongodb://'+ (mongoConfig.dbHost ? mongoConfig.dbHost : 'localhost') + ':'+(mongoConfig.dbPort ? mongoConfig.dbPort : '27017') +'/' + mongoConfig.dbName;
  mongo.connect(mongoUrl, function(err, mongodb) {
    if (err) {
      return cb(err);
    }

    console.log('mongodb is connected');
    cb(null, mongodb);

  });
}

/**
 * Query the database for image links
 * c       is the connection object
 * offset  is a optional offset into the rows
 * limit   is an optional limit on the returned rows
 * cb(err, rows)
 */
function db_query (c, offset, limit, cb) {
  var q = "SELECT * FROM " + config.db_table_name;
  if (limit) {
    if (offset == null)
      offset = 0;
    q += " LIMIT " + offset + ", " + limit + ";";
  }
  c.query(q, cb);
}

function printHelp () {
  console.log("Usage: " + process.argv[0] + " " + process.argv[1] + " [options]");
  console.log("\t--cmd=[create or process]\tSet the command");
  console.log("\t-o, --offset=[offset]\tSet the offset into the Dataset");
  console.log("\t-l, --limit=[limit]\tSet the maximum number of images to process");
  console.log("\t-h, --help\t\tShow this help message");
  process.exit();
}

function download_image (url, cb) {
  if (!fs.existsSync(config.image_path_in)) {
    fs.mkdirSync(config.image_path_in);
  }
  var local_path = url.split("/");
  local_path = config.image_path_in + "/" + local_path[local_path.length - 1];
  var file = fs.createWriteStream(local_path);
  http.get(url, function (r) {
    r.on('end', function () {
      cb(null);
    });
    r.on('error', function (err) {
      cb(err);
    });
    r.pipe(file);
  });
}

function findPinByPDSMetadata(pinsModel, filter, cb) {
  pinsModel.findOne(filter, function (err, result) {
    cb(err, result);
  });
}

function createPDSPlaceholderPin(pinsModel, row, board, user, cb) {


  // create a pin with placeholder image
  var pdsMetadata = {};
  _.each(_.keys(row), function (key) {
    pdsMetadata[key] = row[key];
  });
  pdsMetadata.pds = true;
  pdsMetadata.completed = false;

  var pin = {
    board_id: mongo.ObjectID(config.board_id),
    pin_type: 'image',
    description: 'pds pin ' + row.id,
    time: new Date(),
    blocked: 0,
    user_id: mongo.ObjectID(config.user_id),
    image_name: [config.placeholder_image],
    tmb_image_name: [config.placeholder_image],
    image_width: config.image_width,
    metadata: pdsMetadata
  };

  pinsModel.insert(pin, function (err, results) {
    saveStory(results[0], false, board, user, function(){
      cb(err, results);
    });
  });
}

function completePDSPin(pinsModel, pin, pdsImagePath, row, board, user, cb) {
  var parts = row.image_path.split('/');
  var fileName = parts[parts.length-1];
  var imageName = fileName.replace('IMG', 'jpg');
  var imagePath = path.join(pinImageFolder, '/' + imageName);
  var smallImagePath = path.join(pinImageFolder, '/small/' + imageName);
  var tmbImagePath = path.join(pinImageFolder, '/thumb/' + imageName);

  // copy pds image file to upload pins image folder
  fse.copySync(pdsImagePath, imagePath);

  var small_rez_opt = {
    srcPath: imagePath,
    dstPath: smallImagePath,
    width: 300 // width of small image
  };
  im.resize(small_rez_opt, function (err, stdout, stderr) {
    if (err) return cb(err);
    var tmb_rez_opt = {
      srcPath: imagePath,
      dstPath: tmbImagePath,
      width: 120, // width of image
      height: 120 // height of image
    };
    im.resize(tmb_rez_opt, function (err, stdout, stderr) {
      if (err) return cb(err);

      pin.image_name = [imageName];
      pin.tmb_image_name = [imageName];
      pin.metadata.completed = true;

      // update pin
      pinsModel.update({_id: pin._id}, pin, function (err, result) {
        saveStory(pin, true, board, user, function(){
          cb(err);
        });
      });
    });
  });

}

/**
 * Query PDS database and create placeholder pin for each row.
 *
 * @param connection mysql connection
 * @param mongodb mongodb connection
 * @param callback
 */
function do_work_create_pins (connection, mongodb, board, user, callback) {
  var i = 0;
  var pinsModel = mongodb.collection('pins');
  
  var pin_count = 0;

  async.whilst(function () {
    return i * PAGE_SIZE < config.limit;
  }, function (callback2) {
    var limit = PAGE_SIZE;
    // The last page may be less than PAGE_SIZE
    if ((i + 1) * PAGE_SIZE > config.limit)
      limit = config.limit - i * PAGE_SIZE;
    var offset = config.offset + i * PAGE_SIZE;
    i++;

    async.waterfall([
      function (cb) {
        db_query(connection, offset, limit, cb);
      },
      function (rows, cols, cb) {
        async.eachSeries(rows, function (row, cb2) {
          // check if row already exists in mongodb
          pin_count ++;

          findPinByPDSMetadata(pinsModel, {'metadata.id':row.id, 'metadata.pds': true}, function (err, result) {
            if (err || result) {
              console.log('pin for pds '+ row.id + ' already exists, skipping');
              return cb2(); // skip if already exists
            } else {
              // create a placeholder pin
              createPDSPlaceholderPin(pinsModel, row, board, user, cb2);
            }
          });
        }, function (err) {
          cb(err);
        });
      }
    ], function (err) {
      connection.end();
      mongodb.close();
      callback2(err);
    });
  }, function (err) {
    callback(err, pin_count);
  });
}

function do_work_process_images (connection, mongodb, board, user, callback) {
  var _item_count = 0;
  var i = 0;
  var pinsModel = mongodb.collection('pins');

  async.whilst(function () {
    return i * PAGE_SIZE < config.limit;
  }, function (callback2) {
    var limit = PAGE_SIZE;
    // The last page may be less than PAGE_SIZE
    if ((i + 1) * PAGE_SIZE > config.limit)
      limit = config.limit - i * PAGE_SIZE;
    var offset = config.offset + i * PAGE_SIZE;
    i++;
    async.waterfall([
      function (cb) {
        db_query(connection, offset, limit, cb);
      },
      function (rows, cols, cb) {
        async.eachSeries(rows, function (row, cb2) {
          // check if row already exists in mongodb
          var pin;
          findPinByPDSMetadata(pinsModel, {'metadata.id': row.id, 'metadata.pds': true}, function (err, result) {
            if (err) {
              console.log('Error to find pds pin:', err);
              return cb2(err);
            }
            pin = result;
            if (!pin) {
              console.log('Can not find pds placeholder pin');
              return cb2();
            } else if (pin.metadata && pin.metadata.completed) {
              console.log('pin was already completed, skipping');
              return cb2();
            } else {
              // only incomplete pins continue from here ------

              console.log("Downloading " + row.image_path);
              download_image(row.image_path, function (err) {
                if (err) {
                  return cb2(err);
                }
                // Process this image
                var script = config.run_mock_script ? config.mock_script_path : config.run_sh_path;
                var cmd = '/bin/bash ' + script + ' '
                  + config.image_path_in + ' '
                  + config.image_path_tmp + ' '
                  + config.moon_map_path;
                console.log('image process cmd:', cmd);
                exec(cmd, function (err, stdout, stderr) {
                  if (err) {
                    console.log("Stdout: " + stdout);
                    console.log("Stderr: " + stderr);
                    return cb2(err);
                  }
                  // Check if we got a file in tmp dir
                  var tmp_files = fs.readdirSync(config.image_path_tmp);
                  if (tmp_files.length == 0) {
                    console.log("The process seems to be successful, but we didn't get an output file. Please check the output of the command:");
                    console.log("Stdout: " + stdout);
                    console.log("Stderr: " + stderr);
                    return cb2(new Error("Unexpected error"));
                  }

                  _item_count++;
                  console.log("Successfully processed image " + _item_count + ".");
                  // Copy processed image to output directory
                  var cmd = "cp " + config.image_path_tmp + "* " + config.image_path_out;
                  exec(cmd, function (err, stdout, stderr) {
                    if (err) {
                      return cb2(err);
                    }

                    // create a pin
                    var imagePath = path.join(config.image_path_out, row.name+'_final.jpg');
                    completePDSPin(pinsModel, pin, imagePath, row, board, user, function (err, pin) {
                      if (err) {
                        console.log('Error: failed to update PDS pin', err);
                        //return cb2(err);
                      }

                      // delete input and tmp dirs
                      async.each([config.image_path_in, config.image_path_tmp], function (path, cb3) {
                        exec("rm " + path + "*", function (err, stdout, stderr) {
                          if (err) {
                            console.log("Error: Can't delete " + path);
                            console.log(stderr);
                          }
                          cb3(err);
                        });
                      }, function (err) { // one row is done
                        cb2(err);
                      });
                    });
                  });
                });
              });

            }
          });

        }, function (err) {
          cb(err);
        });
      }
    ], function (err) {
      connection.end();
      mongodb.close();
      if (err) {
        // clean up! we got an error
        [config.image_path_tmp, config.image_path_in].forEach(function (path) {
          if (fs.readdirSync(path).length > 0) {
            exec("rm " + path + "*", function (err, stdout, stderr) {
              if (err) {
                console.log("Error: Can't delete " + path);
                console.log(stderr);
              }
            });
          }
        });
      }
      callback2(err);
    });
  }, function (err) {
    callback(err, _item_count);
  });
}

(function () {
  var argv = require('minimist')(process.argv.slice(2));
  if (!argv.cmd || argv.h || argv.help) {
    printHelp();
    throw new Error('--cmd option is required');
  }

  async.waterfall([
    function (cb) {
      if (argv.offset)
        config.offset = argv.offset;
      else if (argv.o) {
        config.offset = argv.o;
      }
      if (argv.limit)
        config.limit = argv.limit;
      else if (argv.l) {
        config.limit = argv.l;
      }
      checkConfig(cb);
    },
    function (cb) {
      if (argv.cmd === 'create') {
        copy_placeholder_image(cb);
      } else {
        cb();
      }
    },
    function (cb) {
      db_connect(cb);
    },
    function (mysqlConnection, cb) {
      mongodb_connect(function (err, mongodb) {
        if (err) {
          cb(err);
        } else {
          userModel = mongodb.collection('user');
          boardModel = mongodb.collection('board');
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
              cb(null, mysqlConnection, mongodb, boards[0], users[0]);
            });
          });
        }
      });
    },
    function (mysqlConnection, mongodb, board, user, cb) {
      if (argv.cmd === 'create') {
        do_work_create_pins(mysqlConnection, mongodb, board, user, cb);
      } else if (argv.cmd === 'process') {
        do_work_process_images(mysqlConnection, mongodb, board, user, cb);
      }

    }
  ], function (err, item_count) {
    var object = argv.cmd === 'create' ? 'pins' : 'images';
    if (!err) {
      console.log("Done. Processed " + item_count + " " + object);
      process.exit();
    } else {
      throw err;
    }
  });
})();

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
