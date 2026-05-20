const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/eden-school-website/databases/eden-school-website/documents';

loadGoogleReviews();
loadInstagramFeed();
loadFacebookFeed();

async function loadGoogleReviews() {
  try {
    const [infoRes, reviewsRes] = await Promise.all([
      fetch(FIRESTORE_BASE + '/schoolInfo/google'),
      fetch(FIRESTORE_BASE + '/googleReviews'),
    ]);

    if (infoRes.ok) {
      const info = await infoRes.json();
      const rating = info.fields?.rating?.integerValue || info.fields?.rating?.doubleValue;
      const count  = info.fields?.userRatingCount?.integerValue;
      if (rating) updateRatingBadge(Number(rating), Number(count));
    }

    if (!reviewsRes.ok) { showStaticReviews(); return; }

    const reviewsJson = await reviewsRes.json();
    const docs = reviewsJson.documents || [];

    if (!docs.length) { showStaticReviews(); return; }

    const filtered = docs
      .map(d => ({
        authorName:   d.fields?.authorName?.stringValue   || 'Anonymous',
        authorPhoto:  d.fields?.authorPhoto?.stringValue  || '',
        rating:       Number(d.fields?.rating?.integerValue || d.fields?.rating?.doubleValue || 5),
        text:         d.fields?.text?.stringValue         || '',
        relativeTime: d.fields?.relativeTime?.stringValue || '',
        publishTime:  d.fields?.publishTime?.stringValue  || '',
      }))
      .filter(r => r.rating >= 4)
      .sort((a, b) => b.publishTime.localeCompare(a.publishTime));

    const count = filtered.length >= 8 ? 8 : filtered.length >= 4 ? 4 : filtered.length;
    const reviews = filtered.slice(0, count);

    renderReviews(reviews);
  } catch (err) {
    console.error('Google reviews load error:', err);
    showStaticReviews();
  }
}

function updateRatingBadge(rating, count) {
  const ratingEl     = document.getElementById('googleRating');
  const heroRatingEl = document.getElementById('heroGoogleRating');
  const countEl      = document.getElementById('googleRatingCount');
  if (ratingEl)     ratingEl.textContent     = rating.toFixed(1);
  if (heroRatingEl) heroRatingEl.textContent  = rating.toFixed(1);
  if (countEl)      countEl.textContent       = count ? 'Based on ' + count.toLocaleString() + ' Google Reviews' : 'Based on Google Reviews';
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
    card.innerHTML =
      '<div class="review-header">'
      + (review.authorPhoto
        ? '<img src="' + review.authorPhoto + '" alt="' + review.authorName + '" class="reviewer-avatar" style="background:none;padding:0;object-fit:cover;" />'
        : '<div class="reviewer-avatar" style="background:' + color + ';">' + initial + '</div>')
      + '<div>'
      + '<div class="reviewer-name">' + review.authorName + '</div>'
      + '<div class="reviewer-meta">' + (review.relativeTime || '') + ' · Google</div>'
      + '</div></div>'
      + '<div class="stars text-sm mb-2">' + stars + '</div>'
      + '<p class="review-text">"' + review.text + '"</p>'
      + '<div class="review-footer"><img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" class="h-3.5" /></div>';

    grid.appendChild(card);
  });
}

function showStaticReviews() {
  const staticReviews = [
    { authorName: 'Anitha Rajan',   rating: 5, relativeTime: '3 months ago', text: 'My daughter has blossomed so much since joining Eden School. The teachers are incredibly caring and the activities keep the children engaged every single day. Best decision we made!' },
    { authorName: 'Sreekanth Nair', rating: 5, relativeTime: '5 months ago', text: 'Excellent playschool! The staff is warm and professional. My son used to be very shy but after a few months at Eden School, he\'s confident, social, and loves going to school every morning.' },
    { authorName: 'Priya Menon',    rating: 5, relativeTime: '1 month ago',  text: 'The Play·Learn·Grow philosophy really shows in the way they handle each child. My twins are in different classes and both teachers are amazing. Clean, safe, and so well organised.' },
    { authorName: 'Roshan Thomas',  rating: 5, relativeTime: '2 months ago', text: 'Wonderful school! The events and activities they organise are creative and really involve the kids. The school management is always responsive and approachable. Highly recommended!' },
  ];
  renderReviews(staticReviews);
}

