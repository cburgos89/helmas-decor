/* ============================================================
   Helma's Décor, LLC — Main JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------
     Active Nav Link
  ---------------------------------------------------------- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a:not(.btn)').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ----------------------------------------------------------
     Hamburger Menu
  ---------------------------------------------------------- */
  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.querySelector('.nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }

  /* ----------------------------------------------------------
     Hero Ken Burns Effect
  ---------------------------------------------------------- */
  const hero = document.querySelector('.hero');
  if (hero) {
    setTimeout(() => hero.classList.add('loaded'), 100);
  }

  /* ----------------------------------------------------------
     Gallery Filter
  ---------------------------------------------------------- */
  const filterBtns  = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  if (filterBtns.length && galleryItems.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active button
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;

        galleryItems.forEach(item => {
          const cat = item.dataset.category;
          if (filter === 'all' || cat === filter) {
            item.style.display = 'block';
            item.style.animation = 'filterIn 0.4s ease forwards';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  /* ----------------------------------------------------------
     Lightbox
  ---------------------------------------------------------- */
  const lightbox    = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeLb     = document.getElementById('lightbox-close');
  const prevBtn     = document.getElementById('lightbox-prev');
  const nextBtn     = document.getElementById('lightbox-next');

  /* ----------------------------------------------------------
     Scroll Fade-in (IntersectionObserver)
  ---------------------------------------------------------- */
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    fadeEls.forEach(el => observer.observe(el));
  }

  /* ----------------------------------------------------------
     Phone Number Auto-format
  ---------------------------------------------------------- */
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('keydown', (e) => {
      // Allow: backspace, delete, tab, escape, arrows, home, end
      const allowed = ['Backspace','Delete','Tab','Escape','ArrowLeft','ArrowRight','Home','End'];
      if (allowed.includes(e.key)) return;
      // Block anything that isn't a digit
      if (!/^\d$/.test(e.key)) e.preventDefault();
    });

    phoneInput.addEventListener('input', () => {
      const digits = phoneInput.value.replace(/\D/g, '').slice(0, 10);
      let formatted = '';
      if (digits.length > 6) {
        formatted = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
      } else if (digits.length > 3) {
        formatted = `(${digits.slice(0,3)}) ${digits.slice(3)}`;
      } else if (digits.length > 0) {
        formatted = `(${digits}`;
      }
      phoneInput.value = formatted;
    });
  }

  /* ----------------------------------------------------------
     Contact Form — AJAX Submit
  ---------------------------------------------------------- */
  const contactForm = document.getElementById('contact-form');
  const submitBtn   = document.getElementById('contact-submit');
  const feedbackDiv = document.getElementById('form-feedback');

  if (contactForm && submitBtn && feedbackDiv) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitBtn.disabled    = true;
      submitBtn.textContent = 'Sending\u2026';
      feedbackDiv.style.display = 'none';

      try {
        const res = await fetch('contact.php', {
          method:  'POST',
          body:    new FormData(contactForm),
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
        let data;
        try { data = await res.json(); }
        catch (_) { data = { success: false, message: 'Unexpected server response. Please try again.' }; }

        feedbackDiv.style.display = 'block';
        if (data.success) {
          feedbackDiv.textContent      = data.message;
          feedbackDiv.style.background = '#d4edda';
          feedbackDiv.style.color      = '#155724';
          feedbackDiv.style.border     = '1px solid #c3e6cb';
          contactForm.reset();
          submitBtn.textContent = 'Message Sent';
        } else {
          feedbackDiv.textContent      = data.message || 'Something went wrong. Please try again.';
          feedbackDiv.style.background = '#f8d7da';
          feedbackDiv.style.color      = '#721c24';
          feedbackDiv.style.border     = '1px solid #f5c6cb';
          submitBtn.disabled    = false;
          submitBtn.textContent = 'Send Message';
        }
      } catch (_) {
        feedbackDiv.style.display      = 'block';
        feedbackDiv.textContent        = 'Network error. Please check your connection and try again.';
        feedbackDiv.style.background   = '#f8d7da';
        feedbackDiv.style.color        = '#721c24';
        feedbackDiv.style.border       = '1px solid #f5c6cb';
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Send Message';
      }
    });
  }

  if (!lightbox) return;

  let visibleItems = [];
  let currentIndex = 0;

  // Prevent background scroll on iOS (touchmove must be non-passive to call preventDefault)
  const blockScroll = (e) => e.preventDefault();

  function openLightbox(clickedItem) {
    visibleItems = [...document.querySelectorAll('.gallery-item')]
      .filter(el => el.style.display !== 'none');
    currentIndex = visibleItems.indexOf(clickedItem);
    if (currentIndex === -1) currentIndex = 0;
    const img = visibleItems[currentIndex].querySelector('img');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightbox.classList.add('open');
    document.body.classList.add('lightbox-open');
    document.addEventListener('touchmove', blockScroll, { passive: false });
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.classList.remove('lightbox-open');
    document.removeEventListener('touchmove', blockScroll);
    lightboxImg.src = '';
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
    const img = visibleItems[currentIndex].querySelector('img');
    lightboxImg.style.opacity = '0';
    setTimeout(() => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightboxImg.style.opacity = '1';
    }, 150);
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % visibleItems.length;
    const img = visibleItems[currentIndex].querySelector('img');
    lightboxImg.style.opacity = '0';
    setTimeout(() => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightboxImg.style.opacity = '1';
    }, 150);
  }

  // Attach click to each gallery item
  document.querySelectorAll('.gallery-item').forEach((item) => {
    item.addEventListener('click', () => openLightbox(item));
  });

  if (closeLb) closeLb.addEventListener('click', closeLightbox);
  if (prevBtn) prevBtn.addEventListener('click', showPrev);
  if (nextBtn) nextBtn.addEventListener('click', showNext);

  // Close on overlay click
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   showPrev();
    if (e.key === 'ArrowRight')  showNext();
  });

  // Smooth image transition
  lightboxImg.style.transition = 'opacity 0.15s ease';

});
