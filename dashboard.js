/**
 * CogniSol | CFMS - Complete Dashboard Logic
 * Version: 1.1.2 - Production Ready
 * Fixes: Removed demo data, integrated dummy_data.json, and resilient ad-fallback.
 */

const DB_NAME = 'PrintingStoreDB';
const ORDERS_STORE = 'orders';

// --- 1. Data Management (The Bridge) ---
async function fetchDashboardData() {
    const request = indexedDB.open(DB_NAME);

    request.onsuccess = (event) => {
        const db = event.target.result;
        
        if (db.objectStoreNames.contains(ORDERS_STORE)) {
            const transaction = db.transaction([ORDERS_STORE], 'readonly');
            const store = transaction.objectStore(ORDERS_STORE);
            const getRequest = store.getAll();

            getRequest.onsuccess = () => {
                // If IndexedDB has user data, use it; otherwise, go to dummy_data.json
                if (getRequest.result && getRequest.result.length > 0) {
                    renderUI(getRequest.result);
                } else {
                    loadFallbackData();
                }
            };
            getRequest.onerror = () => loadFallbackData();
        } else {
            loadFallbackData();
        }
    };

    request.onerror = () => loadFallbackData();
}

// Fetch from the deployed dummy_data.json
async function loadFallbackData() {
    console.log("CogniSol CFMS: Accessing business insights from dummy_data.json...");
    try {
        const response = await fetch('./dummy_data.json'); 
        if (!response.ok) throw new Error("Data source unreachable");
        const data = await response.json();
        renderUI(data.orders);
    } catch (error) {
        console.error("Critical: Could not load local or fallback data.", error);
    }
}

// --- 2. UI Rendering Logic ---
function renderUI(orders) {
    const tableBody = document.getElementById('recent-orders-body');
    if (!tableBody) return;

    const orderList = Array.isArray(orders) ? orders : [];
    
    const recent = [...orderList]
        .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
        .slice(0, 5);
    
    const totalRev = orderList.reduce((sum, o) => sum + (parseFloat(o.grandTotal) || 0), 0);
    
    // Update KPI counters
    document.getElementById('dash-total-revenue').textContent = `₹ ${totalRev.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('dash-today-orders').textContent = orderList.length;

    // Populate Table
    tableBody.innerHTML = recent.map(o => `
        <tr>
            <td>#${o.orderId ? o.orderId.toString().slice(-6) : 'N/A'}</td>
            <td>${o.customerName || 'Walking Customer'}</td>
            <td>${new Date(o.orderDate).toLocaleDateString()}</td>
            <td>₹${(parseFloat(o.grandTotal) || 0).toFixed(2)}</td>
            <td><span class="status-badge">Completed</span></td>
        </tr>
    `).join('');
}

// --- 3. Rotating Slider Logic ---
function initSlider() {
    const imgs = document.querySelectorAll('.fallback-img');
    if (imgs.length <= 1) return;

    let index = 0;
    // Clear any existing active classes first
    imgs.forEach(img => img.classList.remove('active'));
    imgs[0].classList.add('active');

    setInterval(() => {
        imgs[index].classList.remove('active');
        index = (index + 1) % imgs.length;
        imgs[index].classList.add('active');
    }, 5000);
}

// --- 4. Google Ad Manager (Safe Mode) ---
window.googletag = window.googletag || {cmd: []};

googletag.cmd.push(function() {
    try {
        googletag.defineSlot('/12345678/Dashboard_Top', [1100, 340], 'div-gpt-ad-dashboard-top')
                 .addService(googletag.pubads());
        
        // Collapse the slot if the 400/CORS error occurs to prevent UI gaps
        googletag.pubads().collapseEmptyDivs(true); 
        googletag.pubads().enableSingleRequest();
        googletag.enableServices();
    } catch (e) {
        console.debug("Ad Manager deferred.");
    }
});

// --- 5. Lifecycle Controller ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Prioritize Dashboard Data
    fetchDashboardData();

    // 2. Safe Ad Load
    googletag.cmd.push(() => {
        try {
            const adContainer = document.getElementById('div-gpt-ad-dashboard-top');
            if(adContainer) {
                googletag.display('div-gpt-ad-dashboard-top');
            }
        } catch (err) {
            console.log("Ad display deferred.");
        }
    });

    // 3. Fallback Detection: Show Slider if Ad Fails
    setTimeout(() => {
        const adSlot = document.getElementById('div-gpt-ad-dashboard-top');
        // If Google slot height is 0 (blocked/error), show the fallback slider
        if (adSlot && adSlot.offsetHeight === 0) {
            adSlot.classList.add('ad-placeholder'); 
            const fallbackWrapper = adSlot.querySelector('.ad-fallback-wrapper');
            if (fallbackWrapper) {
                fallbackWrapper.style.display = 'block';
                initSlider();
            }
            console.info("Optimization: Local assets loaded as primary view.");
        }
    }, 3000);
});

// --- 6. Navigation Bridge ---
function goBackToApp(tabName) {
    const urlParams = new URLSearchParams(window.location.search);
    const extensionId = urlParams.get('extId') || "iagnoejddgdhabnaecdgkdehomdhglkg";
    window.location.href = `chrome-extension://${extensionId}/index.html?tab=${tabName}`;
}
