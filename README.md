# ⚡ TrendPulse 360 - 100% Automated Worldwide Trending News Portal

एक पूरी तरह से स्वचालित (Automated), अत्यधिक तेज़ (Ultra-fast), और Google SEO-Optimized विश्वव्यापी न्यूज़ वेब एप्लीकेशन। यह मोबाइल, टैबलेट और डेस्कटॉप तीनों पर शानदार काम करता है और Firebase Hosting पर फ्री में डिप्लॉय होने के लिए तैयार है।

---

## 🌟 मुख्य विशेषताएँ (Key Features)

1. **🌍 Worldwide & 10+ Trending Categories**:
   - 🔥 Trending Worldwide (ब्रेकिंग और वायरल खबरें)
   - 🏛️ Politics & Geopolitics (वैश्विक और राष्ट्रीय राजनीति)
   - 📈 Share Market, Nifty/Sensex & Crypto (शेयर बाज़ार और क्रिप्टोकरेंसी)
   - 💼 Business & Startups (कंपनियाँ, इकॉनमी और स्टार्ट-अप्स)
   - 💰 Finance & Personal Wealth (टैक्स, बैंकिंग, सेविंग्स)
   - 🎬 Entertainment (बॉलीवुड, हॉलीवुड, OTT, वेब सीरीज़)
   - ⚽ Sports (क्रिकेट, फुटबॉल, F1, टेनिस)
   - 🤖 Tech & AI (आर्टिफिशियल इंटेलिजेंस, गैजेट्स, टेक इनोवेशन)
   - 🎓 Education & Exams (UPSC, बोर्ड्स, एडमिट कार्ड, रिजल्ट्स)
   - 🏆 Competition & Government Jobs (सरकारी नौकरियाँ, रिक्रूटमेंट)
   - 💡 Motivational & Success Stories (प्रेरक कहानियाँ और सक्सेस स्टोरीज)

2. **🤖 100% Zero-Manual Automation**:
   - `auto_updater.py` स्क्रिप्ट के ज़रिये Google News और शीर्ष ग्लोबल RSS से ताज़ा खबरें बिना किसी पेड API चार्ज के ऑटोमैटिकली फ़ेच होती हैं।
   - GitHub Actions (`.github/workflows/auto_update.yml`) हर 30 मिनट में क्लाउड पर बिना आपका कंप्यूटर ऑन रखे खुद ताज़ा खबरें लाकर Firebase पर डिप्लॉय कर देता है।

3. **📱 Dual View Mode (2 रीडिंग मोड्स)**:
   - **Magazine Grid**: पारंपरिक न्यूज़पेपर और मैगज़ीन स्टाइल 3-कॉलम रिस्पॉन्सिव ग्रिड।
   - **Inshorts 60-Sec Quick-Read**: मोबाइल-फ्रेंडली कार्ड्स, जिसमें मुख्य बुलेट पॉइंट्स और क्विक टेकअवे होते हैं।

4. **🚀 Google SEO, Discover & Ranking Powerhouse**:
   - `schema.org/NewsArticle` और `BreadcrumbList` JSON-LD स्ट्रक्चर्ड डेटा हर आर्टिकल में एम्बेडेड है।
   - ऑटो-जेनरेटेड Google News `sitemap.xml`, `robots.txt` और `rss.xml`।
   - OpenGraph और Twitter Cards ताकि WhatsApp, Facebook और X (Twitter) पर शेयर करते ही शानदार थंबनेल और टाइटल दिखे।

5. **🔊 Audio Reader (Text-to-Speech)**:
   - "🔊 Listen" बटन दबाते ही ब्राउज़र खबर पढ़कर सुनाने लगता है।

6. **📲 Viral 1-Click Social Sharing**:
   - WhatsApp, Telegram, X/Twitter पर डायरेक्ट वायरल मैसेज फॉर्मेट में शेयरिंग।

