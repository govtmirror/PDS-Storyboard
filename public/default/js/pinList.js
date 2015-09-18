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

$(document).ready(function(){

  modalInit();

  var mOpts = {
    itemSelector : '.element',
    isFitWidth: true,
    isResizable: true,
    gutterWidth: 15,
    isAnimated: false,
    animationOptions: {
      duration: 300,
      easing: 'linear',
      queue: false
    }
  };

  //{{#ifCond siteLayout 'fixed'}}
  mOpts['columnWidth'] = 300;
  //{{/ifCond}}

  $('#container').masonry(mOpts);

  if ($("#container").length !== 0) {
    imagesLoaded( document.querySelector('#container'), function( instance ) {
      $('#container').masonry('reload');
    });
  }
  if ($("#pop_up_container").length !== 0) {
    popup_functions();
  }
  var tempScrollTop;

  $('#myModal').on('show.bs.modal', function (e) {
    if(!$('html').hasClass('modal-open')){
      tempScrollTop = $(window).scrollTop();
    }
    $('html').addClass('modal-open');
    var url =  window.localStorage.getItem('cbt_parenturl') ;
    if(typeof(url)=='undefined' || url==null) {
      url = document.URL;
    }
    expression =/.*\/(?!$)/;
    var str = expression.exec($(e.relatedTarget).attr('href'));
    window.localStorage.setItem('cbt_parenturl', url);
    window.history.pushState({},"", str);
    popup_functions();
  });

  $('#myModal').on('hide.bs.modal', function () {
    $('html').removeClass('modal-open');
    $(window).scrollTop(tempScrollTop);
    url =  window.localStorage.getItem('cbt_parenturl') ;
    window.history.pushState({},"", url);
    window.localStorage.removeItem('cbt_parenturl');
  });

  if(! /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    $('body').niceScroll({
      zindex: 1030,
      horizrailenabled:false
    });
    $('.nav_scoll').niceScroll();
    $('.dropdown-menu.cubet_comment_sub').niceScroll();
  }

  if ($("#board_container").length !== 0) {
    $('#board_container .row:first').hide().css('visibility', 'visible');

    $(window).scroll(function(){
      var top = 280;

      if ( $(window).width() < 480 ) {
        top = 600;
      }

      var mtop = '480px';
      if($(this).scrollTop() > top) {
        $('#board_container .row:last').css('visibility', 'hidden');
        $('#board_container .row:first').slideDown();

      }  else {
        // $('#container').css('margin-top', '0px');
        $('#board_container .row:first').hide();
        $('#board_container .row:last').css('visibility', 'visible');
      }
    });
  }

  //view switcher
  $('#view_switcher a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
      var viewType = $(this).find('input#view_name').val();
      if(viewType === 'grid') {
          $('#container').masonry('reload');
      }
      $("#view_type").val(viewType);
  })

});

configureTimelineElements($('.timeline_contents').children());

// Assume that overflow containers of class pictureWrapper are
// marked with the class overflow and they contain a label
// with the number of remaining pictures. Find these
// containers and add an overlay to each one.
$('.pictureWrapper.overflow').each(function (ix, wrapper) {
  wrapper = $(wrapper);
  var overlay = $(document.createElement('div'));
  overlay.addClass('overlay');
  overlay.width(wrapper.width());
  overlay.height(wrapper.width());
  wrapper.append(overlay);
  var backdrop = $(document.createElement('div'));
  backdrop.addClass('backdrop');
  backdrop.width(wrapper.width());
  backdrop.height(wrapper.width());
  overlay.append(backdrop);
  var label = wrapper.find('.overflowLabel').first();
  label.css('display', 'inline');
  label.css('left', (wrapper.width()-label.width())/2 + 'px');
  label.css('top', (wrapper.height()-label.height())/2 + 'px');
  overlay.append(label);
  var link = wrapper.find('a').first(),
    target = link.attr('href');
  var click = function () {
    location.assign(target);
  };
  backdrop.click(click);
  label.click(click);
});

$(window).load(function(){
  $('.dropdown-toggle').dropdown();
  $('#carousel').flexslider({
    animation: "slide",
    controlNav: false,
    animationLoop: false,
    slideshow: false,
    itemWidth: 100,
    itemMargin: 5,
    asNavFor: '#slider'
  });

  $('#slider').flexslider({
    animation: "slide",
    controlNav: false,
    animationLoop: false,
    slideshow: false,
    sync: "#carousel",
    start: function(slider){
      $('body').removeClass('loading');
    }
  });

});

