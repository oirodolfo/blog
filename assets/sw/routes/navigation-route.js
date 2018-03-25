import {Route} from 'workbox-routing/Route.mjs';
import {strategy} from 'workbox-streams/strategy.mjs';
import {pagePartialsStrategy} from './page-partials-route.js';


const navigationMatcher = ({url}) => {
  // return event.request.mode === 'navigate' &&
  return url.hostname === location.hostname &&
      (url.pathname === '/' ||
      url.pathname.match(/^\/(?:about|articles)\/([\w-]+\/)?$/));
};

const makePartialRequest = (url, event) => {
  return pagePartialsStrategy.makeRequest({request: url, event});
}

const navigationHandler = strategy([
  ({event}) => makePartialRequest(`/shell-start.html`, event),
  ({event, url}) => makePartialRequest(
      `${url.pathname}index.content.html`, event),
  ({event}) => makePartialRequest(`/shell-end.html`, event),
]);

export const createNavigationRoute = () => {
  return new Route(navigationMatcher, navigationHandler);
};
