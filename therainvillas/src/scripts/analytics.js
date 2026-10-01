/**
 * Event tracking GA4 (thedrainvillas.com).
 * Satu listener global di level `document` (event delegation), bukan onclick per tombol,
 * sehingga elemen yang dirender Vue/Astro ikut terdeteksi. Aktif hanya bila `gtag`
 * tersedia, yaitu pada blok gtag milik Layout.astro di production.
 *
 * Prioritas saat satu klik cocok dengan >1 pola: Aturan eksplisit menang atas
 * tebakan dari href, dan generate_lead menang atas whatsapp_click karena klik
 * Pemesanan di form multi-step sekaligus membuka WhatsApp.
 */
if (!window.__trvAnalyticsBound && typeof window.gtag === 'function') {
  window.__trvAnalyticsBound = true;

  const MAX_TEXT = 120;

  const pagePath = () => window.location.pathname;

  function send(name, params) {
    window.gtag('event', name, { page_path: pagePath(), ...params });
  }

  function closestWith(el, selector) {
    if (!el || typeof el.closest !== 'function') return null;
    return el.closest(selector);
  }

  function villaOf(el) {
    const holder = closestWith(el, '[data-villa]');
    const raw = holder && holder.getAttribute('data-villa');
    return raw ? raw.trim().slice(0, MAX_TEXT) : undefined;
  }

  function trackOf(el) {
    const holder = closestWith(el, '[data-track]');
    return holder ? (holder.getAttribute('data-track') || '').trim() : '';
  }

  function formNameOf(el, fallback) {
    const holder = closestWith(el, '[data-form-name]');
    const explicit = holder && holder.getAttribute('data-form-name');
    if (explicit) return explicit.trim().slice(0, MAX_TEXT);
    const named = el && (el.getAttribute('name') || el.getAttribute('id'));
    if (named) return named.trim().slice(0, MAX_TEXT);
    return fallback;
  }

  function labelOf(el) {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text) return text.slice(0, MAX_TEXT);
    const aria = el.getAttribute('aria-label');
    if (aria) return aria.trim().slice(0, MAX_TEXT);
    const title = el.getAttribute('title');
    if (title) return title.trim().slice(0, MAX_TEXT);
    return '';
  }

  function isWhatsApp(href) {
    return /wa\.me|api\.whatsapp\.com|web\.whatsapp\.com/i.test(href);
  }

  document.addEventListener(
    'click',
    (event) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const el = closestWith(event.target, 'a[href], button, [data-track], [role="button"]');
      if (!el) return;

      const href = el.getAttribute('href') || '';
      const track = trackOf(el);
      const villa = villaOf(el);
      const withVilla = villa ? { villa_name: villa } : {};
      const isWa = Boolean(href) && isWhatsApp(href);

      // Pemesanan di form multi-step: satu klik = generate_lead saja, walau
      // href-nya WhatsApp, supaya konversi tidak terhitung dua kali.
      if (track === 'lead_submit') {
        send('generate_lead', {
          form_name: formNameOf(el, 'booking_form'),
          ...withVilla,
        });
        return;
      }

      // Elegan bertanda booking_click sekaligus menuju WhatsApp (CTA "Pesan
      // Sekarang" di halaman villa) tetap mengirim keduanya.
      if (track === 'booking_click') {
        send('booking_click', withVilla);
      }

      if (isWa) {
        send('whatsapp_click', {
          link_url: el.href || href,
          link_text: labelOf(el),
          ...withVilla,
        });
        return;
      }

      if (track === 'booking_click') return;

      if (href.toLowerCase().startsWith('tel:')) {
        send('phone_click', { link_url: href, ...withVilla });
      }
    },
    { capture: true, passive: true },
  );

  // Hanya form ber-atribut data-track="generate_lead" yang dihitung sebagai lead,
  // supaya form survei ulasan dan login admin tidak ikut terhitung.
  document.addEventListener(
    'submit',
    (event) => {
      const form = event.target;
      if (!form || typeof form.closest !== 'function') return;

      const marked = closestWith(form, '[data-track="generate_lead"]');
      if (!marked) return;

      send('generate_lead', {
        form_name: formNameOf(marked, formNameOf(form, 'form')),
        ...(villaOf(marked) ? { villa_name: villaOf(marked) } : {}),
      });
    },
    { capture: true },
  );
}