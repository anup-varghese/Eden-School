/* ── Navbar scroll effect ──────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ── Mobile menu toggle ────────────────────────────── */
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu    = document.getElementById('mobileMenu');

mobileMenuBtn.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('hidden') === false;
  mobileMenuBtn.setAttribute('aria-expanded', String(open));
});

function closeMobileMenu() {
  mobileMenu.classList.add('hidden');
  mobileMenuBtn.setAttribute('aria-expanded', 'false');
}

/* ── Scroll-in animations ──────────────────────────── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.feature-card, .program-card, .contact-info-row').forEach((el, i) => {
  el.classList.add('fade-up');
  el.style.transitionDelay = `${(i % 3) * 0.1}s`;
  observer.observe(el);
});

/* ── Footer year ───────────────────────────────────── */
const yearEl = document.getElementById('footerYear');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── Admission form → Web3Forms → esltrivandrum@gmail.com ── */
const WEB3FORMS_KEY = '57f033f5-3a7e-45f7-903b-7beddfe882e1';

const form          = document.getElementById('admissionForm');
const submitBtn     = document.getElementById('submitBtn');
const submitText    = document.getElementById('submitText');
const submitSpinner = document.getElementById('submitSpinner');
const formSuccess   = document.getElementById('formSuccess');
const formError     = document.getElementById('formError');

const AGE_LABELS = {
  '1.5-2.5': 'Playgroup (1.5 – 2.5 yrs)',
  '2.5-3.5': 'Nursery (2.5 – 3.5 yrs)',
  '3.5-4.5': 'LKG (3.5 – 4.5 yrs)',
  '4.5-5.5': 'UKG (4.5 – 5.5 yrs)',
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  /* Validate required fields */
  const required = form.querySelectorAll('[required]');
  let valid = true;
  required.forEach(field => {
    field.classList.remove('border-red-400');
    if (!field.value.trim()) {
      field.classList.add('border-red-400');
      valid = false;
    }
  });
  if (!valid) return;

  /* Show spinner */
  submitText.classList.add('hidden');
  submitSpinner.classList.remove('hidden');
  submitBtn.disabled = true;
  formSuccess.classList.add('hidden');
  formError.classList.add('hidden');

  const data = Object.fromEntries(new FormData(form));

  const emailBody = `
New Admission Enquiry – Eden School of Learning
================================================
Parent Name  : ${data.parentName}
Child's Name : ${data.childName}
Program      : ${AGE_LABELS[data.childAge] || data.childAge}
Phone        : ${data.phone}
Email        : ${data.email || '—'}
Message      : ${data.message || '—'}
================================================
Received from the Eden School website enquiry form.
  `.trim();

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key:      WEB3FORMS_KEY,
        subject:         `Admission Enquiry – ${data.childName} (${AGE_LABELS[data.childAge] || data.childAge})`,
        from_name:       `${data.parentName} via Eden School Website`,
        replyto:         data.email || 'esltrivandrum@gmail.com',
        message:         emailBody,
        botcheck:        '',
      }),
    });

    const json = await res.json();
    if (json.success) {
      formSuccess.classList.remove('hidden');
      form.reset();
      formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      throw new Error(json.message || 'Submission failed');
    }
  } catch (err) {
    console.error('Form error:', err);
    formError.classList.remove('hidden');
  } finally {
    submitText.classList.remove('hidden');
    submitSpinner.classList.add('hidden');
    submitBtn.disabled = false;
  }
});

/* ── Active nav link highlight on scroll ───────────── */
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(link => {
        link.style.color = link.getAttribute('href') === `#${id}` ? '#00AECE' : '';
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));
