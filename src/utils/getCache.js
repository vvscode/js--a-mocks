import { isEqual } from './utils/isEqual';

export default function() {
  let cache = [];

  function findMockByRequestPart(reqPart) {
    return cache.find(function(cacheItem) {
      return isEqual(cacheItem.request, reqPart);
    });
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

  function removeItemFromCacheByName(name) {
    window._.reject(cache, function(item) {
      return item.name === name;
    });
  }

  return {
    findMockByRequestPart,
    addMockToCache,
    removeItemFromCacheByRequest,
    removeItemFromCacheByName
  };
}
