/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Test data generator
 *
 * Changes in version 1.1 (Myyna Activity and Timeline Features):
 * - added createStories method
 * - added logic for creating stories for the different test activites
 *
 * Changes in version 1.2 (Myyna [Bug Bounty]):
 * - removed user_name story field
 * 
 * @author MonicaMuranyi
 * @version 1.2
 */
var fs = require('fs'),
  path = require('path'),
  async = require('async'),
  _ = require('underscore'),
  request = require('request'),
  mongo = require('mongodb'),
  im = require('imagemagick'),
  fse = require('fs-extra'),
  country_data = require('country-data'),
  config = require('../application/config/mongodb.js');

request = request.defaults({pool: {maxSockets: Infinity}});

// configuration for creating database data
var dataConfig = {
  numUsers: 5,
  numCategories: 5,
  categoryPrefix: '',
  minBoards: 2, // 2 - 10 boards per category
  maxBoards: 5,
  boardPrefix: '',
  minPins: 2,   // 2 - 5 pins per board
  maxPins: 5,
  pinPrefix: '',
  minPinLikes: 1,
  maxPinLikes: 5,
  minRepins: 1,
  maxRepins: 3,
  imageWidth: 400,
  imageHeight: 400,
  imageFolder: '../uploads'
};

var RANDOM_USER_URL = 'http://api.randomuser.me/';
var RANDOM_IMAGE_URL = 'http://randomimage.setgetgo.com/get.php';

var URLS = require('./data/urls.json');
var LOGIN_PAGES = require('./data/loginpages.json');

var PIN_TYPES = ['image', 'url_image', 'web_page'];
var ROLE_NAMES = ['owner', 'admin', 'contributor', 'follower'];


// create folders for image download
fse.mkdirsSync(path.join(__dirname, dataConfig.imageFolder+'/user_images/thumb'));
fse.mkdirsSync(path.join(__dirname, dataConfig.imageFolder+'/categories/thumb'));
fse.mkdirsSync(path.join(__dirname, dataConfig.imageFolder+'/boards/thumb'));
fse.mkdirsSync(path.join(__dirname, dataConfig.imageFolder+'/pins/images/thumb'));
fse.mkdirsSync(path.join(__dirname, dataConfig.imageFolder+'/pins/images/small'));

var randomImageUrls = [
  RANDOM_IMAGE_URL+'?width='+dataConfig.imageWidth+'&height='+dataConfig.imageHeight,
  'http://lorempixel.com/400/400/'
];


module.exports = {
  dropAllCollections: dropAllCollections,
  createLoginPages: createLoginPages,
  createRoles: createRoles,
  createTestData: createTestData
};


/**
 * This script can be executed from the command line or required by other module.
 * When the script is executed from the command line, connect db and create test data.
 */
if(require.main === module) {
  console.log("Executing as a script");
  var sio = null;
  var argv = require('minimist')(process.argv.slice(2));
  if (argv['imageFolder']) {
    delete argv['imageFolder'];
  }
  // copy all command line options to dataConfig
  _.extend(dataConfig, argv);
  //console.log('dataConfig:', dataConfig);


  mongo.connect('mongodb://'+ (config.dbHost ? config.dbHost : 'localhost') + ':'+(config.dbPort ? config.dbPort : '27017') +'/' + config.dbName, function(err, mongodb) {
    if(err) throw err;

    console.log('mongodb is connected');

    async.waterfall([
      function (cb) {      // Remove all collections
        if (argv.reset) {
          argv.loginpage = true;
          argv.role = true;
          dropAllCollections(mongodb, cb);
        } else {
          cb();
        }
      },
      function (cb) {
        if (argv.loginpage) {
          createLoginPages(mongodb, cb);
        } else {
          cb();
        }
      },
      function (cb) {
        if (argv.role) {
          createRoles(mongodb, cb);
        } else {
          getAllRoles(mongodb, cb);
        }
      },
      function (cb) {
        createTestData(mongodb, cb);
      }
    ], function (err) {
      process.exit();
    });

  });
}

function dropAllCollections(mongodb, callback) {
  var allCollections = ['story', 'loginpage', 'role', 'user', 'user_role', 'user_profile', 'category', 'board',
    'pins', 'repin', 'pin_like', 'sessions',
    'country', "university", "organization", "department", "position", "interest"];

  async.each(allCollections, function (collection, cb) {
    var model = mongodb.collection(collection);
    model.drop(cb);
  }, function () {
    logProgress('Dropped all collections.\n');
    callback();
  });
}

var tendots = '..........';
/**
 * Return string of dots of count length
 * @param count the length of dot string
 * @returns {string}
 */
