import {Route} from 'workbox-routing/Route.mjs';
import {NetworkFirst} from 'workbox-strategies/NetworkFirst.mjs';
import {cacheNames} from '../caches.js';

const thirdPartyAssetsMatcher = ({url}) => {
  return url.hostname !== location.hostname &&
      url.pathname.match(/\.(?:js|mp4)$/);
};

const thirdPartyAssetsStrategy = new NetworkFirst({
  cacheName: cacheNames.THIRD_PARTY_ASSETS,
});

export const createThirdPartyAssetsRoute = () => {
  return new Route(thirdPartyAssetsMatcher, thirdPartyAssetsStrategy);
};
