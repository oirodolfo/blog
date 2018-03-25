import {Plugin as BroadcastUpdatePlugin}
    from 'workbox-broadcast-cache-update/Plugin.mjs';
import PrecacheController
    from 'workbox-precaching/controllers/PrecacheController.mjs';
import {cacheNames} from './caches.js';

/* global PRECACHE_MANIFEST */

let precacheController;
const getOrCreatePrecacheController = () => {
  if (!precacheController) {
    precacheController = new PrecacheController(cacheNames.LAYOUT);
  }
  return precacheController;
};

export const installPrecache = async () => {
  const precacheController = getOrCreatePrecacheController();
  precacheController.addToCacheList(PRECACHE_MANIFEST);

  await precacheController.install();
};

export const activatePrecache = async () => {
  const precacheController = getOrCreatePrecacheController();
  await precacheController.activate({
    plugins: [
      new BroadcastUpdatePlugin('api-updates', {
        headersToCheck: ['ETag', 'Content-Length'],
      }),
    ],
  });
};