async function loadInstagramFeed() {
  try {
    const res  = await fetch(FIRESTORE_BASE + '/instagramPosts');
    const json = await res.json();
    const docs = json.documents || [];

    if (!docs.length) { showFeedFallback(); return; }

    const posts = docs
      .map(d => ({
        id:            d.name.split('/').pop(),
        media_type:    d.fields?.media_type?.stringValue  || 'IMAGE',
        media_url:     d.fields?.media_url?.stringValue   || '',
        thumbnail_url: d.fields?.thumbnail_url?.stringValue || '',
        permalink:     d.fields?.permalink?.stringValue   || 'https://www.instagram.com/eden_school_of_learning',
        caption:       d.fields?.caption?.stringValue     || '',
        like_count:    Number(d.fields?.like_count?.integerValue || 0),
        timestamp:     d.fields?.timestamp?.stringValue   || '',
      }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 12);

    buildCarousel('instagramFeed', posts, function(slide, post) {
      const link = document.createElement('a');
      link.href   = post.permalink;
      link.target = '_blank';
      link.rel    = 'noopener noreferrer';
      link.style.cssText = 'display:block;width:100%;height:100%;';

      const isVideo = post.media_type === 'VIDEO';
      if (isVideo) {
        const video = document.createElement('video');
        video.src         = post.media_url;
        video.muted       = true;
        video.loop        = true;
        video.playsinline = true;
        video.poster      = post.thumbnail_url || '';
        link.appendChild(video);
        const badge = document.createElement('div');
        badge.className   = 'carousel-video-badge';
        badge.textContent = 'Video';
        slide.appendChild(badge);
      } else {
        const img    = document.createElement('img');
        img.src      = post.media_url;
        img.alt      = post.caption ? post.caption.slice(0, 80) : 'Eden School post';
        img.loading  = 'lazy';
        img.decoding = 'async';
        link.appendChild(img);
      }
      slide.appendChild(link);
    }, 4000);
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
    badge.textContent = 'Video';
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
  if (post.like_count) overlay.innerHTML = '<span class="feed-item-likes">♥ ' + post.like_count + '</span>';
  link.appendChild(overlay);

  return link;
}

function showFeedFallback() {
  const feed = document.getElementById('instagramFeed');
  if (feed) feed.innerHTML = '';
  const fallback = document.getElementById('feedFallback');
  if (fallback) fallback.classList.remove('hidden');
}

async function loadFacebookFeed() {
  try {
    const res  = await fetch(FIRESTORE_BASE + '/facebookPosts?pageSize=12');
    const json = await res.json();
    const docs = json.documents || [];
    if (!docs.length) return;

    const posts = docs
      .map(d => ({
        picture:     d.fields?.picture?.stringValue     || '',
        message:     d.fields?.message?.stringValue     || '',
        permalink:   d.fields?.permalink?.stringValue   || 'https://www.facebook.com/esltvm',
        createdTime: d.fields?.createdTime?.stringValue || '',
      }))
      .filter(p => p.picture)
      .sort((a, b) => b.createdTime.localeCompare(a.createdTime))
      .slice(0, 12);

    buildCarousel('facebookFeed', posts, function(slide, post) {
      const link = document.createElement('a');
      link.href   = post.permalink;
      link.target = '_blank';
      link.rel    = 'noopener noreferrer';
      link.style.cssText = 'display:block;width:100%;height:100%;';

      const img    = document.createElement('img');
      img.src      = post.picture;
      img.alt      = post.message ? post.message.slice(0, 80) : 'Eden School post';
      img.loading  = 'lazy';
      img.decoding = 'async';
      link.appendChild(img);
      slide.appendChild(link);
    }, 4500);
  } catch (err) {
    console.error('Facebook feed load error:', err);
  }
}

function buildCarousel(containerId, items, buildSlide, interval) {
  const container = document.getElementById(containerId);
  if (!container || !items.length) return;

  container.innerHTML = '';
  container.className = 'feed-carousel';

  const track = document.createElement('div');
  track.className = 'carousel-track';
  items.forEach(function(item) {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    buildSlide(slide, item);
    track.appendChild(slide);
  });
  container.appendChild(track);

  const dotsEl = document.createElement('div');
  dotsEl.className = 'carousel-dots';
  items.forEach(function(_, i) {
    const dot = document.createElement('span');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dotsEl.appendChild(dot);
  });
  container.appendChild(dotsEl);

  let current = 0;
  const dots  = dotsEl.querySelectorAll('.carousel-dot');

  function goTo(index) {
    current = (index + items.length) % items.length;
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    dots.forEach(function(d, i) { d.classList.toggle('active', i === current); });
  }

  dots.forEach(function(dot, i) { dot.addEventListener('click', function() { goTo(i); }); });
  setInterval(function() { goTo(current + 1); }, interval || 4000);
}
