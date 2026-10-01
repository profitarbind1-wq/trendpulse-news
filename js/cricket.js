/**
 * TrendPulse 360 - Cricket Live Score & Match Center Module
 * Features:
 * - Real-time auto-refreshing scores (every 60s)
 * - Beautiful top cricket marquee ticker with India Match highlights alerts
 * - Dedicated Team India Highlights Hub (India Men Last 5 & India Women Last 5 matches)
 * - Direct official OTT free streaming links (JioCinema / Disney+ Hotstar / SonyLIV / BCCI) - Zero YouTube!
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
    activeTab: 'india', // 'india' (default), 'live', 'upcoming', 'recent'
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
      const indiaBadge = document.getElementById('count-india-tab');
      if (indiaBadge) {
        const totalHl = (this.data.matches.indiaMenHighlights.length + this.data.matches.indiaWomenHighlights.length) || this.data.matches.teamIndiaMatches.length;
        indiaBadge.textContent = totalHl;
      }

      const liveBadge = document.getElementById('count-live-tab');
      if (liveBadge) liveBadge.textContent = this.data.matches.liveMatches.length;

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
    ['india', 'live', 'upcoming', 'recent'].forEach(t => {
      const btn = document.getElementById(`cricket-tab-${t}`);
      if (!btn) return;
      if (t === tabName) {
        if (t === 'india') {
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

    // Prominent India Match Highlights Lead Badge in Ticker
    const leadIndiaMatch = (this.data.matches.indiaMenHighlights && this.data.matches.indiaMenHighlights[0]) || allTickerMatches.find(m => m.id === 'ind-wi-2nd-odi');
    if (leadIndiaMatch) {
      html += `
        <div onclick="Cricket.openIndiaHighlights('men')" class="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-600/20 border border-amber-500/60 px-3 py-1 rounded-lg text-xs cursor-pointer transition-all hover:border-amber-400 shadow-md shrink-0">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500 text-slate-950 animate-pulse">
            🎬 India Match Highlights
          </span>
          <span class="font-extrabold flex items-center gap-1 text-white">
            <span>🇮🇳</span> IND 324/5 vs <span>🌴</span> WI 217 (Ind won by 107r)
          </span>
          <span class="text-amber-300 text-[11px] font-bold hover:underline flex items-center gap-1">
            Free Stream on JioCinema →
          </span>
        </div>
      `;
    }

    if (!allTickerMatches.length && !leadIndiaMatch) {
      tickerTrack.innerHTML = '<span class="text-xs text-slate-400">No scheduled cricket matches today.</span>';
      return;
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

    if (isIndiaTab) {
      if (this.data.activeIndiaSubTab === 'men') {
        targetMatches = this.data.matches.indiaMenHighlights || [];
      } else if (this.data.activeIndiaSubTab === 'women') {
        targetMatches = this.data.matches.indiaWomenHighlights || [];
      } else {
        targetMatches = this.data.matches.teamIndiaMatches || [];
      }
    } else if (this.data.activeTab === 'live') {
      targetMatches = this.data.matches.liveMatches;
    } else if (this.data.activeTab === 'upcoming') {
      targetMatches = this.data.matches.upcomingMatches;
    } else {
      targetMatches = this.data.matches.recentMatches;
    }

    let cardsHtml = '';

    // Team India Special Header & Sub-Navigation
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
        ? 'JioCinema / SonyLIV / BCCI.tv पर टीम इंडिया मेन्स के पिछले 5 मैचों के 100% फ्री हाइलाइट्स व फुल स्कोरकार्ड।'
        : (activeSub === 'women'
            ? 'JioCinema / Disney+ Hotstar पर टीम इंडिया विमेंस के पिछले 5 ऐतिहासिक मैचों (300 Chase, T20 WC) के फ्री हाइलाइट्स।'
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
              <span>🆓</span> 100% Free Highlights on JioCinema / Hotstar / SonyLIV (No Login Needed)
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
                    Free OTT Stream
                  </span>
                </h4>
                <p class="text-slate-300 mt-0.5">
                  ${subBannerDesc}
                </p>
              </div>
            </div>
            
            <div class="flex items-center gap-2 self-stretch sm:self-auto">
              <a href="https://www.jiocinema.com/sports/cricket" target="_blank" rel="noopener" class="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-black shadow-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer" title="Open JioCinema Sports Cricket Hub">
                <span>📺</span> JioCinema Cricket
              </a>
              <a href="https://www.bcci.tv/videos/highlights" target="_blank" rel="noopener" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer" title="Official 1080p Extended Highlights">
                <span>🏛️</span> BCCI.tv
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
          <button onclick="Cricket.openIndiaHighlights('men')" class="mt-3 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all">
            View Team India Highlights (5 Matches)
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
      const borderStyle = isInd ? 'border-amber-500/60 shadow-amber-500/10' : 'border-slate-700/80';

      // Stream & Highlights Info (Direct OTT streaming partner)
      const stream = m.stream || { streamName: 'JioCinema Sports', highlightsUrl: 'https://www.jiocinema.com/sports/cricket', streamUrl: 'https://www.jiocinema.com/sports/cricket' };
      const ottHighlightBtnLabel = `🎬 India Match Highlights`;

      cardsHtml += `
        <div class="bg-slate-800/90 hover:bg-slate-800 border ${borderStyle} rounded-2xl p-4 sm:p-5 shadow-lg transition-all hover:border-indigo-500/80 flex flex-col justify-between group">
          
          <!-- Top Row: Series & State Badge -->
          <div>
            <div class="flex items-center justify-between text-xs mb-3 pb-2 border-b border-slate-700/60">
              <span class="font-semibold text-slate-300 truncate max-w-[65%]" title="${m.series}">
                ${isInd ? '<span class="text-amber-400 font-bold mr-1">🇮🇳</span>' : ''}${m.series} • <strong class="text-indigo-400">${m.matchFormat}</strong>
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${badgeStyle}">
                ${badgeLabel}
              </span>
            </div>

            <!-- Teams & Scores -->
            <div class="space-y-3 my-2">
              <!-- Team 1 -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">${t1.flag}</span>
                  <div>
                    <h4 class="font-bold text-sm text-white flex items-center gap-1">
                      ${t1.name}
                      ${t1.shortName.includes('IND') ? '<span class="text-amber-400 text-xs">★</span>' : ''}
                    </h4>
                    <span class="text-[10px] text-slate-400">${m.date || m.matchDesc}</span>
                  </div>
                </div>
                <div class="text-right">
                  <span class="font-mono text-base font-extrabold text-amber-400">${t1_s}</span>
                </div>
              </div>

              <!-- Team 2 -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">${t2.flag}</span>
                  <div>
                    <h4 class="font-bold text-sm text-white flex items-center gap-1">
                      ${t2.name}
                      ${t2.shortName.includes('IND') ? '<span class="text-amber-400 text-xs">★</span>' : ''}
                    </h4>
                    <span class="text-[10px] text-slate-400">${m.venue}</span>
                  </div>
                </div>
                <div class="text-right">
                  <span class="font-mono text-base font-extrabold text-amber-400">${t2_s}</span>
                </div>
              </div>
            </div>

            <!-- Key Highlights / Status Badge -->
            <div class="bg-slate-900/80 rounded-xl p-2.5 my-3 border border-slate-700/50 text-xs space-y-1">
              <div class="flex items-start gap-1.5 text-slate-200 font-medium">
                <span class="text-amber-400">🏆</span>
                <span class="leading-snug">${m.status || m.startTime}</span>
              </div>
              ${m.keyHighlights ? `
                <div class="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex items-center gap-1">
                  <span>🌟</span> <span class="truncate">${m.keyHighlights}</span>
                </div>
              ` : ''}
              <div class="text-[10px] text-emerald-400 pt-0.5 flex items-center gap-1 font-semibold">
                <span>📡</span> Stream: <strong>${stream.streamName}</strong> (Free Highlights)
              </div>
            </div>
          </div>

          <!-- Action Buttons Bar: Scorecard, Live Stream, Highlights -->
          <div class="pt-3 border-t border-slate-700/60 flex flex-wrap items-center gap-2 text-xs">
            <button onclick="Cricket.openScorecard('${m.id}')" class="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-center shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-[110px]">
              <span>📊</span> Scorecard
            </button>
            
            <a href="${stream.highlightsUrl}" target="_blank" rel="noopener" class="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black shadow-md text-center transition-all flex items-center justify-center gap-1 cursor-pointer min-w-[160px]" title="Watch Free Highlights on ${stream.streamName}">
              <span>🎬</span> ${ottHighlightBtnLabel}
            </a>

            <a href="${stream.streamUrl}" target="_blank" rel="noopener" class="py-2 px-3 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-bold text-center transition-all flex items-center justify-center gap-1 cursor-pointer" title="Watch Live/Replay on ${stream.streamName}">
              <span>📺</span> <span class="hidden sm:inline">Stream</span>
            </a>
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
    const stream = match.stream || { streamName: 'JioCinema Sports', highlightsUrl: 'https://www.jiocinema.com/sports/cricket', streamUrl: 'https://www.jiocinema.com/sports/cricket' };
    const isInd = match.isIndiaMatch;

    // 1. Header
    const headerEl = document.getElementById('scorecard-modal-header');
    if (headerEl) {
      headerEl.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span class="text-xs uppercase tracking-wider text-indigo-300 font-semibold flex items-center gap-1.5">
              ${isInd ? '<span>🇮🇳</span>' : ''}${match.series} • ${match.matchDesc || ''} (${match.matchFormat})
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
          <a href="${stream.streamUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm transition-all text-xs" title="Watch on ${stream.streamName}">
            <span>📺</span> Watch Stream (${stream.streamName})
          </a>
          ${stream.bcciUrl ? `
            <a href="${stream.bcciUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-all text-xs" title="Watch on BCCI Official">
              <span>🏛️</span> BCCI Official
            </a>
          ` : ''}
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

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeScorecard();
    });
  }
};

window.Cricket = Cricket;
document.addEventListener('DOMContentLoaded', () => Cricket.init());
