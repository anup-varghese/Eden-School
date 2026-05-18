/**
 * app.js — Firebase initialisation + Instagram feed loader
 *
 * HOW IT WORKS:
 *   1. A Firebase Cloud Function (functions/index.js) runs on a schedule,
 *      fetches the latest posts from the Instagram Graph API, and stores
 *      them in Firestore under the collection "instagramPosts".
 *   2. This file reads those cached posts from Firestore and renders the
 *      feed grid, so the site never makes direct calls to the Instagram API.
 *
 * SETUP (one-time):
 *   - Replace the firebaseConfig values below with your project's config.
 *   - Deploy the Firebase Function (see functions/index.js).
 *   - Set the Instagram access token in Firebase Secret Manager or as a
 *     Function env var (see functions/index.js comments).
 */

import { initializeApp }       from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, query, orderBy, limit, getDocs }
                                from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ── Firebase config ── REPLACE with your project's config ── */
const firebaseConfig = {
  apiKey:            "REPLACE_WITH_YOUR_API_KEY",
  authDomain:        "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  projectId:         "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket:     "REPLACE_WITH_YOUR_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
  appId:             "REPLACE_WITH_YOUR_APP_ID",
};

const IS_CONFIGURED = !firebaseConfig.apiKey.startsWith('REPLACE');

const feedContainer  = document.getElementById('instagramFeed');
const feedFallback   = document.getElementById('feedFallback');

if (!IS_CONFIGURED) {
  /* Config not yet set — show fallback link */
  showFallback();
} else {
  loadFeed();
}

async function loadFeed() {
  try {
    const app = initializeApp(firebaseConfig);
    const db  = getFirestore(app);

    const q = query(
      collection(db, 'instagramPosts'),
      orderBy('timestamp', 'desc'),
      limit(12)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      showFallback();
      return;
    }

    feedContainer.innerHTML = '';

    snap.forEach(doc => {
      const post = doc.data();
      feedContainer.appendChild(buildFeedItem(post));
    });

  } catch (err) {
    console.error('Feed load error:', err);
    showFallback();
  }
}

function buildFeedItem(post) {
  const link = document.createElement('a');
  link.href   = post.permalink || 'https://www.instagram.com/esltrivandrum';
  link.target = '_blank';
  link.rel    = 'noopener noreferrer';
  link.className = 'feed-item';

  const isVideo = post.media_type === 'VIDEO';

  if (isVideo) {
    const video = document.createElement('video');
    video.src           = post.media_url;
    video.muted         = true;
    video.loop          = true;
    video.playsinline   = true;
    video.poster        = post.thumbnail_url || '';
    link.addEventListener('mouseenter', () => video.play());
    link.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
    link.appendChild(video);

    const badge = document.createElement('div');
    badge.className   = 'feed-item-video-badge';
    badge.textContent = '▶ Video';
    link.appendChild(badge);
  } else {
    const img = document.createElement('img');
    img.src     = post.media_url;
    img.alt     = post.caption ? post.caption.slice(0, 80) : 'Eden School post';
    img.loading = 'lazy';
    img.decoding = 'async';
    link.appendChild(img);
  }

  const overlay = document.createElement('div');
  overlay.className = 'feed-item-overlay';
  if (post.like_count) {
    overlay.innerHTML = `<span class="feed-item-likes">♥ ${post.like_count}</span>`;
  }
  link.appendChild(overlay);

  return link;
}

function showFallback() {
  feedContainer.innerHTML = '';
  feedFallback.classList.remove('hidden');
}
