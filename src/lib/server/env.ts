import 'server-only';

/** All secrets come from environment variables (see .env.example). Nothing secret is ever sent to the browser. */
export const env = {
  razorpayKeyId: () => process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: () => process.env.RAZORPAY_KEY_SECRET || '',
  razorpayWebhookSecret: () => process.env.RAZORPAY_WEBHOOK_SECRET || '',
  /** overridable so tests can point at a local stand-in */
  razorpayApiBase: () => process.env.RAZORPAY_API_BASE || 'https://api.razorpay.com',
  appsScriptUrl: () => process.env.APPS_SCRIPT_URL || '',
  appsScriptSecret: () => process.env.APPS_SCRIPT_SECRET || '',
  googleKey: () => process.env.GOOGLE_MAPS_API_KEY || '',
  googlePlaceId: () => process.env.GOOGLE_PLACE_ID || '',
  /** "1" lets orders through outside 8 AM–8 PM (testing only) */
  ignoreHours: () => process.env.ORDERS_IGNORE_HOURS === '1',
  /** override the shop's map pin without touching code: "19.2892,72.85905" */
  shopLatLng: (): { lat: number; lng: number } | null => {
    const v = process.env.SHOP_LATLNG;
    if (!v) return null;
    const [lat, lng] = v.split(',').map((x) => Number(x.trim()));
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  },
};

export const paymentsConfigured = () => !!(env.razorpayKeyId() && env.razorpayKeySecret());
