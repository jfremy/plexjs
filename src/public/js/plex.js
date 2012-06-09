"use strict";
var seen_count = 0;
var unseen_count = 0;
var num_hidden = 0;

var PLEX = {

	servers: [],
    current_server: false,
    sections: [],
	current_section: false,
    items: [],
	current_item: false,
	previous_item_id: 0,
	next_item_id: 0,
	current_sort_key: "title",
	current_sort_order: "asc",
    genres: [],
	current_genre: "all",
	current_director: "all",
	show_all_genres: false,
	show_all_directors: false,
	data_loaded: false,
	filter_timeout: false,
	filter_delay: 350,
	popup_visible: false,
    canCloseOverlay: true,
    transcodeId: "",
    transcodePingTimer: false,

	display_sections_list: function() {
		var section_list_html = '';
		$.each(PLEX.sections, function(i,section){
			section_list_html += '<li data-section="'+i+'" class="'+section.type+'"><em>'+number_format(section.items.length)+'</em><span>'+section.title+'</span></li>';
		});
		PLEX._sections_list.html(section_list_html);
	}, // end func: display_sections_list


	display_section: function(section_id) {
		var section_id = parseInt(section_id);
        var key = PLEX.sections[section_id].key;
        PLEX.items = PLEX.sections[section_id].items;

		if(key != PLEX.current_section.key) {
			PLEX.current_sort_key = "title";
			PLEX.current_sort_order = "asc";
			PLEX.current_genre = "all";
			PLEX.current_director = "all";
			PLEX.current_seen = "all";
			PLEX.show_all_directors = false;
			$("li", PLEX._sorts_list).removeClass("current");
			$("li em", PLEX._sorts_list).remove();
			$("li[data-sort="+PLEX.current_sort_key+"]").addClass("current").append("<em>"+PLEX.current_sort_order+"</em>");
		}

		PLEX.current_section = PLEX.sections[section_id];
		//window.location.hash = PLEX.current_section.key;

		$("li", PLEX._sections_list).removeClass("current");
		$("li[data-section="+section_id+"]").addClass("current");
		PLEX._section_title.text(PLEX.current_section.title);

		PLEX.display_items();
        PLEX.genres = PLEX.build_genres_list(PLEX.items);
		PLEX.display_genre_list(PLEX.genres);

		var items_to_show_directors_for = PLEX.filter_items_by_genre(PLEX.items, PLEX.current_genre),
				directors = [],
				item_count = 0;

		$.each(items_to_show_directors_for, function(key, item) {
			if (!item.Director)
				return;

			item_count++;
            // If only one director, end up with an object rather than an array. Handle this
            if(!$.isArray(item.Director)) item.Director = [item.Director];
			for (var i = item.Director.length - 1; i >= 0; i--) {
				var name = item.Director[i].tag;
				if (name) {
					var director = directors[name];
					if (!director) {
						director = {director: name, count: 0};
						directors.push(director);
						directors[name] = director;
					}
					director.count++;
				}
			}
		});

		directors.sort(function(a, b) {
			if (a.count > b.count)
				return -1;

			if (a.count < b.count)
				return 1;

			if (a.director > b.director)
				return -1;

			if (a.director < b.director)
				return 1;

			return 0;
		});
		PLEX.display_director_list(item_count, directors);
		PLEX.display_seen_list("all");

	}, // end func: display_section


	display_genre_list: function(genres) {

		if(genres.length > 0) {

			var num_to_show_before_hiding = 5;
			var count = num_hidden = 0;
			var list_html = '<li data-genre="all"><em>'+ PLEX.items.length +'</em>All</li>';

			$.each(genres, function(i, e){
				count++;
				if(count <= num_to_show_before_hiding) {
					list_html += '<li data-genre="'+ e.genre+'" class="genre_shown"><em>'+ e.count+'</em>'+e.genre+'</li>';
				} else {
					num_hidden++;
					list_html += '<li data-genre="'+e.genre+'" class="genre_hidden"><em>'+ e.count+'</em>'+e.genre+'</li>';
				}
			});

			if(num_hidden>0) {
				list_html += '<li id="genre_show_all">Show '+num_hidden+' more...</li>';
				list_html += '<li id="genre_hide_all">Show fewer...</li>';
			}

			PLEX._genre_list.html(list_html);

			if(PLEX.show_all_genres) {
				$("#genre_show_all").hide();
				$(".genre_hidden").show();
			} else {
				$("#genre_hide_all").hide();
				$(".genre_hidden").hide();
			}

			$("li", PLEX._genre_list).removeClass("current");
			$("li[data-genre='"+PLEX.current_genre+"']").addClass("current");

			PLEX._genre_list_section.show();
		} else {
			PLEX._genre_list_section.hide();
		}

	}, // end func: display_genre_list


	display_director_list: function(total_count, directors) {
		if (directors.length == 0) {
			PLEX._director_list_section.hide();
			return;
		}

		var num_to_show_before_hiding = 5;
		var count = num_hidden = 0;
		var list_html = '<li data-director="all"><em>'+total_count+'</em>All</li>';

		$.each(directors, function(i, director){
			count++;
			if(count <= num_to_show_before_hiding) {
				list_html += '<li data-director="'+director.director+'" class="director_shown"><em>'+director.count+'</em>'+director.director+'</li>';
			} else {
				num_hidden++;
				list_html += '<li data-director="'+director.director+'" class="director_hidden"><em>'+director.count+'</em>'+director.director+'</li>';
			}
		});

		if(num_hidden>0) {
			list_html += '<li id="director_show_all">Show '+num_hidden+' more...</li>';
			list_html += '<li id="director_hide_all">Show fewer...</li>';
		}

		PLEX._director_list.html(list_html);

		if(PLEX.show_all_directors) {
			$("#director_show_all").hide();
			$(".director_hidden").show();
		} else {
			$("#director_hide_all").hide();
			$(".director_hidden").hide();
		}

		$("li", PLEX._director_list).removeClass("current");
		$("li[data-director='"+PLEX.current_director+"']").addClass("current");

		PLEX._director_list_section.show();

	},
	
	display_seen_list: function(seen) {
		if (PLEX.current_section.type != "movie") {
			PLEX._seen_list_section.hide();
			return;
		};
		
		var list_html = '<li data-seen="all"><em>'+PLEX.items.length +'</em>All</li>';
		
		seen_count = 0;
		$.each(PLEX.filter_items_by_seen(PLEX.items, "true"), function (k, v) {
			seen_count++;
		});
		
		list_html += '<li data-seen="true"><em>'+seen_count+'</em>Seen</li>';
		
		unseen_count = 0;
		$.each(PLEX.filter_items_by_seen(PLEX.items, "false"), function (k, v) {
			unseen_count++;
		});
		
		list_html += '<li data-seen="false"><em>'+unseen_count+'</em>Not Seen</li>';
		
		PLEX._seen_list.html(list_html);
		
		$("li", PLEX._seen_list).removeClass("current");
		$("li[data-seen="+PLEX.current_seen+"]").addClass("current");
		
		PLEX._seen_list_section.show();
	},


	display_items: function() {

		var items = PLEX.items;
        // If there is only one item, then it will be an object rather than an array
        if(!$.isArray(items)) items = [ items ];
		
		if (PLEX.current_seen != "all") {
			items = PLEX.filter_items_by_seen(items, PLEX.current_seen);
		};

		if(PLEX._section_filter.val()!="") {
			items = PLEX.filter_items_by_term(items, PLEX._section_filter.val());
		}

		if(PLEX.current_genre != "all") {
			items = PLEX.filter_items_by_genre(items, PLEX.current_genre);
		}

		if(PLEX.current_director != "all") {
			items = PLEX.filter_items_by_director(items, PLEX.current_director);
		}

		PLEX._item_list.html("");
		var num_items = 0;
		var html_string = '';
		/*$.each(PLEX.current_section.sorts[PLEX.current_sort_key+"_"+PLEX.current_sort_order], function(i, key){
			if(typeof items[key] == "undefined") return;
			var item = items[key];
			var thumb = (item.thumb==false)?"assets/images/default.png":item.thumb;
			html_string += '<li data-item="'+item.key+'" class="item"><img src="'+thumb+'" width="150" /><h4>'+item.title+'</h4></li>';
			num_items++;
		}); */
        $.each(items, function(i,v) {
            var thumb = "images/default.png";
            var data_src = v.thumbTranscodeUrl ? ' data-src="' + v.thumbTranscodeUrl + '&width=150&height=250" ': "";
            html_string += '<li data-item="'+ i +'" class="item"><img src="'+ thumb + '"' + data_src + ' width="150" /><h4>'+v.title+'</h4></li>';
            num_items++;
        });

		PLEX._item_list.html(html_string);

		if(num_items==0) {
			PLEX._section_meta.text("No items in this collection");
			PLEX._item_list_status.html("<p>There are no items to display in this collection.</p>").show();
		} else {
			PLEX._item_list_status.hide();
			PLEX._section_meta.text(number_format(num_items)+" "+inflect(num_items,"item")+" in this collection");
		}

		$(document).trigger("scroll");
	}, // end func: display_items


	filter_items_by_term: function(all_items, term) {
		var term = term.toLowerCase();
		if(term=="") {
			return all_items;
		}
		var items_to_show = {};
		$.each(all_items, function(key, item){
			var title = item.title.toLowerCase();
			if(title.indexOf(term) === -1) return;
			items_to_show[key] = item;
		});
		return items_to_show;
	}, // end func: filter_items_by_term


	filter_items_by_genre: function(all_items, genre) {
		if(genre == "all") return all_items;
		var items_to_show = {};
		$.each(all_items, function(key, item){
            if(!item.hasOwnProperty("Genre")) return;
            if(!$.isArray(item.Genre)) item.Genre = [item.Genre];
            $.each(item.Genre, function(i,g){
                if(g.tag == genre) {
                    items_to_show[key] = item;
                    return false;
                }
            });
		});
		return items_to_show;
	}, // end func: filter_items_by_genre


	filter_items_by_director: function(all_items, director) {
		if(director == "all") return all_items;
		var items_to_show = {};
		$.each(all_items, function(key, item){
            if(!item.hasOwnProperty("Director")) return;
            if(!$.isArray(item.Director)) item.Director = [item.Director];
            $.each(item.Director, function(i,d){
                if(d.tag == director) {
                    items_to_show[key] = item;
                    return false;
                }
            });
		});
		return items_to_show;
	}, // end func: filter_items_by_director
	
	filter_items_by_seen: function(all_items, seen) {
		if(seen == "all") return all_items;
		var items_to_show = {};
		$.each(all_items, function(key, item) {
			if (seen == "true") {
				if (!item.viewCount) return;
			};
			if (seen == "false") {
				if (Number(item.viewCount) > 0) return;
			};
			items_to_show[key] = item;
		});
		return items_to_show;
	},


	change_sort: function(arg_new_sort_key) {
		var new_sort_key = "title";
        var sort_fn = sortTitle;
		switch(arg_new_sort_key) {
			case "release": new_sort_key = "release"; sort_fn = sortRelease; break;
			case "rating": new_sort_key = "rating"; sort_fn = sortRating; break;
			case "addedAt": new_sort_key = "addedAt"; sort_fn = sortAdded; break;
		}

		if(new_sort_key == PLEX.current_sort_key) {
			PLEX.current_sort_order = (PLEX.current_sort_order=="desc")?"asc":"desc";
		} else {
			PLEX.current_sort_key = new_sort_key;
		}


        var api_order = PLEX.current_sort_order=="desc" ? -1: 1;
        function sortTitle(a,b) {
            if(!a.titleSort) a.titleSort = a.title;
            if(!b.titleSort) b.titleSort = b.title;
            return a.titleSort.toLowerCase() > b.titleSort.toLowerCase()? api_order : a.titleSort.toLowerCase() < b.titleSort.toLowerCase() ? -api_order : 0;
        }
        function sortRelease(a,b) {
            if(!a.originallyAvailableAt) a.originallyAvailableAt = "0000-00-00";
            if(!b.originallyAvailableAt) b.originallyAvailableAt = "0000-00-00";
            return a.originallyAvailableAt > b.originallyAvailableAt ? api_order : a.originallyAvailableAt < b.originallyAvailableAt ? -api_order : 0;
        }
        function sortRating(a,b) {
            if(!a.rating) a.rating = 0;
            if(!b.rating) b.rating = 0;
            return (Number(a.rating) - Number(b.rating))* api_order;
        }
        function sortAdded(a,b) {
            if(!a.addedAt) a.addedAt = 0;
            if(!b.addedAt) b.addedAt = 0;
            return (Number(a.addedAt) - Number(b.addedAt))* api_order;
        }

        PLEX.items.sort(sort_fn);




		$("li", PLEX._sorts_list).removeClass("current");
		$("li em", PLEX._sorts_list).remove();
		$("li[data-sort="+PLEX.current_sort_key+"]", PLEX._sorts_list).addClass("current").append("<em>"+PLEX.current_sort_order+"</em>");

		PLEX.display_section($("li.current", PLEX._sections_list).attr('data-section'));

	}, // end func: change_sort


	change_genre: function(genre) {
		if(typeof genre == "undefined" || genre == PLEX.current_genre) return;
		PLEX.current_director = 'all';
		PLEX.current_genre = genre;
		PLEX.display_section($("li.current", PLEX._sections_list).attr('data-section'));
	}, // end func: change_genre


	change_director: function(director) {
		if(typeof director == "undefined" || director == PLEX.current_director) return;
		PLEX.current_director = director;
		PLEX.display_section($("li.current", PLEX._sections_list).attr('data-section'));
	}, // end func: change_director
	
	change_seen: function(seen) {
		if(typeof seen == "undefined" || seen == PLEX.current_seen) return;
		PLEX.current_seen = seen;
		PLEX.display_section($("li.current", PLEX._sections_list).attr('data-section'));
	},


	display_item: function(item_id) {
		var item_id = parseInt(item_id);
		// Already done
		//PLEX.current_item = PLEX.items[item_id];

        //window.location.hash = PLEX.current_section.key+"/"+PLEX.current_item.key;
		var popup_html = PLEX.generate_item_content(item_id);
		PLEX._popup_overlay.fadeIn().height($(document).height());
		PLEX._popup_container
			.html(popup_html)
			.css({
				top: $(window).scrollTop() + ($(window).height()-PLEX._popup_container.height())/2,
				left: ($(window).width()-PLEX._popup_container.width())/2
			})
			.fadeIn();
	}, // end func: display_item




	generate_item_content: function(item_id) {

		var popup_header = '<div id="popup-header"><p class="right"><span class="popup-close">Close</span></p><p>Library &raquo; '+PLEX.current_section.title+' &raquo; '+PLEX.current_item.title+'</p></div>';

		var _current_item = $("li[data-item='"+item_id+"']", PLEX._item_list);
		var previous_item_id = parseInt(_current_item.prev().attr("data-item"));
		var next_item_id = parseInt(_current_item.next().attr("data-item"));


		PLEX.previous_item_id = (previous_item_id>=0)?previous_item_id:-1;
		PLEX.next_item_id = (next_item_id>=0)?next_item_id:-1;


		var popup_footer = '<div id="popup-footer">';
		if(next_item_id>=0) popup_footer += '<span class="right" data-item="'+next_item_id+'">'+PLEX.items[next_item_id].title+' &raquo;</span>';
		if(previous_item_id>=0) popup_footer += '<span data-item="'+previous_item_id+'">&laquo; '+PLEX.items[previous_item_id].title+'</span></div>';
		popup_footer += '<div class="clear"></div></div>';

		var _img = $("img", _current_item);
		var img_height = "";
		if(_img.attr("data-src")!=undefined) {
			_img.attr("src", _img.attr("data-src")).removeAttr("data-src");
		} else {
			img_height = _img.height();
		}
		var img_thumb = _img.attr("src");

		var popup_sidebar_meta = '<ul>';
		if(PLEX.current_item.duration > 0) {
			var minutes = Math.round(PLEX.current_item.duration/60000);
			popup_sidebar_meta += '<li>Duration: '+minutes+' '+inflect(minutes,'minute')+'</li>';
		}
		if(PLEX.current_item.hasOwnProperty("studio")) popup_sidebar_meta += '<li>Studio: '+PLEX.current_item.studio+'</li>';
		if(PLEX.current_item.hasOwnProperty("year")) popup_sidebar_meta += '<li>Released: '+PLEX.current_item.year+'</li>';
		if(PLEX.current_item.hasOwnProperty("contentRating")) popup_sidebar_meta += '<li>Rated: '+PLEX.current_item.contentRating+'</li>';
		//TODO: update to new data model
        if(PLEX.current_item.hasOwnProperty("num_seasons")) popup_sidebar_meta += '<li>Seasons: '+PLEX.current_item.num_seasons+'</li>';
		if(PLEX.current_item.hasOwnProperty("num_episodes")) popup_sidebar_meta += '<li>Episodes: '+PLEX.current_item.num_episodes+'</li>';
		if(PLEX.current_item.hasOwnProperty("view_count")) popup_sidebar_meta += '<li>Watched: '+PLEX.current_item.view_count+' '+inflect(PLEX.current_item.view_count,'time')+'</li>';

		popup_sidebar_meta += '</ul>';
		var popup_sidebar = '<div id="popup-sidebar"><img src="'+img_thumb+'" width="150" height="'+img_height+'" />'+popup_sidebar_meta+'</div>';

		var rating_tag = '';
		if(PLEX.current_item.hasOwnProperty("user_rating")) {
            //TODO: figure out the name of the property in my object
			var rating = PLEX.current_item.user_rating;
			var rating_source = 'user';
		} else if(PLEX.current_item.hasOwnProperty("rating")) {
			var rating = PLEX.current_item.rating;
			var rating_source = 'plex';
		}
		if(rating) {
			var rating_class = "rating_"+Math.round(rating)/2*10;
			rating_tag = '<span class="rating rating_'+rating_source+' '+rating_class+'"></span>';
		}

		var popup_content = '<div id="popup-content">'+rating_tag+'<h3>'+PLEX.current_item.title+'</h3>';

		if(PLEX.current_item.hasOwnProperty("tagline")) popup_content += '<h4>'+PLEX.current_item.tagline+'</h4>';
		if(PLEX.current_item.hasOwnProperty("summary")) popup_content += '<div id="popup-summary"><p>'+PLEX.current_item.summary+'</p></div>';

		if(
			PLEX.current_item.hasOwnProperty("Director") ||
			PLEX.current_item.hasOwnProperty("Genre") ||
			PLEX.current_item.hasOwnProperty("Role") ||
			PLEX.current_item.hasOwnProperty("Media")
		) {
			popup_content += '<ul id="popup-content-meta">';
			if(PLEX.current_item.hasOwnProperty("Director")) {
                var d = $.isArray(PLEX.current_item.Director) ? PLEX.current_item.Director : [PLEX.current_item.Director];
                popup_content += '<li><strong>Directed by:</strong> '+PLEX.joinOnObjectArray(d, ", ", "tag")+'</li>';
            }
			if(PLEX.current_item.hasOwnProperty("Role")) {
                var r = $.isArray(PLEX.current_item.Role) ? PLEX.current_item.Role : [PLEX.current_item.Role];
                popup_content += '<li><strong>Starring:</strong> '+PLEX.joinOnObjectArray(r, ", ", "tag")+'</li>';
            }
			if(PLEX.current_item.hasOwnProperty("Genre")) {
                var g = $.isArray(PLEX.current_item.Genre) ? PLEX.current_item.Genre : [PLEX.current_item.Genre];
                popup_content += '<li><strong>Genre:</strong> '+PLEX.joinOnObjectArray(g, ", ", "tag")+'</li>';
            }
			if(PLEX.current_item.hasOwnProperty("Media")) {
				var media = PLEX.current_item.Media;

                // Compute total size as media can be composed of multiple parts.
                media.total_size = 0;
                $.each(media.Part, function(i,v) { media.total_size += Number(v.size);});

				popup_content += '<li><strong>Video:</strong> codec: '+media.videoCodec+', framerate: '+media.videoFrameRate+ ((media.videoResolution != undefined && media.videoResolution>0)?', vert: '+media.videoResolution:'') + ((media.aspectRatio != undefined && media.aspectRatio>0)?', aspect ratio: '+media.aspectRatio:'') +'</li>';
				//popup_content += '<li><strong>Audio:</strong> codec: '+media.audioCodec+', channels: '+media.audioChannels+'</li>';
                popup_content += PLEX.generate_audiostream_content(media.Part[0]);
                popup_content += PLEX.generate_subtitle_stream(media.Part[0]);
				if(media.total_size != false) popup_content += '<li><strong>File:</strong> '+hl_bytes_to_human(media.total_size)+' @ '+media.bitrate+'kbps</li>';

                popup_content += '<li class="playMovie" data-movie="'+ PLEX.current_item.ratingKey +'"><strong>Play: </strong><img src="images/play_button.png" height="16" /></li>'
			}
			popup_content += '</ul>';
		}

		if(PLEX.current_item.leafCount && Number(PLEX.current_item.leafCount)>0) {
			popup_content += '<div id="popup_seasons"><h4>Season Browser</h4><table><tr><td id="popup_seasons_seasons"><ul>';

            if(!$.isArray(PLEX.current_item.episodes)) PLEX.current_item.episodes = [PLEX.current_item.episodes];
            var seasons = {}
            $.each(PLEX.current_item.episodes, function(i,v) {
                if(!seasons.hasOwnProperty(v.parentIndex)) {
                    popup_content += '<li data-season="'+ v.parentIndex +'">Season '+ v.parentIndex+'</li>';
                    seasons[v.parentIndex] = true;
                }
            });
			popup_content += '</ul></td><td id="popup_seasons_episodes"></td><td id="popup_seasons_episode"></td></tr></table></div>';

			$("#popup_seasons_seasons li").live("click", function(){
				$("#popup_seasons_seasons li").removeClass("current");
				$(this).addClass("current");
				var season_key = $(this).attr("data-season");
				var html = '<ul>';
				$.each(PLEX.current_item.episodes, function(i, episode){
                    if(episode.parentIndex == season_key) {
                        html += '<li data-season="'+season_key+'" data-episode="'+ i +'">'+episode.index+'. '+episode.title+'</li>';
                    }
				});
				html += '</ul>';
				$("#popup_seasons_episodes").html(html);
			});

			$("#popup_seasons_episodes li").live("click", function(){
				$("#popup_seasons_episodes li").removeClass("current");
				$(this).addClass("current");
                var episode_key = Number($(this).attr("data-episode"));
				var episode = PLEX.current_item.episodes[episode_key];
				var minutes = Math.round(episode.duration/60000);
				var html = '<h5>'+episode.title+'</h5><img class="playMovie" data-movie="'+ episode.ratingKey +'"src="images/play_button.png" height="16" /><p class="meta">'+episode_tag(episode)+' | '+minutes+' '+inflect(minutes,'minute')+' | Rated '+episode.rating+'</p><p>'+episode.summary+'</p>';
                //html += "<ul>";
                //html += PLEX.generate_audiostream_content(episode.Media.Part[0]);
                //html += PLEX.generate_subtitle_stream(episode.Media.Part[0]);
                //html += "</ul>";
				$("#popup_seasons_episode").html(html);
			});

		} // end SEASON BROWSER

		popup_content += '</div>';

        var popup_player = '<div id="popup-content-player"><div id="popup-player"></div></div>';

		return popup_header + '<div id="popup-outer"><div id="popup-inner">' + popup_sidebar + popup_player + popup_content + '<div class="clear"></div></div>' + popup_footer + '</div>';

	}, // end func: generate_item_content


	hide_item: function() {
		PLEX.popup_visible = false;
		//window.location.hash = PLEX.current_section.key;
		PLEX._popup_overlay.fadeOut();
		PLEX._popup_container.fadeOut();
	}, // end func: hide_item


	run: function() {
        /*
		if(!PLEX.data_loaded) {
			$.get("plex-data/data.js", function(data){
				eval(data); // unpack
				PLEX.load_data(raw_plex_data);
				return PLEX.run();
			});
			return;
		}*/

        PLEX._servers_list = $("#plex_servers_list");
		PLEX._sections_list = $("#plex_section_list");
		PLEX._sorts_list = $("#plex_sort_list");
		PLEX._genre_list_section = $("#plex_genre_list_section").hide();
		PLEX._genre_list = $("#plex_genre_list");
		PLEX._director_list_section = $("#plex_director_list_section").hide();
		PLEX._director_list = $("#plex_director_list");
		PLEX._seen_list_section = $("#plex_seen_list_section");
		PLEX._seen_list = $("#plex_seen_list");
		PLEX._section_title = $("#section-header h2");
		PLEX._section_meta = $("#section-header p");
		PLEX._section_filter = $("#section-header input");
		PLEX._item_list_status = $("#item-list-status");
		PLEX._item_list = $("#item-list ul");
		PLEX._popup_overlay = $("#popup-overlay");
		PLEX._popup_container = $("#popup-container");

        PLEX.load_servers();
        return;
    },
    init_event_handlers: function() {
        $(PLEX._servers_list).on("click", "li", function(){
            PLEX.display_server($(this).attr("data-server"));
        });

		$(PLEX._sections_list).on("click","li", function(){
            PLEX.display_section($(this).attr("data-section"));
		});

		$(PLEX._sorts_list).on("click", "li" ,function(){
			PLEX.change_sort($(this).attr('data-sort'));
		});

		$(PLEX._genre_list).on("click", "li", function(){
			PLEX.change_genre($(this).attr('data-genre'));
		});

		$(PLEX._director_list).on("click", "li", function(){
			PLEX.change_director($(this).attr('data-director'));
		});
		
		$(PLEX._seen_list).on("click", "li", function(){
			PLEX.change_seen($(this).attr('data-seen'));
		});

		$(document).on("click", "#genre_show_all", function(){
			PLEX.show_all_genres = true;
			$(".genre_hidden").show();
			$("#genre_show_all").hide();
			$("#genre_hide_all").show();
		});

		$(document).on("click", "#genre_hide_all", function(){
			PLEX.show_all_genres = false;
			$(".genre_hidden").hide();
			$("#genre_hide_all").hide();
			$("#genre_show_all").show();
		});

		$(document).on("click", "#director_show_all", function(){
			PLEX.show_all_directors = true;
			$(".director_hidden").show();
			$("#director_show_all").hide();
			$("#director_hide_all").show();
		});

		$(document).on("click", "#director_hide_all", function(){
			PLEX.show_all_directors = false;
			$(".director_hidden").hide();
			$("#director_hide_all").hide();
			$("#director_show_all").show();
		});

		PLEX._section_filter.keyup(function(){
			PLEX.display_section($("li.current", PLEX._sections_list).attr('data-section'));
		});

		$(PLEX._item_list).on("click", "li", function(){
            PLEX.load_item($(this).attr("data-item"));
		});

		$(document).on("click", "#popup-footer span", function(){
            PLEX.load_item($(this).attr("data-item"));
		});


		PLEX._popup_overlay.click(function(){
            if(!PLEX.checkCloseOverlay()) return;
            PLEX.hide_item();
            PLEX.transcodeStop();
		});

		$(document).on("click",".popup-close", function(){
            if(!PLEX.checkCloseOverlay()) return;
			PLEX.hide_item();
            PLEX.transcodeStop();
		});

		$("#toggle_sidebar").on("click", function(){
			$("#sidebar").toggle();
			return false;
		});

        $(document).on("click", ".playMovie", function(event) {
            var e = $(this);
            var ratingKey = e.attr("data-movie");
            PLEX.playMedia(ratingKey);
        });

        $("#sign_out").on("click", function(event) {
            $.ajax({
                type: "GET",
                url: "/logout",
                dataType: "json",
                success: function(data, textStatus, jqXHR) {
                    console.log("Signed out");
                    PLEX.display_login();
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log("Sign out failed");
                }
            })
        });


        $(document).on("inview","img[data-src]", function(event, isInView, visiblePartX, visiblePartY) {
            if(!isInView) return;
            var img = $(this);
            // Show a smooth animation
            img.fadeTo(0, 0);
            img.load(function() { img.fadeTo(300, 1); });
            // Change src
            img.attr('src', img.attr('data-src'));
            // Remove it from live event selector
            img.removeAttr('data-src');
        });

        $(document).on("change", ".audio-stream", function(event) {
            var select = $(this);
            var selected = select.find("option:selected");
            var streamId = selected.attr("data-audio");

            $.ajax({
                url: "/servers/" + PLEX.current_server.machineIdentifier + "/library/movies/" + PLEX.current_item.ratingKey + "/audioStream",
                type: "PUT",
                data: {
                    "audioStreamId": streamId
                },
                success: function(data, textStatus, jqXHR) {
                    //codec: ' + codec + ', channels: ' + channels
                    $.each(PLEX.current_item.Media.Part[0].Stream, function(i,e) {
                        if(e.id == streamId) {
                            $("span.audio-details").html("codec: " + e.codec + ", channels: " + e.channels);
                            return false;
                        }
                    });
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    $("span.audio-details").html("Failed");
                }
            });

        });

        $(document).on("change", ".subtitle-stream", function(event) {
            var select = $(this);
            var selected = select.find("option:selected");
            var streamId = selected.attr("data-subtitle");

            $.ajax({
                url: "/servers/" + PLEX.current_server.machineIdentifier + "/library/movies/" + PLEX.current_item.ratingKey + "/subtitleStream",
                type: "PUT",
                data: {
                    "subtitleStreamId": streamId
                },
                success: function(data, textStatus, jqXHR) {
                    //codec: ' + codec + ', channels: ' + channels
                    if(streamId == "") {
                        $("span.subtitle-details").html("");
                    }
                    $.each(PLEX.current_item.Media.Part[0].Stream, function(i,e) {
                        if(e.id == streamId) {
                            $("span.subtitle-details").html("type: " + e.format);
                            return false;
                        }
                    });
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    $("span.subtitle-details").html("Failed");
                }
            });

        });

	}, // end func: run

    display_login: function() {
        var login_html = PLEX.generate_login_content();
        PLEX.setCloseOverlay(false);
        PLEX._popup_overlay.fadeIn().height($(window).height());
        PLEX._popup_container
            .html(login_html)
            .css({
                top: $(window).scrollTop() + ($(window).height()-PLEX._popup_container.height())/2,
                left: ($(window).width()-PLEX._popup_container.width())/2
            })
            .fadeIn();

        return;
    },
    handle_signin: function() {
        var data = {};
        data.username = $("#popup-content input[name='username']").val();
        data.password = $("#popup-content input[name='password']").val();
        console.log("Logging in " + data.username);
        $.ajax({
            type: "POST",
            url: "/login",
            data: data,
            dataType: "json",
            success: function(data, textStatus, jqXHR) {
                console.log("Signed in");
                // Hide the login form
                PLEX.setCloseOverlay(true);
                PLEX._popup_overlay.fadeOut();
                PLEX._popup_container.fadeOut();
                PLEX.load_servers();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log("Sign in failed");
                $('#signInMessage').html("Invalid username/password")
            }
        });
        return false;
    },
    load_servers: function() {
        $.ajax({
            url: "/servers/",
            dataType: "json",
            success: function(data, textStatus, jqXHR) {
                console.log("Loaded servers");
                PLEX.servers = data.plexServers;
                PLEX.display_servers_list();

                PLEX.init_event_handlers();

                $("li:first", PLEX._servers_list).click();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log("Load servers failed");
                if(jqXHR.status == 401) {
                    PLEX.display_login();
                } else {
                    console.log(errorThrown);
                }
            }
        });

    },

    display_servers_list: function() {
        var server_list_html = '';
        $.each(PLEX.servers, function(i,v){
            server_list_html += '<li data-server="'+ i +'"><span>'+v.name+'</span></li>';
        });
        PLEX._servers_list.html(server_list_html);
    },

    display_server: function (server_id) {
        if(PLEX.servers[server_id].machineIdentifier == PLEX.current_server.machineIdentifer) return;
        PLEX.current_server = PLEX.servers[server_id];
        //window.location.hash = server_id;

        $("li", PLEX._servers_list).removeClass("current");
        $("li[data-server="+server_id+"]").addClass("current");
        PLEX.load_sections();
    },
    load_sections: function() {
        $.ajax({
            url: "/servers/" + PLEX.current_server.machineIdentifier + "/sections/",
            dataType: "json",
            success: function(data, textStatus, jqXHR) {
                console.log("Loaded sections");
                PLEX.sections = data.sections;

                var numSections = PLEX.sections.length;
                var processedSections = 0;
                var displayedSections = [];

                $.each(PLEX.sections, function(i,section) {
                    if(section.type != "movie" && section.type != "show") {
                        processedSections++;
                        return;
                    }

                    $.ajax({
                        url: "/servers/" + PLEX.current_server.machineIdentifier + "/sections/" + section.key + "/filters/all/",
                        dataType: "json",
                        success: function(data, textStatus, jqXHR) {
                            console.log("Loaded section " + i);
                            section.items = data.videos ? data.videos : data.shows;
                            displayedSections.push(section);
                            displayedSections.sort(function(a,b) {
                                var nameA=a.title.toLowerCase(), nameB=b.title.toLowerCase()
                                if (nameA < nameB) //sort string ascending
                                    return -1;
                                if (nameA > nameB)
                                    return 1;
                                return 0; //default return value (no sorting)
                            });

                            processedSections++;
                            if(processedSections == numSections) {
                                PLEX.sections = displayedSections;
                                PLEX.display_sections_list();
                                $("li:first", PLEX._sections_list).click();
                            }
                        },
                        error: function(jqXHR, textStatus, errorThrown) {
                            console.log("Load section failed " + i);
                            processedSections++;
                            if(jqXHR.status == 401) {
                                PLEX.display_login();
                            } else {
                                console.log(errorThrown);
                            }
                        }
                    });
                });
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log("Load sections failed");
                if(jqXHR.status == 401) {
                    PLEX.display_login();
                } else {
                    PLEX._item_list_status.html('<div id="server-error">Could not contact Plex Media Server ' + PLEX.current_server.name +' (' + PLEX.current_server.host +':' + PLEX.current_server.port +')</div>').show();
                    PLEX._item_list.html('');
                    console.log(errorThrown);
                }
            }
        });

    },
    generate_audiostream_content: function(part) {
        //'<li><strong>Audio:</strong> codec: '+media.audioCodec+', channels: '+media.audioChannels+'</li>'
        var codec = "";
        var channels = "";
        var content = '<li><strong>Audio:</strong>';
        if(!$.isArray(part['Stream'])) part['Stream'] = [part['Stream']];

        content += '<select class="audio-stream" data-part="' + part.id +'">';
        $.each(part.Stream, function(i,e) {
            // Only take audio stream
            if(!e.hasOwnProperty('streamType') || e.streamType != 2) {
                return;
            }
            content += '<option ' + (e.hasOwnProperty('selected') ? 'selected="selected" ': '') + ' data-audio="' + e.id + '">' + (e.hasOwnProperty('language') ? e.language : 'unknown') + '</option>'

            if(e.hasOwnProperty('selected')) {
                codec = e.codec;
                channels = e.channels;
            }
        });
        content += '</select>'
        content += '<span class="audio-details">codec: ' + codec + ', channels: ' + channels + '</span>';
        content += '</li>';
        return content;
    },
    generate_subtitle_stream: function(part) {
        var i = 0;
        var type = "";
        var content = '<li><strong>Subtitles:</strong>';
        if(!$.isArray(part['Stream'])) part['Stream'] = [part['Stream']];

        content += '<select class="subtitle-stream">';
        content += '<option data-subtitle="">None</option>';
        $.each(part.Stream, function(i,e) {
            // Only take audio stream
            if(!e.hasOwnProperty('streamType') || e.streamType != 3) {
                return;
            }
            content += '<option ' + (e.hasOwnProperty('selected') ? 'selected="selected" ': '') + ' data-subtitle="' + e.id + '">' + (e.hasOwnProperty('language') ? e.language : 'Unknown') + '</option>'

            if(e.hasOwnProperty('selected')) {
                type = e.format;
            }
        });
        content += '</select>'
        content += '<span class="subtitle-details">' + (type ? 'type: ' + type : "") + '</span>';
        content += '</li>';
        return content;
    },
    load_items: function(section_id) {
        $.ajax({
            url: "/servers/" + PLEX.current_server.machineIdentifier + "/sections/" + PLEX.sections[section_id].key + "/filters/all/",
            dataType: "json",
            success: function(data, textStatus, jqXHR) {
                console.log("Loaded section");
                PLEX.items = data.videos ? data.videos : data.shows;
                PLEX.display_section(section_id);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log("Load section failed");
                if(jqXHR.status == 401) {
                    PLEX.display_login();
                } else {
                    console.log(errorThrown);
                }
            }
        });

    },
    load_item: function(item_id) {
        var url = "/servers/" + PLEX.current_server.machineIdentifier + "/library/";
        if(PLEX.current_section.type == "movie") {
            url += "movies/" + PLEX.items[item_id].ratingKey +"/";
        } else {
            url += "shows/" + PLEX.items[item_id].ratingKey + "/seasons/allLeaves/episodes/";
        }
        $.ajax({
            url: url,
            dataType: "json",
            success: function(data, textStatus, jqXHR) {
                console.log("Loaded item");
                if(data.show) data.show.episodes = data.episodes;
                PLEX.current_item = data.video ? data.video : data.show;
                PLEX.display_item(item_id);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log("Load item failed");
                if(jqXHR.status == 401) {
                    PLEX.display_login();
                } else {
                    console.log(errorThrown);
                }
            }
        });
    },
    build_genres_list: function(items) {
        var genres = {};
        var result = [];
        $.each(items, function(key,item) {
            //No Genre at all
            if(!item.hasOwnProperty("Genre")) return;
            // Only one genre, in which case, it's a Genre object directly
            if(!$.isArray(item.Genre)) item.Genre = [item.Genre];
            $.each(item.Genre, function(i,genre) {
                if(!genre.hasOwnProperty("tag")) {
                    return;
                }
                if(!genres.hasOwnProperty(genre.tag)) {
                    genres[genre.tag] = {genre: genre.tag, count: 1};
                } else {
                    genres[genre.tag].count = genres[genre.tag].count + 1;
                }
            });
        });
        $.each(genres, function(key, item) {
             result.push(item);
        });
        result.sort(function(a,b) {
            // By decreasing count if equal by alphabetical order
            if(a.count > b.count) return -1;
            if(a.count < b.count) return 1;
            if(a.genre > b.genre) return -1;
            if(a.genre < b.genre) return 1;
            return 0;
        });
        return result;
    },
    playMedia: function(mediaId) {
        $("#popup-content").hide();
        $("#popup-content-player").show();
        // We use movies even for tvshows as on plex side it does not make a difference (everything is in library/metadata/
        // It could pose pb at the frond end side but actually works.
        var quality = $("#video_quality").val();
        var url = "/servers/" + PLEX.current_server.machineIdentifier + "/library/movies/" + mediaId +"/hls/start.json?quality=" + quality;

        $.ajax({
            url: url,
            dataType: "json",
            success: function(data, textStatus, jqXHR) {
                console.log("Got playlist");
                jwplayer('popup-player').setup({
                    wmode: "gpu",
                    modes: [
                        {
                            type:'html5',
                            config: {
                                file: data.transcodeURL
                            }
                        },
                        {
                            type: 'flash',
                            src:  '/public/swf/player.swf',
                            config: {
                                file: data.transcodeURL,
                                provider:'/public/swf/adaptiveProvider.swf'
                            }
                        }
                    ],
                    autostart: true
                });

                PLEX.transcodeId = data.transcodeId;

                //jwplayer('popup-player').onPlay();
                //jwplayer('popup-player').onPause();
                //jwplayer('popup-player').onIdle();

            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log("Load playlist failed");
                if(jqXHR.status == 401) {
                    PLEX.display_login();
                } else {
                    console.log(errorThrown);
                }
            }

        });
    },
    joinOnObjectArray: function(array, separator, key) {
        var result = "";
        var l = array.length;
        $.each(array, function(i,v) {
            result += v[key]
            if(i < l-1) result += separator;
        });
        return result;
    },
    generate_login_content: function() {
        var popup_header = '<div id="popup-header"><p class="right"><span class="popup-close">Close</span></p><p>myPlex sign in</p></div>';


        var popup_footer = '<div id="popup-footer">';
        popup_footer += '<div class="clear"></div></div>';


        var popup_content = '<div id="popup-content">';
        popup_content += '<form id="myplex-login" action="login" onsubmit="return PLEX.handle_signin();">';
        popup_content += '<div><h3 id="signInMessage"></h3></div>'
        popup_content += '<div><h3><label for="username">Username:</label></h3></div><div><input type="text" name="username" size="64" value="" required="required" /></div>';
        popup_content += '<div><h3><label for="password">Password:</label></h3></div><div><input type="password" name="password" size="64" value="" required="required" /></div>';
        popup_content += '<div><input type="submit" value="Sign in" id="signInButton"/></div>'
        popup_content += '</form>'
        popup_content += '</div>';

        return popup_header + '<div id="popup-outer"><div id="popup-inner">' + popup_content + '<div class="clear"></div></div>' + popup_footer + '</div>';

    },
    checkCloseOverlay: function() {
        return PLEX.canCloseOverlay;
    },
    setCloseOverlay: function(state) {
        PLEX.canCloseOverlay = state;
    },
    transcodeStop: function() {
        if(PLEX.transcodeId) {
            $.ajax({
                url: "/playback/" + PLEX.transcodeId,
                dataType: "json",
                type: "DELETE"
            });
            PLEX.transcodeId = false;
        }
    },
    transcodePing: function() {
        if(PLEX.transcodeId) {
            $.ajax({
                url: "/playback/" + PLEX.transcodeId + "/state/ping",
                dataType: "text",
                type: "PUT"
            });
        }
    }

}; // end class: PLEX
