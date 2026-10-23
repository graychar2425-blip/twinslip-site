// Pro page: seat selector and the Lemon Squeezy checkout overlay.
// lemon.js is loaded only when someone clicks Buy, so nothing third-party runs before that.
(() => {
  'use strict';
  const cfg = window.TWINSLIP_SITE || {};
  const $ = (s) => document.querySelector(s);

  const placeholder = (v) => typeof v !== 'string' || v.trim() === '' || v.includes('{{');
  const subdomain = String(cfg.LS_STORE_SUBDOMAIN || '');
  const variant = String(cfg.LS_CHECKOUT_VARIANT_ANNUAL || '');
  const configured = !placeholder(subdomain) && !placeholder(variant)
    && /^[a-z0-9-]{1,63}$/i.test(subdomain) && /^[A-Za-z0-9-]{1,80}$/.test(variant);
  const maxSeats = Math.max(1, Math.min(500, Number(cfg.MAX_SEATS) || 25));

  // The page ships in its not-on-sale state. Only with a price and a checkout do the buy controls
  // (kept in <template id="buy-live">) replace it, so a placeholder never reaches the screen.
  const liveTpl = document.getElementById('buy-live');
  const priced = !!liveTpl && !liveTpl.innerHTML.includes('{{');
  if (!configured || !priced) return;
  document.querySelector('.buy').replaceChildren(liveTpl.content.cloneNode(true));

  // Seats.
  const input = $('#seats');
  const minus = $('#seats-minus');
  const plus = $('#seats-plus');
  const total = $('#total');
  const priceText = ($('[data-price]')?.textContent || '').trim();
  input.max = String(maxSeats);

  const seats = () => {
    const n = Math.round(Number(input.value));
    return Number.isFinite(n) ? Math.min(maxSeats, Math.max(1, n)) : 1;
  };

  // "$X" or "€X" or "X USD": if the price is a real number, show the total; if it's still the
  // placeholder, say it in words without inventing anything.
  function totalLine(n) {
    const seatWord = n === 1 ? '1 seat' : `${n} seats`;
    const m = priceText.match(/^([^\d{]*)([\d.,]+)(.*)$/);
    if (!priceText.includes('{{') && m) {
      const per = Number(m[2].replace(/,/g, ''));
      if (Number.isFinite(per) && per > 0) {
        const sum = (per * n).toFixed(per % 1 === 0 ? 0 : 2);
        return `${seatWord}: ${m[1]}${Number(sum).toLocaleString('en-US', { minimumFractionDigits: per % 1 === 0 ? 0 : 2 })}${m[3]} a year`;
      }
    }
    return `${seatWord} × ${priceText} a year`;
  }

  function render() {
    const n = seats();
    if (String(n) !== input.value) input.value = String(n);
    minus.disabled = n <= 1;
    plus.disabled = n >= maxSeats;
    total.textContent = totalLine(n);
    $('#audit-note').hidden = n < 2;
  }
  minus.addEventListener('click', () => { input.value = String(seats() - 1); render(); });
  plus.addEventListener('click', () => { input.value = String(seats() + 1); render(); });
  input.addEventListener('change', render);
  input.addEventListener('blur', render);
  render();


  // Test-mode label.
  if (configured && cfg.LS_TEST_MODE !== false) $('#testmode').hidden = false;

  // Checkout.
  const msg = $('#checkout-msg');
  const say = (html) => { msg.innerHTML = html; msg.hidden = false; msg.focus(); };

  function checkoutUrl(n, embed) {
    const u = new URL(`https://${subdomain}.lemonsqueezy.com/checkout/buy/${variant}`);
    u.searchParams.set('quantity', String(n));
    if (embed) u.searchParams.set('embed', '1');
    return u.toString();
  }

  let lemonLoading = null;
  function loadLemon() {
    if (window.LemonSqueezy) return Promise.resolve();
    if (lemonLoading) return lemonLoading;
    lemonLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://app.lemonsqueezy.com/js/lemon.js';
      s.async = true;
      s.onload = () => {
        if (typeof window.createLemonSqueezy === 'function') window.createLemonSqueezy();
        window.LemonSqueezy ? resolve() : reject(new Error('lemon.js loaded without LemonSqueezy'));
      };
      s.onerror = () => reject(new Error('lemon.js failed to load'));
      document.head.append(s);
    });
    lemonLoading.catch(() => { lemonLoading = null; });
    return lemonLoading;
  }

  const buy = $('#buy');
  buy.addEventListener('click', async () => {
    if (!configured) {
      say("Pro isn't on sale yet, so there's nothing to buy today. The free tracker works in full in the meantime: <a href=\"download.html\">download it here</a>.");
      return;
    }
    const n = seats();
    buy.setAttribute('aria-busy', 'true');
    buy.disabled = true;
    try {
      await loadLemon();
      window.LemonSqueezy.Setup({
        eventHandler: (e) => { if (e && e.event === 'Checkout.Success') window.location.href = 'thanks.html'; },
      });
      window.LemonSqueezy.Url.Open(checkoutUrl(n, true));
      msg.hidden = true;
    } catch {
      // Blocked or offline: send them to the same checkout as a normal page instead.
      say(`The checkout window didn't open here. <a href="${checkoutUrl(n, false)}" rel="noopener">Open the checkout page instead</a>.`);
    } finally {
      buy.disabled = false;
      buy.removeAttribute('aria-busy');
    }
  });
})();
