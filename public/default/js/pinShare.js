var request=null;
$(document).ready(function() {
    $('#webpage').hide();
    $('.cubet_share_image').hide();
    $('.common-share').hide();
    
var send_url = window.location.href;
var current_url = send_url.split(/\?(.+)?/)[1];
if(current_url && typeof(current_url) != 'undefined') {
    current_url = current_url.split('u=');
    var shared_url = current_url[1];
} 
$('#initialform').on('click', '.sharepin', function() {

 
        if($(".cubet_share_image input:checkbox").length!=0 && $(".cubet_share_image ").css('display')=='block'){
        
            if ($(".cubet_share_image input:checkbox:checked").length > 0){
                // any one is checked
                if ($(".cubet_share_image input:checkbox:checked").length > 4){
                    alert('Maximum 4 images.');
                    $(".errmsg").text("Maximum 4 images.");
                    return false;
                }
                else{
                    var ar = [];
                    $("input.img_chkbox:checkbox:checked").each(function(){
                        ar.push($(this).val());
                    });
                   
                }
            } else {
               // nothing checked
               //alert('You must select atleast one image.');
               $(".errmsg").text("You must select atleast one image.");
               return false;
            }
        }
   
    
if(shared_url && typeof(shared_url) != 'undefined'){
    var url = shared_url;
}
else{
  var url =  document.referrer;
}
 //  var url ="https://soundcloud.com/vaughan-1-1/the-last-podcast-of-2013";
   
     
    var type = $('#pin_type').val();
   
    $.ajax({
        url: '/sharepin',
        data: {'url': url,'image':ar,'type':type},
        dataType: 'json',
        type: 'post',
        success: function(data) {
          
            if (data.pin_url) {                
                window.localStorage.setItem('cubetSharepinId', data._id);
                window.location.href = '/loadPins/'+data._id;
            }

        },
        error: function(jqxhr, status, error) {
//alert(error);
        }
    });
}
);

//share pin screen shot
if ($('#sharepin_screenshot').length > 0) {

   if(shared_url && typeof(shared_url) != 'undefined'){
    var url = shared_url;
}
else{
  var url =  document.referrer;
}
  // var url ="https://soundcloud.com/vaughan-1-1/the-last-podcast-of-2013";
   
 $('#loading_web').css({'display':'block'});
    request = $.ajax({
        url: '/screenshot',
        data: {"pageurl": url},
        type: 'post',
        dataType: 'json',
        success: function(data) {

        $('#loading_web').css({'display':'none'});
        $('.common-share').show();
            $('#webpage').show();
            $('.cubet_share_image').hide();
            $("#webpage").attr("src", "/pins/images/temp/" + data.image);

        },
        error: function(jqxhr, status, error) {
            $('#loading_web').css({'display':'none'});
//                        alert('e' + error);
        }
    });

}

$('#pin_type').change(function(){
    $('.cubet_share_image').hide();
    $('#webpage').hide();
    $('.common-share').hide();
    $('#loading_web').show();
    
    if(request) {request.abort();}
    var pitype = $('#pin_type').val();
    
    if(pitype=='image'){
        
     request = $.ajax({
        url: '/imagelist',
        data: {"pageurl": url},
        type: 'post',
       // dataType: 'json',
        success: function(data) {
            $('#loading_web').hide();
            $('.cubet_share_image,.common-share').show();
            $(".cubet_share_image").html(data);
  
        },
        error: function(jqxhr, status, error) {
            $('#loading_web').css({'display':'none'});
                     alert( error);
        }
    });
    }

    else if(pitype=='web_page'){
        $('.common-share').show();
        request = $.ajax({
        url: '/screenshot',
        data: {"pageurl": url},
        type: 'post',
        dataType: 'json',
        success: function(data) {

            $('#loading_web').hide();
            $('#webpage,.common-share').show();
            $("#webpage").attr("src", "/pins/images/temp/" + data.image);

        },
        error: function(jqxhr, status, error) {
            $('#loading_web').hide()
        }
    });
    }
});


});
//
//    
//window.onclose = function() {
//alert(0);
//   var now = new Date();
//    var time = now.getTime();
//    time -= 3600000 ;
//    now.setTime(time);
//    var c_value=escape(1) + "; expires="+now.toGMTString();
//    document.cookie='Cubet_share_pin' + "=" + c_value;
//};

/*
var jq = document.createElement('script');
jq.src = "//ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js";
document.getElementsByTagName('head')[0].appendChild(jq);
// ... give time for script to load, then type.
*/
