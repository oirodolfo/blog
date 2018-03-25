import {Router} from 'workbox-routing/Router.mjs';
import {createNavigationRoute} from './routes/navigation-route.js';
import {createPagePartialsRoute} from './routes/page-partials-route.js';
import {createStaticAssetsRoute} from './routes/static-assets-route.js';
import {createThirdPartyAssetsRoute}
    from './routes/third-party-assets-route.js';

const routes = {
  createNavigationRoute,
  createPagePartialsRoute,
  createStaticAssetsRoute,
  createThirdPartyAssetsRoute,
};

const router = new Router();
for (const route of Object.values(routes)) {
  router.registerRoute(route());
}

export {router};
