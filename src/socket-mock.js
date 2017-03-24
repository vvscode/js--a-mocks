(function() {
  var cache = [];
  var tmpCache = {};
  var notMockedRequests = [];

  function messageToPayload(msg) {
    var tmp = msg.match(/\d\:\:\/(.+?)\/\:(.+)/);
    var ret = JSON.parse(tmp[2]);

    if (ret.args && ret.args[0]) {
      delete ret.args[0]._DEBUG_META;
    }
    return ret;
  }

  function getResource(msg) {
    var tmp = msg.match(/\d\:\:\/(.+?)\/\:(.+)/);
    return tmp[1];
  }

  function responseHashToMessage(resource, hash) {
    return '4::/' + resource + '/:' + JSON.stringify(hash);
  }

  function deepClone(obj) {
    return window._.clone(obj, true);
  }

  function isEqual(a, b) {
    return window._.isEqual(a, b);
  }

  function getRequestId(str) {
    return "" + (str.match(/"request_id":"(\w+\-\w+\-.+?)"/, '') || []).pop();
  }

  function removeRequestId(str, id) {
    return str.replace('"request_id":"' + id + '"', '"request_id":"STUB"');
  }

  function getResponseWithId(item, id) {
    var ret = deepClone(item);
    if (ret.request_id) ret.request_id = id;
    return ret;
  }

  function isRequest(msg) {
    return msg[0] === '5';
  }

  function isResponse(msg) {
    return msg[0] === '4';
  }

  function findCacheItemForRequest(resource, payload) {
    return cache.find(function(item) {
      return item.resource === resource && isEqual(item.request, payload);
    });
  }

  function removeItemFromCache(cacheItem) {
    var itemToRemove = cache.find(function(item) {
      return isEqual(item, cacheItem);
    });
    if (itemToRemove) {
      cache = cache.filter(function(item) {
        return item !== itemToRemove;
      });
    }
  }

  function removeItemFromCacheByName(name) {
    cache = cache.reject(function(item) {
      return item.name === name;
    });
  }

  function removeItemFromCacheByRequest(request) {
    cache = cache.reject(function(item) {
      return isEqual(item.request, request);
    });
  }

  function findCacheItem(msg) {
    var id = getRequestId(msg);
    var msgWithoudId = removeRequestId(msg, id);
    if (!isRequest(msg)) {
      return null;
    }
    var payload = messageToPayload(msgWithoudId);
    var resource = getResource(msgWithoudId);
    var cacheItem = findCacheItemForRequest(resource, payload);
    return cacheItem;

  }

  function mockSocketIo() {
    var onConnect = window.io.Socket.prototype.onConnect;
    window.io.Socket.prototype.onConnect = function() {
      var onmessage = this.transport.websocket.onmessage;
      var send = this.transport.websocket.send;

      this.transport.websocket.onmessage = function(ev) {
        var msg = ev.data;
        var id = getRequestId(msg);
        if (tmpCache[id] && isResponse(msg) && window._socketCache.collectMocks) {
          cache.push({
            resource: getResource(msg),
            request: messageToPayload(tmpCache[id]),
            response: messageToPayload(removeRequestId(msg, id)),
            name: 'Collected automatically',
            description: window.location.href
          });
          delete tmpCache[id];
        }

        return onmessage.call(this, { data: msg });
      };

      this.transport.websocket.send = function(msg) {
        var ret = true;
        var isReq = isRequest(msg);
        if (isReq) {
          var cacheItem;
          var msgId = getRequestId(msg);

          if (window._socketCache.useCache && (cacheItem = findCacheItem(msg))) {
            return setTimeout(function() {
              if (window._socketCache.removeMockItemOnUse) {
                removeItemFromCache(cacheItem);
              }

              this.onmessage({ data: responseHashToMessage(cacheItem.resource, getResponseWithId(cacheItem.response, msgId)) });
            }.bind(this), 0);
          } else if (window._socketCache.useCache && isReq) {
            var notFoundedMockItem =  {
              resource: getResource(msg),
              request: messageToPayload(removeRequestId(msg, msgId)),
              description: window.location.href
            };

            notMockedRequests.push(notFoundedMockItem);
            if (typeof window._socketCache.onNotMockNotFound === 'function') {
              ret = !(window._socketCache.onNotMockNotFound(notFoundedMockItem) === false);
            }
          }

          if (window._socketCache.collectMocks) {
            tmpCache[msgId] = removeRequestId(msg, msgId);
          }
        }

        return ret && send.call(this, msg);
      };
      return onConnect.apply(this, arguments);
    };

    window._socketCache = {
      useCache:  !!document.cookie.match('socketMocks_useCache'),
      collectMocks:  !!document.cookie.match('socketMocks_collectMocks'),
      removeMockItemOnUse:  !!document.cookie.match('socketMocks_removeMockItemOnUse'),
      onNotMockNotFound: function(notFoundedMockItem) { },
      getCache: function() {
        return cache;
      },
      addMock: function(cacheItem) {
        cache.push(cacheItem);
        return this;
      },
      addMocks: function(cacheItems) {
        cache.push.apply(cache, cacheItems);
        return this;
      },
      removeMockByRequest: function(request) {
        removeItemFromCacheByRequest(request);
        return this;
      },
      removeMockByName: function(name) {
        removeItemFromCacheByName(name);
        return this;
      },
      getTmpCache: function() {
        return tmpCache;
      },
      getNotMockedRequests: function() {
        return notMockedRequests;
      }
    };
  }

  if (!!document.cookie.match('socketMocks_enableMocks')) {
    window.addEventListener('load', mockSocketIo);
  }
})();
