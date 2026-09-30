# -*- coding: utf-8 -*-
"""
===================================================================
TrendPulse 360 - 1-Click WhatsApp Channel Dispatcher
===================================================================
Picks the latest top breaking news, formats a viral post, and
opens WhatsApp Web / WhatsApp Desktop directly ready to send
to your WhatsApp Channel without any ban risk.
===================================================================
"""

import os
import sys
import json
import urllib.parse
import webbrowser

# Ensure stdout handles UTF-8
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
NEWS_FILE = os.path.join(BASE_DIR, 'data', 'news.json')
CHANNEL_URL = "https://whatsapp.com/channel/0029Vb9ILQT6RGJFRiIuu80T"
SITE_URL = "https://trendpulse-live.web.app"

def get_latest_viral_post():
    if not os.path.exists(NEWS_FILE):
        print("[ERROR] data/news.json not found. Run auto_updater.py first.")
        return None

    with open(NEWS_FILE, 'r', encoding='utf-8') as f:
        news_data = json.load(f)

    articles = news_data.get("articles", [])
    if not articles:
        print("[ERROR] No articles found.")
        return None

    top = articles[0]
    article_link = f"{SITE_URL}/#news={top['id']}"

    bullets_text = ""
    for b in top.get("bullets", [])[:2]:
        bullets_text += f"\n✔ {b}"

    message = (
        f"⚡ *BREAKING NEWS* | {top.get('categoryName', 'Trending').upper()}\n\n"
        f"🔥 *{top['title']}*\n\n"
        f"📝 {top['summary']}\n"
        f"{bullets_text}\n\n"
        f"🌐 *पूरी खबर 60 सेकंड में यहाँ पढ़ें:*\n"
        f"👉 {article_link}\n\n"
        f"📢 *TrendPulse Official Channel:* {CHANNEL_URL}"
    )
    return message

def dispatch_to_whatsapp():
    msg = get_latest_viral_post()
    if not msg:
        return

    print("=" * 60)
    print("  TrendPulse 360 - Ready to Post to WhatsApp Channel")
    print("=" * 60)
    print(msg)
    print("=" * 60)

    encoded = urllib.parse.quote(msg)
    wa_url = f"https://web.whatsapp.com/send?text={encoded}"
    
    print("\n🚀 Opening WhatsApp Web in your browser...")
    webbrowser.open(wa_url)
    print("👉 Just select your channel 'TrendPulse 360 News' and press Send!")

if __name__ == "__main__":
    dispatch_to_whatsapp()
