/* RB Care: progressive form UI. Cart, accounts and checkout belong to WooCommerce. */
(() => {
  'use strict';
  const config = window.RBCare;
  if (!config) return;
  let language = config.language;
  const dictionary = config.dictionary;
  const reverse = new Map(Object.entries(dictionary.hindi).map(([en, hi]) => [hi, en]));
  const translate = (text) => {
    const cart = text.match(/^(?:Cart|कार्ट) \((\d+)\)$/);
    if (cart) return (language === 'hi' ? 'कार्ट' : 'Cart') + ' (' + cart[1] + ')';
    const en = dictionary.aliases[text] || reverse.get(text) || text;
    return language === 'hi' ? (dictionary.hindi[en] || en) : en;
  };
  function translatePage() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    for (const node of textNodes) {
      if (node.parentElement.closest('script,style,textarea,input,[translate="no"],.woocommerce-product-details__short-description,.product_title')) continue;
      const trimmed = node.textContent.trim();
      if (trimmed && (dictionary.hindi[trimmed] || reverse.has(trimmed) || dictionary.aliases[trimmed] || /^(?:Cart|कार्ट) \(\d+\)$/.test(trimmed))) node.textContent = node.textContent.replace(trimmed, translate(trimmed));
    }
    for (const element of document.querySelectorAll('[placeholder],[aria-label]')) {
      if (element.closest('[translate="no"]')) continue;
      for (const attr of ['placeholder', 'aria-label']) if (element.hasAttribute(attr)) element.setAttribute(attr, translate(element.getAttribute(attr)));
    }
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en-IN';
    document.querySelectorAll('[data-rb-language]').forEach(link => {
      if (link.dataset.rbLanguage === language) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
    });
  }
  document.querySelectorAll('[data-rb-language]').forEach(link => link.addEventListener('click', async event => {
    event.preventDefault();
    try {
      const result = await fetch(config.root + 'language', {method:'POST',headers:{'Content-Type':'application/json','X-WP-Nonce':config.nonce},body:JSON.stringify({language:link.dataset.rbLanguage})});
      if (!result.ok) { window.location.href = link.href; return; }
      language = link.dataset.rbLanguage; translatePage();
    } catch { window.location.href = link.href; }
  }));
  function message(target, text, error = false) {
    target.replaceChildren(); target.className = 'rb-notice' + (error ? ' rb-error' : ''); target.textContent = text;
  }
  document.querySelectorAll('[data-rb-form]').forEach(form => {
    const result = form.querySelector('[data-rb-result]');
    const steps = Array.from(form.querySelectorAll('[data-step]'));
    const submit = form.querySelector('[type="submit"]'); let step = 0;
    function showStep(next) {
      step = next; steps.forEach((section,index) => {section.hidden = index !== step;});
      form.querySelector('[data-rb-back]').hidden = step === 0;
      form.querySelector('[data-rb-next]').hidden = step === steps.length - 1;
      form.querySelector('[data-rb-step-label]').textContent = `${step + 1} / ${steps.length}`;
      submit.hidden = step !== steps.length - 1;
    }
    const invalid = (root) => Array.from(root.querySelectorAll('input,select,textarea')).find(field => !field.checkValidity());
    if (steps.length) {
      form.noValidate = true;
      form.querySelector('.rb-step-controls').hidden = false;
      form.querySelector('[data-rb-next]').addEventListener('click', () => { const field = invalid(steps[step]); if (field) field.reportValidity(); else showStep(step + 1); });
      form.querySelector('[data-rb-back]').addEventListener('click', () => showStep(Math.max(0, step - 1)));
      showStep(0);
    }
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const field = invalid(form);
      if (field) { if (steps.length) showStep(steps.findIndex(section=>section.contains(field))); field.reportValidity(); return; }
      if (form.dataset.rbForm === 'sell') {
        const files = form.querySelector('[type="file"]').files;
        if (files.length < 1 || files.length > 6 || Array.from(files).some(file => file.size > 3 * 1024 * 1024 || !['image/jpeg','image/png','image/webp'].includes(file.type))) {message(result,translate('Add 1–6 JPG, PNG or WebP photos, up to 3 MB each.'),true); return;}
      }
      submit.disabled = true;
      try {
        const response = await fetch(config.root + form.dataset.rbForm, {method:'POST',headers:{'X-WP-Nonce':config.nonce},body:new FormData(form)});
        const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Could not save this request.');
        if (data.trackingUrl) {
          message(result,translate('Request received. Save this private tracking link:'));
          const link = document.createElement('a'); link.href = data.trackingUrl; link.textContent = data.trackingUrl; link.style.display = 'block'; result.append(link);
        } else message(result,translate('Your enquiry has been saved.') + ' ' + data.reference);
        form.reset(); if (steps.length) showStep(0);
      } catch (error) { message(result,error.message,true); } finally {submit.disabled = false;}
    });
  });
  const tracker = document.querySelector('[data-rb-track]');
  const objectUrls = [];
  async function refreshTracking() {
    const parts = window.location.hash.slice(1).split(':');
    const result = tracker.querySelector('[data-rb-result]');
    if (parts.length !== 2 || !/^[a-f0-9-]{36}$/i.test(parts[0]) || !/^[a-f0-9]{64}$/i.test(parts[1])) return;
    const headers = {Authorization:'Bearer ' + parts[1]};
    try {
      const response = await fetch(config.root + 'sell/' + parts[0],{headers,cache:'no-store'});
      const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Unable to open this request.');
      objectUrls.splice(0).forEach(URL.revokeObjectURL);
      message(result,`${data.brand} ${data.model} · ${data.status}`);
      if (Number(data.teamPrice) > 0) { const price = document.createElement('p'); price.textContent = translate('Team-approved price') + ': ' + new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(Number(data.teamPrice)); result.append(price); }
      if (data.ownerNote) {const note=document.createElement('p');note.textContent=data.ownerNote;result.append(note);}
      const gallery = document.createElement('div'); gallery.className='rb-private-photos'; result.append(gallery);
      for (const photo of data.photos) {
        const photoResponse = await fetch(photo.url,{headers,cache:'no-store'});
        if (!photoResponse.ok) continue;
        const url = URL.createObjectURL(await photoResponse.blob()); objectUrls.push(url);
        const image=document.createElement('img');image.src=url;image.alt=`${data.brand} ${data.model}`;gallery.append(image);
      }
    } catch(error) {message(result,error.message,true);}
  }
  if (tracker) {tracker.querySelector('[data-rb-refresh]').addEventListener('click',refreshTracking);window.addEventListener('hashchange',refreshTracking);void refreshTracking();}
  window.addEventListener('pagehide',()=>objectUrls.forEach(URL.revokeObjectURL));
  translatePage();
})();