7. **⭐ Bookmarks & Dark Mode**:
   - पसंदीदा आर्टिकल्स को लोकल स्टोरेज में सेव करने की सुविधा और आँखों को सुकून देने वाला डार्क मोड।

---

## 📂 प्रोजेक्ट फ़ाइल स्ट्रक्चर (Project Structure)

```
i:\Agent\Website\News\
├── index.html               # मुख्य हाई-SEO रिस्पॉन्सिव वेब पोर्टल
├── css/
│   └── style.css            # कस्टम ग्लासमोर्फिज्म, टिकर और डार्क मोड स्टाइल्स
├── js/
│   ├── app.js               # कोर ऐप लॉजिक, लाइव फ़ेचर, ऑडियो रीडर, सर्च और शेयरिंग
│   └── seo.js               # डायनेमिक Google NewsArticle Schema और OpenGraph इंजन
├── data/
│   └── news.json            # 170+ ताज़ा खबरों का ऑटो-जेनरेटेड डेटाबेस
├── auto_updater.py          # बैकएंड ऑटोमेशन स्क्रिप्ट (RSS फ़ेचर + साइटमैप बिल्डर)
├── server.py                # लोकल प्रीव्यू वेब सर्वर
├── sitemap.xml              # Google News कॉम्पैटिबल XML साइटमैप
├── robots.txt               # सर्च इंजन क्रॉलर डायरेक्टिव्स
├── rss.xml                  # सिंडिकेशन के लिए RSS 2.0 फीड
├── firebase.json            # Firebase Hosting कॉन्फ़िगरेशन
├── .firebaserc              # Firebase प्रोजेक्ट सेटिंग्स
└── .github/
    └── workflows/
        └── auto_update.yml  # 24/7 क्लाउड ऑटोमेशन वर्कफ़्लो
```

---

## 🚀 तुरंत रन कैसे करें (How to Run Locally)

### 1. लोकल सर्वर स्टार्ट करें:
अपने टर्मिनल में रन करें:
```powershell
python server.py
```
और अपने ब्राउज़र में खोलें:
👉 **http://localhost:8080**

### 2. कभी भी ताज़ा न्यूज़ फ़ेच और साइटमैप अपडेट करने के लिए:
```powershell
python auto_updater.py
```

---

## 🔥 Firebase पर लाइव कैसे डिप्लॉय करें (Deploy to Firebase)

### स्टेप 1: Firebase Tools इन्स्टॉल करें (यदि पहले से नहीं है)
```powershell
npm install -g firebase-tools
```
*(यदि आपके पास Node/npm नहीं है, तो आप [Firebase CLI Binary](https://firebase.google.com/docs/cli#windows-standalone-binary) सीधे डाउनलोड कर सकते हैं).*

### स्टेप 2: Firebase में लॉगिन करें
```powershell
firebase login
```

### स्टेप 3: प्रोजेक्ट लिंक करें
```powershell
firebase use --add
```
(अपने Firebase कंसोल में बनाए गए प्रोजेक्ट का नाम चुनें)।

### स्टेप 4: 1-क्लिक में डिप्लॉय करें
```powershell
firebase deploy --only hosting
```
आपकी वेबसाइट तुरंत **`https://your-project.web.app`** पर पूरी दुनिया के लिए लाइव हो जाएगी! 🚀

---

## ⚡ 24/7 ऑटोमेशन (Zero Manual Work)

जब आप इस कोड को अपने GitHub रिपॉजिटरी में पुश करेंगे:
1. `.github/workflows/auto_update.yml` हर 30 मिनट में ऑटोमैटिकली चलेगा।
2. यह Google News से सभी 10+ कैटेगरीज की ताज़ा खबरें लाएगा।
3. नए `data/news.json` और `sitemap.xml` को अपडेट करके Firebase पर ऑटो-डिप्लॉय कर देगा।
4. **आपको रोज़ाना कुछ भी करने की ज़रूरत नहीं होगी!**
