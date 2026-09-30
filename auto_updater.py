# -*- coding: utf-8 -*-
"""
===================================================================
TrendPulse 360 - Automated News Ingestion & SEO Generator
===================================================================
Fetches worldwide trending news across all key categories from
Google News RSS and other top global feeds, formats articles with
smart summaries, generates data/news.json, sitemap.xml, and rss.xml.
Zero paid APIs needed. 100% Free & Automated.
===================================================================
"""

import os
import sys
import json
import re
import html
import datetime
from datetime import timezone
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET

# Ensure stdout handles UTF-8
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
os.makedirs(DATA_DIR, exist_ok=True)

# Domain URL for SEO sitemaps (can be updated to custom domain or firebaseapp.com)
SITE_URL = "https://trendpulse-news-14886.web.app"
SITE_NAME = "TrendPulse 360 - Worldwide Trending News"

CATEGORIES = [
    {
        "id": "trending",
        "name": "Trending Now",
        "icon": "🔥",
        "color": "from-red-500 to-amber-500",
        "url": "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"
    },
    {
        "id": "world",
        "name": "Worldwide",
        "icon": "🌍",
        "color": "from-blue-600 to-indigo-600",
        "url": "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en"
    },
    {
        "id": "politics",
        "name": "Politics",
        "icon": "🏛️",
        "color": "from-purple-600 to-pink-600",
        "url": "https://news.google.com/rss/headlines/section/topic/POLITICS?hl=en-US&gl=US&ceid=US:en"
    },
    {
        "id": "business",
        "name": "Business & Startups",
        "icon": "💼",
        "color": "from-emerald-600 to-teal-600",
        "url": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en"
    },
    {
        "id": "share-market",
        "name": "Share Market & Crypto",
        "icon": "📈",
        "color": "from-green-500 to-emerald-700",
        "url": "https://news.google.com/rss/search?q=stock+market+shares+nifty+sensex+crypto+investing&hl=en-US&gl=US&ceid=US:en"
    },
    {
        "id": "finance",
        "name": "Finance & Wealth",
        "icon": "💰",
        "color": "from-amber-600 to-yellow-500",
        "url": "https://news.google.com/rss/search?q=personal+finance+banking+tax+wealth+economy&hl=en-US&gl=US&ceid=US:en"
    },
    {
        "id": "entertainment",
        "name": "Entertainment",
        "icon": "🎬",
        "color": "from-rose-500 to-orange-400",
        "url": "https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-US&gl=US&ceid=US:en"
    },
    {
        "id": "sports",
        "name": "Sports",
        "icon": "⚽",
        "color": "from-cyan-500 to-blue-600",
        "url": "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-US&gl=US&ceid=US:en"
    },
    {
        "id": "tech",
        "name": "Tech & AI",
        "icon": "🤖",
        "color": "from-violet-600 to-cyan-500",
        "url": "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en"
    },
    {
        "id": "education",
        "name": "Education & Exams",
        "icon": "🎓",
        "color": "from-teal-500 to-emerald-600",
        "url": "https://news.google.com/rss/search?q=education+exam+results+admit+card+upsc+scholarship&hl=en-IN&gl=IN&ceid=IN:en"
    },
    {
        "id": "competition",
        "name": "Competition & Jobs",
        "icon": "🏆",
        "color": "from-indigo-500 to-purple-600",
        "url": "https://news.google.com/rss/search?q=competitive+exams+government+jobs+recruitment&hl=en-IN&gl=IN&ceid=IN:en"
    },
    {
        "id": "motivational",
        "name": "Motivational Stories",
        "icon": "💡",
        "color": "from-amber-500 to-rose-500",
        "url": "https://news.google.com/rss/search?q=inspiring+success+story+achiever+motivation&hl=en-IN&gl=IN&ceid=IN:en"
    }
]

