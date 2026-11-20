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
    currentFontSize: 18,
    bulletin: {
      isPlaying: false,
      currentIndex: 0,
      articles: []
    },
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
    this.initLikes();
    this.initFollowedPublishers();
    this.initLanguage();
    this.bindEvents();
    if (window.SEO) window.SEO.init();
    await this.loadData();
    this.renderWeatherWidget();
    this.renderSportsWidget();
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
            image: this.getSmartImage(item.title, cat.id)
          });
        });

        this.data.articles = fallbackArticles;
        this.data.categoryCounts = counts;
      }
    } catch (e) {
      console.error("Live fetch fallback failed:", e);
    }
  },

  getSmartImage(title, categoryId) {
    const text = (title || '').toLowerCase();
    const images = {
      weather: [
        "https://images.unsplash.com/photo-1504386106331-3e4e71712b38?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&auto=format&fit=crop&q=80"
      ],
      aviation: [
        "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1520437358207-323b43b50729?w=900&auto=format&fit=crop&q=80"
      ],
      energy: [
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1582582494705-f8ce0b0c24f0?w=900&auto=format&fit=crop&q=80"
      ],
      crime: [
        "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=900&auto=format&fit=crop&q=80"
      ],
      sports: [
        "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=900&auto=format&fit=crop&q=80"
      ],
      entertainment: [
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=900&auto=format&fit=crop&q=80"
      ],
      crypto: [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=900&auto=format&fit=crop&q=80"
      ],
      stocks: [
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=900&auto=format&fit=crop&q=80"
      ],
      tech: [
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=900&auto=format&fit=crop&q=80"
      ],
      war: [
        "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1579975096649-e773152b04cb?w=900&auto=format&fit=crop&q=80"
      ],
      politics: [
        "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1575517111478-7f6afd0973db?w=900&auto=format&fit=crop&q=80"
      ],
      general: [
        "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1476242906366-d8eb64c2f661?w=900&auto=format&fit=crop&q=80"
      ]
    };
    if (/heat|storm|weather|climate|sea arch|pacific|hawaii|flood|wildfire|earthquake/i.test(text)) return images.weather[Math.abs(this.hashCode(text)) % images.weather.length];
    if (/plane|flight|pilot|airline|airport|flydubai|airbus|boeing|aviation/i.test(text)) return images.aviation[Math.abs(this.hashCode(text)) % images.aviation.length];
    if (/oil|diesel|crude|petroleum|gasoline|energy|refinery|pipeline|reserves/i.test(text)) return images.energy[Math.abs(this.hashCode(text)) % images.energy.length];
    if (/court|trial|judge|prison|jail|crime|murder|execution|inmate|rape|assault|investigation|arrest/i.test(text)) return images.crime[Math.abs(this.hashCode(text)) % images.crime.length];
    if (/crypto|bitcoin|btc|gold|ethereum/i.test(text)) return images.crypto[Math.abs(this.hashCode(text)) % images.crypto.length];
    if (/stock|stocks|sensex|nifty|shares|market|trading|nasdaq/i.test(text)) return images.stocks[Math.abs(this.hashCode(text)) % images.stocks.length];
    if (/sports|cricket|football|nfl|fifa|olympics|match|tournament|49ers/i.test(text)) return images.sports[Math.abs(this.hashCode(text)) % images.sports.length];
    if (/movie|film|hollywood|bollywood|actor|actress|cinema|series|netflix|box office/i.test(text)) return images.entertainment[Math.abs(this.hashCode(text)) % images.entertainment.length];
    if (/apple|mac|ai|tech|robot|software|google|microsoft|nvidia|chatgpt/i.test(text)) return images.tech[Math.abs(this.hashCode(text)) % images.tech.length];
    if (/strike|missile|drone|military|pentagon|war|soldier|army|gaza|iran|israel|ukraine/i.test(text)) return images.war[Math.abs(this.hashCode(text)) % images.war.length];
    if (/trump|biden|white house|congress|senate|capitol|election|gop|democrat|republican/i.test(text)) return images.politics[Math.abs(this.hashCode(text)) % images.politics.length];
    return images.general[Math.abs(this.hashCode(text)) % images.general.length];
  },

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
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
        ? '<span id="lang-flag" class="text-sm">🇬🇧</span> <span id="lang-label">English</span>' 
        : '<span id="lang-flag" class="text-sm">🇮🇳</span> <span id="lang-label">हिन्दी</span>';
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

    this.updateBentoNavTabs(catId);
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
    const bottomLabel = document.getElementById('bottom-view-label');

    if (magBtn && inshortsBtn) {
      if (mode === 'magazine') {
        magBtn.classList.add('bg-white', 'dark:bg-gray-700', 'shadow-sm');
        inshortsBtn.classList.remove('bg-white', 'dark:bg-gray-700', 'shadow-sm');
      } else {
        inshortsBtn.classList.add('bg-white', 'dark:bg-gray-700', 'shadow-sm');
        magBtn.classList.remove('bg-white', 'dark:bg-gray-700', 'shadow-sm');
      }
    }
    if (bottomLabel) {
      bottomLabel.textContent = mode === 'magazine' ? 'Quick' : 'Grid';
    }
    this.render();
  },

  toggleViewMode() {
    const nextMode = this.data.viewMode === 'magazine' ? 'inshorts' : 'magazine';
    this.setViewMode(nextMode);
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
        <div class="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div class="text-5xl mb-3">📰</div>
          <h3 class="text-xl font-bold text-gray-700 dark:text-gray-200">No stories found</h3>
          <p class="text-gray-500 text-sm mt-1">Try another category or clear your search query.</p>
          <button onclick="App.setCategory('trending')" class="mt-4 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold cursor-pointer">
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
      const isLiked = this.isLiked(hero.id);
      const likesCount = this.getLikeCount(hero.id, 240);
      const commentsCount = (Math.abs(this.hashCode(hero.id)) % 45) + 8;
      const readingNow = ((Math.abs(this.hashCode(hero.id)) % 120 + 80) / 10).toFixed(1);

      heroHtml = `
        <div class="mb-6">
          <div class="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all cursor-pointer" onclick="App.openArticleModal('${hero.id}')">
            <div class="grid grid-cols-1 md:grid-cols-12">
              <div class="md:col-span-7 h-64 sm:h-72 md:h-auto relative overflow-hidden bg-gray-900">
                <img src="${hero.image}" alt="${hero.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=900&auto=format&fit=crop&q=80';">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent md:hidden"></div>
                <div class="absolute top-3 left-3 flex flex-wrap items-center gap-2">
                  <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white shadow-md">
                    🔥 Lead Story
                  </span>
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>${readingNow}k Reading Now</span>
                  </span>
                </div>
              </div>
              <div class="md:col-span-5 p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2.5">
                    <span class="font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
                      <span>📰</span> ${hero.source}
                    </span>
                    <span class="font-semibold">${hero.readTime}</span>
                  </div>
                  <h2 class="font-serif-headline text-xl sm:text-2xl font-black text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight mb-2.5">
                    ${hero.title}
                  </h2>
                  <p class="text-gray-600 dark:text-gray-300 text-xs sm:text-sm line-clamp-3 mb-4 leading-relaxed">
                    ${hero.summary}
                  </p>

                  <!-- 3-Sec Takeaways Accordion Toggle -->
                  <button onclick="App.toggleCardBullets('${hero.id}', event)" class="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 hover:underline mb-2 cursor-pointer">
                    <span>⚡</span> <span>3-Sec Takeaways</span>
                  </button>
                  <div id="card-bullets-${hero.id}" class="hidden mb-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                    ${(hero.bullets || []).map(b => `<div class="flex items-start gap-1.5"><span class="text-emerald-500 font-bold shrink-0">✔</span><span class="leading-tight">${b}</span></div>`).join('')}
                  </div>
                </div>

                <!-- High-CTR Reaction & Share Bar -->
                <div class="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <button onclick="App.toggleLike('${hero.id}', event)" class="reaction-pill like-btn-${hero.id} ${isLiked ? 'text-red-600 active' : 'text-gray-600 dark:text-gray-300'} flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/80 dark:hover:bg-gray-700 font-bold cursor-pointer transition-all" title="Like">
                      <span>👍</span> <span class="like-count-${hero.id}">${likesCount}</span>
                    </button>
                    <button onclick="App.openArticleModal('${hero.id}'); event.stopPropagation();" class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/80 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold cursor-pointer transition-all" title="Comments">
                      <span>💬</span> <span>${commentsCount}</span>
                    </button>
                  </div>
                  <div class="flex items-center gap-1">
                    <button onclick="App.playAudio('${hero.id}', event)" title="Listen Audio" class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
                      🔊
                    </button>
                    <button onclick="App.toggleBookmark('${hero.id}', event)" title="Save" class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${isSaved ? 'text-amber-500 font-bold' : 'text-gray-400'} transition-colors">
                      ${isSaved ? '★' : '☆'}
                    </button>
                    <button onclick="App.shareToWhatsApp('${hero.id}', event)" title="WhatsApp Share" class="p-1.5 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-600 transition-colors">
                      💬
                    </button>
                    <button onclick="App.shareArticle('${hero.id}', event)" title="Share" class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-indigo-600 transition-colors">
                      ↗️
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Video Bento Card (Second item)
    let videoCardHtml = '';
    const videoStory = (showHero && remaining.length > 0) ? remaining[0] : null;
    const storiesAfterVideo = (showHero && remaining.length > 0) ? remaining.slice(1) : remaining;

    if (videoStory) {
      const isLiked = this.isLiked(videoStory.id);
      const likesCount = this.getLikeCount(videoStory.id, 120);
      videoCardHtml = `
        <div class="mb-6">
          <div class="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all cursor-pointer" onclick="App.openArticleModal('${videoStory.id}')">
            <div class="relative h-56 sm:h-64 w-full overflow-hidden bg-gray-950">
              <img src="${videoStory.image}" alt="${videoStory.title}" class="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=900&auto=format&fit=crop&q=80';">
              <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                <button class="video-play-btn w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl pl-1 shadow-2xl cursor-pointer" title="Watch Video">
                  ▶
                </button>
              </div>
              <div class="absolute top-3 left-3">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-600 text-white shadow-sm">
                  <span>🎥</span> Watch Video
                </span>
              </div>
              <div class="absolute top-3 right-3">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-black/70 backdrop-blur-md text-white border border-white/20">
                  ▶ HD Video • 03:20
                </span>
              </div>
              <div class="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
                <div class="text-[11px] font-bold text-amber-400 mb-1 flex items-center gap-2">
                  <span>${videoStory.source}</span>
                  <span>•</span>
                  <span>Trending Video</span>
                </div>
                <h3 class="font-serif-headline text-lg sm:text-xl font-extrabold text-white line-clamp-2 leading-snug">
                  ${videoStory.title}
                </h3>
              </div>
            </div>
            <div class="p-4 flex items-center justify-between text-xs border-t border-gray-100 dark:border-gray-700/80">
              <div class="flex items-center gap-2">
                <button onclick="App.toggleLike('${videoStory.id}', event)" class="reaction-pill like-btn-${videoStory.id} ${isLiked ? 'text-red-600 active' : 'text-gray-600 dark:text-gray-300'} flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/80 dark:hover:bg-gray-700 font-bold cursor-pointer transition-all">
                  <span>👍</span> <span class="like-count-${videoStory.id}">${likesCount}</span>
                </button>
                <span class="text-gray-400 text-[11px]">${videoStory.readTime}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <button onclick="App.playAudio('${videoStory.id}', event)" title="Listen" class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                  🔊
                </button>
                <button onclick="App.shareToWhatsApp('${videoStory.id}', event)" title="Share" class="p-1.5 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-600 transition-colors">
                  💬
                </button>
                <button onclick="App.shareArticle('${videoStory.id}', event)" title="Share" class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-indigo-600 transition-colors">
                  ↗️
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Follow Publishers Card (MSN Style)
    const publishersCardHtml = (showHero && storiesAfterVideo.length > 0) ? `
      <div class="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-pink-50/40 dark:from-gray-800 dark:to-gray-800/90 border border-indigo-100 dark:border-gray-700 shadow-sm text-gray-900 dark:text-white">
        <div class="flex items-center justify-between mb-3 pb-2 border-b border-indigo-100/80 dark:border-gray-700/60">
          <div>
            <h3 class="font-bold text-sm sm:text-base flex items-center gap-1.5">
              <span>⭐</span> Suggested for you
            </h3>
            <p class="text-[11px] text-gray-500 dark:text-gray-400">
              Follow publishers to see more of what you like
            </p>
          </div>
          <button onclick="App.openPersonalizeFeed()" class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
            Personalize feed
          </button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          ${this.publishersData.map(pub => {
            const isFollowing = this.isFollowingPublisher(pub.id);
            return `
              <div class="p-2.5 rounded-xl bg-white dark:bg-gray-900/90 border border-gray-200/80 dark:border-gray-700 flex items-center justify-between gap-2 shadow-xs">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm shrink-0 shadow-xs">${pub.avatar}</span>
                  <div class="min-w-0">
                    <div class="font-bold text-xs truncate">${pub.name}</div>
                    <div class="text-[10px] text-gray-400 truncate">${pub.readers}</div>
                  </div>
                </div>
                <button onclick="App.toggleFollowPublisher('${pub.id}', event)" class="publisher-follow-btn follow-btn-${pub.id} ${isFollowing ? 'following' : ''} px-2.5 py-1 rounded-full text-[11px] font-bold border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer whitespace-nowrap shrink-0">
                  ${isFollowing ? '✓ Following' : '+ Follow'}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : '';

    // 2-Column Bento News Cards Grid
    const cardsHtml = storiesAfterVideo.map((art, idx) => {
      const isSaved = this.isBookmarked(art.id);
      const isLiked = this.isLiked(art.id);
      const likesCount = this.getLikeCount(art.id, 45);

      const cardMarkup = `
        <article class="card-hover flex flex-col justify-between rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all" onclick="App.openArticleModal('${art.id}')">
          <div>
            <div class="relative h-44 w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
              <img src="${art.image}" alt="${art.title}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=900&auto=format&fit=crop&q=80';">
              <div class="absolute top-2.5 left-2.5">
                <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-black/60 backdrop-blur-md text-white">
                  ${art.categoryIcon || '📰'} ${art.categoryName || 'News'}
                </span>
              </div>
              <div class="absolute bottom-2 right-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 backdrop-blur-sm">
                  Trending: ${art.trendingScore}%
                </span>
              </div>
            </div>
            <div class="p-4">
              <div class="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
                <span class="text-indigo-600 dark:text-indigo-400 font-bold truncate max-w-[140px]">${art.source}</span>
                <span>${art.readTime}</span>
              </div>
              <h3 class="font-serif-headline text-base font-bold text-gray-900 dark:text-white line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-2 leading-snug">
                ${art.title}
              </h3>
              <p class="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2 leading-relaxed">
                ${art.summary}
              </p>

              <!-- Instant 3-Sec Takeaways Accordion -->
              <button onclick="App.toggleCardBullets('${art.id}', event)" class="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline mb-1.5 cursor-pointer">
                <span>⚡</span> <span>3-Sec Takeaways</span>
              </button>
              <div id="card-bullets-${art.id}" class="hidden mb-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-[11px] text-gray-700 dark:text-gray-300 space-y-1">
                ${(art.bullets || []).map(b => `<div class="flex items-start gap-1.5"><span class="text-emerald-500 font-bold shrink-0">✔</span><span class="leading-tight">${b}</span></div>`).join('')}
              </div>
            </div>
          </div>
          <div class="px-4 pb-3 pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 text-xs">
            <button onclick="App.toggleLike('${art.id}', event)" class="reaction-pill like-btn-${art.id} ${isLiked ? 'text-red-600 active' : 'text-gray-500 dark:text-gray-400'} flex items-center gap-1 text-[11px] font-bold cursor-pointer hover:text-red-600">
              <span>👍</span> <span class="like-count-${art.id}">${likesCount}</span>
            </button>
            <div class="flex items-center gap-1">
              <button onclick="App.playAudio('${art.id}', event)" title="Listen" class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                🔊
              </button>
              <button onclick="App.toggleBookmark('${art.id}', event)" title="Save" class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${isSaved ? 'text-amber-500 font-bold' : 'text-gray-400'} transition-colors">
                ${isSaved ? '★' : '☆'}
              </button>
              <button onclick="App.shareToWhatsApp('${art.id}', event)" title="Share on WhatsApp" class="p-1 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-600 transition-colors">
                💬
              </button>
              <button onclick="App.shareArticle('${art.id}', event)" title="Share" class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-indigo-600 transition-colors">
                ↗️
              </button>
            </div>
          </div>
        </article>
      `;

      // In-Feed Native Ad Card after 2nd story
      const inFeedAd = (idx === 1) ? `
        <article class="card-hover flex flex-col justify-between rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 border border-amber-200 dark:border-amber-900/50 overflow-hidden shadow-sm p-4 text-gray-900 dark:text-white">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500 text-slate-950">Promoted / प्रायोजित</span>
              <span class="text-[11px] text-gray-400">Ad</span>
            </div>
            <h3 class="font-serif-headline text-base font-bold mb-1.5">
              💼 Zero Brokerage Equity &amp; Mutual Fund SIPs
            </h3>
            <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
              Direct Mutual Funds deliver up to 1.5% higher annual returns. 100% paperless KYC and automated monthly investments.
            </p>
          </div>
          <div class="pt-2 border-t border-amber-200/60 dark:border-gray-700 flex items-center justify-between">
            <span class="text-xs text-amber-700 dark:text-amber-400 font-bold">Trusted by 2 Cr+ Indians</span>
            <a href="https://groww.in" target="_blank" rel="noopener sponsored" class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm">
              Start SIP ↗
            </a>
          </div>
        </article>
      ` : '';

      return cardMarkup + inFeedAd;
    }).join('');

    magazineView.innerHTML = `
      ${heroHtml}
      ${videoCardHtml}
      ${publishersCardHtml}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        ${cardsHtml}
      </div>
    `;
  },

  updateBentoNavTabs(catId) {
    const bentoTabs = {
      'trending': 'bento-tab-discover',
      'world': 'bento-tab-world',
      'politics': 'bento-tab-politics',
      'share-market': 'bento-tab-markets',
      'tech': 'bento-tab-tech',
      'sports': 'bento-tab-sports',
      'entertainment': 'bento-tab-entertainment'
    };
    Object.keys(bentoTabs).forEach(key => {
      const el = document.getElementById(bentoTabs[key]);
      if (el) {
        if (key === catId) {
          el.className = 'bento-nav-tab px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-red-600 text-white shadow-sm whitespace-nowrap cursor-pointer';
        } else {
          el.className = 'bento-nav-tab px-3.5 py-1.5 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all whitespace-nowrap cursor-pointer';
        }
      }
    });
  },

  // ----------------------------------------------------
  // Bento Portal Modules: Weather, Sports, Publishers, Likes
  // ----------------------------------------------------
  weatherData: {
    selectedCity: 'New Delhi',
    activeTab: 'hourly',
    cities: {
      'New Delhi': {
        temp: 24,
        desc: 'Partly Cloudy • Humidity 48%',
        icon: '⛅',
        rainNotice: '0% rain probability',
        aqi: 'AQI 72 (Good)',
        aqiColor: 'text-emerald-600 dark:text-emerald-400',
        hourly: [
          { time: '11 AM', val: '23°', height: 60 },
          { time: '12 PM', val: '25°', height: 75 },
          { time: '1 PM', val: '26°', height: 85 },
          { time: '2 PM', val: '26°', height: 85 },
          { time: '3 PM', val: '24°', height: 70 },
          { time: '4 PM', val: '22°', height: 55 }
        ],
        precipitation: [
          { time: '11 AM', val: '0%', height: 10 },
          { time: '12 PM', val: '5%', height: 20 },
          { time: '1 PM', val: '5%', height: 20 },
          { time: '2 PM', val: '10%', height: 30 },
          { time: '3 PM', val: '0%', height: 10 },
          { time: '4 PM', val: '0%', height: 10 }
        ],
        aqiBars: [
          { time: '11 AM', val: '68', height: 50 },
          { time: '12 PM', val: '72', height: 55 },
          { time: '1 PM', val: '75', height: 60 },
          { time: '2 PM', val: '78', height: 65 },
          { time: '3 PM', val: '74', height: 58 },
          { time: '4 PM', val: '70', height: 52 }
        ]
      },
      'Mumbai': {
        temp: 29,
        desc: 'Sunny & Humid • Humidity 72%',
        icon: '☀️',
        rainNotice: '5% rain probability',
        aqi: 'AQI 84 (Moderate)',
        aqiColor: 'text-amber-500',
        hourly: [
          { time: '11 AM', val: '28°', height: 65 },
          { time: '12 PM', val: '30°', height: 80 },
          { time: '1 PM', val: '31°', height: 90 },
          { time: '2 PM', val: '30°', height: 80 },
          { time: '3 PM', val: '29°', height: 70 },
          { time: '4 PM', val: '28°', height: 65 }
        ],
        precipitation: [
          { time: '11 AM', val: '5%', height: 20 },
          { time: '12 PM', val: '5%', height: 20 },
          { time: '1 PM', val: '10%', height: 30 },
          { time: '2 PM', val: '5%', height: 20 },
          { time: '3 PM', val: '5%', height: 20 },
          { time: '4 PM', val: '0%', height: 10 }
        ],
        aqiBars: [
          { time: '11 AM', val: '80', height: 60 },
          { time: '12 PM', val: '84', height: 65 },
          { time: '1 PM', val: '88', height: 70 },
          { time: '2 PM', val: '85', height: 68 },
          { time: '3 PM', val: '82', height: 62 },
          { time: '4 PM', val: '79', height: 58 }
        ]
      },
      'Bengaluru': {
        temp: 22,
        desc: 'Passing Showers • Humidity 65%',
        icon: '🌦️',
        rainNotice: 'Rain starting in ~35 mins',
        aqi: 'AQI 38 (Clean & Fresh)',
        aqiColor: 'text-emerald-500',
        hourly: [
          { time: '11 AM', val: '21°', height: 55 },
          { time: '12 PM', val: '22°', height: 65 },
          { time: '1 PM', val: '23°', height: 70 },
          { time: '2 PM', val: '22°', height: 65 },
          { time: '3 PM', val: '21°', height: 55 },
          { time: '4 PM', val: '20°', height: 50 }
        ],
        precipitation: [
          { time: '11 AM', val: '40%', height: 50 },
          { time: '12 PM', val: '75%', height: 85 },
          { time: '1 PM', val: '60%', height: 70 },
          { time: '2 PM', val: '30%', height: 40 },
          { time: '3 PM', val: '15%', height: 25 },
          { time: '4 PM', val: '10%', height: 20 }
        ],
        aqiBars: [
          { time: '11 AM', val: '35', height: 35 },
          { time: '12 PM', val: '38', height: 40 },
          { time: '1 PM', val: '40', height: 42 },
          { time: '2 PM', val: '36', height: 38 },
          { time: '3 PM', val: '34', height: 34 },
          { time: '4 PM', val: '32', height: 32 }
        ]
      },
      'Kolkata': {
        temp: 26,
        desc: 'Hazy Sunshine • Humidity 58%',
        icon: '🌤️',
        rainNotice: '0% rain probability',
        aqi: 'AQI 89 (Moderate)',
        aqiColor: 'text-amber-500',
        hourly: [
          { time: '11 AM', val: '25°', height: 65 },
          { time: '12 PM', val: '27°', height: 75 },
          { time: '1 PM', val: '28°', height: 80 },
          { time: '2 PM', val: '27°', height: 75 },
          { time: '3 PM', val: '25°', height: 65 },
          { time: '4 PM', val: '24°', height: 60 }
        ],
        precipitation: [
          { time: '11 AM', val: '0%', height: 10 },
          { time: '12 PM', val: '0%', height: 10 },
          { time: '1 PM', val: '0%', height: 10 },
          { time: '2 PM', val: '0%', height: 10 },
          { time: '3 PM', val: '0%', height: 10 },
          { time: '4 PM', val: '0%', height: 10 }
        ],
        aqiBars: [
          { time: '11 AM', val: '85', height: 65 },
          { time: '12 PM', val: '89', height: 70 },
          { time: '1 PM', val: '92', height: 75 },
          { time: '2 PM', val: '88', height: 68 },
          { time: '3 PM', val: '84', height: 64 },
          { time: '4 PM', val: '80', height: 60 }
        ]
      },
      'New York': {
        temp: 12,
        desc: 'Crisp & Clear • Humidity 42%',
        icon: '🍂',
        rainNotice: '0% precipitation expected',
        aqi: 'AQI 28 (Good)',
        aqiColor: 'text-emerald-500',
        hourly: [
          { time: '11 AM', val: '11°', height: 45 },
          { time: '12 PM', val: '13°', height: 55 },
          { time: '1 PM', val: '14°', height: 60 },
          { time: '2 PM', val: '13°', height: 55 },
          { time: '3 PM', val: '12°', height: 50 },
          { time: '4 PM', val: '10°', height: 40 }
        ],
        precipitation: [
          { time: '11 AM', val: '0%', height: 10 },
          { time: '12 PM', val: '0%', height: 10 },
          { time: '1 PM', val: '0%', height: 10 },
          { time: '2 PM', val: '0%', height: 10 },
          { time: '3 PM', val: '0%', height: 10 },
          { time: '4 PM', val: '0%', height: 10 }
        ],
        aqiBars: [
          { time: '11 AM', val: '25', height: 25 },
          { time: '12 PM', val: '28', height: 30 },
          { time: '1 PM', val: '30', height: 32 },
          { time: '2 PM', val: '28', height: 30 },
          { time: '3 PM', val: '26', height: 28 },
          { time: '4 PM', val: '24', height: 25 }
        ]
      },
      'London': {
        temp: 9,
        desc: 'Light Rain • Humidity 84%',
        icon: '🌧️',
        rainNotice: 'Intermittent rain all afternoon',
        aqi: 'AQI 22 (Good)',
        aqiColor: 'text-emerald-500',
        hourly: [
          { time: '11 AM', val: '8°', height: 40 },
          { time: '12 PM', val: '9°', height: 45 },
          { time: '1 PM', val: '10°', height: 50 },
          { time: '2 PM', val: '9°', height: 45 },
          { time: '3 PM', val: '8°', height: 40 },
          { time: '4 PM', val: '8°', height: 40 }
        ],
        precipitation: [
          { time: '11 AM', val: '80%', height: 85 },
          { time: '12 PM', val: '70%', height: 75 },
          { time: '1 PM', val: '50%', height: 60 },
          { time: '2 PM', val: '40%', height: 50 },
          { time: '3 PM', val: '30%', height: 40 },
          { time: '4 PM', val: '20%', height: 30 }
        ],
        aqiBars: [
          { time: '11 AM', val: '20', height: 20 },
          { time: '12 PM', val: '22', height: 22 },
          { time: '1 PM', val: '25', height: 25 },
          { time: '2 PM', val: '23', height: 23 },
          { time: '3 PM', val: '21', height: 21 },
          { time: '4 PM', val: '20', height: 20 }
        ]
      }
    }
  },

  renderWeatherWidget() {
    const cityData = this.weatherData.cities[this.weatherData.selectedCity] || this.weatherData.cities['New Delhi'];
    const tempEl = document.getElementById('weather-temp-main');
    const descEl = document.getElementById('weather-desc');
    const iconEl = document.getElementById('weather-icon-big');
    const rainEl = document.getElementById('weather-rain-notice');
    const aqiEl = document.getElementById('weather-aqi-pill');
    const chartContainer = document.getElementById('weather-chart-container');
    const citySelect = document.getElementById('weather-city-select');

    if (citySelect && citySelect.value !== this.weatherData.selectedCity) {
      citySelect.value = this.weatherData.selectedCity;
    }
    if (tempEl) tempEl.textContent = `${cityData.temp}°`;
    if (descEl) descEl.innerHTML = `<span>${cityData.icon}</span> <span>${cityData.desc}</span>`;
    if (iconEl) iconEl.textContent = cityData.icon;
    if (rainEl) rainEl.innerHTML = `<span>💧</span> <span>${cityData.rainNotice}</span>`;
    if (aqiEl) {
      aqiEl.className = `font-bold ${cityData.aqiColor}`;
      aqiEl.textContent = `● ${cityData.aqi}`;
    }

    if (chartContainer) {
      const activeTab = this.weatherData.activeTab;
      let bars = [];
      let fillClass = '';
      if (activeTab === 'hourly') {
        bars = cityData.hourly;
        fillClass = 'weather-bar-fill';
      } else if (activeTab === 'precipitation') {
        bars = cityData.precipitation;
        fillClass = 'weather-bar-fill precip';
      } else {
        bars = cityData.aqiBars;
        fillClass = 'weather-bar-fill aqi';
      }

      chartContainer.innerHTML = `
        <div class="weather-bar-container">
          ${bars.map(b => `
            <div class="weather-bar-col">
              <span class="text-[10px] font-bold text-gray-700 dark:text-gray-300">${b.val}</span>
              <div class="w-full flex items-end justify-center h-10">
                <div class="${fillClass}" style="height: ${b.height}%;"></div>
              </div>
              <span class="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">${b.time}</span>
            </div>
          `).join('')}
        </div>
      `;
    }
  },

  switchWeatherCity(city) {
    if (this.weatherData.cities[city]) {
      this.weatherData.selectedCity = city;
      this.renderWeatherWidget();
    }
  },

  switchWeatherTab(tab) {
    this.weatherData.activeTab = tab;
    ['hourly', 'precip', 'aqi'].forEach(t => {
      const btn = document.getElementById(`weather-tab-${t}`);
      if (btn) {
        if ((tab === 'hourly' && t === 'hourly') || (tab === 'precipitation' && t === 'precip') || (tab === 'aqi' && t === 'aqi')) {
          btn.className = 'flex-1 py-1 rounded-lg bg-sky-600 text-white font-bold transition-all text-center cursor-pointer shadow-xs';
        } else {
          btn.className = 'flex-1 py-1 rounded-lg text-gray-600 dark:text-gray-300 hover:text-sky-600 transition-all text-center cursor-pointer';
        }
      }
    });
    this.renderWeatherWidget();
  },

  sportsData: {
    selectedLeague: 'premier',
    leagues: {
      'premier': [
        { home: 'Man City', away: 'Fulham', homeFlag: '🔵', awayFlag: '⚪', time: '6:00 PM', date: 'Today', status: 'Upcoming' },
        { home: 'Aston Villa', away: 'Sunderland', homeFlag: '🟣', awayFlag: '🔴', time: '8:30 PM', date: 'Today', status: 'Upcoming' },
        { home: 'Bournemouth', away: 'Nottingham F.', homeFlag: '🔴', awayFlag: '🌲', time: '8:30 PM', date: 'Today', status: 'Upcoming' },
        { home: 'Arsenal', away: 'Chelsea', homeFlag: '🔴', awayFlag: '🔵', time: '10:00 PM', date: 'Tomorrow', status: 'Derby' }
      ],
      'champions': [
        { home: 'Real Madrid', away: 'Bayern Munich', homeFlag: '⚪', awayFlag: '🔴', time: '12:30 AM', date: 'Tomorrow', status: 'Semi' },
        { home: 'PSG', away: 'Liverpool', homeFlag: '🔵', awayFlag: '🔴', time: '12:30 AM', date: 'Wednesday', status: 'Quarter' },
        { home: 'Inter Milan', away: 'Barcelona', homeFlag: '🔵', awayFlag: '🔴', time: '12:30 AM', date: 'Thursday', status: 'Group' }
      ],
      'cricket_fixtures': [
        { home: 'India', away: 'Australia', homeFlag: '🇮🇳', awayFlag: '🇦🇺', time: '9:30 AM', date: '22 Nov', status: '1st Test' },
        { home: 'England', away: 'New Zealand', homeFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', awayFlag: '🇳🇿', time: '3:30 AM', date: '28 Nov', status: '2nd Test' },
        { home: 'South Africa', away: 'Sri Lanka', homeFlag: '🇿🇦', awayFlag: '🇱🇰', time: '1:30 PM', date: '27 Nov', status: '1st Test' }
      ],
      'laliga': [
        { home: 'Barcelona', away: 'Celta Vigo', homeFlag: '🔴', awayFlag: '🩵', time: '1:30 AM', date: 'Sunday', status: 'Matchday' },
        { home: 'Atletico', away: 'Alaves', homeFlag: '⚪', awayFlag: '🔵', time: '8:45 PM', date: 'Saturday', status: 'Matchday' }
      ]
    }
  },

  renderSportsWidget() {
    const listEl = document.getElementById('sports-fixtures-list');
    if (!listEl) return;
    const league = this.sportsData.selectedLeague;
    const fixtures = this.sportsData.leagues[league] || this.sportsData.leagues['premier'];

    listEl.innerHTML = fixtures.map(f => `
      <div class="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all">
        <div class="flex items-center gap-2 flex-1 min-w-0 pr-2">
          <div class="flex flex-col gap-0.5 min-w-0">
            <span class="font-bold truncate text-gray-900 dark:text-gray-100 flex items-center gap-1">
              <span>${f.homeFlag}</span> <span>${f.home}</span>
            </span>
            <span class="font-bold truncate text-gray-900 dark:text-gray-100 flex items-center gap-1">
              <span>${f.awayFlag}</span> <span>${f.away}</span>
            </span>
          </div>
        </div>
        <div class="text-right shrink-0">
          <div class="font-extrabold text-[11px] text-gray-800 dark:text-gray-200">${f.time}</div>
          <div class="text-[10px] text-gray-400 font-semibold">${f.date} • ${f.status}</div>
        </div>
      </div>
    `).join('');
  },

  switchSportsLeague(league) {
    if (this.sportsData.leagues[league]) {
      this.sportsData.selectedLeague = league;
      this.renderSportsWidget();
    }
  },

  publishersData: [
    { id: 'toi', name: 'Times of India', tag: 'TOI', avatar: '🇮🇳', readers: '4.8M readers' },
    { id: 'ndtv', name: 'NDTV News', tag: 'NDTV', avatar: '📺', readers: '3.2M readers' },
    { id: 'it', name: 'India Today', tag: 'IT', avatar: '⚡', readers: '2.9M readers' },
    { id: 'et', name: 'Economic Times', tag: 'ET', avatar: '📈', readers: '2.1M readers' },
    { id: 'bbc', name: 'BBC News', tag: 'BBC', avatar: '🌍', readers: '6.4M readers' },
    { id: 'reuters', name: 'Reuters Global', tag: 'Reuters', avatar: '🌐', readers: '5.1M readers' }
  ],

  initFollowedPublishers() {
    try {
      this.data.followedPublishers = JSON.parse(localStorage.getItem('tp_followed_publishers') || '[]');
    } catch (e) {
      this.data.followedPublishers = [];
    }
  },

  isFollowingPublisher(pubId) {
    return Array.isArray(this.data.followedPublishers) && this.data.followedPublishers.includes(pubId);
  },

  toggleFollowPublisher(pubId, e) {
    if (e) e.stopPropagation();
    if (!Array.isArray(this.data.followedPublishers)) this.data.followedPublishers = [];
    const idx = this.data.followedPublishers.indexOf(pubId);
    let isNowFollowing = false;
    if (idx > -1) {
      this.data.followedPublishers.splice(idx, 1);
    } else {
      this.data.followedPublishers.push(pubId);
      isNowFollowing = true;
    }
    localStorage.setItem('tp_followed_publishers', JSON.stringify(this.data.followedPublishers));
    
    // Update all matching follow buttons
    const btns = document.querySelectorAll(`.follow-btn-${pubId}`);
    btns.forEach(btn => {
      if (isNowFollowing) {
        btn.textContent = '✓ Following';
        btn.classList.add('following');
      } else {
        btn.textContent = '+ Follow';
        btn.classList.remove('following');
      }
    });

    const pub = this.publishersData.find(p => p.id === pubId);
    const name = pub ? pub.name : 'Publisher';
    if (isNowFollowing) {
      this.showToast(`⭐ Following ${name}! Their coverage will appear first.`);
    } else {
      this.showToast(`Unfollowed ${name}`);
    }
  },

  initLikes() {
    try {
      this.data.likes = JSON.parse(localStorage.getItem('tp_article_likes') || '{}');
    } catch (e) {
      this.data.likes = {};
    }
  },

  getLikeCount(artId, defaultSeed = 18) {
    if (this.data.likes && this.data.likes[artId] !== undefined) {
      return this.data.likes[artId].count;
    }
    return (Math.abs(this.hashCode(artId)) % 150) + defaultSeed;
  },

  isLiked(artId) {
    return !!(this.data.likes && this.data.likes[artId]?.userLiked);
  },

  toggleLike(artId, e) {
    if (e) e.stopPropagation();
    if (!this.data.likes) this.data.likes = {};
    const current = this.data.likes[artId] || { count: this.getLikeCount(artId), userLiked: false };
    
    if (current.userLiked) {
      current.count = Math.max(0, current.count - 1);
      current.userLiked = false;
    } else {
      current.count += 1;
      current.userLiked = true;
    }
    this.data.likes[artId] = current;
    localStorage.setItem('tp_article_likes', JSON.stringify(this.data.likes));

    const countEls = document.querySelectorAll(`.like-count-${artId}`);
    countEls.forEach(el => el.textContent = current.count);
    const btns = document.querySelectorAll(`.like-btn-${artId}`);
    btns.forEach(btn => {
      if (current.userLiked) {
        btn.classList.add('text-red-600', 'active');
      } else {
        btn.classList.remove('text-red-600', 'active');
      }
    });

    if (current.userLiked) {
      this.showToast('👍 Liked! We will prioritize similar stories in your feed.');
    }
  },

  startVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.showToast('🎙️ Voice search is not supported in this browser. Please type your query.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = this.data.currentLang === 'hi' ? 'hi-IN' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const voiceBtn = document.getElementById('voice-search-btn');
    if (voiceBtn) voiceBtn.classList.add('animate-pulse', 'text-red-600');
    this.showToast('🎙️ Listening... Speak now (बोलें)...');

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      const bentoInput = document.getElementById('search-input-bento');
      const desktopInput = document.getElementById('search-input');
      const mobileInput = document.getElementById('search-input-mobile');

      if (bentoInput) bentoInput.value = speechResult;
      if (desktopInput) desktopInput.value = speechResult;
      if (mobileInput) mobileInput.value = speechResult;

      this.onSearch(speechResult);
      this.showToast(`🔍 Searching for: "${speechResult}"`);
    };

    recognition.onerror = () => {
      if (voiceBtn) voiceBtn.classList.remove('animate-pulse', 'text-red-600');
      this.showToast('⚠️ Could not hear audio. Please try again.');
    };

    recognition.onend = () => {
      if (voiceBtn) voiceBtn.classList.remove('animate-pulse', 'text-red-600');
    };

    try {
      recognition.start();
    } catch (e) {
      if (voiceBtn) voiceBtn.classList.remove('animate-pulse', 'text-red-600');
    }
  },

  scrollToWeather() {
    const widget = document.getElementById('bento-weather-widget');
    if (widget) {
      widget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      widget.classList.add('ring-2', 'ring-sky-500');
      setTimeout(() => widget.classList.remove('ring-2', 'ring-sky-500'), 1800);
    }
  },

  scrollToPoll() {
    const widget = document.getElementById('interactive-poll-section');
    if (widget) {
      widget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      widget.classList.add('ring-2', 'ring-amber-500');
      setTimeout(() => widget.classList.remove('ring-2', 'ring-amber-500'), 1800);
    }
  },

  openAiSearch() {
    const bentoInput = document.getElementById('search-input-bento');
    const query = (bentoInput ? bentoInput.value.trim() : '') || 'trending world news';
    this.showToast(`✨ Asking TrendPulse AI to summarize latest developments on "${query}"...`);
    this.onSearch(query);
  },

  openPersonalizeFeed() {
    this.showToast('⚙️ Tip: Click "+ Follow" on any publisher to prioritize their coverage in your daily feed.');
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
              <img src="${art.image}" alt="${art.title}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=900&auto=format&fit=crop&q=80';">
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

    const related = this.data.articles
      .filter(a => a.id !== article.id)
      .slice(0, 3);

    const relatedHtml = related.length ? `
      <div class="mb-10 pt-6 border-t border-gray-200 dark:border-gray-800">
        <h3 class="text-base sm:text-lg font-bold font-serif-headline text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <span>🔥</span> Related Trending Stories (और भी ताज़ा खबरें)
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          ${related.map(rel => `
            <div onclick="App.openArticleModal('${rel.id}')" class="group rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between p-3">
              <div class="h-32 w-full rounded-xl overflow-hidden mb-2.5 bg-gray-200 dark:bg-gray-800">
                <img src="${rel.image}" alt="${rel.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80';">
              </div>
              <div>
                <span class="text-[10px] font-bold text-red-600 uppercase tracking-wider">${rel.source}</span>
                <h4 class="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 mt-0.5 group-hover:text-red-600 transition-colors">
                  ${rel.title}
                </h4>
              </div>
              <span class="text-[10px] text-gray-400 mt-2 block">${rel.readTime || '1 min read'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    content.innerHTML = `
      <div class="min-h-screen bg-white dark:bg-gray-950 flex flex-col text-gray-900 dark:text-gray-100">
        <!-- Sticky Top Navigation Header -->
        <header class="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm py-2.5 px-3 sm:px-8">
          <div class="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
            
            <!-- Left: Back Button & Category -->
            <div class="flex items-center gap-1.5 sm:gap-3">
              <button onclick="App.closeArticleModal()" class="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold text-xs sm:text-sm transition-all shadow-sm group cursor-pointer">
                <span class="text-base sm:text-lg group-hover:-translate-x-1 transition-transform">←</span>
                <span class="hidden sm:inline">Back</span>
              </button>
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 truncate max-w-[120px] sm:max-w-none">
                ${article.categoryIcon || '🔥'} ${article.categoryName}
              </span>
            </div>

            <!-- Right: Quick Actions (Font Size, Audio, Bookmark, WhatsApp, Copy Link, Close) -->
            <div class="flex items-center gap-1 sm:gap-2">
              <!-- Font size control -->
              <div class="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 sm:p-1 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300">
                <button onclick="App.changeFontSize(-2)" class="px-2 py-1 rounded hover:bg-white dark:hover:bg-gray-700 cursor-pointer" title="Smaller text">A-</button>
                <button onclick="App.changeFontSize(2)" class="px-2 py-1 rounded hover:bg-white dark:hover:bg-gray-700 cursor-pointer" title="Larger text">A+</button>
              </div>

              <button onclick="App.playAudio('${article.id}', event)" class="p-2 sm:px-3 sm:py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer" title="Listen to Article">
                🔊 <span class="hidden md:inline">Listen</span>
              </button>
              
              <button id="modal-bookmark-btn" onclick="App.toggleBookmark('${article.id}', event)" class="p-2 sm:px-3 sm:py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs sm:text-sm font-semibold ${isSaved ? 'text-amber-500' : 'text-gray-700 dark:text-gray-300'} transition-colors cursor-pointer" title="Save Article">
                ${isSaved ? '★' : '☆'} <span class="hidden md:inline">${isSaved ? 'Saved' : 'Save'}</span>
              </button>

              <button onclick="App.shareToWhatsApp('${article.id}')" class="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer" title="Share on WhatsApp">
                💬 <span class="hidden sm:inline">WhatsApp</span>
              </button>

              <button onclick="App.copyArticleLink('${article.id}', event)" class="p-2 sm:px-3 sm:py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer" title="Copy Link">
                📋
              </button>

              <button onclick="App.shareArticle('${article.id}', event)" class="p-2 sm:px-3 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer" title="Share">
                ↗
              </button>
              
              <!-- Big Clear Red Close Button -->
              <button onclick="App.closeArticleModal()" class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-950/80 dark:hover:bg-red-900/80 text-red-600 dark:text-red-400 flex items-center justify-center font-black text-lg sm:text-xl transition-all shadow-sm ml-0.5 sm:ml-1 cursor-pointer" title="Close (बंद करें)">
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
            <img src="${article.image}" alt="${article.title}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=900&auto=format&fit=crop&q=80';">
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

          <!-- Summary Body Text with resizable font -->
          <div class="prose prose-lg dark:prose-invert max-w-none mb-8">
            <p id="article-modal-body-text" style="font-size: ${this.data.currentFontSize || 18}px; line-height: ${(this.data.currentFontSize || 18) * 1.6}px;" class="text-gray-800 dark:text-gray-200 font-normal transition-all duration-150">
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
              <button onclick="App.shareToWhatsApp('${article.id}')" class="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer">
                💬 WhatsApp
              </button>
              <button onclick="App.copyArticleLink('${article.id}', event)" class="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer">
                📋 Copy Link
              </button>
              <button onclick="App.shareArticle('${article.id}', event)" class="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer">
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

          <!-- In-Article Responsive Ad Slot (Monetization Driver) -->
          <div class="ad-slot-container rounded-2xl p-4 mb-8 text-center shadow-sm">
            <span class="text-[9px] uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">Sponsored Recommendation / प्रायोजित</span>
            <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div>
                <h4 class="font-bold text-sm text-gray-900 dark:text-white">🚀 Grow Your Savings with High-Return Index Funds</h4>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Automated compounding with lowest expense ratio. Trusted by top Indian financial advisors.</p>
              </div>
              <a href="https://zerodha.com" target="_blank" rel="noopener sponsored" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 shadow-sm whitespace-nowrap">
                Explore Funds ↗
              </a>
            </div>
          </div>

          <!-- Related Stories Section -->
          ${relatedHtml}

          <!-- Big Bottom Exit Button -->
          <div class="pt-2 pb-12">
            <button onclick="App.closeArticleModal()" class="w-full py-4 px-6 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01] cursor-pointer">
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

  // Instant 3-Sec Takeaways Toggle on Cards
  toggleCardBullets(articleId, e) {
    if (e) e.stopPropagation();
    const el = document.getElementById(`card-bullets-${articleId}`);
    if (el) {
      el.classList.toggle('hidden');
    }
  },

  // Continuous Audio News Bulletin (Plays Top 5 Headlines Sequentially)
  startAudioBulletin() {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-Speech audio reader is not supported on this browser.");
      return;
    }
    this.stopAudio();

    const topArticles = this.data.articles.slice(0, 5);
    if (!topArticles.length) {
      this.showToast("No news available for audio bulletin.");
      return;
    }

    this.data.bulletin.articles = topArticles;
    this.data.bulletin.currentIndex = 0;
    this.data.bulletin.isPlaying = true;

    const player = document.getElementById('audio-bulletin-player');
    if (player) {
      player.classList.remove('hidden');
      player.classList.add('flex');
    }

    this.showToast("🎧 Starting TrendPulse Daily Audio Bulletin (5 Top Stories)...");
    this.playBulletinCurrentStory();
  },

  playBulletinCurrentStory() {
    const b = this.data.bulletin;
    if (!b.articles || b.currentIndex >= b.articles.length) {
      this.stopAudioBulletin();
      this.showToast("🎧 Daily Bulletin completed!");
      return;
    }

    const art = b.articles[b.currentIndex];
    const titleEl = document.getElementById('bulletin-story-title');
    const badgeEl = document.getElementById('bulletin-index-badge');
    const playBtn = document.getElementById('bulletin-play-pause-btn');

    if (titleEl) titleEl.textContent = art.title;
    if (badgeEl) badgeEl.textContent = `${b.currentIndex + 1}/${b.articles.length}`;
    if (playBtn) playBtn.textContent = '⏸';

    window.speechSynthesis.cancel();
    const text = `Story ${b.currentIndex + 1}: ${art.title}. ${art.summary}`;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;

    utter.onend = () => {
      if (b.isPlaying) {
        b.currentIndex++;
        this.playBulletinCurrentStory();
      }
    };
    utter.onerror = () => {
      if (b.isPlaying) {
        b.currentIndex++;
        this.playBulletinCurrentStory();
      }
    };

    b.isPlaying = true;
    window.speechSynthesis.speak(utter);
  },

  toggleBulletinPlay() {
    const b = this.data.bulletin;
    const playBtn = document.getElementById('bulletin-play-pause-btn');

    if (b.isPlaying) {
      window.speechSynthesis.pause();
      b.isPlaying = false;
      if (playBtn) playBtn.textContent = '▶';
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        this.playBulletinCurrentStory();
      }
      b.isPlaying = true;
      if (playBtn) playBtn.textContent = '⏸';
    }
  },

  nextBulletinStory() {
    const b = this.data.bulletin;
    if (b.currentIndex < b.articles.length - 1) {
      b.currentIndex++;
      this.playBulletinCurrentStory();
    } else {
      this.stopAudioBulletin();
      this.showToast("🎧 Bulletin finished!");
    }
  },

  prevBulletinStory() {
    const b = this.data.bulletin;
    if (b.currentIndex > 0) {
      b.currentIndex--;
      this.playBulletinCurrentStory();
    }
  },

  stopAudioBulletin() {
    this.data.bulletin.isPlaying = false;
    window.speechSynthesis.cancel();
    const player = document.getElementById('audio-bulletin-player');
    if (player) {
      player.classList.add('hidden');
      player.classList.remove('flex');
    }
  },

  // WhatsApp Daily Digest Generator (Viral Growth Tool)
  shareDailyDigest() {
    const topStories = this.data.articles.slice(0, 5);
    if (!topStories.length) return;

    const dateStr = new Date().toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });

    let text = `⚡ *TrendPulse 360 - Daily Top 5 Headlines* ⚡\n📅 ${dateStr}\n\n`;
    topStories.forEach((art, i) => {
      const num = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][i] || `${i + 1}.`;
      text += `${num} *${art.title}*\n👉 ${window.location.origin}/#news=${art.id}\n\n`;
    });
    text += `📢 Read 60-sec verified worldwide news:\n${window.location.origin}`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
    this.showToast("📋 Opening WhatsApp with today's Top 5 Headlines!");
  },

  changeFontSize(delta) {
    this.data.currentFontSize = Math.max(14, Math.min(26, (this.data.currentFontSize || 18) + delta));
    const textEl = document.getElementById('article-modal-body-text');
    if (textEl) {
      textEl.style.fontSize = `${this.data.currentFontSize}px`;
      textEl.style.lineHeight = `${this.data.currentFontSize * 1.6}px`;
    }
  },

  showToast(msg) {
    const toast = document.getElementById('toast-message');
    if (!toast) return;
    toast.innerHTML = msg;
    toast.classList.remove('opacity-0', 'pointer-events-none');
    toast.classList.add('opacity-100');
    setTimeout(() => {
      toast.classList.remove('opacity-100');
      toast.classList.add('opacity-0', 'pointer-events-none');
    }, 2500);
  },

  copyArticleLink(articleId, e) {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}/#news=${articleId}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.showToast('📋 Link copied to clipboard!');
      }).catch(() => {
        this.showToast(`📋 ${shareUrl}`);
      });
    } else {
      this.showToast('📋 Link copied!');
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
      }).catch(err => {
        if (err.name !== 'AbortError') {
          this.copyArticleLink(articleId);
        }
      });
    } else {
      this.copyArticleLink(articleId);
    }
  },

  shareToWhatsApp(articleId, e) {
    if (e) e.stopPropagation();
    const article = this.data.articles.find(a => a.id === articleId);
    if (!article) return;
    const shareUrl = `${window.location.origin}/#news=${article.id}`;
    const text = encodeURIComponent(`🔥 Breaking News: ${article.title}\n\n${article.summary}\n\n👉 Read 60-second brief on TrendPulse 360:\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  },

  shareToTwitter(articleId, e) {
    if (e) e.stopPropagation();
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
    // Synchronize Desktop, Mobile and Bento search inputs
    const searchInputIds = ['search-input-bento', 'search-input', 'search-input-mobile'];
    searchInputIds.forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        let timeout = null;
        input.addEventListener('input', (e) => {
          clearTimeout(timeout);
          const val = e.target.value;
          searchInputIds.forEach(otherId => {
            if (otherId !== id) {
              const other = document.getElementById(otherId);
              if (other && other.value !== val) other.value = val;
            }
          });
          timeout = setTimeout(() => this.onSearch(val), 200);
        });
      }
    });

    // Scroll progress bar and back-to-top button
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      
      const progressBar = document.getElementById('reading-progress-bar');
      if (progressBar) {
        progressBar.style.width = `${Math.min(100, Math.max(0, scrollPercent))}%`;
      }

      const backBtn = document.getElementById('back-to-top');
      if (backBtn) {
        if (scrollTop > 350) {
          backBtn.classList.remove('opacity-0', 'pointer-events-none');
          backBtn.classList.add('opacity-100');
        } else {
          backBtn.classList.remove('opacity-100');
          backBtn.classList.add('opacity-0', 'pointer-events-none');
        }
      }
    }, { passive: true });

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
