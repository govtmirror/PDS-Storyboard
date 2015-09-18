/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/* Socket interaction script.
 *
 * Changes in version 2.1 (Myyna Web Application List View Update):
 * - added logic to load new / updated items in both the list and grid views
 *
 * The MIT License (MIT)
 * @version 2.1
 * @author Arya <arya@cubettech.com>, TCSASSEMBLER
 */

var socket = io.connect();
jQuery(function() {
    socket.on('connect', function() {
        var user_id = window.localStorage.getItem('cubet_user_id');
        socket.emit('socket_data', user_id);
        var pathname = window.location.pathname;
        // var tpe =  window.location.pathname.replace(/\//g, '');
        var extract = pathname.split('/');
        var tpe = extract[1];
        var id =  extract[2];

        function insertElm(prepTo, html){
            var new_cont = $(html),
                timeline_details = new_cont.find('.timeline_details');

            if(timeline_details.length){
                timeline_details.addClass('highlighting');
                $(prepTo).prepend(new_cont);
            }else{
                new_cont.addClass('highlighting');
                $(prepTo)
                        .prepend(new_cont)
                        .masonry('reload');
                setTimeout(function() {
                    $('#container').masonry('reload');
                }, 500);
            }

            setTimeout(function() {
                if(timeline_details.length){
                    timeline_details.removeClass('highlighting');
                }else{
                    new_cont.removeClass('highlighting');
                }
            }, 5000);

            // New items button show
            if($(window).scrollTop()){
                $('#newItemsBtn').removeClass('hide');
            }
        }

        if (tpe == 'pins' || tpe == 'board' || tpe == 'category' || tpe == 'user') {
            // Pin creation
            socket.on('pageview', function(msg) {
                console.log('pageview', msg);
                //for all pins

                if ((msg.pin_type == 'image' ||
                    msg.pin_type == 'url_image' ||
                    msg.pin_type == 'web_page' ||
                    msg.pin_type == 'pdf') && (tpe == 'pins' || (tpe == 'user' && id==msg.data.user_id) || (tpe == 'category' && id==msg.data.category_id) || (tpe == 'board' && id==msg.data.board_id)))
                {
                    insertElm('#container', msg.str);
                    insertElm('.timeline_contents', msg.listEl);
                    configureTimelineElements($('.timeline_contents').children());
                }
            });
            // Pin edit
            socket.on('pin_update', function(msg) {
                console.log('pin_update', msg);
                $('#container').find('#myCarousel2_'+msg.data._id).parent().remove();
                $('#pin_'+msg.data._id).remove();
                insertElm('#container', msg.str);
                insertElm('.timeline_contents', msg.listEl);
            });
            // Board/cat banner update
            if(tpe == 'board' || tpe == 'category'){
                socket.on('board_update', function(msg){
                    //console.log('board_update', msg);
                    $('#assetName').html(msg.data.board_name);
                    $('#assetDesc').html(msg.data.description);
                    $('#assetImg').replaceWith('<img id="assetImg" src="/boards/'+msg.data.image+'">');
                    $('#board_container').addClass('highlighting');
                    setTimeout(function() {
                        $('#board_container').removeClass('highlighting');
                    }, 5000);
                });
                socket.on('update_cat', function(msg){
                    //console.log('update_cat', msg);
                    $('#assetName').html(msg.data.category_name);
                    $('#assetDesc').html(msg.data.description);
                    $('#assetImg').replaceWith('<img id="assetImg" src="/categories/'+msg.data.image+'">');
                    $('#board_container').addClass('highlighting');
                    setTimeout(function() {
                        $('#board_container').removeClass('highlighting');
                    }, 5000);
                });
            }
        }


        socket.on('notification', function(msg) {
          
            var htm = '<li><a class="notifi_li" href="javascript:void(0);">'+msg.notify_msg+'</a></li>'
            $('.cubet_comment_sub').prepend(htm);
            $('.cubet_commment').addClass('select');
            $('#new_notify').parent('li').remove();
            $('#comment_section').removeClass('glyphicon-comment');   
            var comment_count = $("#comment_section").text();
            if(!comment_count)
            {
                comment_count =0;
            }
            
            var newcount = parseInt(comment_count)+parseInt(1);
            $("#comment_section").text(newcount);
        });

        if(tpe == 'boards'){
            // New board
            socket.on('board_item', function(msg){
                console.log('board_item', msg);
                insertElm('#container', msg.gridEl);
                insertElm('.timeline_contents', msg.listEl);
                configureTimelineElements($('.timeline_contents').children());
            });
            // Board update
            socket.on('board_update', function(msg){
                console.log('board_update', msg);
                $('#container').find('#myCarousel2_'+msg.data._id).parent().remove();
                $('#board_'+msg.data._id).remove();
                insertElm('#container', msg.gridEl);
                insertElm('.timeline_contents', msg.listEl);
            });
        }

		if(tpe == 'categories'){
            // New category
            socket.on('new_cat', function(msg){
                console.log('new_cat', msg);
                insertElm('#container', msg.gridEl);
                insertElm('.timeline_contents', msg.listEl);
                configureTimelineElements($('.timeline_contents').children());
            });
            // Category update
            socket.on('update_cat', function(msg){
                console.log('update_cat', msg);
                $('#container').find('#myCarousel2_'+msg.data._id).parent().remove();
                $('#cat_'+msg.data._id).remove();
                insertElm('#container', msg.gridEl);
                insertElm('.timeline_contents', msg.listEl);
            });
        }

        if (tpe == 'pin') {
            // Pin update
            socket.on('pin_update', function (msg) {
                console.log('pin_update', msg);
                $('#slider img').attr('src', '/pins/images/'+msg.data.image_name[0]);
                $('#pinDesc').html(msg.data.description);
                if(msg.data.metadata){
                    $.each(msg.data.metadata, function(k, v){
                        $('#meta_'+k).html(v === null? false.toString() : v.toString());
                    });
                }
                $('#slider').parents('.sep_brdr').addClass('highlighting');
                setTimeout(function() {
                    $('#slider').parents('.sep_brdr').removeClass('highlighting');
                }, 5000);
            });
        }
    });
});