# Curated high-resolution fallback photos for each category (Unsplash royalty-free CDN)
CATEGORY_IMAGES = {
    "trending": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&auto=format&fit=crop&q=80",
    "world": "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=900&auto=format&fit=crop&q=80",
    "politics": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=900&auto=format&fit=crop&q=80",
    "business": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&auto=format&fit=crop&q=80",
    "share-market": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&auto=format&fit=crop&q=80",
    "finance": "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=900&auto=format&fit=crop&q=80",
    "entertainment": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&auto=format&fit=crop&q=80",
    "sports": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&auto=format&fit=crop&q=80",
    "tech": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=900&auto=format&fit=crop&q=80",
    "education": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900&auto=format&fit=crop&q=80",
    "competition": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&auto=format&fit=crop&q=80",
    "motivational": "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=900&auto=format&fit=crop&q=80"
}

def clean_html(raw_html):
    """Strips HTML tags and unescapes entities."""
    if not raw_html:
        return ""
    clean = re.sub(r'<.*?>', '', raw_html)
    return html.unescape(clean).strip()

def slugify(text):
    """Generates SEO-friendly URL slug from title."""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')[:80]

def parse_source_and_title(raw_title):
    """Splits 'Article Title - Source Name' into headline and publisher."""
    parts = raw_title.rsplit(' - ', 1)
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()
    return raw_title.strip(), "World News Wire"

def fetch_rss_feed(category):
    """Fetches and parses a single RSS feed."""
    url = category["url"]
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    articles = []
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = resp.read()
        root = ET.fromstring(data)
        items = root.findall('.//item')

        for idx, item in enumerate(items[:15]):  # Top 15 per category
            title_node = item.find('title')
            link_node = item.find('link')
            pub_date_node = item.find('pubDate')
            desc_node = item.find('description')
            guid_node = item.find('guid')

            if title_node is None or not title_node.text:
                continue

            raw_title = title_node.text.strip()
            title, source = parse_source_and_title(raw_title)

            link = link_node.text.strip() if link_node is not None and link_node.text else "#"
            pub_date = pub_date_node.text.strip() if pub_date_node is not None and pub_date_node.text else datetime.datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")
            raw_desc = desc_node.text if desc_node is not None and desc_node.text else ""
            clean_desc = clean_html(raw_desc)
            if not clean_desc or len(clean_desc) < 20:
                clean_desc = f"{title}. Full coverage and key insights reported by {source} on the latest developments in {category['name']}."

            article_id = f"{category['id']}-{idx}-{abs(hash(title)) % 1000000}"
            slug = slugify(title)

            # Quick summary bullet points (Inshorts style)
            bullets = [
                f"Breaking update from {source} regarding {category['name']}.",
                f"Headline: {title}",
                "Follow verified global sources for developing updates."
            ]

            # Trending engagement score (simulated realistic ranking metric)
            score = max(75, 99 - (idx * 2))

            articles.append({
                "id": article_id,
                "title": title,
                "source": source,
                "category": category["id"],
                "categoryName": category["name"],
                "categoryIcon": category["icon"],
                "categoryColor": category["color"],
                "url": link,
                "publishedAt": pub_date,
                "summary": clean_desc,
                "bullets": bullets,
                "readTime": "1 min read",
                "trendingScore": score,
                "slug": slug,
                "image": CATEGORY_IMAGES.get(category["id"], CATEGORY_IMAGES["trending"])
            })

    except Exception as e:
        print(f"  [WARN] Failed to fetch {category['name']}: {e}")

    return articles

