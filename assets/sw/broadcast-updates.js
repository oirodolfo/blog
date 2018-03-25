import {DBWrapper} from 'workbox-core/_private/DBWrapper.mjs';
import {cacheNames} from './caches.js';


const DB_NAME = 'pw:cache-updates';
const OBJ_STORE_NAME = 'entries';


const db = new DBWrapper(DB_NAME, 1, {
  onupgradeneeded: (evt) => {
    evt.target.result.createObjectStore(OBJ_STORE_NAME, {autoIncrement: true});
  },
});

const broadcastCacheUpdate = (url) => {
  new BroadcastChannel('api-updates').postMessage({
    type: 'CACHE_UPDATED',
    payload: {
      cacheName: cacheNames.PAGES,
      updatedUrl: url,
    },
});
};

self.addEventListener('message', async (evt) => {
  const entries = await db.getAllMatching(OBJ_STORE_NAME, {includeKeys: true});

  if (entries.length > 0) {
    console.log('Sending stored urls...');
    for (const {primaryKey, value} of entries) {
      broadcastCacheUpdate(value.url);

      // Delete all urls.
      // TODO(philipwalton): implement the `clear()` method in Workbox.
      await db.delete(OBJ_STORE_NAME, primaryKey);
    }
  }
});


export const broadcastUpdateIfClients = async (url) => {
  const activeWindows = await self.clients.matchAll({type: 'window'});

  if (activeWindows.length > 0) {
    console.log('sending cache-update message to active window...');
    broadcastCacheUpdate(url);

    // Delete all updated URLs.
    // TODO(philipwalton): implement the `clear()` method in Workbox.
    const entries = await db.getAllMatching(
        OBJ_STORE_NAME, {includeKeys: true});

    for (const {primaryKey} of entries) {
      await db.delete(OBJ_STORE_NAME, primaryKey);
    }
  } else {
    console.log('no active window, storing cache-update message...');
    await db.add(OBJ_STORE_NAME, {url, date: Date.now()});
  }
};
