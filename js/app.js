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
    isDarkMode: false,
    currentLang: localStorage.getItem('tp_lang') || 'en'
  },

  i18n: {
    en: {
      siteTagline: 'Real-Time Worldwide Trending News & 60-Sec Briefs',
      searchPlaceholder: 'Search news & topics...',
      trendingNow: 'Trending Now',
      savedArticles: 'Saved Articles',
      worldwideFeeds: 'Worldwide Trending Feeds',
      marketsLive: 'Markets Live:',
      leadStory: 'Lead Story',
      minuteRead: '1 min read',
      listen: 'Listen',
      bookmark: 'Bookmark',
      share: 'Share',
      readFullCoverage: 'Read full detailed coverage on',
      whatYouNeedToKnow: 'What you need to know (Key Takeaways):',
      backToNews: 'Back to All News',
      whatsappAlertsTitle: 'Get Breaking News Alerts on WhatsApp',
      whatsappAlertsDesc: 'Join the official TrendPulse 360 News channel on WhatsApp.',
      followChannel: 'Follow Channel',
      categories: {
        'trending': '🔥 Trending Now',
        'world': '🌍 Worldwide',
        'politics': '🏛️ Politics',
        'business': '💼 Business & Startups',
        'share-market': '📈 Share Market & Crypto',
        'finance': '💰 Finance & Wealth',
        'entertainment': '🎬 Entertainment',
        'sports': '⚽ Sports',
        'tech': '🤖 Tech & AI',
        'education': '🎓 Education & Exams',
        'competition': '🏆 Competition & Jobs',
        'motivational': '💡 Motivational Stories',
        'bookmarks': '⭐ Saved Articles'
      }
    },
    hi: {
      siteTagline: 'विश्वभर की ताज़ा ट्रेंडिंग खबरें और 60-सेकंड की ब्रीफ्स',
      searchPlaceholder: 'ताज़ा खबरें और विषय खोजें...',
      trendingNow: 'ट्रेंडिंग नाउ',
      savedArticles: 'सेव की गई खबरें',
      worldwideFeeds: 'विश्वभर की ताज़ा ट्रेंडिंग खबरें',
      marketsLive: 'शेयर बाज़ार लाइव:',
      leadStory: 'मुख्य खबर',
      minuteRead: '1 मिनट',
      listen: 'ऑडियो सुनें',
      bookmark: 'सेव करें',
      share: 'शेयर करें',
      readFullCoverage: 'मूल स्रोत पर पूरा विस्तार से पढ़ें',
      whatYouNeedToKnow: 'मुख्य बिंदु (What you need to know):',
      backToNews: 'वापस मुख्य पेज पर जाएं',
      whatsappAlertsTitle: 'व्हाट्सएप पर तुरंत ब्रेकिंग न्यूज़ पाएं',
      whatsappAlertsDesc: 'आधिकारिक TrendPulse 360 व्हाट्सएप चैनल से अभी जुड़ें।',
      followChannel: 'चैनल जॉइन करें',
      categories: {
        'trending': '🔥 ट्रेंडिंग',
        'world': '🌍 देश-विदेश',
        'politics': '🏛️ राजनीति',
        'business': '💼 बिज़नेस & स्टार्टअप्स',
        'share-market': '📈 शेयर बाज़ार & क्रिप्टो',
        'finance': '💰 फाइनेंस & बजट',
        'entertainment': '🎬 मनोरंजन',
        'sports': '⚽ खेलकूद',
        'tech': '🤖 टेक & AI',
        'education': '🎓 शिक्षा & करियर',
        'competition': '🏆 सरकारी नौकरी & परीक्षाएं',
        'motivational': '💡 प्रेरक कहानियाँ',
        'bookmarks': '⭐ सेव की गई खबरें'
      }
    }
  },

  async init() {
    this.initTheme();
    this.initBookmarks();
    this.initLanguage();
    this.bindEvents();
    if (window.SEO) window.SEO.init();
    await this.loadData();
    this.handleInitialRouting();
    this.initNotificationPrompt();
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
      
      if (!json.articles || json.articles.length === 0) {
        throw new Error("Local news.json has 0 articles");
      }

      this.data.articles = json.articles;
      this.data.categories = json.categories || [];
      this.data.categoryCounts = json.categoryCounts || {};

      const lastUpdatedEl = document.getElementById('last-updated-text');
      if (lastUpdatedEl && json.lastUpdated) {
        lastUpdatedEl.textContent = `Updated: ${json.lastUpdated}`;
      }
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
      if (data && data.items && data.items.length > 0) {
        const availableCategories = this.data.categories.length > 0 ? this.data.categories : [
          { id: "trending", name: "Trending Now", icon: "🔥", color: "from-red-500 to-amber-500" },
          { id: "world", name: "Worldwide", icon: "🌍", color: "from-blue-500 to-cyan-500" },
          { id: "politics", name: "Politics", icon: "🏛️", color: "from-purple-500 to-indigo-500" },
          { id: "business", name: "Business & Startups", icon: "💼", color: "from-emerald-500 to-teal-500" },
          { id: "share-market", name: "Share Market & Crypto", icon: "📈", color: "from-green-500 to-emerald-600" },
          { id: "finance", name: "Finance & Wealth", icon: "💰", color: "from-amber-500 to-yellow-600" },
          { id: "entertainment", name: "Entertainment", icon: "🎬", color: "from-pink-500 to-rose-500" },
          { id: "sports", name: "Sports", icon: "⚽", color: "from-orange-500 to-amber-500" },
          { id: "tech", name: "Tech & AI", icon: "🤖", color: "from-cyan-500 to-blue-600" },
          { id: "education", name: "Education & Exams", icon: "🎓", color: "from-indigo-500 to-purple-600" },
          { id: "competition", name: "Competition & Jobs", icon: "🏆", color: "from-yellow-500 to-amber-600" },
          { id: "motivational", name: "Motivational Stories", icon: "💡", color: "from-teal-500 to-emerald-600" }
        ];

        this.data.categories = availableCategories;
        const fallbackArticles = [];
        const counts = {};

        data.items.forEach((item, idx) => {
          const cat = availableCategories[idx % availableCategories.length];
          counts[cat.id] = (counts[cat.id] || 0) + 1;
          fallbackArticles.push({
            id: `live-${cat.id}-${idx}`,
            title: item.title,
            source: item.author || "Global News Wire",
            category: cat.id,
            categoryName: cat.name,
            categoryIcon: cat.icon,
            categoryColor: cat.color,
            url: item.link,
            publishedAt: item.pubDate || new Date().toUTCString(),
            summary: item.description ? item.description.replace(/<[^>]*>?/gm, '').trim() : item.title,
            bullets: [
              `Headline: ${item.title}`,
              `Breaking news update regarding ${cat.name}.`,
              "Follow TrendPulse 360 for live coverage."
            ],
            readTime: "1 min read",
            trendingScore: 99 - (idx % 20),
            image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&auto=format&fit=crop&q=80"
          });
        });

        this.data.articles = fallbackArticles;
        this.data.categoryCounts = counts;
      }
    } catch (e) {
      console.error("Live fetch fallback failed:", e);
    }
  },

  initLanguage() {
    this.applyLanguage(false);
  },

  toggleLanguage() {
    this.data.currentLang = this.data.currentLang === 'en' ? 'hi' : 'en';
    localStorage.setItem('tp_lang', this.data.currentLang);
    this.applyLanguage(true);
  },

  applyLanguage(shouldTriggerTranslation = true) {
    const isHi = this.data.currentLang === 'hi';
    const dict = this.i18n[this.data.currentLang] || this.i18n.en;

    // 1. Update Lang button in header
    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      langBtn.innerHTML = isHi 
        ? '<span class="text-sm">🇬🇧</span> <span>English</span>' 
        : '<span class="text-sm">🇮🇳</span> <span>हिन्दी</span>';
      langBtn.title = isHi ? "Switch to English" : "हिन्दी में पढ़ें";
    }

    // 2. Update Search Placeholders
    const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="Search"], input[type="text"][placeholder*="खोजें"]');
    searchInputs.forEach(input => input.placeholder = dict.searchPlaceholder);

    // 3. Update Markets Label
    const mktLabel = document.getElementById('markets-live-label');
    if (mktLabel) {
      mktLabel.innerHTML = `<span>📈</span> ${dict.marketsLive}`;
    }

    // 4. Update Section Title
    const titleEl = document.getElementById('section-title');
    if (titleEl) {
      if (this.data.activeCategory === 'bookmarks') {
        titleEl.textContent = dict.savedArticles;
      } else if (this.data.activeCategory === 'trending' || !this.data.activeCategory) {
        titleEl.textContent = dict.worldwideFeeds;
      } else {
        const catName = (isHi && dict.categories[this.data.activeCategory]) ? dict.categories[this.data.activeCategory] : (this.data.categories.find(c => c.id === this.data.activeCategory)?.name || dict.worldwideFeeds);
        titleEl.textContent = catName;
      }
    }

    // 5. Re-render Categories Nav
    this.renderCategoriesNav();

    // 6. Notify Cricket Module
    if (window.Cricket && typeof window.Cricket.updateLanguage === 'function') {
      window.Cricket.updateLanguage(this.data.currentLang);
    }

    // 7. Notify Poll Module
    if (window.Poll && typeof window.Poll.render === 'function') {
      window.Poll.render();
    }

    // 8. Re-filter Articles if loaded
    if (this.data.articles && this.data.articles.length > 0) {
      this.filterArticles();
    }

    // 9. Full page translation trigger
    if (shouldTriggerTranslation) {
      this.triggerTranslation(this.data.currentLang);
    }
  },

  triggerTranslation(lang) {
    if (lang === 'hi') {
      document.cookie = "googtrans=/en/hi; path=/";
      document.cookie = "googtrans=/en/hi; domain=" + window.location.hostname + "; path=/";
      if (!window.google || !window.google.translate) {
        this.loadGoogleTranslateScript();
      } else {
        try {
          const select = document.querySelector('.goog-te-combo');
          if (select) {
            select.value = 'hi';
            select.dispatchEvent(new Event('change'));
          }
        } catch(e) {}
      }
    } else {
      document.cookie = "googtrans=/en/en; path=/";
      document.cookie = "googtrans=/en/en; domain=" + window.location.hostname + "; path=/";
      try {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
          select.value = 'en';
          select.dispatchEvent(new Event('change'));
        }
      } catch(e) {}
    }
  },

  loadGoogleTranslateScript() {
    if (document.getElementById('google-translate-script')) return;
    window.googleTranslateElementInit = function() {
      new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'hi,en',
        autoDisplay: false
      }, 'google_translate_element');
    };
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(script);
  },

  renderCategoriesNav() {
    const container = document.getElementById('categories-nav');
    if (!container) return;

    const isHi = this.data.currentLang === 'hi';
    const dict = this.i18n[this.data.currentLang] || this.i18n.en;

    let html = `
      <button onclick="App.setCategory('trending')" class="category-pill flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${this.data.activeCategory === 'trending' ? 'bg-red-600 text-white shadow-md shadow-red-500/20' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}">
        <span>🔥</span> ${isHi ? 'ट्रेंडिंग नाउ' : 'Trending Now'}
      </button>
      <button onclick="App.setCategory('bookmarks')" class="category-pill flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${this.data.activeCategory === 'bookmarks' ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}">
        <span>⭐</span> ${isHi ? 'सेव की गई' : 'Saved Articles'} (${this.data.bookmarks.length})
      </button>
    `;

    this.data.categories.forEach(cat => {
      if (cat.id === 'trending') return;
      const isActive = this.data.activeCategory === cat.id;
      const count = this.data.categoryCounts[cat.id] || 0;
      const catDisplayName = (isHi && dict.categories[cat.id]) ? dict.categories[cat.id] : `${cat.icon} ${cat.name}`;
      html += `
        <button onclick="App.setCategory('${cat.id}')" class="category-pill flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}">
          ${catDisplayName}
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

    const isHi = this.data.currentLang === 'hi';
    const dict = this.i18n[this.data.currentLang] || this.i18n.en;

    const titleEl = document.getElementById('section-title');
    if (titleEl) {
      if (catId === 'bookmarks') {
        titleEl.textContent = dict.savedArticles;
      } else if (catId === 'trending' || !catId) {
        titleEl.textContent = dict.worldwideFeeds;
      } else {
        const catName = (isHi && dict.categories[catId]) ? dict.categories[catId] : (this.data.categories.find(c => c.id === catId)?.name || dict.worldwideFeeds);
        titleEl.textContent = catName;
      }
    }

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
      <div class="min-h-screen bg-white dark:bg-gray-950 flex flex-col text-gray-900 dark:text-gray-100">
        <!-- Sticky Top Navigation Header -->
        <header class="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm py-3 px-4 sm:px-8">
          <div class="max-w-5xl mx-auto flex items-center justify-between gap-3">
            
            <!-- Left: Back Button & Category -->
            <div class="flex items-center gap-2 sm:gap-3">
              <button onclick="App.closeArticleModal()" class="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold text-xs sm:text-sm transition-all shadow-sm group">
                <span class="text-base sm:text-lg group-hover:-translate-x-1 transition-transform">←</span>
                <span>Back to News</span>
              </button>
              <span class="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                ${article.categoryIcon || '🔥'} ${article.categoryName}
              </span>
            </div>

            <!-- Right: Quick Actions (Audio, Bookmark, WhatsApp, Share, Big Close) -->
            <div class="flex items-center gap-1.5 sm:gap-2.5">
              <button onclick="App.playAudio('${article.id}', event)" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200" title="Listen to Article">
                🔊 <span class="hidden md:inline">Listen</span>
              </button>
              <button id="modal-bookmark-btn" onclick="App.toggleBookmark('${article.id}', event)" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs sm:text-sm font-semibold ${isSaved ? 'text-amber-500' : 'text-gray-700 dark:text-gray-300'}" title="Save Article">
                ${isSaved ? '★ Saved' : '☆ Save'}
              </button>
              <button onclick="App.shareToWhatsApp('${article.id}')" class="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-xs sm:text-sm shadow-sm" title="Share on WhatsApp">
                💬 <span>WhatsApp</span>
              </button>
              <button onclick="App.shareArticle('${article.id}', event)" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm" title="Share Link">
                <span>↗ Share</span>
              </button>
              
              <!-- Big Clear Red Close Button -->
              <button onclick="App.closeArticleModal()" class="w-10 h-10 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-950/80 dark:hover:bg-red-900/80 text-red-600 dark:text-red-400 flex items-center justify-center font-black text-xl transition-all shadow-sm ml-1" title="Close (बंद करें)">
                ✕
              </button>
            </div>

          </div>
        </header>

        <!-- Main Reading Area (Full Window Editorial View) -->
        <article class="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          
          <!-- Category & Source Metadata -->
          <div class="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">
            <span class="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">${article.source}</span>
            <span>•</span>
            <span>${article.publishedAt}</span>
            <span>•</span>
            <span>${article.readTime || '1 min read'}</span>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 ml-auto">
              Trending: ${article.trendingScore}%
            </span>
          </div>

          <!-- Main Article Headline (Large, Impactful, Serif) -->
          <h1 class="font-serif-headline text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-6">
            ${article.title}
          </h1>

          <!-- Hero Image (Full-Width High-Res) -->
          <div class="relative w-full h-72 sm:h-96 lg:h-[480px] rounded-3xl overflow-hidden shadow-2xl mb-8 bg-gray-900">
            <img src="${article.image}" alt="${article.title}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div class="absolute bottom-4 left-6 right-6 flex items-center justify-between text-xs text-white/90">
              <span class="font-medium bg-black/60 backdrop-blur-md px-3 py-1 rounded-full">
                📸 Coverage: ${article.categoryName}
              </span>
              <span class="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full">
                Verified Global Wire
              </span>
            </div>
          </div>

          <!-- Summary Body Text -->
          <div class="prose prose-lg dark:prose-invert max-w-none mb-8">
            <p class="text-lg sm:text-xl text-gray-800 dark:text-gray-200 leading-relaxed font-normal">
              ${article.summary}
            </p>
          </div>

          <!-- Key Takeaways & Highlights Box -->
          <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/90 dark:to-gray-800/80 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700/80 shadow-md mb-8">
            <div class="flex items-center gap-2 mb-4">
              <span class="text-xl">⚡</span>
              <h3 class="text-base sm:text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                What you need to know (मुख्य बिंदु):
              </h3>
            </div>
            <ul class="space-y-3 text-sm sm:text-base text-gray-700 dark:text-gray-300">
              ${(article.bullets || []).map(b => `
                <li class="flex items-start gap-3">
                  <span class="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✔</span>
                  <span class="leading-relaxed">${b}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <!-- Publisher Link & Share Strip -->
          <div class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div class="text-center sm:text-left">
              <div class="text-xs uppercase font-bold text-gray-400 tracking-wider">Original Source</div>
              <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1.5 mt-0.5">
                Read full detailed coverage on ${article.source} ↗
              </a>
            </div>
            <div class="flex items-center gap-2 w-full sm:w-auto justify-center">
              <button onclick="App.shareToWhatsApp('${article.id}')" class="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm">
                💬 WhatsApp
              </button>
              <button onclick="App.shareArticle('${article.id}', event)" class="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm">
                ↗ Share
              </button>
            </div>
          </div>

          <!-- Channel Subscription Card inside Article -->
          <div class="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div class="flex items-center gap-3 text-center sm:text-left">
              <span class="text-3xl">📢</span>
              <div>
                <h4 class="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Get Breaking News Alerts on WhatsApp</h4>
                <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Join the official TrendPulse 360 News channel on WhatsApp.</p>
              </div>
            </div>
            <a href="https://whatsapp.com/channel/0029Vb9ILQT6RGJFRiIuu80T" target="_blank" rel="noopener" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all hover:scale-105 flex items-center gap-1.5 flex-shrink-0">
              <span>💬</span> Follow Channel
            </a>
          </div>

          <!-- Big Bottom Exit Button -->
          <div class="pt-2 pb-12">
            <button onclick="App.closeArticleModal()" class="w-full py-4 px-6 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01]">
              <span class="text-lg">←</span>
              <span>Back to All News (वापस मुख्य पेज पर जाएं)</span>
            </button>
          </div>

        </article>
      </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    modal.scrollTo({ top: 0, behavior: 'instant' });
  },

  closeArticleModal(updateHash = true) {
    const modal = document.getElementById('article-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
    document.body.style.overflow = 'auto';
    this.data.activeArticleModal = null;
    this.stopAudio();
    if (updateHash) {
      window.location.hash = this.data.activeCategory ? `category=${this.data.activeCategory}` : '';
    }
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

  initNotificationPrompt() {
    const banner = document.getElementById('push-prompt-banner');
    if (!banner) return;

    // Check if Notification API is supported
    if (!('Notification' in window)) {
      banner.classList.add('hidden');
      return;
    }

    // 1. If notification is ALREADY granted or enabled by user, NEVER show alert again!
    if (Notification.permission === 'granted' || localStorage.getItem('tp_notifications') === 'enabled') {
      banner.classList.add('hidden');
      return;
    }

    // 2. If user explicitly denied, don't nag
    if (Notification.permission === 'denied' || localStorage.getItem('tp_notifications') === 'denied') {
      banner.classList.add('hidden');
      return;
    }

    // 3. If user clicked 'Later', wait at least 3 days before showing again
    const dismissedAt = localStorage.getItem('tp_notifications_dismissed');
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < 3 * 24 * 60 * 60 * 1000) {
        banner.classList.add('hidden');
        return;
      }
    }

    // Only if notifications are OFF / not enabled: Show alert after 3 seconds
    setTimeout(() => {
      if (Notification.permission !== 'granted' && localStorage.getItem('tp_notifications') !== 'enabled') {
        banner.classList.remove('hidden');
      }
    }, 3000);
  },

  async enableNotifications() {
    const banner = document.getElementById('push-prompt-banner');
    if (!('Notification' in window)) {
      alert("Notifications are not supported in this browser.");
      if (banner) banner.classList.add('hidden');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('tp_notifications', 'enabled');
        if (banner) banner.classList.add('hidden');

        try {
          new Notification("TrendPulse 360", {
            body: "🔔 Breaking News Alerts enabled! You will now receive instant headlines.",
            icon: "logo.jpg"
          });
        } catch (e) {}
      } else {
        localStorage.setItem('tp_notifications', 'denied');
        if (banner) banner.classList.add('hidden');
      }
    } catch (e) {
      if (banner) banner.classList.add('hidden');
    }
  },

  dismissNotifications() {
    const banner = document.getElementById('push-prompt-banner');
    if (banner) banner.classList.add('hidden');
    localStorage.setItem('tp_notifications_dismissed', Date.now().toString());
  },

  handleInitialRouting() {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.substring(1);

    const newsId = params.get('news') || (hash.startsWith('news=') ? hash.replace('news=', '') : null);
    const catId = params.get('category') || (hash.startsWith('category=') ? hash.replace('category=', '') : null);

    if (newsId) {
      this.openArticleModal(newsId);
    } else {
      if (this.data.activeArticleModal) {
        this.closeArticleModal(false);
      }
      if (catId) {
        this.setCategory(catId);
      }
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
