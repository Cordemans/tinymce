/**
 * ScriptLoader.js
 *
 * Copyright 2009, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 * Contributing: http://tinymce.moxiecode.com/contributing
 */

(function(tinymce) {
	tinymce.dom.ScriptLoader = function(settings) {
		var LOADING = 1,
			LOADED = 2,
			states = {},
			queue = [];

		/**
		 * Loads a specific script directly without adding it to the load queue.
		 *
		 * @method load
		 * @param {String} url Absolute URL to script to add.
		 * @param {function} callback Optional callback function to execute ones this script gets loaded.
		 * @param {Object} scope Optional scope to execute callback in.
		 */
		function loadScript(url, callback) {
			var t = this, dom = tinymce.DOM, elm, uri, loc, id;

			// Execute callback when script is loaded
			function done() {
				dom.remove(id);

				if (elm)
					elm.onreadystatechange = elm.onload = elm = null;

				callback();
			};

			id = dom.uniqueId();

			if (tinymce.isIE6) {
				uri = new tinymce.util.URI(url);
				loc = location;

				// If script is from same domain and we
				// use IE 6 then use XHR since it's more reliable
				if (uri.host == loc.hostname && uri.port == loc.port && (uri.protocol + ':') == loc.protocol) {
					tinymce.util.XHR.send({
						url : tinymce._addVer(uri.getURI()),
						success : function(content) {
							// Create new temp script element
							var script = dom.create('script', {
								type : 'text/javascript'
							});

							// Evaluate script in global scope
							script.text = content;
							document.getElementsByTagName('head')[0].appendChild(script);
							dom.remove(script);

							done();
						}
					});

					return;
				}
			}

			// Create new script element
			elm = dom.create('script', {
				id : id,
				type : 'text/javascript',
				src : tinymce._addVer(url)
			});

			// Add onload and readystate listeners
			elm.onload = done;
			elm.onreadystatechange = function() {
				var state = elm.readyState;

				// Loaded state is passed on IE 6 however there
				// are known issues with this method but we can't use
				// XHR in a cross domain loading
				if (state == 'complete' || state == 'loaded')
					done();
			};

			// Add script to document
			(document.getElementsByTagName('head')[0] || document.body).appendChild(elm);
		};

		/**
		 * Returns true/false if a script has been loaded or not.
		 *
		 * @method isDone
		 * @param {String} url URL to check for.
		 * @return [Boolean} true/false if the URL is loaded.
		 */
		this.isDone = function(url) {
			return states[url] == LOADED;
		};

		/**
		 * Marks a specific script to be loaded. This can be useful if a script got loaded outside
		 * the script loader or to skip it from loading some script.
		 *
		 * @method markDone
		 * @param {string} u Absolute URL to the script to mark as loaded.
		 */
		this.markDone = function(url) {
			states[url] = LOADED;
		};

		/**
		 * Adds a specific script to the load queue of the script loader.
		 *
		 * @method add
		 * @param {String} url Absolute URL to script to add.
		 * @param {function} callback Optional callback function to execute ones this script gets loaded.
		 * @param {Object} scope Optional scope to execute callback in.
		 */
		this.add = this.load = function(url, callback, scope) {
			var item;

			item = {
				url : url,
				func : callback,
				scope : scope || this
			};

			queue.push(item);
		};

		/**
		 * Starts the loading of the queue.
		 *
		 * @method loadQueue
		 * @param {function} callback Optional callback to execute when all queued items are loaded.
		 * @param {Object} scope Optional scope to execute the callback in.
		 */
		this.loadQueue = function(callback, scope) {
			this.loadScripts(queue, callback, scope);
		};

		/**
		 * Loads the specified queue of files and executes the callback ones they are loaded.
		 * This method is generally not used outside this class but it might be useful in some scenarios. 
		 *
		 * @method loadScripts
		 * @param {Array} scripts Array of queue items to load.
		 * @param {function} callback Optional callback to execute ones all items are loaded.
		 * @param {Object} scope Optional scope to execute callback in.
		 */
		this.loadScripts = function(scripts, callback, scope) {
			var t = this;

			scope = scope || t;

			function isDone() {
				var count = 0;

				tinymce.each(scripts, function(item) {
					if (t.isDone(item.url))
						count++;
				});

				return scripts.length == count;
			};

			(function loadScripts() {
				tinymce.each(scripts, function(script) {
					var url = script.url;

					if (!states[url]) {
						states[url] = LOADING;

						loadScript(url, function() {
							states[url] = LOADED;

							// Execute item callback
							if (script.func)
								script.func.call(script.scope);

							if (isDone()) {
								if (callback)
									callback.call(scope);
							} else
								loadScripts();
						});
					}
				});
			})();
		};
	};

	// Global script loader
	tinymce.ScriptLoader = new tinymce.dom.ScriptLoader();
})(tinymce);
