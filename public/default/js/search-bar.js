/*
 * Copyright (C) 2015 TopCoder Inc., All Rights Reserved.
 */
/**
 * Search bar related JS.
 *
 * Changes in version 1.1 (Myyna Web Application Search Improvement):
 * - refactored the search bar functionality based on the new tag structure
 *
 * Changes in version 1.2 (Myyna [Bug Bounty]):
 * - added pagination
 * - handled tab changing via ajax
 *
 * @author kiril.kartunov, MonicaMuranyi
 * @version 1.2
 */
(function ($) {

    // When DOM loaded/ready
    $(document).ready(function () {
        // Make an initial ajax call to get un-filtered results
        var tab = $(".search_screening_bar li.current").index();
        $.ajax({
            url: "/search",
            data: {tab: tab},
            type: 'post',
            success: function(response) {
                $(".search-result-page-content").append(response);
                imagesLoaded('#container' || [], function(instance) {
                    $('#search_res_cnt').removeClass("hide");
                    $('#container').masonry('reload');
                    nextScroll = true;
                    currentNrOfItems = 0;
                    $('body').getNiceScroll().resize();
                });
            }
        });
        $(".search_screening_bar li a").click(function(){
            $(".search_screening_bar li").removeClass("current");
            $(this).parent().addClass("current");
            $.ajax({
                url: "/search",
                data: {tags: currentTags, tab: $(this).data("tab"), currentNrOfItems: 0},
                type: 'post',
                success: function(response) {
                    $(".search-result-page-content").children().remove();
                    $(".search-result-page-content").append(response);
                    imagesLoaded('#container', function(instance) {
                        $('#search_res_cnt').removeClass("hide");
                        $('#container').masonry('reload');
                        nextScroll = true;
                        currentNrOfItems = $(".element").length;
                        $('body').getNiceScroll().resize();
                    });
                }
            });
        });
        var currentTags;
        $('.search-input-box').searchBar({
            getKeyList: function () {
                var res;
                var tab = $(".search_screening_bar li.current").index();
                // Get the key list synchronously (the searchBar plugin's getKeyList function is used synchronously)
                $.ajax({
                    url: "/searchkeys?tab=" + tab,
                    dataType: 'json',
                    success: function(response) {
                        res = response;
                    },
                    async: false
                });
                return res;
            },
            getValueSuggestionList: function (key) {
                var res;
                // Get the key list synchronously (the searchBar plugin's getValueSuggestionList function is used synchronously)
                $.ajax({
                    url: "/searchvalues",
                    data: {key: key},
                    type: 'post',
                    success: function(response) {
                        res = response;
                    },
                    async: false
                });
                return res;
            },
            searchBarUpdated: function (tags) {
                currentTags = tags;
                if (tags.length > 0) {
                    $('.search-input').attr('placeholder', 'Add more tags');
                } else {
                    $('.search-input').attr('placeholder', 'Search');
                }
                var tab = $(".search_screening_bar li.current").index();
                // Get search results asynchronously
                $.ajax({
                    url: "/search",
                    data: {tags: tags, tab: tab},
                    type: 'post',
                    success: function(response) {
                        $(".search-result-page-content").children().remove();
                        $(".search-result-page-content").append(response);
                        imagesLoaded('#container', function(instance) {
                            $('#search_res_cnt').removeClass("hide");
                            $('#container').masonry('reload');
                            nextScroll = true;
                            currentNrOfItems = $(".element").length;
                            $('body').getNiceScroll().resize();
                        });
                    }
                });
            },
            placeholderText: 'Search',
            suggestionWindowMaxHeight: 200,
            suggestionWindowMaxWidth: 200
        });
        var nextScroll = true;
        var currentNumberOfItems;
        $(window).scroll(function() {
            if($(window).scrollTop() + $(window).height() == $(document).height() && currentNrOfItems < Number($("#totalCount").val())) {
                if (nextScroll) {
                    nextScroll = false;
                    var tab = $(".search_screening_bar li.current").index();
                    $.ajax({
                        url: "/search",
                        data: {tags: currentTags, tab: tab, currentNrOfItems: currentNrOfItems},
                        type: 'post',
                        success: function(response) {
                            //$(".search-result-page-content").children().remove();
                            $(".search-result-page-content").append(response);
                            imagesLoaded('#container', function(instance) {
                                $('#search_res_cnt').removeClass("hide");
                                $('#container').masonry('reload');
                                nextScroll = true;
                                currentNrOfItems = $(".element").length;
                                $('body').getNiceScroll().resize();
                            });
                        }
                    });
                }

            }
        });
        //
        if(location.pathname.indexOf('/search') != -1){
            $('ul.nav.navbar-nav.navbar-right.right-dropd').css({
                position: 'relative',
                'z-index': 99999999999
            });
        }
    });
})(jQuery);
