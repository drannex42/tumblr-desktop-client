// ==UserScript==
// @name        Retags for Tumblr
// @namespace   http://alexhong.net/
// @version     1.0
// @description Retags is a Tumblr extension that makes tag reading easy.
// @grant       GM_xmlhttpRequest
// @include     *://www.tumblr.com/*
// @require     https://code.jquery.com/jquery-2.0.3.min.js
// @downloadURL https://github.com/alexhong/tumblr-retags/raw/master/tumblr-retags.user.js
// @icon        https://raw.githubusercontent.com/alexhong/tumblr-retags/master/icons/icon64.png
// ==/UserScript==

//* TITLE Retags **//
//* DEVELOPER alexhong **//
//* VERSION 1.0 **//
//* DESCRIPTION Retags is a Tumblr extension that makes tag reading easy. **//
//* FRAME false **//
//* SLOW false **//
//* BETA false **//

var retags = {
	version: '1.0',
	api_key: '3DFxEZm0tGISOmdvWe9Fl1QsQMo1LFqEatnc8GQ68wgF1YTZ4w',
	selectors: '.reblog,.is_reblog,.notification_reblog',
	observer: new MutationObserver(function(ms){
		ms.forEach(function(m){
			retags.tag($(m.addedNodes).filter(retags.selectors));
		});
	}),
	init: function() {
		var path = location.pathname.split('/');
		this.page = {
			path: path,
			blog_name: path[2],
			is_dash: path[1] === 'dashboard',
			is_activity: path[3] === 'activity'
		};
		this.css.appendTo('head');
		if (this.page.is_activity) {
			this.settings.init();
			this.toggle.init();
		}
		this.observer.observe(document,{childList:true,subtree:true});
		this.tag(retags.selectors);
	},
	destroy: function() {
		this.css.detach();
		if (this.page.is_activity) {
			this.settings.destroy();
			this.toggle.destroy();
		}
		this.observer.disconnect();
		$('.retags').remove();
	},
	tag: function(el) {
		$(el).each(function(){
			var $t = $(this), cls, $c, url;
			if ($t.find('.retags').length) {
				return false;
			}
			// popover
			if ($t.hasClass('note')) {
				cls = 'with_commentary';
				$c = $t;
				url = $c.find('.action').data('post-url');
			// Activity
			} else if ($t.hasClass('ui_note')) {
				if ($t.find('.part_response').length) {
					$t.addClass('is_response');
				}
				cls = 'is_retags';
				$c = $t.find('.stage');
				url = $c.find('.part_glass').attr('href');
			// dashboard
			} else if ($t.hasClass('notification')) {
				$c = $t.find('.notification_sentence');
				url = $c.find('.notification_target').attr('href');
			}
			if (url) {
				url = url.split('/');
				var host = url[2], id = url[4], name = 'rt_'+id;
				if (localStorage && localStorage.getItem(name) !== null) {
					retags.append($t,cls,$c,JSON.parse(localStorage.getItem(name)));
				} else {
					retags.request($t,cls,$c,name,'https://api.tumblr.com/v2/blog/'+host+'/posts/info?id='+id+'&api_key='+retags.api_key);
				}
			}
		});
	},
	request:
		(typeof GM_xmlhttpRequest !== 'undefined')
		// if userscript or XKit
		? function($t,cls,$c,name,url) {
			GM_xmlhttpRequest({
				method: 'GET',
				url: url,
				onload: function(data) {
					var tags = JSON.parse(data.responseText).response.posts[0].tags;
					retags.append($t,cls,$c,tags);
					retags.store(name,JSON.stringify(tags));
				},
				onerror: function(data) {
					retags.append($t,cls,$c,'ERROR: '+data.status);
				}
			});
		}
		// if Chrome extension
		: function($t,cls,$c,name,url) {
			$.getJSON(url,function(data){
				var tags = data.response.posts[0].tags;
				retags.append($t,cls,$c,tags);
				retags.store(name,JSON.stringify(tags));
			}).fail(function(jqXHR,status,error){
				retags.append($t,cls,$c,status.toUpperCase()+': '+(error||jqXHR.status));
			});
		}
	,
	append: function($t,cls,$c,tags) {
		if (tags.length) {
			var $retags = $('<div class="retags">');
			if (typeof tags === 'string') {
				$retags.append(tags).addClass('error');
			} else {
				tags.forEach(function(tag){
					if (retags.settings.ignore.indexOf(tag.toLowerCase()) === -1) {
						$retags.append('<a href="//tumblr.com/tagged/'+tag.replace(/ /g,'-')+'">#'+tag+'</a>');
					}
				});
			}
			if ($retags.html()) {
				$t.addClass(cls);
				$c.append($retags);
			}
		}
	},
	store: function(name,value) {
		if (localStorage) {
			try {
				localStorage.setItem(name,value);
			} catch(e) {
				localStorage.clear();
				localStorage.setItem(name,value);
			}
		}
	},
	settings: {
		ignore: [],
		button: $('.part-toggle>span'),
		original: $('.part-toggle>span').clone(),
		modal:
		$('<div id="retags-modal" class="ui_dialog_pos">\
			<div class="ui_dialog add_animation fadeIn" style="width:350px;max-width:none;overflow:hidden">\
				<header class="text"><b>Retags</b> <small></small><a target="_blank" href="http://lx.tumblr.com/retags"><i class="icon_help"></i></a></header>\
				<span class="text">Ignore these tags in <b></b>&#8217;s activity:</span>\
				<textarea id="retags-ignore" autocomplete="off" spellcheck="false" placeholder="separate with commas"></textarea>\
				<div class="buttons"><div class="tab_frame"><button class="cancel ui_button chrome">Cancel</button></div><div class="tab_frame"><button class="apply ui_button chrome blue">Apply</button></div></div>\
			</div>\
		</div>'),
		init: function() {
			this.ignore = JSON.parse(cookie.get('rt_ignore')) || [];
			if (this.ignore.length) {
				this.button.attr('data-ignored',this.ignore.length);
			}
			this.button.attr('id','retags-settings').html('<i class="icon_settings"</i>').click(function(){
				retags.settings.open(retags.settings.ignore.join(', '));
			});
			this.modal.find('small').text(retags.version);
			this.modal.find('span.text b').text(retags.page.blog_name);
			this.modal.find('textarea').keydown(function(e){e.stopPropagation();});
			this.modal.find('button.cancel').click(function(){
				retags.settings.close();
			});
			this.modal.find('button.apply').click(function(){
				var val = $('#retags-ignore').val().trim().toLowerCase();
				if (val === retags.settings.val) {
					retags.settings.close();
				} else {
					var tags = val.split(',').map(function(tag){
						return tag.trim();
					}).sort().reduce(function(a,b){
						if (b && a.slice(-1)[0] !== b) {
							a.push(b);
						}
						return a;
					},[]);
					cookie.set('rt_ignore',JSON.stringify(tags),30);
					location.reload();
				}
			});
		},
		destroy: function() {
			this.button.replaceWith(this.original);
			this.close();
		},
		open: function(val) {
			$('.ui_dialog_lock').addClass('opaque').show();
			this.modal.appendTo('body');
			$('#retags-ignore').focus().val(val);
			this.val = val;
		},
		close: function() {
			$('.ui_dialog_lock').removeClass('opaque').hide();
			this.modal.detach();
		}
	},
	toggle: {
		css: $('<style>.ui_note { display: none; } .ui_note.is_retags, .ui_note.is_response, .ui_note.is_reply, .ui_note.is_photo_reply, .ui_note.is_answer, .ui_note.is_user_mention { display: block; }</style>'),
		html: $('<label id="retags-toggle" class="binary_switch"><input type="checkbox"><span class="binary_switch_track"></span><span class="binary_switch_button"></span></label>'),
		init: function() {
			this.html.appendTo('.part-toggle').find('input').change(function(){
				if ($(this).prop('checked')) {
					retags.toggle.css.appendTo('head');
					cookie.set('rt_toggle',1,30);
				} else {
					retags.toggle.css.detach();
					cookie.remove('rt_toggle');
				}
			});
			if (cookie.get('rt_toggle')) {
				$('#retags-toggle input').click();
			}
		},
		destroy: function() {
			this.css.detach();
			this.html.detach();
		}
	},
	css:
	$('<style>\
		#retags-settings { color: inherit; cursor: pointer; }\
		#retags-settings i { color: #9da6b0; font-size: 16px; position: relative; top: 1px; }\
		#retags-settings[data-ignored] i { color: #529ecc; }\
		#retags-settings[data-ignored]:after { content: "\\00a0\\00a0" attr(data-ignored) " ignored"; font-weight: normal; }\
		#retags-modal header { position: relative; margin: -20px -20px 15px; padding: 10px 20px; border-bottom: 1px solid #ddd; background: #fff; line-height: 20px; }\
		#retags-modal small { color: #999; font-size: 11px; }\
		#retags-modal header a { opacity: 0.5; position: absolute; top: 5px; right: 15px; color: #999; padding: 5px; font-size: 16px; }\
		#retags-modal header a:hover { opacity: 1; }\
		#retags-ignore { display: block; resize: vertical; width: 100%; min-height: 117px; margin-top: 15px; line-height: 1.4; -webkit-box-sizing: border-box; -moz-box-sizing: border-box; box-sizing: border-box; }\
		#retags-toggle { top: -1px; margin-left: 15px; }\
		#retags-toggle:after { content: "\\00a0\\00a0Show only retags / responses"; position: absolute; top: 0; left: 24px; line-height: 14px; white-space: nowrap; }\
		.ui_notes .date_header .part_full_date.stuck { width: 165px; margin-left: 400px; }\
		.retags { white-space: normal; margin-top: 10px; overflow: hidden; }\
		.retags.error { color: #c00000; }\
		.retags + .retags:before { color: #c00000; content: "Warning: You are running multiple copies of Retags."; }\
		.retags + .retags a { display: none; }\
		.retags a { color: #a7a7a7 !important; position: relative; margin-right: 11px; text-decoration: none; }\
		.retags a:hover { color: #969696 !important; }\
		.note .retags { font-size: 12px; line-height: 1.3; }\
		.note .retags a { margin-right: 9px; }\
		.post_notes .notes_outer_container.popover .note.with_commentary span.action { min-height: 0; }\
		.notification .retags a { color: rgba(255,255,255,0.3) !important; }\
		.notification .retags a:hover { color: rgba(255,255,255,0.4) !important; }\
		.ui_note .retags { margin-top: 0; padding: 40px 50px 13px; }\
		.ui_note .retags + .retags { margin-top: -5px; padding-top: 0; }\
		.ui_note .part_response + .retags { margin-top: -7px; padding-top: 0; }\
		.post_full .post_tags { white-space: normal; padding-top: 1px; padding-bottom: 1px; line-height: 18px; }\
		.post_full .post_tags:after { display: none; }\
		.post_full .post_tags .post_tag, .post_full .post_tags .post_tag.featured { display: inline; padding-top: 2px; padding-bottom: 2px; }\
		.post_full .post_tags .post_tag:after, .retags a:after { content: "\\00a0  "; font-size: 0; line-height: 0; }\
	</style>')
};

var cookie = {
	set: function(name,value,days) {
		var expires = '';
		if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			expires = '; expires='+date.toGMTString();
		}
		document.cookie = name+'='+value+expires;
	},
	get: function(name) {
		var nameEQ = name+'=';
		var ca = document.cookie.split(';');
		for (var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1,c.length);
			}
			if (c.indexOf(nameEQ) == 0) {
				return c.substring(nameEQ.length,c.length);
			}
		}
		return null;
	},
	remove: function(name) {
		cookie.set(name,'',-1);
	}
};

retags.init();

// (typeof XKit === 'undefined')
// ? retags.init()
// : XKit.extensions.Lx_retags = {
//  	running: false,
// 	run: function() {
// 		this.running = true;
// 		retags.init();
// 	},
// 	destroy: function() {
// 		this.running = false;
// 		retags.destroy();
// 	}
// };