def generate_sitemap(all_articles):
    """Generates Google News XML Sitemap."""
    now_iso = datetime.datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    xml = ['<?xml version="1.0" encoding="UTF-8"?>']
    xml.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
    xml.append('        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">')
    
    # Homepage
    xml.append('  <url>')
    xml.append(f'    <loc>{SITE_URL}/</loc>')
    xml.append(f'    <lastmod>{now_iso}</lastmod>')
    xml.append('    <changefreq>always</changefreq>')
    xml.append('    <priority>1.0</priority>')
    xml.append('  </url>')

    # Category URLs
    for cat in CATEGORIES:
        xml.append('  <url>')
        xml.append(f'    <loc>{SITE_URL}/#category={cat["id"]}</loc>')
        xml.append(f'    <lastmod>{now_iso}</lastmod>')
        xml.append('    <changefreq>hourly</changefreq>')
        xml.append('    <priority>0.8</priority>')
        xml.append('  </url>')

    # Top Articles for Google News Sitemap
    for art in all_articles[:60]:
        pub_iso = now_iso
        try:
            dt = datetime.datetime.strptime(art["publishedAt"][:25].strip(), "%a, %d %b %Y %H:%M:%S")
            pub_iso = dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        except Exception:
            pass

        escaped_title = html.escape(art["title"])
        escaped_source = html.escape(art["source"])

        xml.append('  <url>')
        xml.append(f'    <loc>{SITE_URL}/#news={art["id"]}</loc>')
        xml.append('    <news:news>')
        xml.append('      <news:publication>')
        xml.append(f'        <news:name>{escaped_source}</news:name>')
        xml.append('        <news:language>en</news:language>')
        xml.append('      </news:publication>')
        xml.append(f'      <news:publication_date>{pub_iso}</news:publication_date>')
        xml.append(f'      <news:title>{escaped_title}</news:title>')
        xml.append('    </news:news>')
        xml.append('  </url>')

    xml.append('</urlset>')
    sitemap_path = os.path.join(BASE_DIR, 'sitemap.xml')
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(xml))
    print(f"-> Generated sitemap.xml ({len(all_articles)} items)")

def generate_robots_txt():
    """Generates robots.txt optimized for Googlebot and SEO."""
    content = f"""User-agent: *
Allow: /
Sitemap: {SITE_URL}/sitemap.xml

User-agent: Googlebot
Allow: /

User-agent: Googlebot-News
Allow: /

User-agent: Bingbot
Allow: /
"""
    robots_path = os.path.join(BASE_DIR, 'robots.txt')
    with open(robots_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("-> Generated robots.txt")

def generate_rss_xml(all_articles):
    """Generates an RSS feed for syndication."""
    now_rfc = datetime.datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")
    xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0">',
        '  <channel>',
        f'    <title>{html.escape(SITE_NAME)}</title>',
        f'    <link>{SITE_URL}</link>',
        '    <description>Worldwide Real-Time Trending News Briefs across all categories.</description>',
        '    <language>en</language>',
        f'    <lastBuildDate>{now_rfc}</lastBuildDate>'
    ]

    for art in all_articles[:40]:
        xml.append('    <item>')
        xml.append(f'      <title>{html.escape(art["title"])}</title>')
        xml.append(f'      <link>{html.escape(art["url"])}</link>')
        xml.append(f'      <description>{html.escape(art["summary"])}</description>')
        xml.append(f'      <category>{html.escape(art["categoryName"])}</category>')
        xml.append(f'      <pubDate>{art["publishedAt"]}</pubDate>')
        xml.append(f'      <guid isPermaLink="false">{art["id"]}</guid>')
        xml.append('    </item>')

    xml.append('  </channel>')
    xml.append('</rss>')

    rss_path = os.path.join(BASE_DIR, 'rss.xml')
    with open(rss_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(xml))
    print("-> Generated rss.xml")

def run():
    print("=" * 60)
    print("  TrendPulse 360 - Fetching Worldwide Trending News...")
    print("=" * 60)

    all_articles = []
    category_summary = {}

    for cat in CATEGORIES:
        print(f"Fetching: {cat['icon']} {cat['name']}...")
        articles = fetch_rss_feed(cat)
        all_articles.extend(articles)
        category_summary[cat['id']] = len(articles)

    # Sort top breaking news by trending score
    all_articles.sort(key=lambda x: x["trendingScore"], reverse=True)

    metadata = {
        "siteName": SITE_NAME,
        "siteUrl": SITE_URL,
        "lastUpdated": datetime.datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "totalArticles": len(all_articles),
        "categories": CATEGORIES,
        "categoryCounts": category_summary,
        "articles": all_articles
    }

    news_json_path = os.path.join(DATA_DIR, 'news.json')
    with open(news_json_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print(f"\n-> Successfully saved {len(all_articles)} articles to data/news.json")
    
    # Generate SEO Sitemaps & Feeds
    generate_sitemap(all_articles)
    generate_robots_txt()
    generate_rss_xml(all_articles)

    print("=" * 60)
    print("  All news categories updated & SEO artifacts ready!")
    print("=" * 60)

if __name__ == "__main__":
    run()
