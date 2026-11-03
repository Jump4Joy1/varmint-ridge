/* Supporter store stub for Hoedown Blocks.
   IAP_ON is false. Purchases cannot run in this build.
   A later store build may use RevenueCat on Capacitor, still behind the grown-up gate.
   No ads. No web checkout. No analytics. */
(function (root) {
  'use strict';
  const IAP_ON = false;
  const REVENUECAT_API_KEY = { ios: '', android: '' };
  const products = [
    {
      sku: 'com.jwmanor.hoedownblocks.themepack',
      key: 'themepack',
      type: 'non-consumable',
      price: '$1.99',
      nameKey: 'skuTheme',
      descKey: 'skuThemeDesc'
    },
    {
      sku: 'com.jwmanor.hoedownblocks.challenge',
      key: 'challenge',
      type: 'non-consumable',
      price: '$2.99',
      nameKey: 'skuChallenge',
      descKey: 'skuChallengeDesc'
    }
  ];

  const api = {
    IAP_ON: IAP_ON,
    products: products,
    onEntitlement: null,
    backend: 'none',
    ready: false
  };

  function nativeBits() {
    const cap = root.Capacitor;
    const native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
    const rc = native && cap.Plugins && cap.Plugins.Purchases;
    const cdv = native && root.CdvPurchase;
    return { cap: cap, native: native, rc: rc, cdv: cdv };
  }

  api.available = function () {
    const n = nativeBits();
    return IAP_ON && n.native && api.ready;
  };

  api.init = async function () {
    if (!IAP_ON) return false;
    const n = nativeBits();
    if (!n.native) return false;
    try {
      if (n.rc) {
        const plat = n.cap.getPlatform();
        await n.rc.configure({ apiKey: REVENUECAT_API_KEY[plat] || '' });
        api.backend = 'revenuecat';
      } else if (n.cdv) {
        api.backend = 'cordova';
        await n.cdv.store.initialize();
      } else {
        return false;
      }
      api.ready = true;
      return true;
    } catch (e) {
      return false;
    }
  };

  api.purchase = async function (sku) {
    if (!IAP_ON || !api.available()) return { ok: false, reason: 'disabled' };
    try {
      const n = nativeBits();
      if (api.backend === 'revenuecat') {
        const r = await n.rc.getProducts({ productIdentifiers: [sku] });
        const prod = (r.products || [])[0];
        if (!prod) return { ok: false, reason: 'not found' };
        await n.rc.purchaseStoreProduct({ product: prod });
        if (api.onEntitlement) api.onEntitlement(sku);
        return { ok: true };
      }
      return { ok: false, reason: 'disabled' };
    } catch (e) {
      return { ok: false, reason: 'cancelled' };
    }
  };

  api.restore = async function () {
    if (!IAP_ON || !api.available()) return { ok: false, reason: 'disabled' };
    try {
      const n = nativeBits();
      if (api.backend === 'revenuecat' && n.rc.restorePurchases) await n.rc.restorePurchases();
      return { ok: true, count: 0 };
    } catch (e) {
      return { ok: false, reason: 'disabled' };
    }
  };

  root.HoedownIAP = api;
})(typeof window !== 'undefined' ? window : globalThis);
