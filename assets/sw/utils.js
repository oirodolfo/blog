/* global FetchEvent */

export const createFakeFetchEvent = (url) => {
  const fakeFetchEvent = new FetchEvent('fetch', {
    request: new Request(url, {mode: 'no-cors'}),
  });
  fakeFetchEvent.waitUntil = fakeFetchEvent.respondWith = () => {};

  return fakeFetchEvent;
};
