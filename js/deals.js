/**
 * TrendPulse 360 - Automated Festive Deals & Product Launches Module
 * Features:
 * - Real-time auto-refreshing deals & gadget launches (every 2 mins)
 * - Flashing Top Festive Deals Ticker (Amazon, Flipkart, Myntra, Nykaa, Meesho, Blinkit)
 * - Filterable Platform Tabs (All, New Launches, Amazon, Flipkart, Myntra, Nykaa, Meesho, Blinkit)
 * - Direct official store CTA buttons with brand-specific themes
 * - Detailed Offer & Coupon Modal
 */

const Deals = {
  data: {
    deals: [],
    launches: [],
    sales: [],
    tickerAlerts: [],
    platformCounts: {},
    activeTab: 'all',
    selectedDeal: null,
    pollInterval: null
  },

  async init() {
    await this.loadData();
    // Auto-poll fresh deals every 2 minutes
    this.data.pollInterval = setInterval(() => this.loadData(true), 120000);
  },

  async loadData(isPolling = false) {
    try {
      const resp = await fetch('data/deals.json?v=' + Date.now());
      if (!resp.ok) return;
      const json = await resp.json();

      this.data.deals = json.allDeals || [];
      this.data.launches = json.latestProductLaunches || [];
      this.data.sales = json.megaFestiveSales || [];
      this.data.tickerAlerts = json.tickerAlerts || [];
      this.data.platformCounts = json.platformCounts || {};

      this.updateCounts();
      this.renderTicker();
      this.renderDeals();
    } catch (e) {
      console.warn("Deals data fetch notice:", e);
    }
  },

  updateCounts() {
    const totalCountEl = document.getElementById('count-deal-all');
    if (totalCountEl) totalCountEl.textContent = this.data.deals.length;

    const launchCountEl = document.getElementById('count-deal-launches');
    if (launchCountEl) launchCountEl.textContent = this.data.launches.length;

    ['amazon', 'flipkart', 'myntra', 'nykaa', 'meesho', 'blinkit'].forEach(plat => {
      const el = document.getElementById(`count-deal-${plat}`);
      if (el) el.textContent = this.data.platformCounts[plat] || 0;
    });
  },

  setTab(tabId) {
    this.data.activeTab = tabId;

    // Update active tab buttons styling
    const tabs = ['all', 'launches', 'amazon', 'flipkart', 'myntra', 'nykaa', 'meesho', 'blinkit'];
    tabs.forEach(t => {
      const btn = document.getElementById(`deal-tab-${t}`);
      if (!btn) return;
      if (t === tabId) {
        if (t === 'launches') {
          btn.className = "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap";
        } else if (t === 'amazon') {
          btn.className = "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap";
        } else if (t === 'flipkart') {
          btn.className = "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all bg-blue-600 text-white shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap";
        } else if (t === 'myntra') {
          btn.className = "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap";
        } else if (t === 'nykaa') {
          btn.className = "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap";
        } else if (t === 'meesho') {
          btn.className = "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all bg-purple-600 text-white shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap";
        } else if (t === 'blinkit') {
          btn.className = "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap";
        } else {
          btn.className = "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all bg-red-600 text-white shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap";
        }
      } else {
        btn.className = "px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap";
      }
    });

    this.renderDeals();
  },

  renderTicker() {
    const track = document.getElementById('deals-ticker-track');
    if (!track) return;

    if (!this.data.tickerAlerts.length) {
      track.innerHTML = '<span class="text-xs text-amber-200">Loading live festive sales and product launches...</span>';
      return;
    }

    let html = '';
    this.data.tickerAlerts.forEach(a => {
      html += `
        <div onclick="Deals.scrollToDeals()" class="inline-flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800/95 border border-amber-500/40 px-3 py-1 rounded-lg text-xs cursor-pointer transition-all hover:border-amber-400 shadow-sm shrink-0">
          <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${a.badgeColor}">
            ${a.badge}
          </span>
          <span class="font-bold text-slate-100 flex items-center gap-1">
            ${a.text}
          </span>
          <span class="text-amber-400 text-[11px] font-extrabold hover:underline">
            ${a.actionText}
          </span>
        </div>
      `;
    });

    track.innerHTML = html;
  },

  renderDeals() {
    const container = document.getElementById('deals-grid-container');
    if (!container) return;

    let target = [];
    const active = this.data.activeTab;

    if (active === 'all') {
      target = this.data.deals;
    } else if (active === 'launches') {
      target = this.data.launches;
    } else {
      target = this.data.deals.filter(d => d.platform === active);
    }

    if (!target.length) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12 text-slate-400">
          <div class="text-4xl mb-2">🛍️</div>
          <p class="font-semibold text-sm">No live offers currently in this section.</p>
          <button onclick="Deals.setTab('all')" class="mt-3 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all">
            View All Festive Offers (${this.data.deals.length})
          </button>
        </div>
      `;
      return;
    }

    let html = '';
    target.forEach(d => {
      const isLaunch = d.isLaunch;
      const isBlinkit = d.platform === 'blinkit';
      const isAmazon = d.platform === 'amazon';
      const isFlipkart = d.platform === 'flipkart';
      const isMyntra = d.platform === 'myntra';
      const isNykaa = d.platform === 'nykaa';
      const isMeesho = d.platform === 'meesho';

      // Brand badge styling
      let brandBadgeStyle = "bg-slate-800 text-slate-200 border-slate-700";
      let ctaStyle = "bg-indigo-600 hover:bg-indigo-500 text-white";

      if (isAmazon) {
        brandBadgeStyle = "bg-amber-500/20 text-amber-300 border-amber-500/40";
        ctaStyle = "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black shadow-md";
      } else if (isFlipkart) {
        brandBadgeStyle = "bg-blue-500/20 text-blue-300 border-blue-500/40";
        ctaStyle = "bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md";
      } else if (isMyntra) {
        brandBadgeStyle = "bg-pink-500/20 text-pink-300 border-pink-500/40";
        ctaStyle = "bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold shadow-md";
      } else if (isNykaa) {
        brandBadgeStyle = "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40";
        ctaStyle = "bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-500 hover:to-pink-400 text-white font-bold shadow-md";
      } else if (isMeesho) {
        brandBadgeStyle = "bg-purple-500/20 text-purple-300 border-purple-500/40";
        ctaStyle = "bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md";
      } else if (isBlinkit) {
        brandBadgeStyle = "bg-yellow-400/20 text-yellow-300 border-yellow-400/40";
        ctaStyle = "bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black shadow-md";
      }

      html += `
        <div class="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/70 rounded-2xl p-4 sm:p-5 shadow-lg transition-all flex flex-col justify-between group">
          
          <div>
            <!-- Top Row: Brand & Status Tag -->
            <div class="flex items-center justify-between text-xs mb-3 pb-2 border-b border-slate-700/60">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase border flex items-center gap-1 ${brandBadgeStyle}">
                <span>${d.platformIcon}</span> ${d.platformName}
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${d.tagColor || 'bg-slate-700 text-white'}">
                ${d.tag}
              </span>
            </div>

            <!-- Festival & Category Tag -->
            <div class="text-[11px] font-semibold text-amber-400 mb-1 flex items-center gap-1">
              <span>${d.festival || '🪔 Festive Special'}</span>
            </div>

            <!-- Title -->
            <h4 class="font-bold text-sm sm:text-base text-white group-hover:text-amber-300 transition-colors leading-snug">
              ${d.title}
            </h4>

            <!-- Price & Discount Highlight Box -->
            <div class="bg-slate-900/90 rounded-xl p-3 my-3 border border-slate-700/60 space-y-1">
              <div class="font-mono text-sm sm:text-base font-extrabold text-emerald-400">
                ${d.discount}
              </div>
              <div class="text-xs font-semibold text-slate-300">
                ${d.priceHighlight}
              </div>
              ${d.bankOffer ? `
                <div class="text-[10px] text-amber-300 pt-1 border-t border-slate-800 flex items-center gap-1 font-medium">
                  <span>${d.bankOffer}</span>
                </div>
              ` : ''}
            </div>

            <!-- Description -->
            <p class="text-xs text-slate-400 line-clamp-2 mb-3">
              ${d.description}
            </p>
          </div>

          <!-- Bottom Action Buttons Bar -->
          <div class="pt-3 border-t border-slate-700/60 flex items-center gap-2 text-xs">
            <a href="${d.storeUrl}" target="_blank" rel="noopener" class="flex-1 py-2 px-3 rounded-xl ${ctaStyle} text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer">
              <span>${d.platformIcon}</span> <span>${d.ctaText || 'Grab Offer'}</span>
            </a>
            <button onclick="Deals.openModal('${d.id}')" class="py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-center transition-all flex items-center justify-center gap-1 cursor-pointer" title="View Deal Details">
              <span>ℹ️</span> Details
            </button>
          </div>

        </div>
      `;
    });

    container.innerHTML = html;
  },

  openModal(dealId) {
    const deal = this.data.deals.find(d => d.id === dealId);
    if (!deal) return;

    this.data.selectedDeal = deal;
    const modal = document.getElementById('deal-details-modal');
    const content = document.getElementById('deal-modal-body');
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
        <div class="flex items-center gap-2">
          <span class="text-2xl">${deal.platformIcon}</span>
          <div>
            <h3 class="font-bold text-lg text-gray-900 dark:text-white leading-tight">${deal.platformName}</h3>
            <span class="text-xs text-amber-600 dark:text-amber-400 font-semibold">${deal.festival} • ${deal.category}</span>
          </div>
        </div>
        <span class="px-2.5 py-1 rounded-full text-xs font-black uppercase ${deal.tagColor}">
          ${deal.tag}
        </span>
      </div>

      <div class="my-4 space-y-3">
        <h4 class="font-bold text-base text-gray-900 dark:text-white">
          ${deal.title}
        </h4>

        <div class="bg-gray-100 dark:bg-gray-800/90 rounded-2xl p-4 space-y-2 border border-gray-200 dark:border-gray-700">
          <div class="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ${deal.discount}
          </div>
          <div class="text-sm font-bold text-gray-800 dark:text-gray-200">
            ${deal.priceHighlight}
          </div>
          ${deal.bankOffer ? `
            <div class="text-xs text-amber-700 dark:text-amber-300 pt-2 border-t border-gray-200 dark:border-gray-700 font-semibold">
              ${deal.bankOffer}
            </div>
          ` : ''}
        </div>

        <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          ${deal.description}
        </p>

        <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-800">
          <span>Validity: <strong>${deal.validTill || 'Limited Period Festive Offer'}</strong></span>
          <span>Official Store: <strong>${deal.platformName}</strong></span>
        </div>
      </div>

      <div class="pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3">
        <a href="${deal.storeUrl}" target="_blank" rel="noopener" class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-center text-sm shadow-md transition-all flex items-center justify-center gap-2">
          <span>${deal.platformIcon}</span> <span>${deal.ctaText}</span> →
        </a>
        <button onclick="Deals.closeModal()" class="py-2.5 px-4 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs transition-all">
          Close
        </button>
      </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    const modal = document.getElementById('deal-details-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }
    this.data.selectedDeal = null;
  },

  scrollToDeals() {
    const el = document.getElementById('festive-deals-hub');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
};

window.Deals = Deals;
document.addEventListener('DOMContentLoaded', () => Deals.init());
