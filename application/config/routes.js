/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/* 
 * Routes.
 * Add your routes here
 *
 * Changes in version 1.1 (Myyna NodeJS Roles and Users Update):
 * - added the following routes: addcategory, manage_users, get_users, add_user_role,
 * delete_user_role, category_action, categories
 *
 * Changes in version 1.2 (Myyna Activity and Timeline Features):
 * - added the following routes: timeline, manage_users, get_next_timeline_items, save_comment_story
 *
 * Changes in version 1.3 (Myyna Web Application Search Improvement):
 * - added the following routes: search (POST), searchkeys, searchvalues
  *
 * Changes in version 1.4 (Myyna [Bug Bounty]):
 * - added route nextcategories
 *
 * @version 1.4
 * @author Robin <robin@cubettech.com>, MonicaMuranyi
 * @Date 23-10-2013
 */
var path = require('path');
exports.routes  = [
    {route: '/', controller: 'user', action: 'login', fn: 'userLoginPreCheck'},
    {route: '/logout', controller: 'user', action: 'logout'},
    {route: '/login', controller: 'user', action: 'login', fn: 'userLoginPreCheck'},
    {route: '/socialsignup', controller: 'user', action: 'socialsignup'},
    {route: '/logincheck', controller: 'user', action: 'logincheck', type: 'POST'},
    {route: '/signup', controller: 'user', action: 'signup'},
    {route: '/userlist', controller: 'user', action: 'userList', fn: 'login_validate'},
    {route: '/auth', controller: 'user', action: 'auth'},
    {route: '/twittersignup', controller: 'user', action: 'twittersignup'},
    {route: '/twitterauth', controller: 'user', action: 'twitterauth'},
    {route: '/usersignup', controller: 'user', action: 'usersignup', type: 'POST'},
    {route: '/twitteruser', controller: 'user', action: 'twitteruser', type: 'POST'},
    {route: '/verify', controller: 'user', action: 'mailVerification', params:[':mail', ':id']},
    {route: '/closeSignup', controller: 'user', action: 'closeSignup'},
    {route: '/settings', controller: 'user', action: 'Settings', fn: 'login_validate'},
    {route: '/changesettings', controller: 'user', action: 'changeSettings', type: 'POST', fn: 'login_validate'},
    {route: '/followuser', controller: 'user', action: 'followUser', type: 'POST', fn: 'login_validate'},
    {route: '/unFollowuser', controller: 'user', action: 'unFollowUser', type: 'POST', fn: 'login_validate'},
    {route: '/forgotaction', controller: 'user', action: 'forgotaction', type: 'POST'},
    {route: '/socialshare', controller: 'user', action: 'socialShare'},
    {route: '/uservalidation', controller: 'user', action: 'userNameChack', type: 'POST'},
    {route: '/emailvalidation', controller: 'user', action: 'EmailValidation', type: 'POST'},
    {route: '/search', controller: 'search', action: 'getSearch'},
    {route: '/search', controller: 'search', action: 'search', type: 'POST'},
    {route: '/searchkeys', controller: 'search', action: 'getSearchKeys'},
    {route: '/searchvalues', controller: 'search', action: 'getSearchValues', type: 'POST'},
   
    
    {route: '/webpins', controller: 'pin', action:'webpin',fn:'login_validate'},
    {route: '/pinpage', controller: 'pin', action:'pins', type:'POST',fn:'login_validate'},
    {route: '/nextpage', controller: 'pin', action:'morepins',type:'POST',params:[':list']},
    {route: '/pinlike', controller: 'pin', action:'pinLike',type:'POST',fn:'login_validate'},
    {route: '/pinunlike', controller: 'pin', action:'pinUnlike',type:'POST',fn:'login_validate'},
    {route: '/createcomment', controller: 'pin', action:'createComment',type:'POST'},
    {route: '/screenshot', controller: 'pin', action:'screenshot', type:'POST'},
    {route: '/pins', controller: 'pin', action:'list'},
    {route: '/mostrepin', controller: 'pin', action:'mostRepin', fn:'login_validate'},
    {route: '/mostlike', controller: 'pin', action:'mostLike', fn:'login_validate'},
    {route: '/repin', controller: 'pin', action:'repin', type:'POST',fn:'login_validate'},
    {route: '/repinload', controller: 'pin', action:'repinload',params:[':pid'],fn:'login_validate'},
    {route: '/report', controller: 'pin', action:'report', type:'POST',fn:'login_validate'},
    {route: '/reportload', controller: 'pin', action:'reportPinLoad',params:[':pid'],fn:'login_validate'},
    {route: '/removeNotification', controller: 'pin', action:'removeNotification',fn:'login_validate'},
    {route: '/timeline', controller: 'timeline', action:'showTimeline', fn:'login_validate'},
//    {route: '/sharepinload', controller: 'pin', action:'sharePinLoad'},
//    {route: '/sharepin', controller: 'pin', action:'InitialshareSave', type:'POST'},
//    {route: '/imagelist', controller: 'pin', action:'imageList', type:'POST'},
//    {route: '/loadPins', controller: 'pin', action:'loadThirdpartyShare',fn:'login_validate',params:[':share_id']},
//    
    {route: '/addpin', controller: 'image_upload', action:'addpin', fn:'login_validate'},
    {route: '/post_url', controller: 'urlfetch', action:'post_url', type: 'POST'},
    {route: '/select_action', controller: 'urlfetch', action:'select_action', type: 'POST'},
    {route: '/pin_action', controller: 'urlfetch', action:'pin_action', type: 'POST'},
    {route: '/webpinspage', controller: 'webpin', action:'webpin', fn:'name1'},
    {route: '/image_upload', controller: 'image_upload', action:'browse_image',fn:'login_validate'},
    {route: '/upload_action', controller: 'image_upload', action:'upload_action',type: 'POST'},
    {route: '/addcategory', controller: 'category', action: 'category_form', fn:'login_validate'},
    {route: '/addboard', controller: 'board', action: 'board_form', fn:'login_validate'},
    {route: '/user/edit', controller: 'user', action: 'editUser', fn:'login_validate'},
    {route: '/user/edit/lookup', controller: 'user', action: 'editUserLookups', params: [':type']},
    {route: '/user/update', controller: 'user', action: 'updateUser', type: 'POST', fn:'login_validate'},
    {route: '/manage_users', controller: 'user_roles', action: 'user_roles_form', params: [':type', ':resid'], fn:'login_validate'},
    {route: '/get_users', controller: 'user_roles', action: 'get_users', params: [':type', ':resid'], fn:'login_validate'},
    {route: '/add_user_role', controller: 'user_roles', action: 'add_user_role', type: 'POST', fn:'login_validate'},
    {route: '/delete_user_role', controller: 'user_roles', action: 'delete_user_role', params: [':id'], fn:'login_validate'},
    {route: '/category_action', controller: 'category', action: 'category_action', type: 'POST', fn:'login_validate'},
    {route: '/board_action', controller: 'board', action: 'board_action', type: 'POST', fn:'login_validate'},
    {route: '/categories', controller: 'category', action: 'categoryList'},
    {route: '/boards', controller: 'board', action: 'boardList'},
    {route: '/nextboards', controller: 'board', action: 'moreBoards', type: 'POST', params: [':view']},
    {route: '/nextcategories', controller: 'category', action: 'moreCategories', type: 'POST', params: [':view']},
    {route: '/followboard', controller: 'board', action: 'followBoard', type: 'POST', fn:'login_validate'},
    {route: '/unfollowboard', controller: 'board', action: 'unFollowBoard', type: 'POST'},
    {route: '/category', controller: 'pin', action: 'listByCategory', params: [':catid', ':resid']},
    {route: '/board', controller: 'pin', action: 'listByBoard', params: [':bid']},
    {route: '/user', controller: 'pin', action: 'listByUser', params: [':uid', ':bid'], fn: 'login_validate'},
    {route: '/pin', controller: 'pin', action: 'popup', params: [':pid', ':popup']},
    {route: '/pdfview', controller: 'pin', action: 'pdfview', params: [':pdfid']},
    {route: '/upin_nxtpg', controller: 'pin', action: 'more_userpins', type: 'POST'},
    {route: '/nextboardpins', controller: 'pin', action: 'morePinsByBoard', type: 'POST'},
    {route: '/nextdomainpins', controller: 'pin', action:'morePinsByDomain',type:'POST'},
    {route: '/get_next_timeline_items', controller: 'timeline', action: 'getNextTimelineItems', params: [':restart', ':pageType', ':resourceId'], fn:'login_validate'},
    {route: '/save_comment_story', controller: 'pin', action: 'saveCommentStory', fn:'login_validate',  type: 'POST'},
//    {route: '/sharer', controller: 'pin', action: 'sharejs'},
    {route: '/edit/category', controller: 'category', action: 'renderEditCatForm', params: [':catid'], fn:'login_validate'},
    {route: '/edit/category', controller: 'category', action: 'updateCategory', type: 'POST', params: [':catid'], fn:'login_validate'},
    {route: '/edit/board', controller: 'board', action: 'renderEditBoardForm', params: [':bid'], fn:'login_validate'},
    {route: '/edit/board', controller: 'board', action: 'updateBoard', type: 'POST', params: [':bid'], fn:'login_validate'},
    {route: '/edit/pin', controller: 'pin', action: 'renderEditPinForm', params: [':pid'], fn:'login_validate'},
    {route: '/edit/pin', controller: 'pin', action: 'updatePin', type: 'POST', params: [':pid'], fn:'login_validate'},

    //admin side
    {route: '/admin', controller: path.join('','admin/adminuser'), action: 'login', fn: 'adminLoginPreCheck'},
    {route: '/admin/adminauth', controller: path.join('','admin/adminuser'), action: 'adminAuth', type: 'POST'},
    {route: '/admin/dashboard', controller: path.join('','admin/adminuser'), action: 'dashboard', fn: 'adminLoginCheck'},
    {route: '/admin/logout', controller: path.join('','admin/adminuser'), action: 'logout'},
    {route: '/admin/viewadmins', controller: path.join('','admin/adminuser'), action: 'viewAdminUsers', fn: 'adminLoginCheck'},
    {route: '/admin/addadmin', controller: path.join('','admin/adminuser'), action: 'addAdminUsers', fn: 'adminLoginCheck'},
    {route: '/admin/addadminpost', controller: path.join('','admin/adminuser'), action: 'addAdminUsersPost', fn: 'adminLoginCheck', type: 'POST'},
    {route: '/admin/checkusername', controller: path.join('','admin/adminuser'), action: 'checkUsername', fn: 'adminLoginCheck', params: [':username']},
    {route: '/admin/deleteadmin', controller: path.join('','admin/adminuser'), action: 'deleteAdminUser', fn: 'adminLoginCheck', params: [':id']},
    {route: '/admin/editadmin', controller: path.join('','admin/adminuser'), action: 'editAdminUser', fn: 'adminLoginCheck', params: [':id']},
    {route: '/admin/updateadminuser', controller: path.join('','admin/adminuser'), action: 'updateAdminUsersPost', fn: 'adminLoginCheck', type: 'POST'},
    {route: '/admin/resetpwdadminuser', controller: path.join('','admin/adminuser'), action: 'ResetPassword', fn: 'adminLoginCheck', params: [':id']},
    {route: '/admin/viewusers', controller: path.join('','admin/user'), action: 'viewUsers', fn: 'adminLoginCheck'},
    {route: '/admin/adduser', controller: path.join('','admin/user'), action: 'addUsers', fn: 'adminLoginCheck'},
    {route: '/admin/adduserpost', controller: path.join('','admin/user'), action: 'addUsersPost', fn: 'adminLoginCheck', type: 'POST'},
    {route: '/admin/ucheckusername', controller: path.join('','admin/user'), action: 'checkUsername', fn: 'adminLoginCheck', params: [':username']},
    {route: '/admin/deleteuser', controller: path.join('','admin/user'), action: 'deleteUser', fn: 'adminLoginCheck', params: [':id']},
    {route: '/admin/edituser', controller: path.join('','admin/user'), action: 'editUser', fn: 'adminLoginCheck', params: [':id']},
    {route: '/admin/updateuser', controller: path.join('','admin/user'), action: 'updateUsersPost', fn: 'adminLoginCheck', type: 'POST'},
    {route: '/admin/blockuser', controller: path.join('','admin/user'), action: 'blockUser', fn: 'adminLoginCheck', params: [':type', ':id']},
    {route: '/admin/resetpwduser', controller: path.join('','admin/user'), action: 'ResetPassword', fn: 'adminLoginCheck', params: [':id']},
    {route: '/admin/blockedusers', controller: path.join('','admin/user'), action: 'blockedUsers', fn: 'adminLoginCheck'},
    {route: '/admin/general-settings', controller: path.join('','admin/settings'), action: 'general', fn: 'adminLoginCheck'},
    {route: '/admin/update-general-settings', controller: path.join('','admin/settings'), action: 'updateGeneral', fn: 'adminLoginCheck', type: 'POST'},
    {route: '/admin/disqus-settings', controller: path.join('','admin/settings'), action: 'disqus', fn: 'adminLoginCheck'},
    {route: '/admin/update-disqus-settings', controller: path.join('','admin/settings'), action: 'updateDisqus', fn: 'adminLoginCheck', type: 'POST'},
    {route: '/admin/social-settings', controller: path.join('','admin/settings'), action: 'social', fn: 'adminLoginCheck'},
    {route: '/admin/update-social-settings', controller: path.join('','admin/settings'), action: 'updateSocial', fn: 'adminLoginCheck', type: 'POST'},
    {route: '/admin/viewpins', controller: path.join('','admin/pins'), action: 'viewPins', fn: 'adminLoginCheck'},
    {route: '/admin/deletepin', controller: path.join('','admin/pins'), action: 'deletePin', fn: 'adminLoginCheck', params: [':id']},
    {route: '/admin/blockpin', controller: path.join('','admin/pins'), action: 'blockPin', fn: 'adminLoginCheck', params: [':type', ':id']},
    {route: '/admin/blockedpins', controller: path.join('','admin/pins'), action: 'blockedPins', fn: 'adminLoginCheck'},
    {route: '/admin/cleanpin', controller: path.join('','admin/pins'), action: 'cleanPin', fn: 'adminLoginCheck', params: [':id']},
    {route: '/admin/reportedpins', controller: path.join('','admin/pins'), action: 'reportedPins', fn: 'adminLoginCheck'},
    {route: '/admin/addboard', controller: path.join('','admin/pins'), action: 'addBoard', fn: 'adminLoginCheck'},
    {route: '/admin/editboard', controller: path.join('','admin/pins'), action: 'addBoard', fn: 'adminLoginCheck', params: [':id']},
    {route: '/admin/addboardpost', controller: path.join('','admin/pins'), action: 'addBoardPost', fn: 'adminLoginCheck', type: 'POST'},
    {route: '/admin/viewboards', controller: path.join('','admin/pins'), action: 'showBoards', fn: 'adminLoginCheck'},
    {route: '/admin/lockboard', controller: path.join('','admin/pins'), action: 'LockBoard', fn: 'adminLoginCheck', params: [':type', ':id']},
    {route: '/admin/deleteboard', controller: path.join('','admin/pins'), action: 'deleteBoard', fn: 'adminLoginCheck', params: [':id']},
    {route: '/admin/addcategory', controller: path.join('','admin/pins'), action: 'addCategory', fn: 'adminLoginCheck'},
    {route: '/admin/editcategory', controller: path.join('','admin/pins'), action: 'addCategory', fn: 'adminLoginCheck', params: [':id']},
    {route: '/admin/addcategoyrpost', controller: path.join('','admin/pins'), action: 'addCategoryPost', fn: 'adminLoginCheck', type: "POST"},
    {route: '/admin/viewcategories', controller: path.join('','admin/pins'), action: 'showCategories', fn: 'adminLoginCheck'},
    {route: '/admin/deletecategory', controller: path.join('','admin/pins'), action: 'deleteCategory', fn: 'adminLoginCheck', params: [':id']},
    {route: '/admin/pinpagination', controller: path.join('','admin/pins'), action: 'pinPagination',params: [':blocktype']}
    
]

exports.commonRouteFunctions = ['DefineLocals'];

