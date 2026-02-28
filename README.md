# print-manager
The dashboard page of Printstore app.
cfms/ (GitHub Root)
├── ads/
│   ├── ad1.jpg
│   ├── ad2.jpg
│   └── ad3.jpg
├── ads.txt                <-- Place your AdSense code here
├── privacy.html           <-- Required for AdSense approval
├── dashboard.html         <-- The main page Google will review
├── dashboard.css          <-- Styles for the dashboard
└── dashboard.js           <-- Bridge logic + Demo data fallback


printstore-extension/
├── lib/
│   ├── xlsx.full.min.js
│   └── qrcode.min.js
├── manifest.json          <-- Version 4.2 with host_permissions
├── background.js          <-- Manages the extension icon click
├── idlehandler.js         <-- Redirects to GitHub after 3 mins
├── config.json            <-- Your store details (GSTIN, UPI, etc.)
├── index.html             <-- Your local POS / Order Creator
├── script.js              <-- Local IndexedDB logic
└── style.css              <-- Local App styling
