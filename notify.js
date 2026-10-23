// "Tell me when Pro opens" (pro.html): one email field. It posts only the email, and only to
// FormSubmit's AJAX endpoint, whose address scripts/publish-site.sh writes into
// <meta name="twinslip:pro-list-url">. With no address (or any other kind), the form stays hidden
// and the page's plain note says how to hear about Pro instead.
(() => {
  'use strict';
  const form = document.getElementById('notify');
  const none = document.getElementById('notify-none');
  if (!form) return;
  const raw = (document.querySelector('meta[name="twinslip:pro-list-url"]') || {}).content || '';
  let url = null;
  try {
    const u = new URL(raw);
    if (u.protocol === 'https:' && u.hostname === 'formsubmit.co' && u.pathname.startsWith('/ajax/') && u.pathname.length > 6) url = u.toString();
  } catch { /* empty or not a URL: the note stays */ }
  if (!url) return;
  form.hidden = false;
  if (none) none.hidden = true;

  const email = document.getElementById('notify-email');
  const btn = document.getElementById('notify-btn');
  const out = document.getElementById('notify-msg');
  const label = btn.textContent;
  const say = (text, err = false) => {
    out.textContent = text;
    out.classList.toggle('err', err);
    if (err) { email.setAttribute('aria-invalid', 'true'); email.setAttribute('aria-describedby', out.id); }
  };
  email.addEventListener('input', () => email.removeAttribute('aria-invalid'));
  const done = (address) => {
    say(`Thanks. We'll email ${address} once, when Pro opens.`);
    btn.textContent = "You're on the list";
    btn.disabled = true;
    email.disabled = true;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const address = email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 254) { say('Enter an email address like you@example.com.', true); email.focus(); return; }
    if (document.getElementById('notify-hp').value) { done(address); return; } // a bot filled the hidden field
    btn.disabled = true;
    btn.textContent = 'Sending…';
    say('');
    // The form service can take most of a minute to answer: say so after a few seconds, and give up after 90.
    const slow = setTimeout(() => say('Still sending. This can take up to a minute.'), 6000);
    const stop = new AbortController();
    const limit = setTimeout(() => stop.abort(), 90000);
    try {
      const body = new URLSearchParams({ email: address, _subject: 'Twinslip: tell me when Pro opens' });
      const r = await fetch(url, { method: 'POST', headers: { Accept: 'application/json' }, body, signal: stop.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!r.ok) throw r;
      const j = await r.json().catch(() => ({}));
      if (j && 'success' in j && String(j.success) !== 'true') throw j;
      done(address);
    } catch {
      btn.disabled = false;
      btn.textContent = label;
      say("That didn't go through. Try again in a moment.", true);
    } finally {
      clearTimeout(slow);
      clearTimeout(limit);
    }
  });
})();
