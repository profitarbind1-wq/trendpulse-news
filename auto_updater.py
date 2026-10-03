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
SITE_URL = "https://trendpulse-live.web.app"
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

# Curated contextual photo bank matching news topics with high-res Unsplash CDN images
TOPIC_IMAGE_RULES = [
    # 1. Weather, Storms, Heat, Natural Events, Disasters
    (
        ['heat', 'storm', 'storms', 'weather', 'climate', 'sea arch', 'pacific', 'hawaii', 'flood', 'rain', 'temperature', 'wildfire', 'earthquake'],
        [
            "https://images.unsplash.com/photo-1504386106331-3e4e71712b38?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=900&auto=format&fit=crop&q=80"
        ]
    ),
    # 2. Aviation & Flight incidents
    (
        ['plane', 'flight', 'pilot', 'cockpit', 'airline', 'airport', 'flydubai', 'airbus', 'boeing', 'aviation', 'stabbing'],
        [
            "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1520437358207-323b43b50729?w=900&auto=format&fit=crop&q=80"
        ]
    ),
    # 3. Oil, Diesel, Energy, Petroleum, Reserves
    (
        ['diesel', 'crude', 'oil', 'petroleum', 'barrels', 'reserves', 'g7', 'g-7', 'gasoline', 'energy', 'refinery', 'pipeline'],
        [
            "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1582582494705-f8ce0b0c24f0?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=900&auto=format&fit=crop&q=80"
        ]
    ),
    # 4. Legal, Courts, Prison, Execution, Crimes, Law
    (
        ['execution', 'christa pike', 'inmate', 'death row', 'lethal injection', 'court', 'trial', 'judge', 'sentenced', 'prison', 'jail', 'lawyer', 'prosecutor', 'rape', 'allegation', 'assault', 'crime', 'murder', 'verdict', 'justice', 'investigation', 'arrest', 'sting', 'kratom', 'clerk', 'charges', 'charged', 'terrorism', 'terrorist', 'terror'],
        [
            "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1453733190371-0a9bedd82893?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=900&auto=format&fit=crop&q=80"
        ]
    ),
    # 5. Colleges, Universities, Campus
    (
        ['cornell', 'harvard', 'university', 'college', 'campus', 'higher education', 'students', 'dorm', 'ole miss'],
        [
            "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1562774053-701939374585?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=900&auto=format&fit=crop&q=80"
        ]
    ),
    # 6. Crypto, Bitcoin, Gold, Commodities
    (
        ['crypto', 'bitcoin', 'btc', 'gold', 'ethereum', 'token', 'blockchain', 'bullion'],
        [
            "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=900&auto=format&fit=crop&q=80"
        ]
    ),
    # 7. Stock Market, Trading, Sensex, Nifty, Wall Street
    (
        ['stocks', 'stock market', 'sensex', 'nifty', 'wall street', 'nasdaq', 'investors', 'trading', 'shares', 'rally', 'equity', 'jobs report'],
        [
            "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=900&auto=format&fit=crop&q=80"
        ]
    ),
    # 8. Economy, Finance, Banking, History, Dollar
    (
        ['economy', 'economic', 'financial', 'finance', 'dollar', 'milestones', 'bank', 'banking', 'fed', 'federal reserve', 'inflation', 'wealth', 'tax'],
        [
            "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&auto=format&fit=crop&q=80"
        ]
    ),
    # 9. Entertainment, Movies, Hollywood, Barbie, Actors
    (
        ['skydance', 'barbie', 'movie', 'film', 'hollywood', 'bollywood', 'actor', 'actress', 'cinema', 'series', 'netflix', 'ellison', 'box office', 'entertainment', 'music', 'album', 'song'],
        [
            "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&auto=format&fit=crop&q=80"
        ]
    ),
    # 10. Sports, NFL, 49ers, Football, Cricket
    (
        ['49ers', 'nfl', 'york', 'sports', 'football', 'stadium', 'cricket', 'fifa', 'tournament', 'champion', 'trophy', 'match', 'ipl', 'olympics'],
        [
            "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=900&auto=format&fit=crop&q=80"
        ]
    ),
    # 11. Tech, AI, Apple, Mac, Cyber, Software
    (
        ['apple', 'mac', 'ai', 'tech', 'disk access', 'software', 'technology', 'robot', 'cyber', 'google', 'microsoft', 'chatgpt', 'nvidia', 'chips', 'hardware', 'intel', 'musk'],
        [
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=900&auto=format&fit=crop&q=80"
        ]
    ),
    # 12. Education, Exams, UPSC, NDA, Admit Card, Results
    (
        ['upsc', 'nda', 'admit card', 'hall ticket', 'exam', 'education', 'school', 'scholarship', 'answer key', 'results', 'merit list'],
        [
            "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=900&auto=format&fit=crop&q=80"
        ]
    ),
    # 13. Migration, Deportation, Border
    (
        ['migrant', 'migration', 'deportation', 'border', 'asylum', 'immigrant', 'return hubs'],
        [
            "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=900&auto=format&fit=crop&q=80"
        ]
    ),
    # 14. Protests, Demonstrations, Activism
    (
        ['protest', 'protests', 'protesters', 'rally', 'demonstration', 'march', 'gather', 'streets'],
        [
            "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=900&auto=format&fit=crop&q=80"
        ]
    ),
    # 15. War, Military, Strikes, Middle East, Conflicts, Pentagon
    (
        ['iran', 'iranian', 'israel', 'israeli', 'strike', 'strikes', 'gaza', 'war', 'military', 'missile', 'drone', 'soldier', 'army', 'pentagon', 'defense', 'ukraine', 'russia', 'air attack'],
        [
            "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1579975096649-e773152b04cb?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&auto=format&fit=crop&q=80"
        ]
    ),
    # 16. US Politics, White House, Congress, Trump, Government
    (
        ['trump', 'biden', 'white house', 'congress', 'senate', 'democrat', 'republican', 'capitol', 'presidency', 'taxpayer', 'governor', 'hegseth', 'cabinet', 'election', 'lobbying', 'gop', 'midterms', 'redistricting', 'kushner', 'bolsonaro', 'lula'],
        [
            "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1575517111478-7f6afd0973db?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=900&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=900&auto=format&fit=crop&q=80"
        ]
    )
]

