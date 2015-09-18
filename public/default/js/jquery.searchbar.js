/*
 * A jQuery plugin which creates a AWS searchbar like search functionality.
 * @version 1.0
 * @author TCSPROTOTYPE DEVELOPER
 * @copyright topcoder, 2015
 */

 /*
  * Example usage:
  * $('.foo').searchBar({
        getKeyList: function () {
            return keyList;
        },
        getValueSuggestionList: function (key) {
            return valueList;
        },
        searchBarUpdated: function (tags) {
            console.log(JSON.stringify(tags));
        }
    });
  */
(function ($) {

    $(document).on('click', function (e) {
        if ($(e.target).closest('.search-bar').length === 0) {
            $('.search-bar').each(function (index, element) {
                $(element).data('searchBar').collapse();
                $(element).data('searchBar').hideSuggestionWindow();
            });
        }
    });

    $.fn.searchBar = function( options ) {
        // Options supported by the plugin. Options are merged with the the options
        // passed by user. So, all the options listed here can be overridden by user.
        var settings = $.extend({
            searchBarMarkup: $.fn.searchBar.searchBarMarkup,
            suggestionBoxMarkup: $.fn.searchBar.suggestionBoxMarkup,
            showCloseButton: false,
            showHelpIcon: false,
            // Default implementation which has to be overridden by the user.
            getKeyList: function () {
                return {};
            },
            // Default implementation which has to be overridden by the user.
            getValueSuggestionList: function (key) {
                return [];
            },
            // Default implementation which has to be overridden by the user.
            searchBarUpdated: function (tags) {

            },
            // Placeholder text which will be used for the input field within the text box
            placeholderText: 'Search',
            initialSearchValue: null,
            // Max height of the suggestion box
            suggestionWindowMaxHeight: 250,
            // Max width of the suggestion box
            suggestionWindowMaxWidth: 210
        }, options);

        // Creates a searchBar for each element matching the selector.
        return this.each(function () {
            $(this).data('searchBar', new SearchBar($(this), settings));
        });
    };

    // Markup for creating the text box.
    $.fn.searchBar.searchBarMarkup = '<div class="search-bar-wrapper">' +
                                        '<div class="tag-wrapper">' +
                                            '<div class="search-input-wrapper"><input type="text" class="search-input"/></div>' +
                                        '</div>' +
                                        '<div class="hidden-tags-count"></div>' +
                                    '</div>';

    // Placeholder markup for the suggestion box
    $.fn.searchBar.suggestionBoxMarkup = '<div class="search-bar-suggestions-wrapper"></div>';

    // Markup for each tag
    $.fn.searchBar.tagMarkup = '<a href="javascript:;" tabindex="1"><span class="tag-text"></span><span class="close">x</span></a>'


    /* SearchBar Class
     * @param element DOM element which has to be converted into SearchBar
     * @param options
    **/
    var SearchBar = function (element, options) {
        this.options = options;
        this.rootElement = element;

        this.rootElement.addClass('search-bar');

        this.searchBarElement = $($.parseHTML(options.searchBarMarkup));
        this.rootElement.append(this.searchBarElement);

        // Sets the placeholder text passed through config
        this.searchTextBox = this.rootElement.find('input.search-input');
        this.searchTextBox.attr('placeholder', options.placeholderText);

        this.suggestionBoxTarget = $($.parseHTML(options.suggestionBoxMarkup));
        this.rootElement.find('.search-input-wrapper').append(this.suggestionBoxTarget);
        this.suggestionBoxTarget.css('max-height', this.options.suggestionWindowMaxHeight + 'px');
        this.suggestionBoxTarget.css('max-width', this.options.suggestionWindowMaxWidth + 'px');

        this.tagWrapper = this.rootElement.find('.tag-wrapper');
        if (this.options.initialSearchValue) {
            this.searchTextBox.val(this.options.initialSearchValue);
        }

        if (this.options.restrictToSingleTag) {
            this.rootElement.addClass('sigle-tag-mode');
            this.rootElement.find('.hidden-tags-count').remove();
        }
        this.state = {};

        this.tags = [];

        this.setupEventHandlers();
        return this;
    };

    /**
     * Expands the searchBar and hides the hidden tag count.
     **/
    SearchBar.prototype.expand = function () {
        this.searchBarElement.addClass('expanded');
        this.rootElement.find('.hidden-tags-count').hide();
    };

    /**
     * collapses the searchBar and hides the hidden tag count.
     **/
    SearchBar.prototype.collapse = function () {
        this.searchBarElement.removeClass('expanded');
        this.showNumberOfHiddenElement();
    };

    /**
     * Resets the SearchBar to the olde state.
     * i.e, Creates key suggestion window and resets the search value.
     **/
    SearchBar.prototype.reset = function () {
        this.suggestionWindow.destroy();
        this.suggestionWindow = null;
        if (this.state && this.state.key) {
            delete this.state.key;
        }
        this.searchTextBox.val('');

        var keys = this.options.getKeyList();
        this.createNewSuggestionWindow(keys);
        this.suggestionWindow.render();
    };

    /**
     * Creates and renders the tag with the key and value passed.
     * @param key Selected key
     * @param value Selected value
     **/
    SearchBar.prototype.createTag = function (key, value) {
        if (!this.options.restrictToSingleTag && !this.ownerTag) {
            this.reset();
            // Return if the tag is a duplicate
            for (var i = 0; i < this.tags.length; i++) {
                if (this.tags[i].key === key && this.tags[i].value === value) {
                    this.textBoxClickedFlag = true;
                    return;
                }
            }
            var tag = new Tag(key, value);
            this.tags.push(tag);
            //tag.render(this.tagWrapper);
            var tagDOM = tag.getMarkup();
            tagDOM.insertBefore($(this.tagWrapper).find('.search-input-wrapper'));
            // When the tag is removed, recalculates the tags maintained by the plugin
            $(tagDOM).on('willRemove', function (e, tag) {
                this.tagRemoved(tag);
                window.setTimeout(function () {
                    this.showNumberOfHiddenElement();
                }.bind(this), 100);
            }.bind(this));
            this.sendTags();
            this.state.doNotShowSuggestionBox = true;
            this.searchTextBox.focus();
        } else {
            this.ownerTag.update(key, value);
            $(this.ownerTag.element).on('willRemove', function (e, tag) {
                this.tagRemoved(tag);
                window.setTimeout(function () {
                    this.showNumberOfHiddenElement();
                }.bind(this), 100);
            }.bind(this));
        }
    };

    /**
     * Notifies the user of the tags created/deleted/updated.
     * Sends a plain javascript object which can be stringified directly.
     * Invokes searchBarUpdated callback which can be overridden by the user to listen to changes.
     **/
    SearchBar.prototype.sendTags = function () {
        var json = [];
        for (var i = 0; i < this.tags.length; i++) {
            json.push({
                key: this.tags[i].key,
                value: this.tags[i].value
            })
        }
        this.options.searchBarUpdated(json);
    };

    /**
     * Listens to the tag and updates the search bar when the user removes tag by
     * clicking 'x' icon. And notified the user regaring the change in the tag.
     * @param tag The removed tag.
     **/
    SearchBar.prototype.tagRemoved = function (tag) {
        var tags = this.tags;
        for (var i = 0; i < tags.length; i++) {
            if (tags[i].key.id == tag.key.id && tags[i].value.id == tag.value.id) {
                this.tags.splice(i, 1);
                break;
            }
        }
        this.sendTags();
    };

    /*
     * @private
     * Registers event handlers required for SearchBar.
     **/
    SearchBar.prototype.setupEventHandlers = function () {
        this.searchTextBox.on('focus', $.proxy(this.textBoxFocused, this));
        this.searchTextBox.on('blur', $.proxy(this.textBoxBlurred, this));
        this.searchTextBox.on('keydown', $.proxy(this.handleKey, this));
        this.searchTextBox.on('click', $.proxy(this.textBoxClicked, this));
        this.suggestionBoxTarget.on('optionChosen', $.proxy(this.optionChosen, this));
        this.suggestionBoxTarget.on('scroll', $.proxy(this.onSuggestionBoxScroll, this));
        this.rootElement.find('.search-bar-wrapper').on('click', $.proxy(this.onSearchBarFocus, this));
        $(window).on('resize', $.proxy(this.onResize, this));
    };

    SearchBar.prototype.onSuggestionBoxScroll = function (e) {
        this.state.DontCloseFlyout = true;
    };

    /**
     * When the width of the searchBar changes, updates the hidden
     * tags count accordingly.
     **/
    SearchBar.prototype.onResize = function () {
        this.showNumberOfHiddenElement();
    };

    /**
     * When the searchBar div is focused, changes the focus to the input field.
     * This wont happen if restrictToSingleTag is set to true.
     * @param e jQuery event object
     **/
    SearchBar.prototype.onSearchBarFocus = function (e) {
        if (!this.options.restrictToSingleTag) {
            this.searchTextBox.focus();
        }
    };

    /**
     * Gets invoked by the SuggestionWidnow when the option(key/value) is chosen by click.
     * @param e jQuery Event Object
     * @param option The text of the selected option
     **/
    SearchBar.prototype.optionChosen = function (e, option) {
        this.state.DontCloseFlyout = true;
        if (this.state && this.state.key) {
            this.createTag(this.state.key, option);
        } else {
            this.state.key = option;
            this.createNewValueSuggestionWindow(this.state.key);
            this.suggestionWindow.render();
            this.suggestionBoxTarget.show();
            this.textBoxClickedFlag = true;
        }
    };

    /**
     * Gets invoked whenever user presses any key inside the searchBar and delegates the action accordingly.
     * @param e jQuery Event Object
     **/
    SearchBar.prototype.handleKey = function (e) {
        if (e.keyCode === 40) {
            this.handleDownArrow(e);
        } else if (e.keyCode === 38) {
            this.handleUpArrow(e);
        } else if (e.keyCode === 9) {
            this.handleTab(e);
        } else if (e.keyCode === 13) {
            this.handleEnter(e);
        } else if (e.keyCode === 8) {
            if (!this.searchTextBox.val() || this.searchTextBox.val() === 0) {
                return
            } else {
                this.searchForPattern();
            }
        } else if (e.keyCode === 27) {
            this.handleEscape(e);
        } else if (e.keyCode !== 16) {
            // Search for pattern
            this.searchForPattern(e);
        }
    };

    /**
     * When the user enters tab, if there is any text in the input field,
     * treats it as enter to allow freetyping.
     * If there is no text, treats it as tab.
     * @param e jQuery Event object.
     **/
    SearchBar.prototype.handleTab = function (e) {
        var selectedObject = this.suggestionWindow.chooseCurrentSelection();
        if (this.searchTextBox.val().length === 0 && selectedObject === null) {
            return;
        } else {
            this.textBoxClickedFlag = false;
            this.handleSelectedObject(selectedObject);
            e.preventDefault();
        }
    };

    /**
     * When the user presses down arrow,
     * Selects the next option in the Suggestion window if it is opened.
     * @param e jQuery Event object.
     **/
    SearchBar.prototype.handleDownArrow = function (e) {
        if (this.state.textBoxFocused === true) {
            e.preventDefault();
            this.suggestionWindow.selectNext();
        }
    };

    /**
     * When the user presses escape,
     * closes the suggestion box if it is shown.
     * If any tag is being edited, updates the ownerTag to cancel edit.
     * @param e jQuery Event object.
     **/
    SearchBar.prototype.handleEscape = function (e) {
        if (!this.ownerTag) {
            if (this.suggestionWindow) {
                this.suggestionBoxTarget.hide();
            }
            return;
        }
        this.ownerTag.update(this.ownerTag.key, this.ownerTag.value);
    };

    /**
     * When the user presses up arrow,
     * Selects the previous option in the Suggestion window if it is opened.
     * @param e jQuery Event object.
     **/
    SearchBar.prototype.handleUpArrow = function (e) {
        if (this.state.textBoxFocused === true) {
            e.preventDefault();
            this.suggestionWindow.selectPrevious();
        }
    };


    /**
     * When the user presses enter,
     * Creates a tag when the user presses enter and resets the searchBar to recive input for next tag.
     * @param e jQuery Event object.
     **/
    SearchBar.prototype.handleEnter = function (e) {
        if (this.state.textBoxFocused === true) {
            this.textBoxClickedFlag = false;
            e.preventDefault();
            var selectedObject = this.suggestionWindow.chooseCurrentSelection();
            this.handleSelectedObject(selectedObject);
        }
    };

    // TODO:FIX
    SearchBar.prototype.handleSelectedObject = function (selectedText) {
        var key = this.state.key, tag;
        if (!selectedText) {
            if (!key) {
                selectedText = this.searchTextBox.val();
                if (selectedText.trim().length) {
                    this.createTag({ id: undefined, name : 'search'}, { id : undefined, name : selectedText});
                } else {
                    this.reset();
                }
            } else {
                var value = this.searchTextBox.val().replace(/^((\w+:)?[\w\s]+\s+:\s*)/i, '');
                if (value && value.length) {
                    this.createTag(key, {id : undefined, name : value});
                } else {
                    this.createTag(key, {id : undefined, name : '' });
                }
            }
        } else {
            if (!key) {
                this.state.key = selectedText;
                this.createNewValueSuggestionWindow(selectedText);
            } else {
                this.createTag(key, selectedText);
            }
        }
    };

    /**
     * Searches, highlights and filters the value ented by the user in the suggestion window shown.
     **/
    SearchBar.prototype.searchForPattern = function () {
        var scheduledSearch = this.scheduledSearch, searchPattern;
        if (scheduledSearch != null) {
            return;
        } else {
            this.scheduledSearch = window.setTimeout($.proxy(function () {
                this.scheduledSearch = null;
                var regexMatch  = /^((\w+:)?[\w\s]+\s+:[\sa-zA-Z0-9_\s]*)$/i;
                var regexReplace = /^((\w+:)?[\w\s]+\s+:\s*)/i;
                // Persist the state of searchbox
                searchPattern = this.searchTextBox.val();
                if (this.state && this.state.key) {
                    if (regexMatch.test(searchPattern)) {
                        searchPattern = searchPattern.replace(regexReplace, '');
	                }else {
	                    delete this.state.key;
                        // The user has removed ":", so start for searching key
                        this.createNewKeySuggestionWindow();
                        this.suggestionWindow.render();
                    }
                }
                this.state.searchPattern = searchPattern;
                this.suggestionWindow.searchAndHighlight(searchPattern);
            }, this), 100);
        }
    }

    /**
     * @private
     * Gets triggered when the text box is focused.
     * If there is no suggestion box, creates one.
     */
    SearchBar.prototype.textBoxFocused = function () {
        if (!this.suggestionWindow) {
            this.createNewKeySuggestionWindow();
            this.suggestionWindow.render(this.state);
        }
        this.state.textBoxFocused = true;
        if (this.textBoxClickedFlag === true && this.state.doNotShowSuggestionBox !== true) {
            this.showSuggestionWindow();
        } else {
            this.hideSuggestionWindow();
        }
        this.state.doNotShowSuggestionBox = false;
        this.expand();
    };

    SearchBar.prototype.textBoxClicked = function () {
        if (this.textBoxClickedFlag === true) {
            this.textBoxClickedFlag = false;
        } else {
            this.textBoxClickedFlag = true;
        }
    };

    /**
     * Shows the suggestionWindow beloging to the current SearchBar if it is already created.
     **/
    SearchBar.prototype.showSuggestionWindow = function () {
        if (this.suggestionWindow) {
            this.suggestionBoxTarget.show();
        }
    };

    SearchBar.prototype.hideSuggestionWindow = function () {
        if (this.suggestionWindow) {
            this.suggestionBoxTarget.hide();
        }
    };

    SearchBar.prototype.toggleSuggestionWindow = function () {
        if (this.suggestionWindow) {
            this.suggestionBoxTarget.toggle();
        }
    };    

    /**
     * Creates a new SuggestionWindow for showing key suggestion.
     * It gets the keys suggestion by invoking getKeyList.
     **/
    SearchBar.prototype.createNewKeySuggestionWindow = function () {
        var keys = this.options.getKeyList();
        this.createNewSuggestionWindow(keys);
    };

    /**
     * Creates a new SuggestionWindow for showing value suggestion based on the selected key.
     * It gets the keys suggestion by invoking getValueSuggestionList.
     * @param key The selected key
     **/
    SearchBar.prototype.createNewValueSuggestionWindow = function (key) {
        var values = this.options.getValueSuggestionList(key);
        this.searchTextBox.val((this.state.key.type ? this.state.key.type + ":" : '') + this.state.key.name + ' : ');
        if(values) {
            this.createNewSuggestionWindow(values);
            this.suggestionWindow.render();
            this.suggestionBoxTarget.show();
        }
        this.searchTextBox.focus();
    };

    /**
     * Creates a new SuggestionWindow to display the passed data.
     * @param data The data to be shown in the suggestion box.
     **/
    SearchBar.prototype.createNewSuggestionWindow = function (data) {
        if (this.suggestionWindow) {
            this.suggestionWindow.destroy();
        }
        this.suggestionWindow = new SuggestionWindow(this, this.suggestionBoxTarget, data);
    };

    /**
     * Gets invoked when the user navigates away from the input field.
     * It waits to find whether the user is interacting with suggestionWindow.
     * If so, it makes sure that the SearchBar doesn't collapse.
     **/
    SearchBar.prototype.textBoxBlurred = function () {
        if (!this.options.restrictToSingleTag && !this.ownerTag) {
            window.setTimeout(function () {
                if (this.searchTextBox.is(':focus')) {
                    this.state.DontCloseFlyout = false;
                    return;
                }
                this.textBoxClickedFlag = false;
                var focusedTag = !!this.rootElement.find('.tag-wrapper a:focus').length;
                if (!this.state.DontCloseFlyout) {
                    this.suggestionBoxTarget.hide();
                    // safari hack to force the browser to repaint the suggestion box.
                    this.suggestionBoxTarget.get(0).offsetHeight;
                    if (!focusedTag) {
                        this.searchBarElement.removeClass('expanded');
                        this.showNumberOfHiddenElement();
                    }
                }
                this.state.DontCloseFlyout = false;
            }.bind(this), 200);
            this.state.textBoxFocused = false;
        } else {
            this.ownerTag.update(this.ownerTag.key, this.ownerTag.value);
        }
    };

    /**
     * Updates the number of hiddenTags when the searchBar is in collapsed state.
     **/
    SearchBar.prototype.showNumberOfHiddenElement = function () {
        if (this.options.restrictToSingleTag) {
            return;
        }
        var numberOfTags = this.tags.length, xPosition, breakingPosition = 1, firstElementPosition,
            hiddenTagsCount;
        if (numberOfTags <= 1) {
            hiddenTagsCount = 0;
        } else {
            firstElementPosition = $(this.tags[0].element).position().top;
            for (var i = 1; i < numberOfTags; i++) {
                if ($(this.tags[i].element).position().top === firstElementPosition) {
                    breakingPosition++;
                }
            }
            hiddenTagsCount = numberOfTags - breakingPosition;
        }

        // If there is no hidden tags, hides the count.
        if (hiddenTagsCount === 0) {
            this.rootElement.find('.hidden-tags-count').hide();
        } else {
            this.rootElement.find('.hidden-tags-count').html('<p>(+' + hiddenTagsCount + ')</p>')
            this.rootElement.find('.hidden-tags-count').show();
        }
    };

    /**
     * @private
     * Class which wraps the suggestion window.
     * @param parentSearchBar The reference to the search bar to which this suggestion window belongs to
     * @param targetDOM The DOM element into which the suggestion window has to be rendered
     * @param data The dat to be rendered in suggestion window.
     * @param the callback to be invoked when a value is selected
     **/
    var SuggestionWindow = function (parentSearchBar, targetDOM, data, onValueSelect) {
        this.parentSearchBar = parentSearchBar;
        this.targetDOM = targetDOM;
        this.onValueSelect = onValueSelect;
        this.data = data;
        this.state = {};
    };

    SuggestionWindow.prototype.getObjectById = function(id) {
	    if (this.data instanceof Array) {
			for (i = 0; i < this.data.length; i++) {
                if(this.data[i].id == id) {
     		       return this.data[i];
	            }
            }
	    } else {
		    for (key in this.data) {
                if (this.data.hasOwnProperty(key)) {
                    keys = this.data[key];
                    for (i = 0; i < keys.length; i++) {
                        if(keys[i].id == id) {
	                       keys[i].type = key.replace(' ', '');
		     		       return keys[i];
			            }
                    }
                }
             }
        }
         
	    return undefined;
	}
	
    /**
     * @private
     * Decides whether to render the passed data as key or value
     * @param data Data to be rendered in the suggestion box
     */
    SuggestionWindow.prototype.render = function (options) {
        if (this.data instanceof Array) {
            this.renderValues(this.data);
        } else {
            this.renderKeys(this.data);
        }
        if (options && options.searchPattern) {
            this.searchAndHighlight(options.searchPattern);
        }
    };

    /**
     * Renders keys in the Title/option format into the suggestion Window
     * @param data Data to be rendered
     **/
    SuggestionWindow.prototype.renderKeys = function (data) {
        var parentUl, keys, keyListMarkup, key, i, ulMarkup, optionLiMarkup, index = 0;

        parentUl = $($.parseHTML('<ul></ul>'));
        this.parentUl = parentUl;
        this.targetDOM.html(parentUl);

        for (key in data) {
            if (data.hasOwnProperty(key)) {
                keys = data[key];

                // Renders object key as title.
                keyListMarkup = $($.parseHTML('<li class="heading"><span>' + key + '</span></li>'));
                ulMarkup = $($.parseHTML('<ul></ul>'));

                for (i = 0; i < keys.length; i++) {
                    optionLiMarkup = $.parseHTML('<li id=' + keys[i].id + ' class="option">' + keys[i].name + '</li>');
                    ulMarkup.append(optionLiMarkup);
                    $(optionLiMarkup).attr('data-option-index', index);

                    index++;
                }

                keyListMarkup.append(ulMarkup);
                parentUl.append(keyListMarkup);
            }
        }

        this.targetDOM.append(parentUl);

        this.registerEvents();
    };

    /**
     * Renders the passed array into suggestion list
     * @param data The values array
     **/
    SuggestionWindow.prototype.renderValues = function (data) {
        var i, ulMarkup, optionLiMarkup, index = 0;
        ulMarkup = $($.parseHTML('<ul></ul>'));
        this.parentUl = ulMarkup;

        for (i = 0; i < data.length; i++) {
            optionLiMarkup = $.parseHTML('<li id="' + data[i].id + '" class="option">' + data[i].name + '</li>');
            ulMarkup.append(optionLiMarkup);
            $(optionLiMarkup).attr('data-option-index', index);
            index++;
        }
        this.targetDOM.html(ulMarkup);
        this.registerEvents();
    };

    /**
     * Registers events required for SuggestionWindow.
     **/
    SuggestionWindow.prototype.registerEvents = function () {
        this.targetDOM.find('li').not('.heading').on('click', $.proxy(this.selectByClick, this));
    };

    /**
     * When the user selects an option by click,
     * It updates the parent searchbar regarding the selected option
     * @param e jQuery Event object
     **/
    SuggestionWindow.prototype.selectByClick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        var option;
        if (e.target.tagName == 'LI') {
            option = this.getObjectById($(e.target).attr('id'));
        } else {
            option = this.getObjectById($(e.target).parent().attr('id'));
        }
        this.targetDOM.trigger('optionChosen', option);
    }

    /**
     * Filters/highlights the options in the suggestion window with the
     * passed searchPattern
     * @param searchPattern The string to be searched for
     **/
    SuggestionWindow.prototype.searchAndHighlight = function (searchPattern) {
        if (!this.data) {
            return;
        }

        // If the data format is an array, assumes that the value is currently rendered.
        if (this.data instanceof Array) {
            this.searchAndHighlightValues(searchPattern);
        } else {
            this.searchAndHighlightKeys(searchPattern);
        }
    };

    /**
     * Filters/highlights the options in the suggestion window with the
     * passed searchPattern.
     * This is a specialised format of searchAndHighlight which knows how to highlight key suggestion
     * @param searchPattern The string to be searched for
     **/
    SuggestionWindow.prototype.searchAndHighlightKeys = function (searchPattern) {
        var filteredData = {}, actualData = this.data, name;
        if (!searchPattern || searchPattern.length === 0) {
            filteredData = $.extend(filteredData, actualData);
        } else {
	        if (searchPattern.indexOf(':') != -1) {
                searchPattern = searchPattern.split(':')[1];
            }
            for (var k in actualData) {
                if (actualData.hasOwnProperty(k)) {

                    filteredData[k] = [];

                    for (var i = 0; i < actualData[k].length; i++) {
                        if (actualData[k][i].name.toLowerCase().indexOf(searchPattern.toLowerCase()) !== -1) {
                            // Highlights the matching text
                            name = actualData[k][i].name.replace(new RegExp(searchPattern, 'gi'), function (str) {
                                return '<span class="highlight">' + str + '</span>';
                            });
                            filteredData[k].push({
	                            id : actualData[k][i].id,
                                name: name
                            });
                        }
                    }

                    if (filteredData[k].length === 0) {
                        delete filteredData[k];
                    }
                }
            }
        }

        if (Object.keys(filteredData).length === 0) {
            this.targetDOM.hide();
        } else {
            this.renderKeys(filteredData);
            this.targetDOM.show();
        }
    };

    /**
     * Filters/highlights the options in the suggestion window with the
     * passed searchPattern.
     * This is a specialised format of searchAndHighlight which knows how to highlight value suggestion
     * @param searchPattern The string to be searched for
     **/
    SuggestionWindow.prototype.searchAndHighlightValues = function (searchPattern) {
        var filteredData = [], actualData = this.data, value;
        if (!searchPattern || searchPattern.length === 0) {
            filteredData = $.extend(filteredData, actualData);
        } else {
            for (var i = 0; i < actualData.length; i++) {
                if (actualData[i].name.toLowerCase().indexOf(searchPattern.toLowerCase()) !== -1) {
                    // Highlights the matching text
                    value = actualData[i].name.replace(new RegExp(searchPattern, 'gi'), function (str) {
                        return '<span class="highlight">' + str + '</span>';
                    });
                    filteredData.push({
                        id : actualData[i].id,
                        name: value
                    });
                }
            }
        }

        if (filteredData.length === 0) {
            this.targetDOM.hide();
        } else {
            this.renderValues(filteredData);
            this.targetDOM.show();
        }
    };

    /**
     * When the user navigates with arrow keys, highlights the current selection.
     **/
    SuggestionWindow.prototype.highlightCurrentSelection = function() {
        this.targetDOM.find('li.highlight').removeClass('highlight');
        this.state.currentSelection.addClass('highlight');
    };

    /**
     * Selects/highlights the next option in the suggestion window.
     * Selection is maintained by using the data-option-index custom attribute.
     **/
    SuggestionWindow.prototype.selectNext = function () {
        var currentSelection = this.state.currentSelection, currentSelectionIndex;
        if (!currentSelection) {
            this.state.currentSelection = $(this.targetDOM.find('li').not('.heading').first());
            this.targetDOM.get(0).scrollTop = 0;
        } else {
            currentSelectionIndex = parseInt(this.state.currentSelection.attr('data-option-index'));
            if (currentSelectionIndex === (this.targetDOM.find('li').not('.heading').length - 1)){
                this.state.currentSelection = $(this.targetDOM.find('li').not('.heading').first());
                this.targetDOM.get(0).scrollTop = 0;
            } else {
                this.state.currentSelection = $(this.targetDOM.find('li[data-option-index="' + (currentSelectionIndex + 1) + '"]'));
                this.targetDOM.get(0).scrollTop = $(this.state.currentSelection).offset().top - this.targetDOM.offset().top + this.targetDOM.scrollTop();
            }
        }
        this.highlightCurrentSelection();
    };

    /**
     * Selects/highlights the previous option in the suggestion window.
     * Selection is maintained by using the data-option-index custom attribute.
     **/
    SuggestionWindow.prototype.selectPrevious = function () {
        var currentSelection = this.state.currentSelection, currentSelectionIndex;
        if (!currentSelection) {
            this.state.currentSelection = $(this.targetDOM.find('li').not('.heading').last());
            this.targetDOM.get(0).scrollTop = this.parentUl.height();
        } else {
            currentSelectionIndex = parseInt(this.state.currentSelection.attr('data-option-index'));
            if (currentSelectionIndex != 0) {
                this.state.currentSelection = $(this.targetDOM.find('li[data-option-index="' + (currentSelectionIndex - 1) + '"]'));
                this.targetDOM.get(0).scrollTop = $(this.state.currentSelection).offset().top - this.targetDOM.offset().top + this.targetDOM.scrollTop();
            } else {
                this.state.currentSelection = $(this.targetDOM.find('li').not('.heading').last());
                this.targetDOM.get(0).scrollTop = this.parentUl.height();
            }
        }
        this.highlightCurrentSelection();
    };

    /**
     * Selects the current selection and notifies the searchbar to create a tag with the chosen value.
     **/
    SuggestionWindow.prototype.chooseCurrentSelection = function () {
        if (this.state.currentSelection && this.targetDOM.is(':visible')) {
            var selectedOption = this.getObjectById(this.state.currentSelection.attr('id'));
            this.state = {};
            this.targetDOM.hide();
            return selectedOption;
        } else {
            return null;
        }
    };

    /**
     * Removes the suggestion window from DOM
     **/
    SuggestionWindow.prototype.destroy = function () {
        this.targetDOM.html('');
    };


    /**
     * @private
     * Class which represents a key:value tag
     * @param key string representing key
     * @param value string representing value
     **/
    var Tag = function (key, value) {
        this.key = key;
        this.value = value;
    };

    /**
     * Renders the tag using $.fn.searchBar.tagMarkup template into the targetDOM
     * @param targetDOM The DOM element into which the tag has to be rendered.
     **/
    Tag.prototype.render = function (targetDOM) {
        var markup = $($.parseHTML($.fn.searchBar.tagMarkup));
        markup.find('span.tag-text').html('<span class="key">' + this.key.name + '</span> : <span class="value">' + this.value.name + '</span>');
        targetDOM.append(markup);
        this.element = markup;

        this.setupEventHandlers(markup);
    };

    /**
     * Returns the DOM element of the tag to the caller.
     * @retuns marku The DOM of the tag which can be appended directly into DOM
     **/
    Tag.prototype.getMarkup = function () {
        var markup = $($.parseHTML($.fn.searchBar.tagMarkup));
        markup.find('span.tag-text').html('<span class="key">' + this.key.name + '</span> : <span class="value">' + this.value.name + '</span>');
        this.element = markup;
        this.setupEventHandlers(markup);
        return markup;
    };

    /**
     * Registers event handlers required for the Tag.
     **/
    Tag.prototype.setupEventHandlers = function (element) {
        $(element).find('.close').on('click', $.proxy(this.remove, this));
        $(element).on('keydown', $.proxy(this.handleKeyPress, this));
        $(element).on('click', $.proxy(this.clicked, this));
        $(element).on('blur', $.proxy(this.blurred, this));
    };

    /**
     * When the user click the croos icon or presses delete,
     * this removes the tag and notifies the searchbar by invoking willRemove event.
     * @param e jQuery Event Object
     **/
    Tag.prototype.remove = function (e) {
        e.stopPropagation();
        $(this.element).trigger('willRemove', this);
        $(this.element).remove();
        return false;
    };

    /**
     * Gets triggered when the user clicks on the tag.
     * On first click, focuses the tag and on second click, marks tag for editing.
     * @param e jQuery Event Object
     **/
    Tag.prototype.clicked = function (e) {
        e.preventDefault();
        if (this.isFocused) {
            // Edit only on second click.
            this.edit();
        } else {
            this.isFocused  = true;
            $(this.element).focus();
        }
        $(this.element).closest('.search-bar').data('searchBar').expand();
        e.stopPropagation();
    };

    /**
     * Gets triggered when the focus goes away from tag.
     * Resets the click counter.
     * @param e jQuery Event Object
     **/
    Tag.prototype.blurred = function (e) {
        if (this.isFocused) {
            this.isFocused  = false;
        }
    };

    /**
     * Gets triggered when user presses any key.
     * @param e jQuery Event Object
     **/
    Tag.prototype.handleKeyPress = function (e) {
        if (e.keyCode === 8) {
            this.handleDelete(e);
        } else if (e.keyCode === 13) {
            this.handleEnter(e);
        }
    };

    /**
     * On delete, deletes the tag.
     * @param e jQuery Event Object
     **/
    Tag.prototype.handleDelete = function (e) {
        e.preventDefault();
        this.remove(e);
    };


    /**
     * On enter, edits the tag.
     * @param e jQuery Event Object
     **/
    Tag.prototype.handleEnter = function (e) {
        if ($(this.element).is(':focus')) {
            this.edit(e);
        }
    };

    /**
     * Implements the inline edit functionality.
     * When a tag is marked as edit,
     * This create a SearchBar in the place of the tag in restrictToSingleTag.
     * When the SearchBar detcts that the user has completed the edit, it invokes the tag.
     * The tag saves the updated tag and replaces the search bar with the updated tag.
     * @param e jQuery Event Object.
     **/
    Tag.prototype.edit = function (e) {
        var text = $(this.element).text(),
        existingWidth = $(this.element).find('.tag-text').width(),
        newSearchBar = $($.parseHTML('<div></div>')),
        newSearchBarInstance;

        this.inEditMode = true;

        var parentSearchBar = $($(this.element)).closest('.search-bar').data('searchBar');
        this.parentSearchBar = parentSearchBar;

        $(this.element).replaceWith(newSearchBar);

        // Creates a new SearchBar
        newSearchBarInstance = newSearchBar.searchBar($.extend({}, parentSearchBar.options, {restrictToSingleTag: true})).data('searchBar');
        parentSearchBar.expand();

        newSearchBarInstance.ownerTag = this;
        newSearchBarInstance.state.key = this.key;
        newSearchBarInstance.createNewValueSuggestionWindow(this.key);
        newSearchBarInstance.textBoxClickedFlag = true;
        newSearchBarInstance.searchTextBox.focus();
        newSearchBarInstance.searchForPattern(this.value);
        newSearchBarInstance.searchTextBox.val((this.key.type ? this.key.type + ':' : '') + this.key.name + ' : ' + this.value.name);
        newSearchBarInstance.showSuggestionWindow();

        newSearchBarInstance.rootElement.find('.search-input-wrapper').width(existingWidth);


        this.selectValue(newSearchBarInstance.searchTextBox);
        newSearchBarInstance.searchTextBox.focus();

        this.element = newSearchBar;
    };

    /**
     * Updates the tag with new key and value and notfies the parent SearchBar of the change.
     * @param key Updated key
     * @param value Updated value
     **/
    Tag.prototype.update = function (key, value) {
        this.key = key;
        this.value = value;

        var targetElement = this.element;

        // Replaces the search bar with the tag DOM.
        $(targetElement).replaceWith(this.getMarkup());
        if (this.parentSearchBar) {
            this.parentSearchBar.sendTags();
        }
        this.inEditMode = false;
        this.isFocused = false;
    };

    /**
     * When the user edits a tag, selects the "value" in the input box.
     * @param input The input element
     **/
    Tag.prototype.selectValue = function (input) {
        var inputElement = input.get(0),
            startPos = input.val().indexOf(this.value.name),
            endPos = startPos + this.value.name.length;

        if (typeof inputElement.selectionStart != "undefined") {
            inputElement.setSelectionRange(startPos, endPos);
        } else if (document.selection && document.selection.createRange) {
            // IE branch
            inputElement.select();
            var range = document.selection.createRange();
            range.collapse(true);
            range.moveEnd("character", endPos);
            range.moveStart("character", startPos);
            range.select();
        }
    }

}(jQuery));
