/**
 * CogniSol | CFMS - Production Dashboard Logic
 * Clean version: Removed demo constants, using dummy_data.json as primary fallback.
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
                // Use user data if present; otherwise, load from dummy_data.json
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
    
    // Sort by date and take the 5 most recent
    const recent = [...orderList]
        .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
        .slice(0, 5);
    
    const totalRev = orderList.reduce((sum, o) => sum + (parseFloat(o.grandTotal) || 0), 0);
    
    // Update KPI counters
    const revEl = document.getElementById('dash-total-revenue');
    const countEl = document.getElementById('dash-today-orders');
    
    if (revEl) revEl.textContent = `₹ ${totalRev.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    if (countEl) countEl.textContent = orderList.length;

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

// --- 3. Rotating Slider ---
function initSlider() {
    const slider = document.getElementById('mainSlider');
    const imgs = document.querySelectorAll('.fallback-img');
    if (!slider || imgs.length <= 1) return;

    let index = 0;
    let paused = false;

    slider.addEventListener('mouseenter', () => paused = true);
    slider.addEventListener('mouseleave', () => paused = false);

    setInterval(() => {
        if (!paused) {
            imgs[index].classList.remove('active');
            index = (index + 1) % imgs.length;
            imgs[index].classList.add('active');
        }
    }, 5000);
}

// --- 4. Google Ad Manager Init (Safe Mode) ---
window.googletag = window.googletag || {cmd: []};

googletag.cmd.push(function() {
    try {
        googletag.defineSlot('/12345678/Dashboard_Top', [1100, 340], 'div-gpt-ad-dashboard-top')
                 .addService(googletag.pubads());
        
        // Collapse empty divs to prevent layout shifts on load failure
        googletag.pubads().collapseEmptyDivs(true); 
        googletag.pubads().enableSingleRequest();
        googletag.enableServices();
    } catch (e) {
        console.debug("Ad Manager initialization deferred.");
    }
});

// --- 5. Lifecycle Controller ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Data
    fetchDashboardData();
    
    // 2. Initialize UI Components
    initSlider();

    // 3. Safe Ad Display Call
    googletag.cmd.push(() => {
        try {
            if(document.getElementById('div-gpt-ad-dashboard-top')) {
                googletag.display('div-gpt-ad-dashboard-top');
            }
        } catch (err) {
            console.log("Ad module deferred.");
        }
    });

    // 4. Post-load Optimization
    setTimeout(() => {
        const adSlot = document.getElementById('div-gpt-ad-dashboard-top');
        if (adSlot && adSlot.offsetHeight === 0) {
            adSlot.classList.add('ad-placeholder'); 
            console.info("Notice: Dashboard optimized for current network environment.");
        }
    }, 3000);
});

// --- 6. Navigation Bridge ---
function goBackToApp(tabName) {
    const urlParams = new URLSearchParams(window.location.search);
    const extensionId = urlParams.get('extId') || "iagnoejddgdhabnaecdgkdehomdhglkg";
    window.location.href = `chrome-extension://${extensionId}/index.html?tab=${tabName}`;
}
