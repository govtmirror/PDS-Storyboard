/* 
 * Pin helper
 * 
 * @package cubetboard
 * @version 2.0
 * @author Arya <arya@cubettech.com>
 * @Date 22-11-2013
 */

/*
 * Send instant notification and mails
 * Log notification details
 */
var path = require('path');
module.exports = {
          
    socketNotification:function(socketid,fun_id,message,userdata,mail) {
        if(mail){
            userdata.mailcontent.logo = sleekConfig.siteUrl + '/' + DEFINES.site_logo;
            var template = system.getCompiledView(path.join('','email/mail'), userdata.mailcontent)
            var mailOptions = {
                from: DEFINES.site_title+"<no-reply@myyna.com>", // sender address
                to: userdata.tomail, // list of receivers
                subject: userdata.subject?  userdata.subject:DEFINES.site_title+" Pin Notification", // Subject line
                html: template // html content
            }
            //send mail
            sendMail(mailOptions, function(error, response){
                if(error){
                    console.log(error);
                } else{
                    console.log("Message sent: " + response.message);
                }
            });
        } else {
            sio.sockets.socket(socketid).emit(fun_id, {'notify_msg':message});
        }
    
     
    }
    
    
    
}
