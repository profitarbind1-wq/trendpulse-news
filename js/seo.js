/**
 * TrendPulse 360 - Dynamic SEO & Schema Engine
 * Dynamically updates Meta tags, OpenGraph, Twitter Cards,
 * and JSON-LD Structured Data (NewsArticle, WebSite, Breadcrumbs).
 */

const SEO = {
  siteName: "TrendPulse 360",
  siteUrl: window.location.origin || "https://trendpulse360.web.app",
  defaultTitle: "TrendPulse 360 - Real-Time Worldwide Trending News & Viral Briefs",
  defaultDesc: "Read real-time trending news across Politics, Business, Stock Market, Tech & AI, Sports, Entertainment, Education & Motivational stories.",
  defaultImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80",

  init() {
    this.injectBaseSchema();
  },

  injectBaseSchema() {
    // WebSite & SearchAction Schema
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": this.siteName,
      "url": this.siteUrl,
      "description": this.defaultDesc,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${this.siteUrl}/?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };

    // NewsMediaOrganization Schema
    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "NewsMediaOrganization",
      "name": this.siteName,
      "url": this.siteUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${this.siteUrl}/favicon.ico`,
        "width": 60,
        "height": 60
      },
      "sameAs": [
        "https://twitter.com",
        "https://facebook.com",
        "https://t.me"
      ]
    };

    this.upsertJsonLd("schema-website", websiteSchema);
    this.upsertJsonLd("schema-org", orgSchema);
  },

  updateForCategory(categoryName, categoryId) {
    const title = `${categoryName} News - Trending Worldwide | ${this.siteName}`;
    const desc = `Live breaking updates and trending stories in ${categoryName}. Stay informed with 60-second news briefs on ${this.siteName}.`;
    
    document.title = title;
    this.setMeta('description', desc);
    this.setMeta('og:title', title, 'property');
    this.setMeta('og:description', desc, 'property');
    this.setMeta('og:url', `${this.siteUrl}/#category=${categoryId}`, 'property');

    // Breadcrumb Schema
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": this.siteUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": categoryName,
          "item": `${this.siteUrl}/#category=${categoryId}`
        }
      ]
    };
    this.upsertJsonLd("schema-breadcrumb", breadcrumbSchema);
  },

  updateForArticle(article) {
    if (!article) return;
    const title = `${article.title} | ${this.siteName}`;
    const desc = article.summary || article.title;
    const img = article.image || this.defaultImage;
    const articleUrl = `${this.siteUrl}/#news=${article.id}`;

    document.title = title;
    this.setMeta('description', desc);
    this.setMeta('og:title', title, 'property');
    this.setMeta('og:description', desc, 'property');
    this.setMeta('og:image', img, 'property');
    this.setMeta('og:url', articleUrl, 'property');
    this.setMeta('og:type', 'article', 'property');
    this.setMeta('twitter:card', 'summary_large_image');
    this.setMeta('twitter:title', title);
    this.setMeta('twitter:description', desc);
    this.setMeta('twitter:image', img);

    // Google NewsArticle Schema
    const newsArticleSchema = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": articleUrl
      },
      "headline": article.title,
      "image": [img],
      "datePublished": article.publishedAt,
      "dateModified": article.publishedAt,
      "author": {
        "@type": "Organization",
        "name": article.source || "World News Wire"
      },
      "publisher": {
        "@type": "Organization",
        "name": this.siteName,
        "logo": {
          "@type": "ImageObject",
          "url": `${this.siteUrl}/favicon.ico`
        }
      },
      "description": desc,
      "articleSection": article.categoryName || "General"
    };

    this.upsertJsonLd("schema-article", newsArticleSchema);
  },

  setMeta(nameOrProperty, content, attr = 'name') {
    let el = document.querySelector(`meta[${attr}="${nameOrProperty}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, nameOrProperty);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  },

  upsertJsonLd(id, data) {
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data, null, 2);
  }
};

window.SEO = SEO;
