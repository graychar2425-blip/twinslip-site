// Site settings. Fill these in before launch (see README.md). Until they're real, the Pro
// page's Buy button shows a "not on sale yet" message instead of opening a checkout.
// Nothing here is secret: a store subdomain and a product variant id are public by design.
window.TWINSLIP_SITE = {
  // Where the site lives, no trailing slash. Also update the same value in sitemap.xml,
  // robots.txt, llms.txt, agents.md, mcp.json and the og:url / canonical tags.
  SITE_URL: 'https://graychar2425-blip.github.io/twinslip-site',

  // Lemon Squeezy store subdomain: for https://twinslip.lemonsqueezy.com it's 'twinslip'.
  LS_STORE_SUBDOMAIN: '{{LS_STORE_SUBDOMAIN}}',

  // The checkout id of the annual Pro variant. In Lemon Squeezy: Products → Twinslip Pro →
  // the annual variant → Share → the id at the end of the checkout link
  // (https://<store>.lemonsqueezy.com/checkout/buy/<THIS-PART>).
  LS_CHECKOUT_VARIANT_ANNUAL: '{{LS_CHECKOUT_VARIANT_ANNUAL}}',

  // The checkout id of the monthly Pro variant ($10 a month), found the same way. While it's a
  // placeholder, the page offers yearly only.
  LS_CHECKOUT_VARIANT_MONTHLY: '{{LS_CHECKOUT_VARIANT_MONTHLY}}',

  // true while the store is in Lemon Squeezy test mode. The page then labels the checkout as a
  // test so nobody mistakes it for a real purchase. Set to false only when going live.
  LS_TEST_MODE: true,

  // Most seats one checkout can buy from the seat selector.
  MAX_SEATS: 25,
};
