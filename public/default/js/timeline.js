/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/* Configure timeline elements script.
 *
 * Changes in version 2.1 (Myyna Web Application List View Update):
 * - added logic to handle Disqus properly
 *
 * The MIT License (MIT)
 * @version 2.1
 * @author Arya <arya@cubettech.com>, TCSASSEMBLER
 */

/**
 * Configure the timeline elements.
 * Show the visible status bar icons and set the click event for the comments button.
 * The function is used for the initial loaded pins, for the pins loaded during scroll
 * and for the newly created pins added through sockets.
 * @param elements the elements to configure
 */
var configureTimelineElements = function(elements) {
  // Show the appropriate icons.
  var contentAction = elements.find('.contentAction');
  var statusBar = contentAction.find('.statusBar');
  if (contentAction.hasClass('category')) {
    statusBar.find('.boardStatus').addClass('showStatus');
    statusBar.find('.userStatus').addClass('showStatus');
  } else if (contentAction.hasClass('board')) {
    statusBar.find('.pinStatus').addClass('showStatus');
    statusBar.find('.userStatus').addClass('showStatus');
  } else if (contentAction.hasClass('pin')) {
    statusBar.find('.heartStatus').addClass('showStatus');
    statusBar.find('.linkStatus').addClass('showStatus');
  }

  // Add an event listener to the comment button.
  statusBar.find('.commentButton').unbind( "click" );
  statusBar.find('.commentButton').click(function () {
    var disqusWidget = $('.disqusWidget').first();
    var newContainer = $(this).closest('.contentAction').find('.disqusWidgetContainer').first();
    if(disqusWidget.is(":visible")) {
      disqusWidget.fadeToggle();
      if(disqusWidget.parent()[0] == newContainer[0]) {
        return;
      }
    }

    var type = newContainer.find("input[name='type']").val();
    var id = newContainer.find("input[name='id']").val();
    var description = newContainer.find("input[name='description']").val();
    var disqus_shortname = '{{DEFINES.DISQUS_SHORTNAME}}';
    var disqus_identifier = type + '/' + id;
    var disqus_title = description;
    var disqus_url = window.location.origin + "/" + type + "/" + id;

    DISQUS.reset({
      reload: true,
      config: function () {
        this.page.identifier = disqus_identifier;
        this.page.url = disqus_url;
        this.page.title = disqus_title;
      }
    });

    newContainer.append(disqusWidget);
    disqusWidget.fadeToggle();
  });
};