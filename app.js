/**
 * app.js — Firebase init + live data loaders
 *
 * Loads from Firestore:
 *   • googleReviews   → rendered in the testimonials section
 *   • schoolInfo/google → overall rating badge
 *   • instagramPosts  → rendered in the events feed section
 *
 * Falls back gracefully to static content if Firebase isn't configured yet.
 */

import { initializeApp }  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ── Firebase config — REPLACE with your project's config ── */
const firebaseConfig = {
  apiKey:            "REPLACE_WITH_YOUR_API_KEY",
  authDomain:        "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  projectId:         "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket:     "REPLACE_WITH_YOUR_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
  appId:             "REPLACE_WITH_YOUR_APP_ID",
};

const IS_CONFIGURED = !firebaseConfig.apiKey.startsWith('REPLACE');

if (IS_CONFIGURED) {
  const app = initializeApp(firebaseConfig);
  const db  = getFirestore(app);
  loadGoogleReviews(db);
  loadInstagramFeed(db);
} else {
  /* Not configured yet — show static fallbacks */
  showStaticReviews();
  showFeedFallback();
}


/* ══════════════════════════════════════════════════════
   GOOGLE REVIEWS
   ══════════════════════════════════════════════════════ */
async function loadGoogleReviews(db) {
  try {
    /* Load overall rating */
    const infoSnap = await getDoc(doc(db, 'schoolInfo', 'google'));
    if (infoSnap.exists()) {
      const { rating, userRatingCount } = infoSnap.data();
      updateRatingBadge(rating, userRatingCount);
    }

    /* Load individual reviews */
    const reviewsSnap = await getDocs(collection(db, 'googleReviews'));

    if (reviewsSnap.empty) {
      showStaticReviews();
      return;
    }

    const reviews = [];
    reviewsSnap.forEach(d => reviews.push(d.data()));

    renderReviews(reviews);
  } catch (err) {
    console.error('Google reviews load error:', err);
    showStaticReviews();
  }
}

function updateRatingBadge(rating, count) {
  const ratingEl = document.getElementById('googleRating');
  const countEl  = document.getElementById('googleRatingCount');
  if (ratingEl) ratingEl.textContent = rating?.toFixed(1) ?? '—';
  if (countEl)  countEl.textContent  = count ? `Based on ${count.toLocaleString()} Google Reviews` : 'Based on Google Reviews';
}

function renderReviews(reviews) {
  const grid = document.getElementById('reviewsGrid');
  if (!grid) return;

  grid.innerHTML = '';

  reviews.forEach(review => {
    const initial = (review.authorName || 'A')[0].toUpperCase();
    const colors  = ['#00AECE','#E81FA3','#06C67A','#007A95','#C4198B'];
    const color   = colors[initial.charCodeAt(0) % colors.length];
    const stars   = '★'.repeat(Math.min(5, review.rating || 5));

    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `
      <div class="review-header">
        ${review.authorPhoto
          ? `<img src="${review.authorPhoto}" alt="${review.authorName}" class="reviewer-avatar" style="background:none;padding:0;object-fit:cover;" />`
          : `<div class="reviewer-avatar" style="background:${color};">${initial}</div>`
        }
        <div>
          <div class="reviewer-name">${review.authorName || 'Anonymous'}</div>
          <div class="reviewer-meta">${review.relativeTime || ''} · Google</div>
        </div>
      </div>
      <div class="stars text-sm mb-2">${stars}</div>
      <p class="review-text">"${review.text || ''}"</p>
      <div class="review-footer">
        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" class="h-3.5" />
      </div>`;

    grid.appendChild(card);
  });
}

function showStaticReviews() {
  /* Static reviews shown until Firebase function runs for the first time */
  const staticReviews = [
    { authorName: 'Anitha Rajan',   rating: 5, relativeTime: '3 months ago', text: 'My daughter has blossomed so much since joining Eden School. The teachers are incredibly caring and the activities keep the children engaged every single day. Best decision we made!' },
    { authorName: 'Sreekanth Nair', rating: 5, relativeTime: '5 months ago', text: 'Excellent playschool! The staff is warm and professional. My son used to be very shy but after a few months at Eden School, he\'s confident, social, and loves going to school every morning.' },
    { authorName: 'Priya Menon',    rating: 5, relativeTime: '1 month ago',  text: 'The Play·Learn·Grow philosophy really shows in the way they handle each child. My twins are in different classes and both teachers are amazing. Clean, safe, and so well organised.' },
    { authorName: 'Roshan Thomas',  rating: 5, relativeTime: '2 months ago', text: 'Wonderful school! The events and activities they organise are creative and really involve the kids. The school management is always responsive and approachable. Highly recommended!' },
  ];
  renderReviews(staticReviews);
}


/* ══════════════════════════════════════════════════════
   INSTAGRAM FEED
   ══════════════════════════════════════════════════════ */
async function loadInstagramFeed(db) {
  try {
    const q    = query(collection(db, 'instagramPosts'), orderBy('timestamp', 'desc'), limit(12));
    const snap = await getDocs(q);

    if (snap.empty) { showFeedFallback(); return; }

    const feed = document.getElementById('instagramFeed');
    feed.innerHTML = '';
    snap.forEach(d => feed.appendChild(buildFeedItem(d.data())));
  } catch (err) {
    console.error('Feed load error:', err);
    showFeedFallback();
  }
}

function buildFeedItem(post) {
  const link = document.createElement('a');
  link.href      = post.permalink || 'https://www.instagram.com/esltrivandrum';
  link.target    = '_blank';
  link.rel       = 'noopener noreferrer';
  link.className = 'feed-item';

  const isVideo = post.media_type === 'VIDEO';
  if (isVideo) {
    const video = document.createElement('video');
    video.src         = post.media_url;
    video.muted       = true;
    video.loop        = true;
    video.playsinline = true;
    video.poster      = post.thumbnail_url || '';
    link.addEventListener('mouseenter', () => video.play());
    link.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
    link.appendChild(video);
    const badge = document.createElement('div');
    badge.className   = 'feed-item-video-badge';
    badge.textContent = '▶ Video';
    link.appendChild(badge);
  } else {
    const img = document.createElement('img');
    img.src      = post.media_url;
    img.alt      = post.caption ? post.caption.slice(0, 80) : 'Eden School post';
    img.loading  = 'lazy';
    img.decoding = 'async';
    link.appendChild(img);
  }

  const overlay = document.createElement('div');
  overlay.className = 'feed-item-overlay';
  if (post.like_count) overlay.innerHTML = `<span class="feed-item-likes">♥ ${post.like_count}</span>`;
  link.appendChild(overlay);

  return link;
}

function showFeedFallback() {
  document.getElementById('instagramFeed').innerHTML = '';
  document.getElementById('feedFallback')?.classList.remove('hidden');
}
