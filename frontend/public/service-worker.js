// This is the service worker with the Cache-first network

const CACHE = "pwabuilder-precache";
const precacheFiles = [
  /* Add an array of files to precache for your app */
];

// Install stage sets up the cache-array to configure pre-cache content
self.addEventListener("install", function (evt) {
  console.log("[PWA Builder] The service worker is being installed.");
  evt.waitUntil(
    caches.open(CACHE).then(function (cache) {
      console.log("[PWA Builder] Pre-caching offline page");
      return cache.addAll(precacheFiles);
    })
  );
});

// Allow sw to control of current page
self.addEventListener("activate", function (evt) {
  console.log("[PWA Builder] Claiming clients for current page");
  return self.clients.claim();
});

// If any fetch fails, it will look for the request in the cache and serve it from there first
self.addEventListener("fetch", function (evt) {
  if (evt.request.method !== "GET") return;
  
  evt.respondWith(
    fromCache(evt.request).then(
      function (response) {
        // The response was found in the cache so we respond with it
        console.log("[PWA Builder] Return from cache", evt.request.url);
        return response;
      },
      function () {
        // Response was not found in cache so we try the network
        return fetch(evt.request)
          .then(function (response) {
            // If request was success, add or update it in the cache
            evt.waitUntil(updateCache(evt.request, response.clone()));
            return response;
          })
          .catch(function (error) {
            console.log("[PWA Builder] Network request Failed. Serving content from cache: " + error);
          });
      }
    )
  );
});

function fromCache(request) {
  // Check to see if you have it in the cache
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (matching) {
      if (!matching || matching.status === 404) {
        return Promise.reject("no-match");
      }
      return matching;
    });
  });
}

function updateCache(request, response) {
  return caches.open(CACHE).then(function (cache) {
    return cache.put(request, response);
  });
}