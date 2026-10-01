/**
 * TrendPulse 360 - Interactive Fan Poll & Opinion Meter
 * Supports: Live voting, percentage calculation, localStorage persistence,
 * switching between Cricket and Market polls, and WhatsApp sharing.
 */

const Poll = {
  activePollId: 'cricket',

  polls: {
    cricket: {
      id: 'cricket',
      badge: 'Cricket Fan Poll',
      questionEn: '🏏 IND vs WI: Who will win today\'s cricket match?',
      questionHi: '🏏 IND vs WI: आज का क्रिकेट मैच कौन जीतेगा?',
      options: [
        { labelEn: '🇮🇳 Team India', labelHi: '🇮🇳 टीम इंडिया (Team India)', votes: 1640 },
        { labelEn: '🌴 West Indies', labelHi: '🌴 वेस्ट इंडीज (West Indies)', votes: 290 }
      ]
    },
    market: {
      id: 'market',
      badge: 'Market & Economy Poll',
      questionEn: '📈 Will Sensex & NIFTY hit record highs this month?',
      questionHi: '📈 क्या शेयर बाज़ार इस महीने नया ऑल-टाइम रिकॉर्ड बनाएगा?',
      options: [
        { labelEn: '🚀 Yes, Strong Bull Rally', labelHi: '🚀 हाँ, रिकॉर्ड तेजी आएगी', votes: 1320 },
        { labelEn: '⚠️ No, Correction ahead', labelHi: '⚠️ नहीं, गिरावट हो सकती है', votes: 410 }
      ]
    }
  },

  init() {
    this.render();
  },

  switchPoll(pollId) {
    if (!this.polls[pollId]) return;
    this.activePollId = pollId;

    // Update Tab Styles
    const cricketTab = document.getElementById('poll-tab-cricket');
    const marketTab = document.getElementById('poll-tab-market');
    if (cricketTab && marketTab) {
      if (pollId === 'cricket') {
        cricketTab.className = 'px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold transition-all';
        marketTab.className = 'px-3 py-1 rounded-lg text-slate-300 hover:text-white transition-all';
      } else {
        marketTab.className = 'px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold transition-all';
        cricketTab.className = 'px-3 py-1 rounded-lg text-slate-300 hover:text-white transition-all';
      }
    }

    this.render();
  },

  getVotedChoice(pollId) {
    const saved = localStorage.getItem(`tp_poll_${pollId}`);
    return saved !== null ? parseInt(saved, 10) : null;
  },

  vote(optionIndex) {
    const voted = this.getVotedChoice(this.activePollId);
    if (voted !== null) return; // Already voted

    localStorage.setItem(`tp_poll_${this.activePollId}`, optionIndex.toString());
    const poll = this.polls[this.activePollId];
    poll.options[optionIndex].votes += 1;

    this.render();
  },

  render() {
    const poll = this.polls[this.activePollId];
    if (!poll) return;

    const currentLang = (window.App && window.App.data && window.App.data.currentLang) || 'en';
    const isHi = currentLang === 'hi';

    const titleEl = document.getElementById('poll-title-text');
    const badgeEl = document.getElementById('poll-category-badge');
    const totalVotesEl = document.getElementById('poll-total-votes');
    const container = document.getElementById('poll-options-container');

    if (titleEl) {
      titleEl.textContent = isHi ? poll.questionHi : poll.questionEn;
    }
    if (badgeEl) {
      badgeEl.textContent = poll.badge;
    }

    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
    if (totalVotesEl) {
      totalVotesEl.textContent = totalVotes.toLocaleString('en-IN');
    }

    if (!container) return;

    const userVote = this.getVotedChoice(this.activePollId);
    const hasVoted = userVote !== null;

    let html = '';
    poll.options.forEach((opt, idx) => {
      const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 50;
      const isSelected = userVote === idx;
      const label = isHi ? opt.labelHi : opt.labelEn;

      if (!hasVoted) {
        // Clickable Option Card (Before voting)
        html += `
          <button 
            onclick="Poll.vote(${idx})" 
            class="group relative overflow-hidden p-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/90 hover:border-amber-400 text-left transition-all duration-200 hover:scale-[1.01] shadow-md flex items-center justify-between cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <span class="w-7 h-7 rounded-full bg-slate-700 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center text-xs font-bold text-slate-300 transition-colors">
                ${String.fromCharCode(65 + idx)}
              </span>
              <span class="font-bold text-sm sm:text-base text-white group-hover:text-amber-300 transition-colors">
                ${label}
              </span>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded bg-slate-700/60 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-300 transition-all">
              ${isHi ? 'वोट दें ➔' : 'Vote ➔'}
            </span>
          </button>
        `;
      } else {
        // Result Display Card (After voting)
        const barGradient = isSelected 
          ? 'from-amber-500 to-orange-500' 
          : 'from-slate-600 to-slate-700';
        
        html += `
          <div class="relative overflow-hidden p-4 rounded-xl border ${isSelected ? 'border-amber-400 bg-slate-800' : 'border-slate-800 bg-slate-850/80'} shadow-md">
            <!-- Animated Progress Fill -->
            <div 
              class="absolute left-0 top-0 bottom-0 bg-gradient-to-r ${barGradient} opacity-20 transition-all duration-1000 ease-out"
              style="width: ${percentage}%;"
            ></div>

            <div class="relative flex items-center justify-between z-10">
              <div class="flex items-center gap-2.5">
                <span class="font-bold text-sm sm:text-base text-white flex items-center gap-1.5">
                  ${label}
                  ${isSelected ? `<span class="text-xs text-amber-400 font-extrabold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">✓ ${isHi ? 'आपका वोट' : 'Your Vote'}</span>` : ''}
                </span>
              </div>
              <div class="text-right">
                <span class="text-base sm:text-lg font-black ${isSelected ? 'text-amber-400' : 'text-slate-300'} font-mono">
                  ${percentage}%
                </span>
                <span class="block text-[10px] text-slate-400">
                  ${opt.votes.toLocaleString('en-IN')} votes
                </span>
              </div>
            </div>

            <!-- Mini Progress Line -->
            <div class="w-full bg-slate-700/50 h-1.5 rounded-full mt-2 overflow-hidden">
              <div class="bg-gradient-to-r ${barGradient} h-full rounded-full transition-all duration-1000" style="width: ${percentage}%;"></div>
            </div>
          </div>
        `;
      }
    });

    container.innerHTML = html;
  },

  sharePoll() {
    const poll = this.polls[this.activePollId];
    const isHi = (window.App && window.App.data && window.App.data.currentLang) === 'hi';
    const question = isHi ? poll.questionHi : poll.questionEn;
    const url = window.location.origin;

    const text = encodeURIComponent(`🗳️ *Live Fan Poll | जनता की राय*\n\n${question}\n\n👉 अपनी राय यहाँ दें और लाइव रिज़ल्ट देखें:\n${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  }
};

window.Poll = Poll;
document.addEventListener('DOMContentLoaded', () => {
  Poll.init();
});
