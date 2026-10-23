// Twinslip website: the few things static HTML can't do. No trackers, no network calls.
(() => {
  'use strict';

  // The two-bucket example: one tap files the unclaimed charge, like the app's inbox.
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const ask = document.querySelector('[data-ask]');
  if (ask) {
    const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;
    const totals = [...document.querySelectorAll('[data-total]')];
    const lists = [...document.querySelectorAll('[data-entries]')];
    const start = {
      ask: ask.innerHTML,
      totals: totals.map((t) => ({ cents: t.dataset.cents, text: t.textContent })),
      lists: lists.map((l) => l.innerHTML),
    };
    const SLIP = '<svg class="slip" viewBox="0 0 16 16" aria-hidden="true"><rect class="copy" x="4.5" y="4.5" width="10" height="10.5" rx="1.5"/><rect class="orig" x="1" y="1" width="10" height="10.5" rx="1.5"/></svg>';

    // A bucket's total counts up to its new value, the way the hero total rolls in.
    const countTo = (el, from, to) => {
      if (still.matches) { el.textContent = fmt(to); return; }
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 600);
        el.textContent = fmt(Math.round(from + (to - from) * (1 - (1 - k) ** 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const file = (bucket) => {
      const list = document.querySelector(`[data-entries="${bucket}"]`);
      const total = document.querySelector(`[data-total="${bucket}"]`);
      const cents = Number(ask.dataset.cents);
      const li = document.createElement('li');
      li.className = 'arrived';
      // The bank saw it. Filed under Agents, that bank line makes it checked (the app's ✓ rule).
      // Filed under Mine, it reads like every other purchase of yours: from your bank.
      li.innerHTML = bucket === 'agents'
        ? `<span class="m"></span><span class="amt"></span><span class="d"><span>Oct 3</span><span class="state ok">${SLIP}Checked against your bank</span></span>`
        : '<span class="m"></span><span class="amt"></span><span class="d"><span>Oct 3</span><span class="state src">From your bank</span></span>';
      li.querySelector('.m').textContent = ask.dataset.merchant;
      li.querySelector('.amt').textContent = fmt(cents);
      list.prepend(li);
      if (!still.matches && li.animate) {
        // The match: the row settles in, then its carbon copy slides into register. Nothing else moves.
        li.animate([{ transform: 'translateY(-6px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: 280, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
        li.querySelector('rect.copy')?.animate([{ transform: 'translate(3px, 3px)' }, { transform: 'none' }],
          { duration: 420, delay: 200, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' });
      }
      const before = Number(total.dataset.cents);
      total.dataset.cents = String(before + cents);
      countTo(total, before, before + cents);

      const label = bucket === 'mine' ? 'Mine' : 'Agents';
      ask.classList.add('done');
      ask.replaceChildren();
      const p = document.createElement('p');
      p.setAttribute('role', 'status');
      p.className = 'status-line';
      p.textContent = `Filed under ${label}. Next time a charge from ${ask.dataset.merchant} shows up, the app suggests ${label} first. `;
      const again = document.createElement('button');
      again.type = 'button';
      again.className = 'btn ghost small-btn';
      again.textContent = 'Reset example';
      again.addEventListener('click', reset);
      p.append(again);
      ask.append(p);
      again.focus({ preventScroll: true });
    };

    const bind = () => ask.querySelectorAll('button[data-bucket]').forEach((btn) => {
      btn.addEventListener('click', () => file(btn.dataset.bucket));
    });
    function reset() {
      ask.classList.remove('done');
      ask.innerHTML = start.ask;
      totals.forEach((t, i) => { t.dataset.cents = start.totals[i].cents; t.textContent = start.totals[i].text; });
      lists.forEach((l, i) => { l.innerHTML = start.lists[i]; });
      bind();
      ask.querySelector('button[data-bucket]')?.focus({ preventScroll: true });
    }
    bind();
  }

  // The share card's total rolls in once on load, digit by digit, its carbon copy a beat behind:
  // the same roll as the app's hero total (docs/DESIGN.md "Motion"). Skipped with Reduce Motion.
  function rollPlan(from, to) {
    const value = (s) => Number(s.replace(/\D/g, '') || 0);
    const up = value(to) >= value(from);
    const a = [...from];
    const b = [...to];
    const shift = a.length - b.length;
    const cols = b.map((ch, i) => ({ ch, was: a[i + shift] ?? '', path: null, turn: 0 }));
    let turn = 0;
    for (let i = cols.length - 1; i >= 0; i--) {
      const c = cols[i];
      if (!/^\d$/.test(c.ch) || c.was === c.ch) continue;
      c.turn = turn++;
      if (!/^\d$/.test(c.was)) { c.path = ['', c.ch]; continue; }
      const [f, t] = [Number(c.was), Number(c.ch)];
      const steps = up ? (t - f + 10) % 10 : (f - t + 10) % 10;
      c.path = Array.from({ length: steps + 1 }, (_, k) => String((f + (up ? k : -k) + 10) % 10));
    }
    return { up, cols: cols.map(({ ch, path, turn: n }) => ({ ch, path, turn: n })) };
  }
  const total = document.querySelector('.share-card .headline strong');
  const stack = document.querySelector('.card-stack');
  const anims = [];
  if (total && total.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const text = total.textContent;
    const { up, cols } = rollPlan(text.replace(/\d/g, '0'), text);
    const css = getComputedStyle(total);
    const lh = parseFloat(css.lineHeight) || parseFloat(css.fontSize) * 1.2;
    const span = (cls, content) => { const el = document.createElement('span'); if (cls) el.className = cls; if (content !== undefined) el.textContent = content; return el; };
    const face = span('');
    face.setAttribute('aria-hidden', 'true');
    const sr = span('sr', text);
    for (const c of cols) {
      if (!c.path) { face.append(c.ch); continue; }
      const travel = (c.path.length - 1) * lh;
      const col = span('roll-col');
      col.append(span('roll-sizer', c.ch));
      ['roll-strip copy', 'roll-strip'].forEach((cls, k) => {
        const strip = span(cls);
        for (const d of (up ? c.path : [...c.path].reverse())) strip.append(span('', d || '\u00a0'));
        col.append(strip);
        const ends = [`translateY(${up ? 0 : -travel}px)`, `translateY(${up ? -travel : 0}px)`];
        anims.push(strip.animate(ends.map((transform) => ({ transform })), {
          duration: 600, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both', delay: 300 + c.turn * 40 + (k === 0 ? 120 : 0),
        }));
      });
      face.append(col);
    }
    total.replaceChildren(sr, face);
    Promise.all(anims.map((a) => a.finished)).then(() => { total.textContent = text; }, () => { total.textContent = text; });
  }
  // On screen at load (most desktops): play now. Otherwise hold the first frame (zeros, the copy slip
  // out of register) until half the card is visible, then play once.
  if (stack) {
    const r = stack.getBoundingClientRect();
    if (r.top > innerHeight * 0.8 && 'IntersectionObserver' in window) {
      stack.classList.add('wait');
      anims.forEach((a) => a.pause());
      const io = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        stack.classList.remove('wait');
        anims.forEach((a) => a.play());
      }, { threshold: 0.5 });
      io.observe(stack);
    }
  }

  // Copy buttons on code blocks.
  document.querySelectorAll('.code').forEach((block) => {
    const pre = block.querySelector('pre');
    if (!pre || !navigator.clipboard) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy to clipboard');
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText.trim());
        btn.textContent = 'Copied';
      } catch {
        btn.textContent = 'Select and copy';
      }
      setTimeout(() => { btn.textContent = 'Copy'; }, 1800);
    });
    block.append(btn);
  });

  // Footer year.
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
