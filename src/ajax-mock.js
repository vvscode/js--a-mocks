import { isEqual } from './utils/isEqual';

const $ = window.jQuery;

let readyDelay = 20; // seconds
let readyDelayTimer;
let cache = [];
const tmpCache = [];
const notMockedRequests = [];

function getRequestSettingsForCacheItem(reqSettings) {
  var data = reqSettings.data;
  if (typeof data === 'string' && data) {
    try {
      data = JSON.parse(reqSettings.data);
    } catch (e) {
      console.warn('Error on parse data from request', e);
    }
  }

  var filter = data && data.filter;
  if (typeof filter === 'string' && filter) {
    try {
      filter = JSON.parse(filter);
    } catch (e) {}
    if (filter) {
      data.filter = filter;
    }
  }

  return JSON.parse(
    JSON.stringify({
      url: reqSettings.url,
      type: reqSettings.type,
      data: data,
    }),
  );
}

function findMockByRequestPart(reqPart) {
  return cache.find(function(cacheItem) {
    return isEqual(cacheItem.request, reqPart);
  });
}

function addUnmockedRequest(reqPart) {
  var notFoundedMockItem = {
    description: window.location.href,
    request: reqPart,
  };
  notMockedRequests.push(notFoundedMockItem);
  typeof window._ajaxCache.onNotMockNotFound === 'function' &&
    window._ajaxCache.onNotMockNotFound(notFoundedMockItem);
}

function addMockToCache(item) {
  cache.push(item);
}

function removeItemFromCacheByRequest(cacheItem) {
  var itemToRemove = cache.find(function(item) {
    return isEqual(item, cacheItem);
  });
  if (itemToRemove) {
    cache = cache.filter(function(item) {
      return item !== itemToRemove;
    });
  }
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
  window._.reject(cache, function(item) {
    return item.name === name;
  });
}

function removeFromTmpCache(reqPart) {
  window._.remove(tmpCache, function(item) {
    return item === reqPart;
  });
}

function getResponseFromCacheItem(mockItem, origSettings) {
  var responseBody = mockItem.response.responseBody;
  if (typeof responseBody === 'object' && responseBody) {
    responseBody = JSON.stringify(responseBody);
  }

  this.responseText = responseBody;
  return;
}

function mockAjax() {
  $.mockjax(function(requestSettings) {
    console.log('Mojax catch', requestSettings);

    var requestPart = getRequestSettingsForCacheItem(requestSettings);
    var mockItem = findMockByRequestPart(requestPart);

    if (window._ajaxCache.useCache && mockItem && mockItem.response) {
      if (window._ajaxCache.removeMockItemOnUse) {
        removeItemFromCache(mockItem);
      }
      return {
        response: function(origSettings) {
          return getResponseFromCacheItem.call(this, mockItem, origSettings);
        },
      };
    } else if (window._ajaxCache.useCache) {
      addUnmockedRequest(requestPart);
    }
    if (window._ajaxCache.collectMocks) {
      tmpCache.push(requestPart);
      var origSuccess = requestSettings._origSettings.success;

      requestSettings._origSettings.success = function(
        response,
        textStatus,
        jqXHR,
      ) {
        var responseBody = jqXHR.responseText;
        try {
          responseBody = JSON.parse(responseBody);
        } catch (e) {}

        addMockToCache({
          request: requestPart,
          response: {
            responseBody: responseBody,
          },
          name: 'Collected from app',
          description: window.location.href,
        });
        removeFromTmpCache(requestPart);

        return origSuccess && origSuccess(response, textStatus, jqXHR);
      };
    }

    return;
  });

  var useCache = !!document.cookie.match('ajaxMocks_useCache');
  if (useCache) {
    var $ready = $.ready;
    var runOriginalReady = function() {
      clearTimeout(readyDelayTimer);
      if ($.ready !== $ready) {
        $.ready = $ready;
        $.ready();
      }
    };
    $.ready = function() {
      console.debug('Delay on app start.');
      readyDelayTimer = setTimeout(runOriginalReady, readyDelay * 1000);
    };
    $.ready.promise = $ready.promise;
  }

  window._ajaxCache = {
    useCache: !!document.cookie.match('ajaxMocks_useCache'),
    collectMocks: !!document.cookie.match('ajaxMocks_collectMocks'),
    removeMockItemOnUse: !!document.cookie.match(
      'ajaxMocks_removeMockItemOnUse',
    ),
    onNotMockNotFound: function(notFoundedMockItem) {},
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
    },
    initialMocksLoaded: function() {
      typeof window.loadApp === 'function' && window.loadApp();
      typeof runOriginalReady === 'function' && runOriginalReady();
    },
  };
}

// $.cookie('ajaxMocks_enableMocks', 'ajaxMocks_useCache ajaxMocks_collectMocks');
if (!!document.cookie.match('ajaxMocks_enableMocks')) {
  mockAjax();
}
