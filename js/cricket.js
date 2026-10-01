/**
 * TrendPulse 360 - Cricket Live Score & Match Center Module
 * Features:
 * - Live Matches FIRST on page load (active by default)
 * - Beautiful top cricket marquee ticker with live scores & alerts
 * - Google OneBox card style with match video thumbnail and ▶ 20:00 duration badge
 * - Dedicated Team India Highlights Hub (India Men Last 5 & India Women Last 5 matches)
 * - Direct official OTT free streaming links (Disney+ Hotstar, JioCinema, SonyLIV, BCCI) - Zero YouTube!
 * - Full interactive scorecard modal (Batting, Bowling, Toss, CRR/RRR, Dismissals)
 */

const Cricket = {
  data: {
    matches: {
      liveMatches: [],
      upcomingMatches: [],
      recentMatches: [],
      teamIndiaMatches: [],
      indiaMenHighlights: [],
      indiaWomenHighlights: []
    },
    activeTab: 'live', // LIVE MATCH FIRST by default (as explicitly requested!)
    activeIndiaSubTab: 'men', // 'men' (default), 'women', 'all'
    selectedMatch: null,
    selectedInningsIdx: 0,
    pollInterval: null
  },

  async init() {
    await this.loadData();
    this.bindEvents();
    // Auto-poll fresh cricket scores every 60 seconds in background
    this.data.pollInterval = setInterval(() => this.loadData(true), 60000);
  },

  async loadData(isPolling = false) {
    try {
      const resp = await fetch('data/cricket.json?v=' + Date.now());
      if (!resp.ok) return;
      const json = await resp.json();
      
      this.data.matches.liveMatches = json.liveMatches || [];
      this.data.matches.upcomingMatches = json.upcomingMatches || [];
      this.data.matches.recentMatches = json.recentMatches || [];
      this.data.matches.indiaMenHighlights = json.indiaMenHighlights || [];
      this.data.matches.indiaWomenHighlights = json.indiaWomenHighlights || [];

      // Extract or compute Team India matches
      const all = [
        ...this.data.matches.liveMatches,
        ...this.data.matches.upcomingMatches,
        ...this.data.matches.recentMatches,
        ...this.data.matches.indiaMenHighlights,
        ...this.data.matches.indiaWomenHighlights
      ];

      const indiaMap = {};
      (json.teamIndiaMatches || all.filter(m => m.isIndiaMatch)).forEach(m => {
        indiaMap[m.id] = m;
      });
      this.data.matches.teamIndiaMatches = Object.values(indiaMap);

      // Update tab badges
      const liveBadge = document.getElementById('count-live-tab');
      if (liveBadge) liveBadge.textContent = this.data.matches.liveMatches.length;

      const indiaBadge = document.getElementById('count-india-tab');
      if (indiaBadge) {
        const totalHl = (this.data.matches.indiaMenHighlights.length + this.data.matches.indiaWomenHighlights.length) || this.data.matches.teamIndiaMatches.length;
        indiaBadge.textContent = totalHl;
      }

      const upBadge = document.getElementById('count-upcoming-tab');
      if (upBadge) upBadge.textContent = this.data.matches.upcomingMatches.length;

      const recBadge = document.getElementById('count-recent-tab');
      if (recBadge) recBadge.textContent = this.data.matches.recentMatches.length;

      this.renderTicker();
      this.renderCards();

      // If active scorecard modal is open, refresh its data in-place
      if (this.data.selectedMatch) {
        const updated = this.findMatchById(this.data.selectedMatch.id);
        if (updated) {
          this.data.selectedMatch = updated;
          this.renderScorecardContent();
        }
      }
    } catch (e) {
      console.warn("Cricket data fetch notice:", e);
    }
  },

  findMatchById(id) {
    const all = [
      ...this.data.matches.liveMatches,
      ...this.data.matches.upcomingMatches,
      ...this.data.matches.recentMatches,
      ...this.data.matches.teamIndiaMatches,
      ...this.data.matches.indiaMenHighlights,
      ...this.data.matches.indiaWomenHighlights
    ];
    return all.find(m => m.id === id);
  },

  setTab(tabName) {
    this.data.activeTab = tabName;
    ['live', 'india', 'upcoming', 'recent'].forEach(t => {
      const btn = document.getElementById(`cricket-tab-${t}`);
      if (!btn) return;
      if (t === tabName) {
        if (t === 'live') {
          btn.className = "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all bg-red-600 text-white shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap";
        } else if (t === 'india') {
          btn.className = "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap";
        } else {
          btn.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-indigo-600 text-white shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap";
        }
      } else {
        btn.className = "px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap";
      }
    });
    this.renderCards();
  },

  setIndiaSubTab(subTab) {
    this.data.activeIndiaSubTab = subTab;
    this.renderCards();
  },

  openIndiaHighlights(subTab = 'men') {
    this.data.activeIndiaSubTab = subTab;
    this.setTab('india');
    this.toggleCricketCenter();
  },

  renderTicker() {
    const tickerTrack = document.getElementById('cricket-ticker-track');
    if (!tickerTrack) return;

    const allTickerMatches = [
      ...this.data.matches.liveMatches,
      ...this.data.matches.upcomingMatches,
      ...this.data.matches.recentMatches
    ];

    let html = '';

    // Prominent Live Match Lead Badge if any match is live
    if (this.data.matches.liveMatches.length > 0) {
      const live1 = this.data.matches.liveMatches[0];
      const t1 = live1.team1;
      const t2 = live1.team2;
      const t1_s = t1.innings1 ? t1.innings1.display : '';
      const t2_s = t2.innings1 ? t2.innings1.display : '';

      html += `
        <div onclick="Cricket.setTab('live'); Cricket.toggleCricketCenter();" class="inline-flex items-center gap-2 bg-red-600/30 border border-red-500/70 px-3 py-1 rounded-lg text-xs cursor-pointer transition-all hover:border-red-400 shadow-md shrink-0">
          <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          <span class="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-red-600 text-white animate-pulse">
            🔴 LIVE NOW
          </span>
          <span class="font-extrabold flex items-center gap-1 text-white">
            <span>${t1.flag}</span> ${t1.shortName} <span class="font-mono text-amber-300">${t1_s}</span> vs <span>${t2.flag}</span> ${t2.shortName} <span class="font-mono text-amber-300">${t2_s}</span>
          </span>
          <span class="text-slate-300 text-[11px] font-bold hover:underline">
            View Live Match →
          </span>
        </div>
      `;
    }

    // Lead Highlights Badge (WI 405/7 vs IND 406/2 on Hotstar)
    const leadIndiaMatch = (this.data.matches.indiaMenHighlights && this.data.matches.indiaMenHighlights[0]) || allTickerMatches.find(m => m.id === 'ind-wi-2nd-odi');
    if (leadIndiaMatch) {
      html += `
        <div onclick="Cricket.openIndiaHighlights('men')" class="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-600/20 border border-amber-500/60 px-3 py-1 rounded-lg text-xs cursor-pointer transition-all hover:border-amber-400 shadow-md shrink-0">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500 text-slate-950 animate-pulse">
            🎬 India Match Highlights
          </span>
          <span class="font-extrabold flex items-center gap-1 text-white">
            <span>🌴</span> WI 405/7 vs <span>🇮🇳</span> IND 406/2 (IND won by 8 wkts)
          </span>
          <span class="text-amber-300 text-[11px] font-bold hover:underline flex items-center gap-1">
            Free on Disney+ Hotstar →
          </span>
        </div>
      `;
    }

    allTickerMatches.forEach(m => {
      const t1 = m.team1;
      const t2 = m.team2;
      const t1_score = t1.innings1 ? t1.innings1.display : '';
      const t2_score = t2.innings1 ? t2.innings1.display : '';

      const isLive = m.isLive;
      const badgeColor = isLive ? 'bg-red-600 text-white animate-pulse' : (m.isUpcoming ? 'bg-slate-700 text-slate-300' : 'bg-emerald-700 text-white');
      const badgeText = isLive ? 'LIVE' : (m.isUpcoming ? 'UPCOMING' : 'RESULT');

      html += `
        <div onclick="Cricket.openScorecard('${m.id}')" class="inline-flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/70 px-3 py-1 rounded-lg text-xs cursor-pointer transition-all hover:border-indigo-500 shadow-sm shrink-0">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${badgeColor}">
            ${badgeText}
          </span>
          <span class="font-bold flex items-center gap-1 text-slate-100">
            <span>${t1.flag}</span> ${t1.shortName} <span class="font-mono text-amber-400">${t1_score}</span>
          </span>
          <span class="text-slate-500 font-bold">vs</span>
          <span class="font-bold flex items-center gap-1 text-slate-100">
            <span>${t2.flag}</span> ${t2.shortName} <span class="font-mono text-amber-400">${t2_score}</span>
          </span>
          <span class="text-slate-400 text-[11px] max-w-xs truncate hidden sm:inline">
            • ${m.status || m.startTime}
          </span>
          <span class="text-indigo-400 text-[11px] font-semibold hover:underline">
            📊 Scorecard →
          </span>
        </div>
      `;
    });

    tickerTrack.innerHTML = html;
  },

  renderCards() {
    const container = document.getElementById('cricket-cards-container');
    if (!container) return;

    let targetMatches = [];
    const isIndiaTab = (this.data.activeTab === 'india');
    const isLiveTab = (this.data.activeTab === 'live');

    if (isIndiaTab) {
      if (this.data.activeIndiaSubTab === 'men') {
        targetMatches = this.data.matches.indiaMenHighlights || [];
      } else if (this.data.activeIndiaSubTab === 'women') {
        targetMatches = this.data.matches.indiaWomenHighlights || [];
      } else {
        targetMatches = this.data.matches.teamIndiaMatches || [];
      }
    } else if (isLiveTab) {
      targetMatches = this.data.matches.liveMatches || [];
    } else if (this.data.activeTab === 'upcoming') {
      targetMatches = this.data.matches.upcomingMatches || [];
    } else {
      targetMatches = this.data.matches.recentMatches || [];
    }

    let cardsHtml = '';

    // 1. LIVE MATCH BANNER (if on Live tab)
    if (isLiveTab) {
      cardsHtml += `
        <div class="col-span-full bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-950 border border-red-600/50 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs shadow-xl">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-2xl shadow-lg shrink-0">
              🔴
            </div>
            <div>
              <h4 class="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                Live Cricket Matches (In-Play)
                <span class="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded-full font-mono animate-pulse">
                  ● Real-Time
                </span>
              </h4>
              <p class="text-slate-300 mt-0.5">
                Real-time scores, live ball-by-ball updates, required run rates, and official live streaming links.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 self-stretch sm:self-auto">
            <button onclick="Cricket.setTab('india')" class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black shadow-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer">
              <span>🇮🇳</span> India Match Highlights (${this.data.matches.indiaMenHighlights.length + this.data.matches.indiaWomenHighlights.length})
            </button>
          </div>
        </div>
      `;
    }

    // 2. TEAM INDIA SPECIAL HEADER & SUB-NAVIGATION (if on India tab)
    if (isIndiaTab) {
      const activeSub = this.data.activeIndiaSubTab;
      const menActive = activeSub === 'men' 
        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black shadow-md' 
        : 'text-slate-300 hover:text-white hover:bg-slate-800';
      const womenActive = activeSub === 'women' 
        ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black shadow-md' 
        : 'text-slate-300 hover:text-white hover:bg-slate-800';
      const allActive = activeSub === 'all' 
        ? 'bg-indigo-600 text-white font-black shadow-md' 
        : 'text-slate-300 hover:text-white hover:bg-slate-800';

      const subBannerTitle = activeSub === 'men' 
        ? '👨 Team India Men — Previous 5 Matches Highlights & Free Streaming' 
        : (activeSub === 'women' 
            ? '👩 Team India Women — Previous 5 Matches Highlights & Free Streaming' 
            : '🏏 All Team India Fixtures, Live & Upcoming Matches');

      const subBannerDesc = activeSub === 'men'
        ? 'Disney+ Hotstar / JioCinema / SonyLIV पर टीम इंडिया मेन्स के पिछले 5 मैचों के 100% फ्री हाइलाइट्स व फुल स्कोरकार्ड।'
        : (activeSub === 'women'
            ? 'Disney+ Hotstar / JioCinema पर टीम इंडिया विमेंस के पिछले 5 ऐतिहासिक मैचों (300 Chase, T20 WC) के फ्री हाइलाइट्स।'
            : 'भारतीय टीम के सभी वर्तमान, हालिया और आगामी मैचों की पूरी सूची।');

      cardsHtml += `
        <div class="col-span-full space-y-4">
          
          <!-- Top Sub-Tabs Navigation (Men vs Women vs All) -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/80 border border-amber-500/40 rounded-2xl p-2.5 sm:p-3 shadow-lg">
            <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <button onclick="Cricket.setIndiaSubTab('men')" class="px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${menActive}">
                <span>👨</span> <strong>India Men (5 Highlights)</strong>
              </button>
              <button onclick="Cricket.setIndiaSubTab('women')" class="px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${womenActive}">
                <span>👩</span> <strong>India Women (5 Highlights)</strong>
              </button>
              <button onclick="Cricket.setIndiaSubTab('all')" class="px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${allActive}">
                <span>🏏</span> All India Matches (${this.data.matches.teamIndiaMatches.length})
              </button>
            </div>

            <!-- Free Streaming Platform Badge -->
            <div class="flex items-center gap-2 text-[11px] font-semibold text-amber-300 self-end sm:self-auto bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
              <span>🆓</span> 100% Free Highlights on Disney+ Hotstar / JioCinema / SonyLIV
            </div>
          </div>

          <!-- Section Banner -->
          <div class="bg-gradient-to-r from-amber-500/20 via-orange-600/20 to-blue-600/20 border border-amber-500/50 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs shadow-lg">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-2xl shadow-md shrink-0">
                ${activeSub === 'women' ? '👩' : '🇮🇳'}
              </div>
              <div>
                <h4 class="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  ${subBannerTitle}
                  <span class="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full font-mono">
                    Free Highlights
                  </span>
                </h4>
                <p class="text-slate-300 mt-0.5">
                  ${subBannerDesc}
                </p>
              </div>
            </div>
            
            <div class="flex items-center gap-2 self-stretch sm:self-auto">
              <a href="https://www.hotstar.com/in/sports/cricket" target="_blank" rel="noopener" class="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black shadow-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer" title="Open Disney+ Hotstar Cricket Hub">
                <span>📺</span> Hotstar Cricket
              </a>
              <a href="https://www.jiocinema.com/sports/cricket" target="_blank" rel="noopener" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer" title="Open JioCinema Sports">
                <span>📱</span> JioCinema
              </a>
            </div>
          </div>

        </div>
      `;
    }

    if (!targetMatches.length) {
      cardsHtml += `
        <div class="col-span-full text-center py-12 text-slate-400">
          <div class="text-4xl mb-2">🏏</div>
          <p class="font-semibold text-sm">No matches in this section right now.</p>
          <button onclick="Cricket.setTab('india')" class="mt-3 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all">
            View Team India Highlights
          </button>
        </div>
      `;
      container.innerHTML = cardsHtml;
      return;
    }

    targetMatches.forEach(m => {
      const t1 = m.team1;
      const t2 = m.team2;
      const t1_s = t1.innings1 ? t1.innings1.display : (m.isUpcoming ? 'Yet to Bat' : '-');
      const t2_s = t2.innings1 ? t2.innings1.display : (m.isUpcoming ? 'Yet to Bat' : '-');

      const isLive = m.isLive;
      const isInd = m.isIndiaMatch;

      const badgeStyle = isLive 
        ? 'bg-red-600 text-white shadow-red-500/30 animate-pulse' 
        : (m.isUpcoming ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30');
      
      const badgeLabel = isLive ? '🔴 LIVE' : (m.isUpcoming ? '📅 UPCOMING' : '🏆 COMPLETED');
      const borderStyle = isLive ? 'border-red-500/80 shadow-red-500/20' : (isInd ? 'border-amber-500/60 shadow-amber-500/10' : 'border-slate-700/80');

      // Stream & Highlights Info
      const stream = m.stream || { streamName: 'Disney+ Hotstar', highlightsUrl: 'https://www.hotstar.com/in/sports/cricket', streamUrl: 'https://www.hotstar.com/in/sports/cricket' };

      // Render cards exactly in Google OneBox style (matching user's screenshot layout)
      cardsHtml += `
        <div class="bg-slate-800/95 hover:bg-slate-800 border ${borderStyle} rounded-2xl p-4 sm:p-5 shadow-lg transition-all hover:border-indigo-500/80 flex flex-col justify-between group">
          
          <div>
            <!-- Top Header: Match Description (Left) & Date (Right) - Exactly as in user screenshot -->
            <div class="flex items-center justify-between text-xs text-slate-400 mb-3 pb-2 border-b border-slate-700/60 font-sans">
              <span class="font-medium text-slate-300 truncate max-w-[70%]" title="${m.series}">
                ${m.matchDesc || m.series} ${m.matchFormat ? `(${m.matchFormat})` : ''}
              </span>
              <span class="font-semibold text-slate-400 text-[11px] whitespace-nowrap">
                ${m.date || (isLive ? '<span class="text-red-400 font-bold animate-pulse">● LIVE</span>' : 'Yesterday')}
              </span>
            </div>

            <!-- Teams & Scores Rows (Clean & bold layout like screenshot) -->
            <div class="space-y-2.5 my-2">
              <!-- Team 1 -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">${t1.flag}</span>
                  <span class="font-bold text-sm text-white flex items-center gap-1">
                    ${t1.name}
                    ${t1.shortName.includes('IND') ? '<span class="text-amber-400 text-xs">★</span>' : ''}
                  </span>
                </div>
                <div class="font-mono text-sm sm:text-base font-bold text-slate-200">
                  ${t1_s}
                </div>
              </div>

              <!-- Team 2 -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">${t2.flag}</span>
                  <span class="font-bold text-sm text-white flex items-center gap-1">
                    ${t2.name}
                    ${t2.shortName.includes('IND') ? '<span class="text-amber-400 text-xs">★</span>' : ''}
                  </span>
                </div>
                <div class="font-mono text-sm sm:text-base font-extrabold text-amber-400">
                  ${t2_s}
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Row: Result/Status on Left & Video Thumbnail on Right (from screenshot) -->
          <div class="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-3">
            
            <!-- Result & Actions Left Column -->
            <div class="flex-1 min-w-0 pr-1">
              <p class="text-xs sm:text-sm font-bold text-white leading-tight">
                ${m.status || (isLive ? 'Match in progress' : 'Completed')}
              </p>
              <p class="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1 truncate">
                <span>📺</span> Streamed on <strong>${stream.streamName}</strong>
              </p>
              
              <div class="flex items-center gap-2 mt-2.5 flex-wrap">
                <button onclick="Cricket.openScorecard('${m.id}')" class="py-1 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer">
                  <span>📊</span> Scorecard
                </button>
                <a href="${stream.highlightsUrl}" target="_blank" rel="noopener" class="py-1 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1" title="Watch on ${stream.streamName}">
                  <span>🎬</span> Highlights
                </a>
              </div>
            </div>

            <!-- Video Thumbnail Right Column (Click opens Hotstar stream!) -->
            <div class="shrink-0">
              <a href="${stream.highlightsUrl}" target="_blank" rel="noopener" class="block relative group/thumb overflow-hidden rounded-xl border border-slate-700 shadow-md cursor-pointer hover:border-amber-400 transition-all w-[105px] sm:w-[125px] h-[64px] sm:h-[75px] bg-slate-900" title="Watch Highlights Video on ${stream.streamName}">
                ${m.thumbnail ? `
                  <img src="${m.thumbnail}" alt="${m.series} Highlights" class="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300">
                ` : `
                  <div class="w-full h-full bg-gradient-to-tr from-blue-900 via-indigo-900 to-slate-900 flex flex-col items-center justify-center text-center p-1 text-[10px] text-white font-bold">
                    <span class="tracking-wider">HIGHLIGHTS</span>
                    <span class="text-[9px] text-amber-400">${t1.shortName} vs ${t2.shortName}</span>
                  </div>
                `}
                <!-- Duration Badge on Bottom Right (e.g. ▶ 20:00 as in screenshot) -->
                <div class="absolute bottom-1 right-1 bg-black/85 backdrop-blur-sm text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <span>▶</span> ${m.duration || '20:00'}
                </div>
                <!-- Play button overlay on hover -->
                <div class="absolute inset-0 bg-black/25 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                  <div class="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center text-xs shadow-lg font-bold">
                    ▶
                  </div>
                </div>
              </a>
            </div>

          </div>

        </div>
      `;
    });

    container.innerHTML = cardsHtml;
  },

  openScorecard(matchId) {
    const match = this.findMatchById(matchId);
    if (!match) return;

    this.data.selectedMatch = match;
    this.data.selectedInningsIdx = 0;
    this.renderScorecardContent();

    const modal = document.getElementById('cricket-scorecard-modal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  },

  closeScorecard() {
    const modal = document.getElementById('cricket-scorecard-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }
    this.data.selectedMatch = null;
  },

  setScorecardInnings(idx) {
    this.data.selectedInningsIdx = idx;
    this.renderScorecardTables();
  },

  renderScorecardContent() {
    const match = this.data.selectedMatch;
    if (!match) return;

    const t1 = match.team1;
    const t2 = match.team2;
    const sc = match.scorecard || {};
    const stream = match.stream || { streamName: 'Disney+ Hotstar', highlightsUrl: 'https://www.hotstar.com/in/sports/cricket', streamUrl: 'https://www.hotstar.com/in/sports/cricket' };
    const isInd = match.isIndiaMatch;

    // 1. Header
    const headerEl = document.getElementById('scorecard-modal-header');
    if (headerEl) {
      headerEl.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span class="text-xs uppercase tracking-wider text-indigo-300 font-semibold flex items-center gap-1.5">
              ${isInd ? '<span>🇮🇳</span>' : ''}${match.series} • ${match.matchDesc || ''} (${match.matchFormat || 'ODI'})
            </span>
            <div class="flex items-center gap-4 mt-2">
              <div class="flex items-center gap-2">
                <span class="text-3xl">${t1.flag}</span>
                <div>
                  <h3 class="font-bold text-lg text-white">${t1.name}</h3>
                  <span class="font-mono text-xl font-black text-amber-400">${t1.innings1 ? t1.innings1.display : 'Yet to Bat'}</span>
                </div>
              </div>
              <span class="text-slate-400 font-serif text-lg">vs</span>
              <div class="flex items-center gap-2">
                <span class="text-3xl">${t2.flag}</span>
                <div>
                  <h3 class="font-bold text-lg text-white">${t2.name}</h3>
                  <span class="font-mono text-xl font-black text-amber-400">${t2.innings1 ? t2.innings1.display : 'Yet to Bat'}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/10 text-xs space-y-1 self-start sm:self-auto min-w-[200px]">
            <div class="flex justify-between">
              <span class="text-slate-400">Target:</span>
              <strong class="text-white">${sc.target || '-'}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Current RR:</span>
              <strong class="text-emerald-400 font-mono">${sc.crr || '-'}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Req RR:</span>
              <strong class="text-red-400 font-mono">${sc.rrr || '-'}</strong>
            </div>
          </div>
        </div>

        <div class="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          <div>
            <span class="text-amber-400">📍 Venue:</span> ${sc.venue || match.venue}
          </div>
          <div>
            <span class="text-emerald-400">🪙 Toss:</span> ${sc.toss || 'Toss completed'}
          </div>
        </div>
      `;
    }

    // 2. Action Buttons (Live Stream & Free OTT Highlights)
    const actionsBar = document.getElementById('scorecard-actions-bar');
    if (actionsBar) {
      actionsBar.innerHTML = `
        <div class="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300 text-xs">
          <span class="text-red-500 font-bold">● Status:</span>
          <span>${sc.status || match.status}</span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <a href="${stream.highlightsUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black shadow-md transition-all text-xs" title="Watch Free Highlights on ${stream.streamName}">
            <span>🎬</span> Watch Highlights on ${stream.streamName} (Free OTT)
          </a>
          <a href="${stream.streamUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm transition-all text-xs" title="Watch on ${stream.streamName}">
            <span>📺</span> Watch Stream (${stream.streamName})
          </a>
        </div>
      `;
    }

    // 3. Innings Tabs
    const tabsContainer = document.getElementById('scorecard-innings-tabs');
    if (tabsContainer && sc.innings && sc.innings.length > 0) {
      let tabsHtml = '';
      sc.innings.forEach((inn, idx) => {
        const isActive = idx === this.data.selectedInningsIdx;
        const activeClass = isActive 
          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 border-b-2 font-bold' 
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium';

        tabsHtml += `
          <button onclick="Cricket.setScorecardInnings(${idx})" class="py-2 px-4 text-xs whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${activeClass}">
            <span>${inn.flag}</span>
            <span>${inn.team} Innings</span>
            <span class="font-mono text-xs opacity-75">(${inn.score})</span>
          </button>
        `;
      });
      tabsContainer.innerHTML = tabsHtml;
    }

    // 4. Tables
    this.renderScorecardTables();
  },

  renderScorecardTables() {
    const match = this.data.selectedMatch;
    if (!match || !match.scorecard) return;

    const innings = match.scorecard.innings ? match.scorecard.innings[this.data.selectedInningsIdx] : null;
    const bodyEl = document.getElementById('scorecard-modal-body');
    if (!bodyEl) return;

    if (!innings) {
      bodyEl.innerHTML = `
        <div class="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
          Scorecard will be updated as the match progresses.
        </div>
      `;
      return;
    }

    // Batting Table
    let battingRows = '';
    (innings.batting || []).forEach(b => {
      battingRows += `
        <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40">
          <td class="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">
            ${b.name}
          </td>
          <td class="py-2.5 px-3 text-gray-500 dark:text-gray-400 text-xs">
            ${b.dismissal}
          </td>
          <td class="py-2.5 px-3 text-right font-bold text-gray-900 dark:text-white font-mono">
            ${b.runs}
          </td>
          <td class="py-2.5 px-3 text-right text-gray-500 dark:text-gray-400 font-mono">
            ${b.balls}
          </td>
          <td class="py-2.5 px-3 text-right text-gray-500 dark:text-gray-400 font-mono">
            ${b.fours}
          </td>
          <td class="py-2.5 px-3 text-right text-gray-500 dark:text-gray-400 font-mono">
            ${b.sixes}
          </td>
          <td class="py-2.5 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400 font-mono">
            ${b.sr}
          </td>
        </tr>
      `;
    });

    // Bowling Table
    let bowlingRows = '';
    (innings.bowling || []).forEach(bw => {
      bowlingRows += `
        <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40">
          <td class="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">
            ${bw.name}
          </td>
          <td class="py-2.5 px-3 text-right font-mono text-gray-700 dark:text-gray-300">
            ${bw.overs}
          </td>
          <td class="py-2.5 px-3 text-right font-mono text-gray-500 dark:text-gray-400">
            ${bw.maidens}
          </td>
          <td class="py-2.5 px-3 text-right font-mono text-gray-700 dark:text-gray-300">
            ${bw.runs}
          </td>
          <td class="py-2.5 px-3 text-right font-mono font-bold text-red-600 dark:text-red-400">
            ${bw.wickets}
          </td>
          <td class="py-2.5 px-3 text-right font-mono font-medium text-indigo-600 dark:text-indigo-400">
            ${bw.econ}
          </td>
        </tr>
      `;
    });

    bodyEl.innerHTML = `
      <!-- Batting Table -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
            <span>🏏</span> Batting Scorecard - ${innings.team}
          </h4>
          <span class="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
            Total: ${innings.score}
          </span>
        </div>
        <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table class="w-full text-left text-xs">
            <thead class="bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 font-semibold uppercase">
              <tr>
                <th class="py-2 px-3">Batter</th>
                <th class="py-2 px-3">Dismissal</th>
                <th class="py-2 px-3 text-right">R</th>
                <th class="py-2 px-3 text-right">B</th>
                <th class="py-2 px-3 text-right">4s</th>
                <th class="py-2 px-3 text-right">6s</th>
                <th class="py-2 px-3 text-right">SR</th>
              </tr>
            </thead>
            <tbody>
              ${battingRows}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bowling Table -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
            <span>🎯</span> Bowling Figures
          </h4>
        </div>
        <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table class="w-full text-left text-xs">
            <thead class="bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 font-semibold uppercase">
              <tr>
                <th class="py-2 px-3">Bowler</th>
                <th class="py-2 px-3 text-right">O</th>
                <th class="py-2 px-3 text-right">M</th>
                <th class="py-2 px-3 text-right">R</th>
                <th class="py-2 px-3 text-right">W</th>
                <th class="py-2 px-3 text-right">ECON</th>
              </tr>
            </thead>
            <tbody>
              ${bowlingRows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  toggleCricketCenter() {
    const center = document.getElementById('cricket-match-center');
    if (!center) return;
    center.scrollIntoView({ behavior: 'smooth' });
  },

  updateLanguage(lang) {
    const isHi = lang === 'hi';
    const liveBtn = document.getElementById('cricket-tab-live');
    const indiaBtn = document.getElementById('cricket-tab-india');
    const upcomingBtn = document.getElementById('cricket-tab-upcoming');
    const recentBtn = document.getElementById('cricket-tab-recent');

    const liveCount = this.data.matches.liveMatches.length;
    const indiaCount = (this.data.matches.indiaMenHighlights.length + this.data.matches.indiaWomenHighlights.length) || 10;
    const upCount = this.data.matches.upcomingMatches.length;
    const recCount = this.data.matches.recentMatches.length;

    if (liveBtn) {
      liveBtn.innerHTML = `<span class="w-2 h-2 rounded-full bg-white animate-ping mr-0.5"></span> ${isHi ? '🔴 लाइव मैच' : '🔴 Live Matches'} (<span id="count-live-tab">${liveCount}</span>)`;
    }
    if (indiaBtn) {
      indiaBtn.innerHTML = `<span>🇮🇳</span> ${isHi ? 'भारत मैच हाइलाइट्स' : 'India Match Highlights'} (<span id="count-india-tab">${indiaCount}</span>)`;
    }
    if (upcomingBtn) {
      upcomingBtn.innerHTML = `<span>📅</span> ${isHi ? 'आगामी मैच' : 'Upcoming'} (<span id="count-upcoming-tab">${upCount}</span>)`;
    }
    if (recentBtn) {
      recentBtn.innerHTML = `<span>🏆</span> ${isHi ? 'परिणाम' : 'Results'} (<span id="count-recent-tab">${recCount}</span>)`;
    }
    this.renderCards();
  },

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeScorecard();
    });
  }
};

window.Cricket = Cricket;
document.addEventListener('DOMContentLoaded', () => Cricket.init());
