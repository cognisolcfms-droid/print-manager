/**
 * CogniSol | CFMS - Complete Dashboard Logic
 * Fix: Corrected Fallback Filename & CSP Compliance
 */

const DB_NAME = 'PrintingStoreDB';
const ORDERS_STORE = 'orders';

// Demo data for AdSense Reviewers
const demoOrders = [
    { orderId: 'ORD-8821', customerName: 'Retail Customer', orderDate: new Date().toISOString(), grandTotal: 450.00 },
    { orderId: 'ORD-8822', customerName: 'Corporate Hub', orderDate: new Date().toISOString(), grandTotal: 2100.00 },
    { orderId: 'ORD-8823', customerName: 'Local School', orderDate: new Date().toISOString(), grandTotal: 125.50 }
];

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

// FIX: Changed 'dummy-data.json' to 'dummy_data.json' to fix 404
async function loadFallbackData() {
    console.log("CogniSol CFMS: Loading fallback data...");
    try {
        const response = await fetch('./dummy_data.json'); 
        if (!response.ok) throw new Error("Fallback file not found");
        const data = await response.json();
        renderUI(data.orders);
    } catch (error) {
        console.warn("Fallback JSON failed, using internal demo data.");
        renderUI(demoOrders);
    }
}

// --- 2. UI Rendering Logic ---
function renderUI(orders) {
    const tableBody = document.getElementById('recent-orders-body');
    const orderList = Array.isArray(orders) ? orders : [];
    
    const recent = [...orderList]
        .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
        .slice(0, 5);
    
    const totalRev = orderList.reduce((sum, o) => sum + (parseFloat(o.grandTotal) || 0), 0);
    
    document.getElementById('dash-total-revenue').textContent = `₹ ${totalRev.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('dash-today-orders').textContent = orderList.length;

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
    if (imgs.length <= 1) return;

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

// --- 4. Google Ad Manager ---
// --- 1. Google Ad Manager Init (Safe Mode) ---
window.googletag = window.googletag || {cmd: []};

googletag.cmd.push(function() {
    try {
        // Define slot and enable services
        googletag.defineSlot('/12345678/Dashboard_Top', [1100, 340], 'div-gpt-ad-dashboard-top')
                 .addService(googletag.pubads());
        
        // Tells Google to collapse the div if the ad fails to load (prevents layout shift)
        googletag.pubads().collapseEmptyDivs();
        googletag.pubads().enableSingleRequest();
        googletag.enableServices();
    } catch (e) {
        // Silently catch initialization errors
    }
});

// --- 2. Start Everything ---
document.addEventListener('DOMContentLoaded', () => {
    // Run core app logic
    fetchDashboardData();
    initSlider();

    // Safe Ad Display Call
    googletag.cmd.push(() => {
        try {
            // Only attempt display if the div exists to avoid DOM errors
            if(document.getElementById('div-gpt-ad-dashboard-top')) {
                googletag.display('div-gpt-ad-dashboard-top');
            }
        } catch (err) {
            // This prevents the CORS/400 error from appearing as a crash
            console.log("Dashboard Info: Ad module deferred.");
        }
    });

    // Check for AdBlock/CORS after delay without using .style
    setTimeout(() => {
        const adSlot = document.getElementById('div-gpt-ad-dashboard-top');
        if (adSlot && adSlot.offsetHeight === 0) {
            // Using a class instead of .style to stay CSP compliant
            adSlot.classList.add('ad-placeholder'); 
            console.info("Notice: Ad container optimized for current environment.");
        }
    }, 3000);
});

// --- 3. Navigation Bridge ---
function goBackToApp(tabName) {
    const urlParams = new URLSearchParams(window.location.search);
    const extensionId = urlParams.get('extId') || "iagnoejddgdhabnaecdgkdehomdhglkg"; 
    window.location.href = `chrome-extension://${extensionId}/index.html?tab=${tabName}`;
}
