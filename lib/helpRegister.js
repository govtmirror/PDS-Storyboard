/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/* Handlebars helpers.
 *
 * Changes in version 2.1 (Myyna Web Application List View Update):
 * - added logic to diplay items as list and to add extra information
 *
 * The MIT License (MIT)
 * @version 2.1
 * @author Arya <arya@cubettech.com>, TCSASSEMBLER
 */

var Handlebars = require('handlebars');
var _ = require('underscore');

Handlebars.registerHelper('ifCond', function(v1, v2, options) {
  if(v1 == v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

Handlebars.registerHelper('ObjIfCond', function(v1, v2, options) {
  if(String(v1) == String(v2)) {
    return options.fn(this);
  }
  return options.inverse(this);

});



Handlebars.registerHelper('notifCond', function(v1, v2, options) {
  
  if(v1 != v2) {
    return options.fn(this);
  }
  return options.inverse(this);

});




Handlebars.registerHelper('siteURL', function() {
  return sleekConfig.siteUrl;
});

Handlebars.registerHelper('getDefine', function(name) {
  return DEFINES[name];
});


Handlebars.registerHelper('loginbtn', function(v1, options) {
    if(DEFINES[v1] && (DEFINES[v1] == true || DEFINES[v1] == 'true')) {
        return options.fn(this);
    }
    return options.inverse(this);
});




//display unlike
//Handlebars.registerHelper('pinUnlike', function(v1,v2) {
//    var pinModel = system.getModel('pin');
//    pinModel.pinLikeCheck(v1,v2,function(callback){
//     
//        if(callback)
//        {
//           
//            return 1;
//        }
//        
//        else
//        {
//            return 0;
//        }
//    });
//  //return sleekConfig.siteUrl;
//});
////display like
//Handlebars.registerHelper('pinlike', function(v1,v2) {
//    var pinModel = system.getModel('pin');
//    pinModel.pinLikeCheck(v1,v2,function(callback){
//     
//        if(callback)
//        {
//            
//            return 0;
//        }
//        
//        else
//        {
//            return 1;
//        }
//    });
//  //return sleekConfig.siteUrl;
//});



/** 
*
* @author   :   Rahul P R <rahul.pr@cubettech.com>
* @date     :   31-Oct-2013
*
* returns image(original) stored path
*
**/

Handlebars.registerHelper('imagepathOriginal', function() {
      return DEFINES.IMAGE_PATH_ORIGINAL;
});



/** 
*
* @author   :   Rahul P R <rahul.pr@cubettech.com>
* @date     :   31-Oct-2013
* 
* returns image(small) stored path
*
**/

Handlebars.registerHelper('imagepathSmall', function() {
      return DEFINES.IMAGE_PATH_SMALL;
});

/** 
*
* @author   :   Rahul P R <rahul.pr@cubettech.com>
* @date     :   31-Oct-2013
* 
* returns audio file saved path
*
**/

Handlebars.registerHelper('audioPath', function() {
      return DEFINES.AUDIO_PATH;
});


/** 
*
* @author   :   Rahul P R <rahul.pr@cubettech.com>
* @date     :   31-Oct-2013
* 
* returns video path
*
**/

Handlebars.registerHelper('videoPath', function() {
      return DEFINES.VIDEO_PATH;
});



/** 
*
* @author   :   Rahul P R <rahul.pr@cubettech.com>
* @date     :   31-Oct-2013
*
* returns date from unix timestamp
* 
**/

Handlebars.registerHelper('pinTime', function(UNIX_timestamp) {
  if(UNIX_timestamp==''){
    return 'Time Not Available';
  } else {
    var a = new Date(new Number(UNIX_timestamp)) ;
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date+','+month+' '+year+' '+hour+':'+min+':'+sec ;
    return time;
  }
});

// Get the pin date in MM/dd/YYYY format
Handlebars.registerHelper('pinDate', function(UNIX_timestamp) {
  if(UNIX_timestamp==''){
    return 'Date N/A';
  } else {
    var a = new Date(new Number(UNIX_timestamp)) ;
    var year = a.getFullYear();
    var month = a.getMonth() + 1;
    var date = a.getDate();
    return month + '/' + date + '/' + year ;
  }
});


/** 
*
* @author   :   Rahul P R <rahul.pr@cubettech.com>
* @date     :   01-Nov-2013
*
* returns audio files stored path
*
**/

Handlebars.registerHelper('audioPath', function() {
      return DEFINES.AUDIO_PATH;
});







/** 
*
* @author   :   Rahul P R <rahul.pr@cubettech.com>
* @date     :   01-Nov-2013
*
* check if select data matches with posted dataa
*
**/

Handlebars.registerHelper('sel', function(var1, var2) {
    if(var1 && var2 && var1.toHexString && var2.toHexString && var1.toHexString() == var2.toHexString()){
        return 'selected="selected"';
    }
    if(var1==var2)
      return 'selected="selected"';
      
});

Handlebars.registerHelper('input_type', function(key, val) {
    var number = _.isNumber(val);
    var bool = _.isBoolean(val);
    
    if(key == 'id' || key == 'mission_id'){
        return 'text';
    }else if(number){
        return 'number';
    }else if(bool){
        return 'checkbox';
    }else{
        return 'text';
    }
});

Handlebars.registerHelper('input_val', function(val) {
    var bool = _.isBoolean(val);
    if(bool){
        return '';
    }else if(val === null){
        return 'null';
    }else{
        return val;
    }
});

Handlebars.registerHelper('checked', function(val) {
    var bool = _.isBoolean(val);
    if(bool && val == true){
        return 'checked=checked';
    }
});



Handlebars.registerHelper('ifOr', function(v1, v2, options) {
  var condtions = v2.split(',');
  if(condtions.indexOf(v1) > -1) {
    return options.fn(this);
  }
  return options.inverse(this);

});

Handlebars.registerHelper('toDate', function(timestamp) {
    if(timestamp == undefined){
        return 'Not logged in yet!';
    } else {
        return new Date(timestamp);
    }
});

Handlebars.registerHelper('toDateStr', function(timestamp) {
    if(!timestamp instanceof Date){
        timestamp = new Date(timestamp);
    }
    return timestamp.getMonth()+1+'/'+timestamp.getDate()+'/'+timestamp.getFullYear();
});

// returns substring of description
Handlebars.registerHelper('substr', function(string,length) {
  if(typeof(string)=='string' && string.length!==0) {
    return string.substring(0, length);
  } else {
    return '' ;
  }
});

// Returns substring by words of a given string.
Handlebars.registerHelper('substrByWordLimit', function(string,length) {
  if(typeof(string)=='string' && string.length!==0) {
    var index = string.indexOf(' ', length);
    var trimmedString;
    if(index== -1){
      trimmedString = string;
    } else {
      trimmedString = string.substring(0, index);
    }
    if(trimmedString.length > length && trimmedString.lastIndexOf(" ") > -1) {
      trimmedString = trimmedString.substring(0, trimmedString.lastIndexOf(" "));
    }
    return trimmedString;
  } else {
    return '';
  }
});

// Returns first name.
Handlebars.registerHelper('substrFirstName', function(string) {
  if(typeof(string)=='string' && string.length!==0) {
    if(string.indexOf(' ') > 0) {
      return string.substring(0, string.indexOf(' '));
    } else {
      return string;
    }
  } else {
    return '' ;
  }
});

// Returns last name.
Handlebars.registerHelper('substrLastName', function(string) {
  if(typeof(string)=='string' && string.length!==0) {
    if(string.indexOf(' ') > 0) {
      return string.substring(string.indexOf(' ') + 1);
    } else {
      return '';
    }
  } else {
    return '';
  }
});

// pinblock class
Handlebars.registerHelper('pinBlockClass', function(length) {
   if(DEFINES.site_layout=='fixed') {
        return 'element clearfix' ;
    } else {
        if(parseInt(length) <= 300){
            return 'element clearfix single_colm';
        } else {
            return 'element clearfix two_colm' ;
        }
    }
});


// video class
Handlebars.registerHelper('getVideoHeight', function() {
   if(DEFINES.site_layout=='fixed') {
        return '200' ;
    } else {
        return '300' ;
    }
});


// get count of an array
Handlebars.registerHelper('arrlenGtZero', function(arr,options) {
    if( (arr instanceof Array) && arr.length>0) {
        return options.fn(this);
    }
    return options.inverse(this);
});

// get count of an array
Handlebars.registerHelper('arrlenGtOne', function(arr,options) {
    if( (arr instanceof Array) && arr.length>1) {
        return options.fn(this);
    }
    return options.inverse(this);
});

/**
* @author   :   ARYA S A<arya@cubettech.com>
* @date     :   18-Dec-2013
*
* timestamp to time
**/
Handlebars.registerHelper('timeAgo',function(time){
  var units = [
    { name: "second", limit: 60, in_seconds: 1 },
    { name: "minute", limit: 3600, in_seconds: 60 },
    { name: "hour", limit: 86400, in_seconds: 3600 },
    { name: "day", limit: 604800, in_seconds: 86400 },
    { name: "week", limit: 2629743, in_seconds: 604800 },
    { name: "month", limit: 31556926, in_seconds: 2629743 },
    { name: "year", limit: null, in_seconds: 31556926 }
  ];
  var diff = (new Date() - new Date(time)) / 1000;
  if (diff < 5) {
    return "just now";
  }
  var i = 0;
  while (unit = units[i++]) {
    if (diff < unit.limit || !unit.limit){
      var diff = Math.floor(diff / unit.in_seconds);
      return diff + " " + unit.name + (diff>1 ? "s" : "") + " ago";
    }
  };
});

Handlebars.registerHelper('logbuttonCheck', function(v1,v2, options) {
    console.log(DEFINES[v1]);
    console.log(DEFINES[v2]);
    if((DEFINES[v1] && (DEFINES[v1] == true || DEFINES[v1] == 'true')) || (DEFINES[v2] && (DEFINES[v2] == true || DEFINES[v2] == 'true'))) {
        return options.fn(this);
    }
    return options.inverse(this);
});

// Helper that checks if an element is the last one from an array of multiple elements
Handlebars.registerHelper("isLastElement", function(index, array, options) {
  return array.length > 1 && index == array.length - 1 ? options.fn(this) : options.inverse(this);
});

// Helper that checks if an element is not the first or the last one from an array
Handlebars.registerHelper("isMiddleElement", function(index, array, options) {
  return index != 0 && index != array.length - 1  ? options.fn(this) : options.inverse(this);
});

// Helper that checks if an array has only one element
Handlebars.registerHelper("oneElement", function(array, options) {
  return array.length === 1  ? options.fn(this) : options.inverse(this);
});
// Username split
Handlebars.registerHelper("user_name_break", function(name) {
  return '<span>'+name.split(' ').join('</span><span>')+'</span>';
});
// Image getter from array
Handlebars.registerHelper("listImage", function(val) {
   return val instanceof Array ? val[0] : val;
});
// More powerfull ifCond helper
Handlebars.registerHelper('ifCondAll', function (v1, operator, v2, options) {

    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});
// Math
Handlebars.registerHelper("math", function(lvalue, operator, rvalue, options) {
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);

    return {
        "+": lvalue + rvalue,
        "-": lvalue - rvalue,
        "-1": lvalue - rvalue - 1,
        "*": lvalue * rvalue,
        "/": lvalue / rvalue,
        "%": lvalue % rvalue
    }[operator];
});