# Rich varied fallback photo collections per category (so adjacent stories never duplicate)
CATEGORY_POOLS = {
    "trending": [
        "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1476242906366-d8eb64c2f661?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=900&auto=format&fit=crop&q=80"
    ],
    "world": [
        "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900&auto=format&fit=crop&q=80"
    ],
    "politics": [
        "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1575517111478-7f6afd0973db?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=900&auto=format&fit=crop&q=80"
    ],
    "business": [
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=900&auto=format&fit=crop&q=80"
    ],
    "share-market": [
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=900&auto=format&fit=crop&q=80"
    ],
    "finance": [
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1565372195458-9de0b320ef04?w=900&auto=format&fit=crop&q=80"
    ],
    "entertainment": [
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=900&auto=format&fit=crop&q=80"
    ],
    "sports": [
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=900&auto=format&fit=crop&q=80"
    ],
    "tech": [
        "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&auto=format&fit=crop&q=80"
    ],
    "education": [
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=900&auto=format&fit=crop&q=80"
    ],
    "competition": [
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=900&auto=format&fit=crop&q=80"
    ],
    "motivational": [
        "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&auto=format&fit=crop&q=80"
    ]
}

def is_kw_match(kw, text):
    if len(kw) <= 4:
        return bool(re.search(rf'\b{re.escape(kw)}\b', text))
    return kw in text

def get_smart_article_image(title, category_id, summary=""):
    """
    Intelligently assigns a relevant, distinct high-resolution image
    based on news headline keywords and category pools.
    Prioritizes title matches so headline subjects determine the photo.
    """
    title_lower = title.lower()
    summary_lower = summary.lower()
    
    # 1. Direct Headline Topic Match (Highest Relevance!)
    for keywords, images in TOPIC_IMAGE_RULES:
        if any(is_kw_match(kw, title_lower) for kw in keywords):
            idx = abs(hash(title)) % len(images)
            return images[idx]

    # 2. Context Summary Match
    for keywords, images in TOPIC_IMAGE_RULES:
        if any(is_kw_match(kw, summary_lower) for kw in keywords):
            idx = abs(hash(title)) % len(images)
            return images[idx]
            
    # 3. Varied Category Pool Selection
    pool = CATEGORY_POOLS.get(category_id, CATEGORY_POOLS.get("trending"))
    idx = abs(hash(title)) % len(pool)
    return pool[idx]


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
                "image": get_smart_article_image(title, category["id"], clean_desc)
            })

    except Exception as e:
        print(f"  [WARN] Failed to fetch {category['name']}: {e}")

    return articles

def generate_sitemap(all_articles):
    """Generates Google News XML Sitemap compliant with Google Search guidelines."""
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

    # Static Pages (About, Privacy, Contact)
    for page in ['about.html', 'privacy.html', 'contact.html']:
        xml.append('  <url>')
        xml.append(f'    <loc>{SITE_URL}/{page}</loc>')
        xml.append(f'    <lastmod>{now_iso}</lastmod>')
        xml.append('    <changefreq>monthly</changefreq>')
        xml.append('    <priority>0.7</priority>')
        xml.append('  </url>')

    # Category URLs (clean query param, no '#' fragments)
    for cat in CATEGORIES:
        xml.append('  <url>')
        xml.append(f'    <loc>{SITE_URL}/?category={cat["id"]}</loc>')
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
        xml.append(f'    <loc>{SITE_URL}/?news={art["id"]}</loc>')
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

    # Fail-safe check: Never overwrite news.json with empty or corrupted data
    if len(all_articles) < 15:
        print(f"\n[WARNING] Only {len(all_articles)} articles fetched! Retaining existing data/news.json cache to keep website active.")
        return

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

    # Update Live Cricket Scores & Fixtures
    try:
        from cricket_updater import update_cricket_data
        update_cricket_data()
    except Exception as e:
        print(f"  [Cricket Updater Notice] {e}")

    # Auto-Post Fresh Top Stories to Telegram / WhatsApp
    try:
        from auto_social_poster import run_autoposter
        run_autoposter()
    except Exception as e:
        print(f"  [Social Poster Notice] {e}")

    print("=" * 60)
    print("  All news categories updated & SEO artifacts ready!")
    print("=" * 60)

if __name__ == "__main__":
    run()