function modalInit(){
  $('body').on('click', '*[data-toggle="modal"]',function(e){
    $('.loader').show();
    e.stopPropagation();
    e.preventDefault();
    var id = $(this).attr('data-target');
    var link = $(this).attr('href');
    //to handle popups
    if($(this).attr('data-extend')){
      link += '/'+ $(this).attr('data-extend');
    }

    $(id).modal('show').on('hide.bs.modal',function(){
      $(this).html('');
    }).on('shown.bs.modal', function () {
      setTimeout("$('.loader').hide();",100);
    });

    $(id).load(link);

    if(id == '#myModal') {
      var url =  window.localStorage.getItem('cbt_parenturl') ;
      if(typeof(url)=='undefined' || url==null) {
        url = document.URL;
      }
      expression =/.*\/(?!$)/;
      var str = expression.exec(link);
      window.localStorage.setItem('cbt_parenturl', url);
      window.history.pushState({},"", str);
    }
  });
}


function popup_functions() {
  var next_scroll = true
  var scr = $("#myModal");

  if($("#container").length == 0)
  {
    var scr = $(document) ;
  }
  scr.scroll(function() {
    var wintop    = scr.scrollTop(),
      docheight = $(document).height(),
      winheight = $('#pop_up_container').height();

    if ( (wintop + $(".modal_pou_up .row").height()) + parseInt(1000) > winheight ) {

      if (next_scroll) {
        // alert(2);
        next_scroll = false;
        //$('div#loadmoreajaxloader').show();
        var start = $('#endlimit2').val();
        var end = parseInt(start) + parseInt(6);
        $('#endlimit2').val(end);
        //alert($("#cur_pin_id").val());

        $.ajax({
          url: "/upin_nxtpg",
          data: {
            "startlimit": start,
            "endlimit"  : "3",
            //"user_id"   : $("#user_id").val(),
            "cur_pin_id": $("#cur_pin_id").val(),
            "popup"     : $("#popup").val()
          },
          type: 'post',
          success: function(html)
          {
            //alert(html);
            if (html){
              var mOptsPop = {
                itemSelector : '.element',
                isFitWidth: true,
                isResizable: true,
                gutterWidth: 15,
                isAnimated: false,
                animationOptions: {
                  duration: 300,
                  easing: 'linear',
                  queue: false
                }
              };

              //{{#ifCond siteLayout 'fixed'}}
              mOptsPop['columnWidth'] = 300;
              //{{/ifCond}}

              $("#pop_up_container").masonry(mOptsPop);
              $("#pop_up_container").append(html);

              imagesLoaded(document.querySelector('#pop_up_container'), function( instance ) {
                $('#pop_up_container').masonry('reload');
                next_scroll = true;
              });
              //$('div#loadmoreajaxloader').hide();
            } else {
              //$('div#loadmoreajaxloader').html('<center>No more posts to show.</center>');
            }
          },
          error: function(jqxhr, status, error) {
            //                            alert('e' + error);
            //$('div#loadmoreajaxloader').html('<center>No more posts to show.</center>');
          }
        });
      }
    }
  });

  $('#carousel').flexslider({
    animation: "slide",
    controlNav: false,
    animationLoop: false,
    slideshow: false,
    itemWidth: 210,
    itemMargin: 5,
    asNavFor: '#slider'
  });
  $('#slider').flexslider({
    animation: "slide",
    controlNav: false,
    animationLoop: false,
    slideshow: false,
    sync: "#carousel",
    start: function(slider){
      $('body').removeClass('loading');
    }
  });

  $(".youtubeClass").unbind('click').bind('click',function(){
    //alert(2);
    var vUrl = $(this).children('img.youtube').attr('data-src');
    $(this).children('iframe').attr('src', vUrl).show();
    $(this).children('img').hide();
  });

  setTimeout(function(){
    imagesLoaded(document.querySelector('.boardMasonry'), function( instance ) {
      $('.boardMasonry').masonry('reload');
    });
    $('#myModal').niceScroll();

    if($('.boardMasonry').length > 0) {
      imagesLoaded(document.querySelector('.boardMasonry'), function( instance ) {
        $('.boardMasonry').masonry('reload');
      });
    }
    if($('.domainContainer').length > 0) {
      imagesLoaded(document.querySelector('.domainContainer'), function( instance ) {
        $('.domainContainer').masonry('reload');
      });
    }

    $('.sharegr').hover(function() {
      $('.share_popup').hide();
      $('.popup_share').show();
    }, function() {
      $('.popup_share').hide();
      $('.share_popup').show();
    });

    $('.overflw_sectn').niceScroll({
      horizrailenabled: false
    });
    $('.loader').hide();
  },800);
}
