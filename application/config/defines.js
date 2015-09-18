/* 
 * Defines.
 * Add defines here
 * 
 * @version 1.0
 * @author Robin <robin@cubettech.com>
 * @Date 23-10-2013
 */
var path = require('path');

module.exports = global.DEFINES = {
    IMAGE_PATH: sleekConfig.siteUrl + '/pins/images/',
    IMAGE_PATH_REL: path.join(appPath , '/uploads/pins/images/'),
    IMAGE_PATH_ORIGINAL: sleekConfig.siteUrl + '/pins/images/',
    IMAGE_PATH_ORIGINAL_REL: path.join(appPath , '/uploads/pins/images/'),
    IMAGE_PATH_SMALL: sleekConfig.siteUrl + '/pins/images/small/',
    IMAGE_PATH_SMALL_REL: path.join(appPath , '/uploads/pins/images/small/'),
    IMAGE_PATH_THUMB: sleekConfig.siteUrl + '/pins/images/thumb/',
    IMAGE_PATH_THUMB_REL: path.join(appPath ,'/uploads/pins/images/thumb/'),
    AUDIO_PATH: sleekConfig.siteUrl + '/pins/audio/',
    AUDIO_PATH_REL: path.join(appPath, '/uploads/pins/audio/'),
    VIDEO_PATH: sleekConfig.siteUrl + '/pins/videos/',
    VIDEO_PATH_REL: path.join(appPath, '/uploads/pins/videos/'),
    PDF_PATH_IMAGE: sleekConfig.siteUrl + '/pins/images/',
    PDF_PATH_REL: path.join(appPath, '/uploads/pins/pdfs/'),
    USER_IMAGE_PATH: path.join(appPath ,'/uploads/user_images/'),
    USER_IMAGE_WIDTH:'140',
    FB_APP_ID : "FB_APP_ID",
    FB_APP_SECRET : "FB_APP_SECRET",
    TW_CONS_KEY : "TWITTER_CONSUMER_KEY",
    TW_CONS_SECRET : "TWITTER_CONSUMER_SECRET",
    TW_LOGIN : true,
    FB_LOGIN : true,
    DISQUS_SHORTNAME : "DISQUS_SHORTNAME",
    DISQUS_API_SECRET_KEY : "DISQUS_API_SECRET_KEY",
    DISQUS_API_PUBLIC_KEY : "DISQUS_API_PUBLIC_KEY",

}
 //Last updated by admin user on Mon Jun 22 2015 08:37:17 GMT+0300 (EEST)