function getDots(count) {
  if (!count) {
    return '.';
  }
  var dots = '';
  if (count > 10) {
    var n = Math.floor(count/10);
    count -= n * 10;
    _.times(n, function () {
      dots += tendots;
    });
  }

  _.times(count, function () {
    dots += '.';
  });
  return dots;
}

/**
 * Create logingpage data
 * @param mongodb
 * @param callback
 */
function createLoginPages(mongodb, callback) {
  logProgress('Creating loginpages:');
  var loginPageModel = mongodb.collection('loginpage');
  loginPageModel.insert(LOGIN_PAGES, function (err, results) {
    if (err) {
      logProgress('Error on creating loginpages', err);
    } else {
      logProgress('Created loginpages: '+results.length+'\n');
    }
    callback(err);
  });
}

var users = [], roles = [], roleMap = {};

/**
 * Create role data
 * @param mongodb
 * @param callback
 */
function createRoles(mongodb, callback) {
  logProgress('Creating roles:');
  var roleModel = mongodb.collection('role');
  async.eachSeries(ROLE_NAMES, function (roleName, cb2) {
    var role = {
      name: roleName,
      description: roleName + ' role'
    };
    if (roles.length > 0) {
      role.parent = _.last(roles)._id;
    } else {
      role.parent = null;
    }
    roleModel.insert(role, function (err, results) {
      if (err) return cb2(err);

      roles.push(results[0]);
      roleMap[roleName] = results[0];
      cb2();
    });
  }, function (err) {
    if (err) {
      logProgress('Error on creating roles:', err);
    } else {
      logProgress('Created roles: '+roles.length+'\n');
    }
    callback(err);
  });
}

/**
 * Get all roles
 * @param mongodb
 * @param callback
 */
function getAllRoles(mongodb, callback) {
  var roleModel = mongodb.collection('role');
  roleModel.find().toArray(function (err, results) {
    if (err) {
      return callback(err);
    }
    roles = results;

    _.each(roles, function (role) {
      roleMap[role.name] = role;
    });
    callback();
  });
}

/**
 * Select a random user from user_role collection.
 * @param mongodb
 * @param resource
 * @param type
 * @param roles
 * @param callback
 */
function getRandomUserByRoles(mongodb, resource, type, roles, callback) {

  var filter = {};
  if (resource) {
    filter.resource_id = resource._id
  }
  if (type) {
    filter.type = type
  }
  var roleIds = [];
  if (roles && roles.length > 0) {
    _.each(roles, function (role) {
      var roleId = roleMap[role]._id;
      roleIds.push(roleId);
    });
    filter.role_id = {$in: roleIds}
  }

  mongodb.collection('user_role').find(filter).toArray(function(err, results) {
    if (err) {
      console.log('Error to find user_role:', err);
      callback(err);
    }
    // return one random user from results
    if (results && results.length > 0) {
      var userRole = results[_.random(results.length-1)];
      return callback(null, userRole.user_id);
    } else if (resource.creator) {
      return callback(null, resource.creator);
    } else {
      return callback(null, users[_.random(users.length - 1)]._id);
    }

  });
}

/**
 * Print progress message stdout and socket.io when the script is called from install
 * @param msg
 */
function logProgress(msg, err) {
  if (err) {
    console.log(msg, err);
  } else {
    process.stdout.write(msg);
  }

  // send progress message to browser client
  if (sio) {
    sio.sockets.emit('status_data', {
      msg: msg
    });
  }
}

/**
 * Inserts an array of stories
 *
 * @param mongodb The db object
 * @param stories The array of stories
 * @param callback The function to be called after the data is retrieved
 * @since 1.1
 */
function createStories(mongodb, stories, callback){
    var storyModel = mongodb.collection('story');
    storyModel.insert(stories, function (err, results) {
        if (err) {
            return callback(err);
        }
        logProgress('Created stories: '+stories.length+'\n');
        callback();
    });
}

/**
 * Create all test data
 * @param mongodb
 * @param callback
 */
