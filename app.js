/* ============================================================
   JBL Rent — Main Application Script
   ============================================================ */

(function () {
  'use strict';

  // ─── Frame Sequence (Scroll-Scrub) ────────────────────────
  const FRAME_COUNT = 84;
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d');
  const heroSection = document.getElementById('hero');
  const images = [];
  let loadedCount = 0;
  let currentFrame = -1;

  // Pre-size canvas to first image dimensions
  function sizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  sizeCanvas();
  window.addEventListener('resize', () => {
    sizeCanvas();
    drawFrame(currentFrame < 0 ? 0 : currentFrame);
  });

  // Load all frames
  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    img.src = `frames/frame_${i}.webp`;
    img.onload = () => {
      loadedCount++;
      if (loadedCount === 1) drawFrame(0); // show first frame ASAP
    };
    images[i] = img;
  }

  function drawFrame(index) {
    if (index < 0 || index >= FRAME_COUNT) return;
    const img = images[index];
    if (!img || !img.complete) return;
    currentFrame = index;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Cover-fit the image
    const cW = canvas.width;
    const cH = canvas.height;
    const iW = img.naturalWidth;
    const iH = img.naturalHeight;
    const scale = Math.max(cW / iW, cH / iH);
    const dW = iW * scale;
    const dH = iH * scale;
    const dx = (cW - dW) / 2;
    const dy = (cH - dH) / 2;

    ctx.drawImage(img, dx, dy, dW, dH);
  }

  // Scroll-scrub logic
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect = heroSection.getBoundingClientRect();
      const scrollable = heroSection.offsetHeight - window.innerHeight;
      const progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);
      const frameIndex = Math.min(Math.floor(progress * FRAME_COUNT), FRAME_COUNT - 1);
      if (frameIndex !== currentFrame) {
        drawFrame(frameIndex);
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ─── Header Scroll Effect ────────────────────────────────
  const header = document.getElementById('header');
  function updateHeader() {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });

  // ─── FAQ Accordion ───────────────────────────────────────
  document.querySelectorAll('.faq__question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq__item');
      const answer = item.querySelector('.faq__answer');
      const isOpen = item.classList.contains('active');

      // Close all
      document.querySelectorAll('.faq__item.active').forEach(openItem => {
        openItem.classList.remove('active');
        openItem.querySelector('.faq__answer').style.maxHeight = '0';
        openItem.querySelector('.faq__question').setAttribute('aria-expanded', 'false');
      });

      // Open clicked (if was closed)
      if (!isOpen) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ─── Modal ───────────────────────────────────────────────
  const overlay = document.getElementById('modalOverlay');
  const form = document.getElementById('reservationForm');
  const formSuccess = document.getElementById('formSuccess');
  const submitBtn = document.getElementById('submitBtn');

  function openModal() {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.getElementById('headerCta').addEventListener('click', openModal);
  document.getElementById('pricingCta').addEventListener('click', openModal);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
  });

  // ─── Form Submission (Dual-Send) ─────────────────────────
  const WEB3FORMS_KEY = 'a914afc5-d7db-436e-8f77-965463c29623';
  const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbz_Y2ac5MbkyaWDviwD4SOYSAAOkncvoRdC8-j5qCHaVpG4S_bqv00ZmMxfX05p5hG2/exec';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      date: form.date.value,
    };

    // Build Web3Forms payload
    const w3body = new FormData();
    w3body.append('access_key', WEB3FORMS_KEY);
    w3body.append('subject', 'Nova rezervacija — JBL Rent');
    w3body.append('Ime i Prezime', data.name);
    w3body.append('Email', data.email);
    w3body.append('Telefon', data.phone);
    w3body.append('Datum najma', data.date);

    // Google Sheets payload
    const sheetBody = new URLSearchParams(data);

    try {
      await Promise.all([
        fetch('https://api.web3forms.com/submit', { method: 'POST', body: w3body }),
        fetch(SHEETS_URL, { method: 'POST', body: sheetBody, mode: 'no-cors' }),
      ]);
    } catch (err) {
      // Fail silently — still show success
      console.error('Submission error:', err);
    }

    // Show success
    submitBtn.classList.remove('loading');
    form.classList.add('hidden');
    formSuccess.classList.add('show');

    // Reset after closing
    setTimeout(() => {
      form.reset();
      form.classList.remove('hidden');
      formSuccess.classList.remove('show');
      submitBtn.disabled = false;
    }, 4000);
  });

  // ─── Scroll Reveal ───────────────────────────────────────
  const reveals = document.querySelectorAll('.reveal');
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  reveals.forEach(el => revealObs.observe(el));

})();
