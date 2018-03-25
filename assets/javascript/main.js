import * as alerts from './alerts';
import * as analytics from './analytics';
import * as breakpoints from './breakpoints';
import * as contentLoader from './content-loader';
import * as drawer from './drawer';
import {onNewSwActive, messageSw} from './sw-utils.js';

/**
 * The main script entry point for the site. Initalizes all the sub modules
 * analytics tracking, and the service worker.
 */
const main = async () => {
  alerts.init();
  breakpoints.init();
  contentLoader.init();
  drawer.init();

  // analytics.init();

  if ('serviceWorker' in navigator) {
    const updatesChannel = new BroadcastChannel('api-updates');
    updatesChannel.addEventListener('message', async (event) => {
      console.log('BroadcastChannel message', event.data);
    });

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      onNewSwActive(registration, (sw) => {
        const urls = [
          location.href,
          ...performance.getEntriesByType('resource').map(({name}) => name),
        ];

        messageSw(sw, {cmd: 'CACHE_LOADED_RESOURCES', urls});
      });
    } catch (err) {
      console.error(err);
      // analytics.trackError(err);
    }
  }
};

main();
