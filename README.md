## Usage example 

```html
    <!--
    <script src="{{rootURL}}assets/vendor.js" type="def/script"></script>
    <script src="{{rootURL}}assets/apollo.js" type="def/script"></script>
    -->
    <!--
	Below we use `p` tag for links cause FF load script even for `script` with incorrect type attr.
	To avoid this behavior we use non-sourcable tag
	-->
	<p src="assets/vendor.js" type="def/script"></p>
	<p src="assets/apollo-auth.js" type="def/script"></p>
    <script>
      (function() {
        var loadScript = function(src) {
          var script= document.createElement('script');
          script.type= 'text/javascript';
          script.src= src;
          script.async = false;
          body.appendChild(script);
        };
        var delay = 0;
        var body = document.querySelector('body');
        var buildMatch = window.location.href.match(/build=(\w+)/) || document.cookie.match(/build_apollo=([a-z0-9]+)/);
        var shouldReplace = !!buildMatch;
        var assetsPath = shouldReplace ? (buildMatch.pop() + '/assets') : '$1/assets';
        var replaceRegexp = new RegExp('(\\w+)' + '\/a' + 'ss' + 'ets');
        var scripts = [].slice.call(document.querySelectorAll('script[type="def/script"]'));
        var item = scripts[0];
        loadScript(shouldReplace ? item.src.replace(replaceRegexp, assetsPath) : item.src);
        if (document.cookie.match('Mocks_')) {
          delay = 30;
          [
            "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.4/lodash.js",
            "assets/scripts/socket-mock.js",
            "assets/scripts/jquery.mockjax.js",
            "assets/scripts/ajax-mock.js" ].forEach(function(script) {
              loadScript(script.match(/cdnjs/) || !script.match(/^http/) ?  script : script.replace(replaceRegexp, assetsPath));
          });
        }
        [].slice.call(document.querySelectorAll('link[rel="stylesheet"]')).forEach(function(item) {
          if (shouldReplace) {
            item.href = item.href.replace(replaceRegexp, assetsPath);
          }
        });
        window.loadApp = function() {
          if (!window.loadAppTimer) {
            return;
          }
          clearTimeout(window.loadAppTimer);
          window.loadAppTimer = null;
          for(var i = 1; i < scripts.length; i++) {
            var item = scripts[i];
            loadScript(shouldReplace ? item.src.replace(replaceRegexp, assetsPath) : item.src);
          }
        };
        window.loadAppTimer = setTimeout(window.loadApp, delay * 1000);
      })();
    </script>
```