function createTestData(mongodb, callback) {

  var userSettings = [], userProfiles = [], categories = [], boards = [], pins = [], pinlikes = [], pinlikesResults = [], repins = [];
  var usernameImageUrl = {};
  var storyUserData = {};
  var storyCategoryData = {};
  var storyBoardData = {};
  var storyPinData = {};
  var countriesData = country_data.countries.all;

  async.waterfall([
    function (cb) {   // create countries
      var countryModel = mongodb.collection('country');
      logProgress('Creating countries: ');
      var countries = [];
      async.eachSeries(countriesData, function (country, cb2) {
        countries.push({
          name: country.name,
          name_lower_case: country.name.toLowerCase(),
          alpha2: country.alpha2,
          alpha3: country.alpha3
        });
        cb2();
      }, function (err) {
        process.stdout.write('\n');
        if (err) {
          logProgress('Error on creating countries:', err);
          cb(err);
        } else {
          countryModel.insert(countries, function (err, results) {
            if (err) return cb(err);
            logProgress('Created countries: '+countries.length+'\n');
            cb();
          });
        }
      });
    },

    function (cb) {   // create universities
      var universityModel = mongodb.collection('university');
      logProgress('Creating universities: ');
      var universities = [{
        name: "University1",
        name_lower_case: "university1"
      },{
        name: "University2",
        name_lower_case: "university2"
      }];
      universityModel.insert(universities, function (err, results) {
        if (err) return cb(err);
        logProgress('Created universities: '+universities.length+'\n');
        cb();
      });
    },

    function (cb) {   // create organizations
      var organizationModel = mongodb.collection('organization');
      logProgress('Creating organizations: ');
      var organizations = [{
        name: "Organization1",
        name_lower_case: "organization1"
      },{
        name: "Organization2",
        name_lower_case: "organization2"
      }];
      organizationModel.insert(organizations, function (err, results) {
        if (err) return cb(err);
        logProgress('Created organizations: '+organizations.length+'\n');
        cb();
      });
    },

    function (cb) {   // create departments
      var departmentModel = mongodb.collection('department');
      logProgress('Creating departments: ');
      var departments = [{
        name: "Department1",
        name_lower_case: "department1"
      },{
        name: "Department2",
        name_lower_case: "department2"
      }];
      departmentModel.insert(departments, function (err, results) {
        if (err) return cb(err);
        logProgress('Created departments: '+departments.length+'\n');
        cb();
      });
    },

    function (cb) {   // create positions
      var positionModel = mongodb.collection('position');
      logProgress('Creating positions: ');
      var positions = [{
        name: "Position1",
        name_lower_case: "position1"
      },{
        name: "Position2",
        name_lower_case: "position2"
      }];
      positionModel.insert(positions, function (err, results) {
        if (err) return cb(err);
        logProgress('Created positions: '+positions.length+'\n');
        cb();
      });
    },

    function (cb) {   // create interests
      var interestModel = mongodb.collection('interest');
      logProgress('Creating interests: ');
      var interests = [{
        name: "Interest1",
        name_lower_case: "interest1"
      },{
        name: "Interest2",
        name_lower_case: "interest2"
      }];
      interestModel.insert(interests, function (err, results) {
        if (err) return cb(err);
        logProgress('Created interests: '+interests.length+'\n');
        cb();
      });
    },

    function (cb) {   // create users
      var range = _.range(dataConfig.numUsers);
      var userModel = mongodb.collection('user');

      logProgress('Creating users: ');
      async.eachSeries(range, function (n, cb2) {
        request.get(RANDOM_USER_URL, function (err, response, body) {
          if (err) return cb2(err);

          body = JSON.parse(body);
          if (body.results && body.results[0].user) {

            var ru = body.results[0].user;
            var user = {
              name: ru.name.first + ' ' + ru.name.last,
              username: ru.username,
              email: ru.email,
              password: 'b2f8ede4a187251f1d2e415c3bfff75e',   // all users' password is password
              verified: 1,
              blocked: 0,
              time_created: new Date()
            };
            usernameImageUrl[ru.username] = ru.picture.medium;
            users.push(user);
            process.stdout.write('.');
            cb2();
          }
        });
      }, function (err) {
        process.stdout.write('\n');
        if (err) {
          logProgress('Error on creating users:', err);
          cb(err);
        } else {
          userModel.insert(users, function (err, results) {
            if (err) return cb(err);

            users = results;
            logProgress('Created users: '+users.length+'\n');
            cb();
          });
        }
      });
    },

    function (cb) {   // create user settings
      logProgress('Creating user settings: ');
      var settingsModel = mongodb.collection('settings');
      async.each(users, function (user, cb2) {
        var settings = {
          user_id: user._id,
          comment:1,
          like:1,
          follow:1
        };
        userSettings.push(settings);
        process.stdout.write('.');
        cb2();
      }, function (err) {
        process.stdout.write('\n');
        if (err) {
          logProgress('Error on creating user settings ' + JSON.stringify(err));
          cb(err);
        } else {
          settingsModel.insert(userSettings, function (err, results) {
            if (err) return cb(err);

            userSettings = results;
            logProgress('Created user settings: '+userSettings.length+'\n');
            cb();
          });
        }
      });
    },

    function (cb) {   // create user profiles
      logProgress('Creating user profiles: ');
      var userProfileModel = mongodb.collection('user_profile');
      async.each(users, function (user, cb2) {
        request.get({url: usernameImageUrl[user.username], encoding: 'binary'}, function (err, response, body) {
          if (err) return cb2(err);

          var imageName = user.username + '.jpg';
          storyUserData[user._id] = {name: user.name, imageName: imageName};
          var imagePath = path.join(__dirname, dataConfig.imageFolder + '/user_images/' + imageName);
          var tmbImagePath = path.join(__dirname, dataConfig.imageFolder + '/user_images/thumb/' + imageName);

          fs.writeFile(imagePath, body, 'binary', function (err) {
            if (err) return cb2(err);

            var tmb_rez_opt = {
              srcPath: imagePath,
              dstPath: tmbImagePath,
              width: 30, // width of image
              height: 30 // height of image
            };
            im.resize(tmb_rez_opt, function (err, stdout, stderr) {
              if (err) return cb2(err);

              var userProfile = {
                user_id: user._id,
                pic: imageName
              };
              userProfiles.push(userProfile);
              process.stdout.write('.');
              cb2();
            });
          });
        });

      }, function (err) {
        process.stdout.write('\n');
        if (err) {
          logProgress('Error on creating user profile ' + JSON.stringify(err));
          cb(err);
        } else {
          userProfileModel.insert(userProfiles, function (err, results) {
            if (err) return cb(err);

            userProfiles = results;
            logProgress('Created user profiles: '+userProfiles.length+'\n');
            cb();
          });
        }
      });
    },

    function (cb) {   // create categories
      logProgress('Creating categories: ');
      var categoryModel = mongodb.collection('category');
      async.times(dataConfig.numCategories, function (n, cb2) {
        var imageName = dataConfig.categoryPrefix + 'category-' + n + '.png';
        var imagePath = path.join(__dirname, dataConfig.imageFolder + '/categories/' + imageName);
        var tmbImagePath = path.join(__dirname, dataConfig.imageFolder + '/categories/thumb/' + imageName);

        request.get({
          url: randomImageUrls[n % randomImageUrls.length],
          encoding: 'binary'
        }, function (err, response, body) {
          if (err) return cb2(err);

          fs.writeFile(imagePath, body, 'binary', function (err) {
            if (err) return cb2(err);

            var tmb_rez_opt = {
              srcPath: imagePath,
              dstPath: tmbImagePath,
              width: 120, // width of image
              height: 120 // height of image
            };
            im.resize(tmb_rez_opt, function (err, stdout, stderr) {
              if (err) return cb2();
              var user = users[_.random(users.length - 1)];
              // create category
              var category = {
                category_name: dataConfig.categoryPrefix + 'Category-' + n,
                description: dataConfig.categoryPrefix + 'category description ' + n,
                image: imageName,
                creator: user._id,
                timestamp: new Date()
              };
              categories.push(category);
              process.stdout.write('.');
              cb2();
            });
          });
        });

      }, function (err) {
        process.stdout.write('\n');
        if (err) {
          logProgress('Error on creating categories:', err);
          cb(err);
        } else {
            categoryModel.insert(categories, function (err, results) {
              if (err) return cb(err);

              categories = results;
              logProgress('Created categories: '+categories.length+'\n');
              var stories = [];
              logProgress('Creating stories for categories: ');
              async.each(categories, function (category, cb3) {
                  // create story for adding categories
                  var story = {
                      timestamp: category.timestamp,
                      user_id: category.creator,
                      action: "Created",
                      item_type: "category",
                      item_id: category._id,
                      item_name: category.category_name,
                      item_image: category.image,
                      updated_field_type: null,
                      updated_field: null,
                      old_value: null,
                      new_value: null,
                      related_item_type: null,
                      related_item_id: null,
                      related_item_name: null,
                      related_item_image: null
                  };
                  stories.push(story);
                  process.stdout.write('.');
                  cb3();
              }, function (err) {
                  process.stdout.write('\n');
                  if (err) {
                    logProgress('Error on creating stories ' + JSON.stringify(err));
                    cb(err);
                  } else {
                    createStories(mongodb, stories, cb);
                  }
              });
          });
        }
      });
    },

    function (cb) {   // create a user_role for categories
      logProgress('Creating user_roles for categories: ');
      var userRoles = [];
      var categoryCreators = {};
      async.each(categories, function (category, cb2) {
        storyCategoryData[category._id] = {name: category.category_name, image: category.image};
        var userRole = {
          resource_id : category._id,
          role_id: roleMap['owner']._id,
          user_id: category.creator,
          type: 'category'
        };
        userRoles.push(userRole);
        categoryCreators[category._id] = category.creator;

        // add admin role for 1/3 categories
        if (_.random(2) == 1) {
          var adminRole = {
            resource_id : category._id,
            role_id: roleMap['admin']._id,
            user_id: users[_.random(0, users.length - 1)]._id,
            type: 'category'
          };
          userRoles.push(adminRole);
        }

        process.stdout.write('.');
        cb2();
      }, function () {
        process.stdout.write('\n');
        var userRoleModel = mongodb.collection('user_role');
        userRoleModel.insert(userRoles, function (err, results) {
          if (err) {
            logProgress('Error on creating user_role for categories:', err);
            cb(err);
          } else {
            logProgress('Created user_roles for categories: '+results.length+'\n');
            var stories = [];
            logProgress('Creating stories for category user roles: ');
            async.each(userRoles, function (userRole, cb3) {
                // create story for adding user roles tfor categories
                if(userRole.user_id != categoryCreators[userRole.resource_id]){
                  var story = {
                      timestamp: new Date(),
                      user_id: categoryCreators[userRole.resource_id],
                      action: "Added",
                      item_type: "user",
                      item_id: userRole.user_id,
                      item_name: storyUserData[userRole.user_id].name,
                      item_image: storyUserData[userRole.user_id].imageName,
                      updated_field_type: null,
                      updated_field: null,
                      old_value: null,
                      new_value: null,
                      related_item_type: "category",
                      related_item_id: userRole.resource_id,
                      related_item_name: storyCategoryData[userRole.resource_id].name,
                      related_item_image: storyCategoryData[userRole.resource_id].image
                  };
                  stories.push(story);
                  process.stdout.write('.');
                }
                cb3();
            }, function (err) {
                process.stdout.write('\n');
                if (err) {
                  logProgress('Error on creating stories ' + JSON.stringify(err));
                  cb(err);
                } else {
                  createStories(mongodb, stories, cb);
                }
            });
          }
        });
      })
    },

    function (cb) {   // create a random number of boards per categories
      logProgress('Creating boards: ');
      var boardModel = mongodb.collection('board');
      var index = 0;
      async.eachSeries(categories, function (category, cb2) {
        var num = _.random(dataConfig.minBoards, dataConfig.maxBoards);
        var range = _.range(num);
        var catBoards = [];
        async.each(range, function (n, cb3) {
          var imageName = dataConfig.boardPrefix + 'board-' + index + '.png';
          var imagePath = path.join(__dirname, dataConfig.imageFolder + '/boards/' + imageName);
          var tmbImagePath = path.join(__dirname, dataConfig.imageFolder + '/boards/thumb/' + imageName);
          var boardIndex = index ++;

          getRandomUserByRoles(mongodb, category, 'category', ['owner', 'admin'], function (err, userId) {
            if (err) {
              cb3(err);
            }

            var board = {
              board_name: dataConfig.boardPrefix + 'Board ' + boardIndex,
              description: dataConfig.boardPrefix + 'board description ' + boardIndex,
              category_id: category._id,
              timestamp: new Date(),
              locked: 0,
              cost: 1,
              creator: userId,
              image: imageName
            };

            var imageUrl = randomImageUrls[index % randomImageUrls.length];
            request.get({url: imageUrl, encoding: 'binary'}, function (err, response, body) {
              if (err) {
                console.log(err, imageUrl);
                return cb3(err);
              }

              //console.log('pin image stream is done');
              fs.writeFile(imagePath, body, 'binary', function (err) {
                if (err) return cb3(err);

                var tmb_rez_opt = {
                  srcPath: imagePath,
                  dstPath: tmbImagePath,
                  width: 120, // width of image
                  height: 120 // height of image
                };
                im.resize(tmb_rez_opt, function (err, stdout, stderr) {
                  if (err) return cb3(err);

                  catBoards.push(board);
                  cb3();
                });
              });
            });
          });

        }, function (err) {
          if (err) {
            cb2(err);
          } else {
            boardModel.insert(catBoards, function (err, results) {
              if (err) return cb2(err);

              boards = boards.concat(results);
              process.stdout.write(getDots(results.length));
              cb2();
            });
          }
        });

      }, function (err) {
        process.stdout.write('\n');
        if (err) {
          logProgress('Error on creating boards:', err);
          cb(err);
        } else {
          logProgress('Created boards: '+boards.length+'\n');
          var stories = [];
          logProgress('Creating stories for boards: ');
          async.each(boards, function (board, cb3) {
              // create story for adding boards
              var story = {
                  timestamp: board.timestamp,
                  user_id: board.creator,
                  action: "Created",
                  item_type: "board",
                  item_id: board._id,
                  item_name: board.board_name,
                  item_image: board.image,
                  updated_field_type: null,
                  updated_field: null,
                  old_value: null,
                  new_value: null,
                  related_item_type: "category",
                  related_item_id: board.category_id,
                  related_item_name: storyCategoryData[board.category_id].name,
                  related_item_image: storyCategoryData[board.category_id].image
              };
              stories.push(story);
              process.stdout.write('.');
              cb3();
          }, function (err) {
              process.stdout.write('\n');
              if (err) {
                logProgress('Error on creating stories ' + JSON.stringify(err));
                cb(err);
              } else {
                createStories(mongodb, stories, cb);
              }
          });
        }
      });
    },

    function (cb) {   // create a user_role for boards
      logProgress('Creating user_roles for boards: ');
      var userRoles = [];
      var boardCreators = {};
      async.each(boards, function (board, cb2) {
        storyBoardData[board._id] = {name: board.board_name, image: board.image};
        var userRole = {
          resource_id : board._id,
          role_id: roleMap['owner']._id,
          user_id: board.creator,
          type: 'Board'
        };
        userRoles.push(userRole);
        boardCreators[board._id] = board.creator;

        // add contributor role for 1/3 categories
        if (_.random(2) == 1) {
          var adminRole = {
            resource_id : board._id,
            role_id: roleMap['contributor']._id,
            user_id: users[_.random(0, users.length - 1)]._id,
            type: 'board'
          };
          userRoles.push(adminRole);
        }
        process.stdout.write('.');
        cb2();
      }, function () {
        process.stdout.write('\n');
        var userRoleModel = mongodb.collection('user_role');
        userRoleModel.insert(userRoles, function (err, results) {
          if (err) {
            logProgress('Error on creating user_role for boards:', err);
            cb(err);
          } else {
            logProgress('Created user_roles for boards: '+results.length+'\n');
            var stories = [];
            logProgress('Creating stories for board user roles: ');
            async.each(userRoles, function (userRole, cb3) {
                // create story for adding user roles for boards
                if(userRole.user_id != boardCreators[userRole.resource_id]){
                  var story = {
                      timestamp: new Date(),
                      user_id: boardCreators[userRole.resource_id],
                      action: "Added",
                      item_type: "user",
                      item_id: userRole.user_id,
                      item_name: storyUserData[userRole.user_id].name,
                      item_image: storyUserData[userRole.user_id].imageName,
                      updated_field_type: null,
                      updated_field: null,
                      old_value: null,
                      new_value: null,
                      related_item_type: "board",
                      related_item_id: userRole.resource_id,
                      related_item_name: storyBoardData[userRole.resource_id].name,
                      related_item_image: storyBoardData[userRole.resource_id].image
                  };
                  stories.push(story);
                  process.stdout.write('.');
                }
                cb3();
            }, function (err) {
                process.stdout.write('\n');
                if (err) {
                  logProgress('Error on creating stories ' + JSON.stringify(err));
                  cb(err);
                } else {
                  createStories(mongodb, stories, cb);
                }
            });
          }
        });
      })
    },

    function (cb) { // create a random number of pins per board
      logProgress('Creating pins: ');
      var pinsModel = mongodb.collection('pins');
      var index = 0;
      async.eachSeries(boards, function (board, cb2) {
        var num = _.random(dataConfig.minPins, dataConfig.maxPins);
        var range = _.range(num);
        var boardPins = [];
        async.each(range, function (n, cb3) {
          var imageName = dataConfig.pinPrefix + 'pin-' + index + '.png';
          var imagePath = path.join(__dirname, dataConfig.imageFolder + '/pins/images/' + imageName);
          var smallImagePath = path.join(__dirname, dataConfig.imageFolder + '/pins/images/small/' + imageName);
          var tmbImagePath = path.join(__dirname, dataConfig.imageFolder + '/pins/images/thumb/' + imageName);
          var pinIndex = index ++;

          getRandomUserByRoles(mongodb, board, 'board', ['owner', 'contributor'], function (err, userId) {
            if (err) {
              cb3(err);
            }

            var pinType = PIN_TYPES[_.random(0, PIN_TYPES.length - 1)];
            var pin = {
              board_id: board._id,
              pin_type: pinType,
              description: dataConfig.pinPrefix + 'pin description ' + pinIndex,
              time: new Date(),
              blocked: 0,
              user_id: board.creator
            };

            var imageUrl = randomImageUrls[index % randomImageUrls.length];
            request.get({url: imageUrl, encoding: 'binary'}, function (err, response, body) {
              if (err) {
                console.log(err, imageUrl);
                return cb3(err);
              }

              fs.writeFile(imagePath, body, 'binary', function (err) {
                if (err) return cb3(err);

                var small_rez_opt = {
                  srcPath: imagePath,
                  dstPath: smallImagePath,
                  width: 300 // width of small image
                };
                im.resize(small_rez_opt, function (err, stdout, stderr) {
                  if (err) return cb3(err);
                  var tmb_rez_opt = {
                    srcPath: imagePath,
                    dstPath: tmbImagePath,
                    width: 120, // width of image
                    height: 120 // height of image
                  };
                  im.resize(tmb_rez_opt, function (err, stdout, stderr) {
                    if (err) return cb3(err);

                    if (pinType === 'image') {
                        pin.image_name = [imageName];
                        pin.tmb_image_name = [imageName];
                        pin.image_width = dataConfig.imageWidth;

                        // Make some of them PDS pins
                        var pds_toss = _.random(0, 100);
                        if (pds_toss > 70) {
                            pin.metadata = {
                            "id" : index,
                            "name" : "M141679105RE"+index,
                            "mission_id" : index,
                            "image_path" : "http://lroc.sese.asu.edu/data/LRO-L-LROC-2-EDR-V1.0/LROLRC_0005/DATA/SCI/2010287/NAC/M141679105RE.IMG",
                            "date" : new Date(),
                            "center_longitude" : 269.37,
                            "center_latitude" : 9.960000000000001,
                            "illumination" : null,
                            "camera_angle" : 162.82,
                            "camera_type" : "LROC_LEFT",
                            "product_type" : "EDRNAC",
                            "camera_spec" : "NAC",
                            "pds" : true,
                            "completed" : false
                            };
                        }

                    } else if (pinType === 'url_image') {
                      var url = URLS[_.random(0, URLS.length - 1)];
                      pin.image_name = [imageName];
                      pin.tmb_image_name = [imageName];
                      pin.image_width = dataConfig.imageWidth;
                      pin.pin_url = url;
                      pin.source_url = url;
                    } else if (pinType === 'web_page') {
                      var url = URLS[_.random(0, URLS.length - 1)];
                      pin.image_name = imageName;
                      pin.pin_url = url;
                      pin.source_url = url;
                    } else {
                      console.log('Unknown pin_type:', pinType);
                      return cb3();
                    }
                    boardPins.push(pin);
                    cb3();

                  });
                });
              });
            });
          });
        }, function (err) {
          if (err) {
            cb2(err);
          } else {
            if (boardPins.length > 0) {
              pinsModel.insert(boardPins, function (err, results) {
                if (err) return cb2(err);

                pins = pins.concat(results);
                process.stdout.write(getDots(results.length));
                cb2();
              });
            } else {
              cb2();
            }
          }
        });

      }, function (err) {
        process.stdout.write('\n');
        if (err) {
          logProgress('Error on creating pins:', err);
          cb(err);
        } else {
          logProgress('Created pins: '+pins.length+'\n');
          var stories = [];
          logProgress('Creating stories for pins: ');
          async.each(pins, function (pin, cb3) {
              storyPinData[pin._id] = {
                  name: pin.description, 
                  image: Array.isArray(pin.image_name) ? pin.image_name[0] : pin.image_name, user_id: pin.user_id,
                  board_id: pin.board_id,
                  board_name: storyBoardData[pin.board_id].name,
                  board_image: storyBoardData[pin.board_id].image
              }
              // create story for adding pins
              var story = {
                  timestamp: pin.time,
                  user_id: pin.user_id,
                  action: "Created",
                  item_type: "pin",
                  item_id: pin._id,
                  item_name: pin.description,
                  item_image: Array.isArray(pin.image_name) ? pin.image_name[0] : pin.image_name,
                  updated_field_type: null,
                  updated_field: null,
                  old_value: null,
                  new_value: null,
                  related_item_type: "board",
                  related_item_id: pin.board_id,
                  related_item_name: storyBoardData[pin.board_id].name,
                  related_item_image: storyBoardData[pin.board_id].image
              };
              stories.push(story);
              process.stdout.write('.');
              cb3();
          }, function (err) {
              process.stdout.write('\n');
              if (err) {
                logProgress('Error on creating stories ' + JSON.stringify(err));
                cb(err);
              } else {
                createStories(mongodb, stories, cb);
              }
          });
        }
      });
    },

    function (cb) {   // create a random number of pin_likes per pin
      logProgress('Creating pin likes: ');
      var pinLikeCount = 0;
      var pinLikeModel = mongodb.collection('pin_like');
      async.each(pins, function (pin, cb2) {
        var num = _.random(dataConfig.minPinLikes, dataConfig.maxPinLikes);
        var pinLikes = [];
        async.times(num, function (n, cb3) {
          var pinLike = {
            pin_id: pin._id,
            user_id: users[_.random(0, users.length - 1)]._id,
            timestamp: new Date()
          };
          pinLikes.push(pinLike);
          cb3();

        }, function (err) {
          if (err) {
            cb2(err);
          } else {
            pinLikeModel.insert(pinLikes, function (err, results) {
              if (results && results.length > 0) {
                pinLikeCount += results.length;
                pinlikesResults = pinlikesResults.concat(results);
              }
              process.stdout.write(getDots(results.length));
              
              cb2(err);
            });
          }
        });

      }, function (err) {
        process.stdout.write('\n');
        if (err) {
          logProgress('Error on creating pin likes:', err);
          cb(err);
        } else {
          logProgress('Created pin likes: '+pinLikeCount+'\n');
          var stories = [];
          logProgress('Creating stories for pin likes: ');
          async.each(pinlikesResults, function (pinLike, cb3) {
              // create story for liking pins
              var story = {
                  timestamp: pinLike.timestamp,
                  user_id: pinLike.user_id,
                  action: "Liked",
                  item_type: "pin",
                  item_id: pinLike.pin_id,
                  item_name: storyPinData[pinLike.pin_id].name,
                  item_image: storyPinData[pinLike.pin_id].image,
                  updated_field_type: null,
                  updated_field: null,
                  old_value: null,
                  new_value: null,
                  related_item_type: null,
                  related_item_id: null,
                  related_item_name: null,
                  related_item_image: null
              };
              stories.push(story);
              process.stdout.write('.');
              cb3();
          }, function (err) {
              process.stdout.write('\n');
              if (err) {
                logProgress('Error on creating stories ' + JSON.stringify(err));
                cb(err);
              } else {
                createStories(mongodb, stories, cb);
              }
          });
        }
      });
    },

    function (cb) {   // randomly generate repin
      logProgress('Creating repin: ');
      var repinCount = 0;
      var pinModel = mongodb.collection('pins');
      var repinModel = mongodb.collection('repin');
      async.each(pins, function (pin, cb2) {
        var toss = _.random(0, 100);
        if (toss > 70) {    // repin only 30%
          var sourcePinId = pin._id.valueOf();

          var num = _.random(dataConfig.minRepins, dataConfig.maxRepins);
          async.times(num, function (n, cb3) {
            delete pin._id;
            // create new pin
            pin.description = 're-' + pin.description;
            pinModel.insert(pin, function (err, results) {
              if (err) return cb3();

              var newPin = results[0];

              // create a repin
              var repin = {
                pin_id: newPin._id,
                parent_pin_id: sourcePinId,
                source_pin_id: sourcePinId,
                level: 0,
                timestamp: new Date()
              };
              repinModel.insert(repin, function (err, results) {
                repinCount++;
                repins = repins.concat(results);
                process.stdout.write('.');
                cb3();
              });
            });
          }, cb2);
        } else {
          cb2();
        }

      }, function (err) {
        process.stdout.write('\n');
        if (err) {
          logProgress('Error on creating repins:', err);
          cb(err);
        } else {
          logProgress('Created repins: '+repinCount+'\n');
          var stories = [];
          logProgress('Creating stories for repins: ');
          async.each(repins, function (repin, cb3) {
              // create story for repinning pins
              var story = {
                  timestamp: repin.timestamp,
                  user_id: storyPinData[repin.source_pin_id].user_id,
                  action: "Repined",
                  item_type: "pin",
                  item_id: repin.source_pin_id,
                  item_name: storyPinData[repin.source_pin_id].name,
                  item_image: storyPinData[repin.source_pin_id].image,
                  updated_field_type: null,
                  updated_field: null,
                  old_value: null,
                  new_value: null,
                  related_item_type: "board",
                  related_item_id: storyPinData[repin.source_pin_id].board_id,
                  related_item_name: storyPinData[repin.source_pin_id].board_name,
                  related_item_image: storyPinData[repin.source_pin_id].board_image
              };
              stories.push(story);
              process.stdout.write('.');
              cb3();
          }, function (err) {
              process.stdout.write('\n');
              if (err) {
                logProgress('Error on creating stories ' + JSON.stringify(err));
                cb(err);
              } else {
                createStories(mongodb, stories, cb);
              }
          });
        }
      });
    }

  ], function (err) {
    if (err) {
      logProgress('Failed to create test data with error:', err);
    } else {
      logProgress('Created test data in database successfully\n');
    }
    if (callback) {
      callback(err);
    }
  });
}
