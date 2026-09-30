/**
 * TrendPulse 360 - Main Web Application Logic
 * Supports: Dual-view (Magazine / Inshorts), Live RSS fetch fallback,
 * Search, Bookmarks, Text-to-Speech audio reader, and Viral Sharing.
 */

const App = {
  data: {
    articles: [],
    filteredArticles: [],
    categories: [],
    categoryCounts: {},
    activeCategory: 'trending',
    searchQuery: '',
    viewMode: 'magazine', // 'magazine' or 'inshorts'
    bookmarks: [],
    isSpeaking: false,
    currentSpeechUtterance: null,
    activeArticleModal: null,
    isDarkMode: false
  },

  async init() {
    this.initTheme();
    this.initBookmarks();
    this.bindEvents();
    if (window.SEO) window.SEO.init();
    await this.loadData();
    this.handleInitialRouting();
  },

  initTheme() {
    const savedTheme = localStorage.getItem('tp_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      this.data.isDarkMode = true;
      document.documentElement.classList.add('dark');
    } else {
      this.data.isDarkMode = false;
      document.documentElement.classList.remove('dark');
    }
  },

  toggleTheme() {
    this.data.isDarkMode = !this.data.isDarkMode;
    if (this.data.isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tp_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tp_theme', 'light');
    }
  },

  initBookmarks() {
    try {
      const saved = localStorage.getItem('tp_bookmarks');
      this.data.bookmarks = saved ? JSON.parse(saved) : [];
    } catch (e) {
      this.data.bookmarks = [];
    }
    this.updateBookmarkBadge();
  },

  toggleBookmark(articleId, e) {
    if (e) e.stopPropagation();
    const idx = this.data.bookmarks.indexOf(articleId);
    if (idx > -1) {
      this.data.bookmarks.splice(idx, 1);
    } else {
      this.data.bookmarks.push(articleId);
    }
    localStorage.setItem('tp_bookmarks', JSON.stringify(this.data.bookmarks));
    this.updateBookmarkBadge();
    this.render();
    if (this.data.activeArticleModal && this.data.activeArticleModal.id === articleId) {
      this.updateModalBookmarkBtn();
    }
  },

  isBookmarked(articleId) {
    return this.data.bookmarks.includes(articleId);
  },

  updateBookmarkBadge() {
    const badge = document.getElementById('bookmark-count-badge');
    if (badge) {
      badge.textContent = this.data.bookmarks.length;
      badge.style.display = this.data.bookmarks.length > 0 ? 'inline-flex' : 'none';
    }
  },

  async loadData() {
    const loader = document.getElementById('global-loader');
    if (loader) loader.style.display = 'flex';

    try {
      const response = await fetch('data/news.json?v=' + Date.now());
      if (!response.ok) throw new Error("Local news.json not found");
      const json = await response.json();
      this.data.articles = json.articles || [];
      this.data.categories = json.categories || [];
      this.data.categoryCounts = json.categoryCounts || {};

      const lastUpdatedEl = document.getElementById('last-updated-text');
      if (lastUpdatedEl && json.lastUpdated) {
        lastUpdatedEl.textContent = `Updated: ${json.lastUpdated}`;
      }

      // Smart Fail-Safe: If PC was off and cache is older than 6 hours, auto-refresh live headlines
      try {
        const cacheDate = new Date(json.lastUpdated.replace(' UTC', 'Z'));
        const ageHours = (Date.now() - cacheDate.getTime()) / (1000 * 60 * 60);
        if (ageHours > 6) {
          this.fetchLiveNewsFallback(true);
        }
      } catch (e) {}
    } catch (err) {
      console.warn("Could not load local data/news.json, falling back to live fetch:", err);
      await this.fetchLiveNewsFallback();
    } finally {
      if (loader) loader.style.display = 'none';
      this.renderCategoriesNav();
      this.renderBreakingTicker();
      this.filterArticles();
    }
  },

  async fetchLiveNewsFallback() {
    try {
      const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en')}`;
      const res = await fetch(proxyUrl);
      const data = await res.json();
      if (data && data.items) {
        this.data.articles = data.items.map((item, idx) => ({
          id: `live-${idx}`,
          title: item.title,
          source: item.author || "Google News Wire",
          category: "trending",
          categoryName: "Trending Now",
          categoryIcon: "🔥",
          categoryColor: "from-red-500 to-amber-500",
          url: item.link,
          publishedAt: item.pubDate,
          summary: item.description ? item.description.replace(/<[^>]*>?/gm, '').trim() : item.title,
          bullets: [item.title, "Trending worldwide topic reported by top global media."],
          readTime: "1 min read",
          trendingScore: 99 - idx,
          image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&auto=format&fit=crop&q=80"
        }));
      }
    } catch (e) {
      console.error("Live fetch fallback failed:", e);
    }
  },

  renderCategoriesNav() {
    const container = document.getElementById('categories-nav');
    if (!container) return;

    let html = `
      <button onclick="App.setCategory('trending')" class="category-pill flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${this.data.activeCategory === 'trending' ? 'bg-red-600 text-white shadow-md shadow-red-500/20' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}">
        <span>🔥</span> Trending Now
      </button>
      <button onclick="App.setCategory('bookmarks')" class="category-pill flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${this.data.activeCategory === 'bookmarks' ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}">
        <span>⭐</span> Saved Articles (${this.data.bookmarks.length})
      </button>
    `;

    this.data.categories.forEach(cat => {
      if (cat.id === 'trending') return;
      const isActive = this.data.activeCategory === cat.id;
      const count = this.data.categoryCounts[cat.id] || 0;
      html += `
        <button onclick="App.setCategory('${cat.id}')" class="category-pill flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}">
          <span>${cat.icon}</span> ${cat.name}
          ${count > 0 ? `<span class="text-xs opacity-75 font-mono">(${count})</span>` : ''}
        </button>
      `;
    });

    container.innerHTML = html;
  },

  renderBreakingTicker() {
    const tickerContainer = document.getElementById('ticker-headlines');
    if (!tickerContainer) return;

    const breakingNews = this.data.articles.slice(0, 10);
    if (!breakingNews.length) return;

    let itemsHtml = breakingNews.map(art => `
      <span class="inline-flex items-center mx-6 cursor-pointer hover:underline text-sm font-medium" onclick="App.openArticleModal('${art.id}')">
        <span class="w-2 h-2 rounded-full bg-red-500 mr-2 animate-ping"></span>
        <strong class="text-red-500 dark:text-red-400 mr-2">[${art.categoryName || 'NEWS'}]:</strong>
        ${art.title}
      </span>
    `).join(' • ');

    // Duplicate string for seamless continuous loop
    tickerContainer.innerHTML = itemsHtml + ' • ' + itemsHtml;
  },

  setCategory(catId) {
    this.data.activeCategory = catId;
    window.location.hash = `category=${catId}`;
    this.renderCategoriesNav();
    this.filterArticles();
    if (window.SEO) {
      const catObj = this.data.categories.find(c => c.id === catId);
      window.SEO.updateForCategory(catObj ? catObj.name : catId, catId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  setViewMode(mode) {
    this.data.viewMode = mode;
    const magBtn = document.getElementById('view-mode-magazine');
    const inshortsBtn = document.getElementById('view-mode-inshorts');

    if (magBtn && inshortsBtn) {
      if (mode === 'magazine') {
        magBtn.classList.add('bg-white', 'dark:bg-gray-700', 'shadow-sm');
        inshortsBtn.classList.remove('bg-white', 'dark:bg-gray-700', 'shadow-sm');
      } else {
        inshortsBtn.classList.add('bg-white', 'dark:bg-gray-700', 'shadow-sm');
        magBtn.classList.remove('bg-white', 'dark:bg-gray-700', 'shadow-sm');
      }
    }
    this.render();
  },

  onSearch(val) {
    this.data.searchQuery = val.trim().toLowerCase();
    this.filterArticles();
  },

  filterArticles() {
    let list = this.data.articles;

    if (this.data.activeCategory === 'bookmarks') {
      list = list.filter(art => this.isBookmarked(art.id));
    } else if (this.data.activeCategory && this.data.activeCategory !== 'all') {
      list = list.filter(art => art.category === this.data.activeCategory);
    }

    if (this.data.searchQuery) {
      list = list.filter(art =>
        art.title.toLowerCase().includes(this.data.searchQuery) ||
        art.summary.toLowerCase().includes(this.data.searchQuery) ||
        art.source.toLowerCase().includes(this.data.searchQuery)
      );
    }

    this.data.filteredArticles = list;
    this.render();
  },

  render() {
    const countEl = document.getElementById('results-count');
    if (countEl) {
      countEl.textContent = `${this.data.filteredArticles.length} stories available`;
    }

    if (this.data.viewMode === 'inshorts') {
      this.renderInshortsMode();
    } else {
      this.renderMagazineMode();
    }
  },

  renderMagazineMode() {
    const magazineView = document.getElementById('magazine-view');
    const inshortsView = document.getElementById('inshorts-view');
    if (!magazineView) return;

    magazineView.classList.remove('hidden');
    if (inshortsView) inshortsView.classList.add('hidden');

    const articles = this.data.filteredArticles;
    if (!articles.length) {
      magazineView.innerHTML = `
        <div class="col-span-full text-center py-20">
          <div class="text-5xl mb-3">📰</div>
          <h3 class="text-xl font-bold text-gray-700 dark:text-gray-200">No stories found</h3>
          <p class="text-gray-500 text-sm mt-1">Try another category or clear your search query.</p>
          <button onclick="App.setCategory('trending')" class="mt-4 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold">
            Back to Trending
          </button>
        </div>
      `;
      return;
    }

    // Hero Article (First item if on Trending/General and not searching)
    const showHero = !this.data.searchQuery && this.data.activeCategory !== 'bookmarks' && articles.length > 0;
    const hero = showHero ? articles[0] : null;
    const remaining = showHero ? articles.slice(1) : articles;

    let heroHtml = '';
    if (hero) {
      const isSaved = this.isBookmarked(hero.id);
      heroHtml = `
        <div class="col-span-full mb-8">
          <div class="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl transition-all hover:shadow-2xl grid grid-cols-1 lg:grid-cols-12 cursor-pointer" onclick="App.openArticleModal('${hero.id}')">
            <div class="lg:col-span-7 h-64 sm:h-80 lg:h-auto relative overflow-hidden bg-gray-900">
              <img src="${hero.image}" alt="${hero.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy">
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:hidden"></div>
              <div class="absolute top-4 left-4 flex gap-2">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600 text-white pulse-badge">
                  🔥 Lead Story
                </span>
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-white">
                  ${hero.categoryName}
                </span>
              </div>
            </div>
            <div class="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span class="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">${hero.source}</span>
                  <span>${hero.readTime}</span>
                </div>
                <h2 class="font-serif-headline text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight mb-4">
                  ${hero.title}
                </h2>
                <p class="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-6">
                  ${hero.summary}
                </p>
              </div>
              <div class="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <span class="text-xs text-gray-400">${hero.publishedAt}</span>
                <div class="flex items-center gap-2">
                  <button onclick="App.playAudio('${hero.id}', event)" title="Listen" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                    🔊
                  </button>
                  <button onclick="App.toggleBookmark('${hero.id}', event)" title="Bookmark" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${isSaved ? 'text-amber-500' : 'text-gray-400'}">
                    ${isSaved ? '★' : '☆'}
                  </button>
                  <button onclick="App.shareArticle('${hero.id}', event)" title="Share" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-indigo-600">
                    ↗️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Grid of remaining articles
    const cardsHtml = remaining.map(art => {
      const isSaved = this.isBookmarked(art.id);
      return `
        <article class="card-hover flex flex-col justify-between rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm cursor-pointer" onclick="App.openArticleModal('${art.id}')">
          <div>
            <div class="relative h-48 w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
              <img src="${art.image}" alt="${art.title}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy">
              <div class="absolute top-3 left-3">
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-black/60 backdrop-blur-md text-white">
                  ${art.categoryIcon || '📰'} ${art.categoryName || 'News'}
                </span>
              </div>
              <div class="absolute bottom-2 right-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/90 text-white backdrop-blur-sm">
                  Trending: ${art.trendingScore}%
                </span>
              </div>
            </div>
            <div class="p-5">
              <div class="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-2 font-medium">
                <span class="text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[150px]">${art.source}</span>
                <span>${art.readTime}</span>
              </div>
              <h3 class="font-serif-headline text-lg font-bold text-gray-900 dark:text-white line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-2">
                ${art.title}
              </h3>
              <p class="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 leading-relaxed">
                ${art.summary}
              </p>
            </div>
          </div>
          <div class="px-5 pb-4 pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 text-xs">
            <span class="text-gray-400 text-[11px] truncate max-w-[120px]">${art.publishedAt.split(' ').slice(0, 4).join(' ')}</span>
            <div class="flex items-center gap-1">
              <button onclick="App.playAudio('${art.id}', event)" title="Listen" class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                🔊
              </button>
              <button onclick="App.toggleBookmark('${art.id}', event)" title="Save" class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${isSaved ? 'text-amber-500 font-bold' : 'text-gray-400'}">
                ${isSaved ? '★' : '☆'}
              </button>
              <button onclick="App.shareArticle('${art.id}', event)" title="Share" class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-indigo-600">
                ↗️
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    magazineView.innerHTML = heroHtml + `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 col-span-full">${cardsHtml}</div>`;
  },

  renderInshortsMode() {
    const magazineView = document.getElementById('magazine-view');
    const inshortsView = document.getElementById('inshorts-view');
    if (!inshortsView) return;

    if (magazineView) magazineView.classList.add('hidden');
    inshortsView.classList.remove('hidden');

    const articles = this.data.filteredArticles;
    if (!articles.length) {
      inshortsView.innerHTML = `
        <div class="text-center py-20">
          <p class="text-gray-500">No stories available to flip through.</p>
        </div>
      `;
      return;
    }

    const cardsHtml = articles.map(art => {
      const isSaved = this.isBookmarked(art.id);
      return `
        <div class="inshorts-card max-w-2xl mx-auto my-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden flex flex-col justify-between">
          <div>
            <div class="relative h-64 sm:h-72 w-full overflow-hidden bg-gray-900">
              <img src="${art.image}" alt="${art.title}" class="w-full h-full object-cover">
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
              <div class="absolute top-4 left-4 flex gap-2">
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow">
                  ${art.categoryIcon || '🔥'} ${art.categoryName}
                </span>
                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-white">
                  Trending #${art.trendingScore}
                </span>
              </div>
              <div class="absolute bottom-4 left-4 right-4">
                <span class="text-xs uppercase font-bold tracking-widest text-indigo-300">${art.source}</span>
                <h2 class="text-lg sm:text-xl font-bold text-white font-serif-headline drop-shadow">
                  ${art.title}
                </h2>
              </div>
            </div>
            <div class="p-6">
              <p class="text-gray-700 dark:text-gray-200 text-base leading-relaxed mb-6 font-normal">
                ${art.summary}
              </p>
              <div class="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
                <h4 class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Key Takeaways:</h4>
                <ul class="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                  ${(art.bullets || []).map(b => `<li class="flex items-start gap-2"><span class="text-red-500 font-bold">•</span> <span>${b}</span></li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
          <div class="p-6 pt-0">
            <div class="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
              <a href="${art.url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Read Full Story on ${art.source} ↗
              </a>
              <div class="flex items-center gap-2">
                <button onclick="App.playAudio('${art.id}', event)" class="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-medium hover:bg-gray-200">
                  🔊 Listen
                </button>
                <button onclick="App.toggleBookmark('${art.id}', event)" class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs ${isSaved ? 'text-amber-500' : 'text-gray-400'}">
                  ${isSaved ? '★ Saved' : '☆ Save'}
                </button>
                <button onclick="App.shareArticle('${art.id}', event)" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
                  Share 📲
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    inshortsView.innerHTML = cardsHtml;
  },

  openArticleModal(articleId) {
    const article = this.data.articles.find(a => a.id === articleId);
    if (!article) return;

    this.data.activeArticleModal = article;
    window.location.hash = `news=${article.id}`;
    if (window.SEO) window.SEO.updateForArticle(article);

    const modal = document.getElementById('article-modal');
    const content = document.getElementById('modal-content');
    if (!modal || !content) return;

    const isSaved = this.isBookmarked(article.id);

    content.innerHTML = `
      <div class="relative bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full mx-4 border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col">
        <button onclick="App.closeArticleModal()" class="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors font-bold text-lg">
          ✕
        </button>
        <div class="relative h-64 sm:h-72 w-full overflow-hidden bg-gray-900 flex-shrink-0">
          <img src="${article.image}" alt="${article.title}" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div class="absolute bottom-4 left-6 right-6">
            <span class="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-red-600 text-white mb-2">
              ${article.categoryName}
            </span>
            <div class="text-xs text-gray-300 font-mono">${article.source} • ${article.publishedAt}</div>
          </div>
        </div>
        <div class="p-6 sm:p-8 overflow-y-auto flex-1">
          <h1 class="font-serif-headline text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
            ${article.title}
          </h1>
          <p class="text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-6 font-normal">
            ${article.summary}
          </p>
          <div class="bg-gray-50 dark:bg-gray-900/60 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/60 mb-6">
            <h4 class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">What you need to know:</h4>
            <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              ${(article.bullets || []).map(b => `<li class="flex items-start gap-2.5"><span class="text-red-500 font-bold mt-1">✔</span> <span>${b}</span></li>`).join('')}
            </ul>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div class="flex items-center gap-2">
              <button onclick="App.playAudio('${article.id}', event)" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm font-medium text-gray-800 dark:text-gray-200">
                🔊 <span>Listen</span>
              </button>
              <button id="modal-bookmark-btn" onclick="App.toggleBookmark('${article.id}', event)" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm font-medium ${isSaved ? 'text-amber-500' : 'text-gray-700 dark:text-gray-300'}">
                ${isSaved ? '★ Saved' : '☆ Save'}
              </button>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="App.shareToWhatsApp('${article.id}')" class="p-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm" title="Share on WhatsApp">
                💬 WhatsApp
              </button>
              <button onclick="App.shareArticle('${article.id}', event)" class="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm">
                Share ↗
              </button>
            </div>
          </div>
          <div class="text-center mt-6">
            <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline">
              View original report on ${article.source} ↗
            </a>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  },

  closeArticleModal() {
    const modal = document.getElementById('article-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    document.body.style.overflow = 'auto';
    this.data.activeArticleModal = null;
    this.stopAudio();
    window.location.hash = this.data.activeCategory ? `category=${this.data.activeCategory}` : '';
  },

  updateModalBookmarkBtn() {
    const btn = document.getElementById('modal-bookmark-btn');
    if (btn && this.data.activeArticleModal) {
      const isSaved = this.isBookmarked(this.data.activeArticleModal.id);
      btn.innerHTML = isSaved ? '★ Saved' : '☆ Save';
      btn.className = `inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm font-medium ${isSaved ? 'text-amber-500' : 'text-gray-700 dark:text-gray-300'}`;
    }
  },

  // Speech Synthesizer (Text-to-Speech)
  playAudio(articleId, e) {
    if (e) e.stopPropagation();
    const article = this.data.articles.find(a => a.id === articleId);
    if (!article) return;

    if (!('speechSynthesis' in window)) {
      alert("Text-to-Speech is not supported on this browser.");
      return;
    }

    if (this.data.isSpeaking) {
      window.speechSynthesis.cancel();
      this.data.isSpeaking = false;
      return;
    }

    const textToSpeak = `${article.title}. ${article.summary}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      this.data.isSpeaking = false;
    };
    utterance.onerror = () => {
      this.data.isSpeaking = false;
    };

    this.data.isSpeaking = true;
    window.speechSynthesis.speak(utterance);
  },

  stopAudio() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.data.isSpeaking = false;
    }
  },

  // Viral Sharing Handlers
  shareArticle(articleId, e) {
    if (e) e.stopPropagation();
    const article = this.data.articles.find(a => a.id === articleId);
    if (!article) return;

    const shareUrl = `${window.location.origin}/#news=${article.id}`;
    const shareText = `🔥 Breaking: ${article.title}\n\nRead more on TrendPulse 360:`;

    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: shareText,
        url: shareUrl
      }).catch(err => console.log('Share canceled', err));
    } else {
      this.shareToWhatsApp(articleId);
    }
  },

  shareToWhatsApp(articleId) {
    const article = this.data.articles.find(a => a.id === articleId);
    if (!article) return;
    const shareUrl = `${window.location.origin}/#news=${article.id}`;
    const text = encodeURIComponent(`🔥 Breaking News: ${article.title}\n\nRead 60-sec brief here:\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  },

  shareToTwitter(articleId) {
    const article = this.data.articles.find(a => a.id === articleId);
    if (!article) return;
    const shareUrl = `${window.location.origin}/#news=${article.id}`;
    const text = encodeURIComponent(`🔥 ${article.title}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}&hashtags=TrendingNews,Breaking`, '_blank');
  },

  handleInitialRouting() {
    const hash = window.location.hash.substring(1);
    if (hash.startsWith('news=')) {
      const artId = hash.replace('news=', '');
      this.openArticleModal(artId);
    } else if (hash.startsWith('category=')) {
      const catId = hash.replace('category=', '');
      this.setCategory(catId);
    }
  },

  bindEvents() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let timeout = null;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => this.onSearch(e.target.value), 250);
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeArticleModal();
    });

    window.addEventListener('hashchange', () => {
      this.handleInitialRouting();
    });
  }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
