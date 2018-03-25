export const cacheNames = {
  LAYOUT: 'pw_v1_layout',
  LAYOUT_TEMP: 'pw_v1_layout_temp',
  PAGES: 'pw_v1_pages',
  STATIC_ASSETS: 'pw_v1_static',
  THIRD_PARTY_ASSETS: 'pw_v1_third_party_assets',
};

export const deleteUnusedCaches = async () => {
  const usedCacheNames = await caches.keys();
  const validCacheNames = new Set(Object.values(cacheNames));
  for (const usedCacheName of usedCacheNames) {
    if (!validCacheNames.has(usedCacheName)) {
      await caches.delete(usedCacheName);
    }
  }
};
