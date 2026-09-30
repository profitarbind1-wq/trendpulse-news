# -*- coding: utf-8 -*-
"""
===================================================================
TrendPulse 360 - Unified Telegram & WhatsApp Channel Auto-Poster
===================================================================
Automatically takes top breaking news from data/news.json, formats
viral message cards with emojis and direct website links, and posts
to Telegram Channel and WhatsApp Webhook/Bridge without duplicates.
===================================================================
"""

import os
import sys
import json
import urllib.request
import urllib.parse

# Ensure stdout handles UTF-8
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
POSTED_LOG_FILE = os.path.join(DATA_DIR, 'posted_articles.json')
CONFIG_FILE = os.path.join(DATA_DIR, 'social_config.json')

# Default Social Settings (can be edited by user in data/social_config.json)
DEFAULT_CONFIG = {
    "telegram": {
        "enabled": False,
        "bot_token": "YOUR_TELEGRAM_BOT_TOKEN_HERE",
        "channel_username": "@YourTelegramChannel"
    },
    "whatsapp_webhook": {
        "enabled": False,
        "webhook_url": "YOUR_MAKE_OR_PABBLY_WEBHOOK_URL_HERE"
    },
    "website_url": "https://trendpulse-live.web.app",
    "whatsapp_channel_url": "https://whatsapp.com/channel/0029Vb9ILQT6RGJFRiIuu80T",
    "max_posts_per_run": 2
}

def load_config():
    if not os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(DEFAULT_CONFIG, f, indent=2)
        return DEFAULT_CONFIG
    try:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return DEFAULT_CONFIG

def load_posted_ids():
    if not os.path.exists(POSTED_LOG_FILE):
        return []
    try:
        with open(POSTED_LOG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def save_posted_ids(posted_ids):
    # Keep only the last 500 posted IDs to prevent file growing indefinitely
    posted_ids = posted_ids[-500:]
    with open(POSTED_LOG_FILE, 'w', encoding='utf-8') as f:
        json.dump(posted_ids, f, indent=2)

def format_viral_message(article, config):
    site_url = config.get("website_url", "https://trendpulse-live.web.app")
    wa_url = config.get("whatsapp_channel_url", "https://whatsapp.com/channel/0029Vb9ILQT6RGJFRiIuu80T")
    article_link = f"{site_url}/#news={article['id']}"

    bullets_text = ""
    for b in article.get("bullets", [])[:2]:
        bullets_text += f"\n✔ {b}"

    message = (
        f"⚡ *BREAKING NEWS* | {article.get('categoryName', 'Trending').upper()}\n\n"
        f"🔥 *{article['title']}*\n\n"
        f"📝 {article['summary']}\n"
        f"{bullets_text}\n\n"
        f"🌐 *पूरी खबर 60 सेकंड में यहाँ पढ़ें:*\n"
        f"👉 {article_link}\n\n"
        f"📢 *Join WhatsApp Channel:* {wa_url}"
    )
    return message

def post_to_telegram(article, config):
    tg = config.get("telegram", {})
    if not tg.get("enabled"):
        return False
    bot_token = tg.get("bot_token")
    channel = tg.get("channel_username")
    if not bot_token or bot_token == "YOUR_TELEGRAM_BOT_TOKEN_HERE":
        return False

    message_text = format_viral_message(article, config)
    image_url = article.get("image")

    try:
        if image_url:
            # Send photo with caption
            endpoint = f"https://api.telegram.org/bot{bot_token}/sendPhoto"
            payload = {
                "chat_id": channel,
                "photo": image_url,
                "caption": message_text,
                "parse_mode": "Markdown"
            }
        else:
            # Send text message
            endpoint = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            payload = {
                "chat_id": channel,
                "text": message_text,
                "parse_mode": "Markdown"
            }

        data = urllib.parse.urlencode(payload).encode('utf-8')
        req = urllib.request.Request(endpoint, data=data, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            if res.get("ok"):
                print(f"  [Telegram OK] Posted: {article['title'][:40]}...")
                return True
    except Exception as e:
        print(f"  [Telegram Error] {e}")
    return False

def post_to_webhook(article, config):
    wh = config.get("whatsapp_webhook", {})
    if not wh.get("enabled"):
        return False
    webhook_url = wh.get("webhook_url")
    if not webhook_url or "YOUR_" in webhook_url:
        return False

    message_text = format_viral_message(article, config)
    payload = {
        "title": article['title'],
        "category": article.get('categoryName', 'Trending'),
        "summary": article['summary'],
        "image": article.get('image'),
        "source": article.get('source'),
        "url": f"{config.get('website_url')}/#news={article['id']}",
        "whatsapp_formatted_text": message_text
    }

    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            webhook_url,
            data=data,
            headers={"Content-Type": "application/json", "User-Agent": "TrendPulse-AutoPoster"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"  [WhatsApp Webhook OK] Sent: {article['title'][:40]}...")
            return True
    except Exception as e:
        print(f"  [WhatsApp Webhook Error] {e}")
    return False

def run_autoposter():
    print("=" * 60)
    print("  TrendPulse 360 - Social Auto-Poster Running...")
    print("=" * 60)

    config = load_config()
    news_file = os.path.join(DATA_DIR, 'news.json')
    if not os.path.exists(news_file):
        print("  [ERROR] data/news.json not found. Run auto_updater.py first.")
        return

    with open(news_file, 'r', encoding='utf-8') as f:
        news_data = json.load(f)

    articles = news_data.get("articles", [])
    if not articles:
        print("  No articles found in data/news.json.")
        return

    posted_ids = load_posted_ids()
    max_posts = config.get("max_posts_per_run", 2)
    posted_count = 0

    print(f"  Total articles: {len(articles)} | Already posted: {len(posted_ids)}")

    for article in articles:
        art_id = article["id"]
        if art_id in posted_ids:
            continue

        print(f"\n-> Formatting & Posting: {article['title'][:55]}...")
        # Post to Telegram
        tg_ok = post_to_telegram(article, config)
        # Post to WhatsApp Webhook
        wh_ok = post_to_webhook(article, config)

        # Print preview to console
        preview = format_viral_message(article, config)
        print("\n--- [VIRAL MESSAGE PREVIEW] ---")
        print(preview)
        print("-------------------------------\n")

        posted_ids.append(art_id)
        posted_count += 1

        if posted_count >= max_posts:
            break

    save_posted_ids(posted_ids)
    print("=" * 60)
    print(f"  Social Auto-Poster Completed! (Posted: {posted_count})")
    print("=" * 60)

if __name__ == "__main__":
    run_autoposter()
