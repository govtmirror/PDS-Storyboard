/* 
 * Configuration
 * 
 * @version 1.0
 * @author Robin <robin@cubettech.com>
 * @Date 23-10-2013
 */
var path = require('path'),
    mongodb = require('./mongodb.js');

//port number
global.sleekConfig.appPort = 3000;

global.sleekConfig.appHost = 'localhost';

global.sleekConfig.siteUrl = 'http://localhost:3000';
global.sleekConfig.env = 'development';

//global.sleekConfig.configLibs = [];
//themeing
global.sleekConfig.theme = 'default'
//logging
global.sleekConfig.logToFile = false; // if true, logs will write to file instead of console.
global.sleekConfig.accesslog = path.join('' ,'application/var/logs/access.log'); // logging each access
global.sleekConfig.errorlog = path.join('' ,'application/var/logs/error.log'); // application errors
global.sleekConfig.systemlog = path.join('' ,'application/var/logs/system.log'); // manual logging

global.webpagepath = path.join('' ,"public/webpages");
global.videopath = path.join('' ,"public/videos");
global.user_images = path.join('' ,"public/user_images");
global.loggedUser = new Array();//array to save socket id of logged user
global.pass_salt = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';//salt append with passwordower123

global.sessionConfig.secret = '0123abcABC';//config this secret to a more complex one
global.sessionConfig.storeOptions = {
    ttl: 7 * 24 * 60 * 60, //7 days default is 14 days
    autoRemove: 'native', //default
    url: 'mongodb://'
    + (mongodb.dbUser ? (mongodb.dbUser+':'+mongodb.dbPass+'@'): '')
    + (mongodb.dbHost ? mongodb.dbHost : 'localhost') + ':'
    + (mongodb.dbPort ? config.dbPort : '27017') + '/' + mongodb.dbName
};
