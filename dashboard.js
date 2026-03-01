/**
 * CogniSol | CFMS - Complete Dashboard Logic
 * Features: Local Fallback Slider, Pause on Hover, Demo Mode for AdSense
 */

const DB_NAME = 'PrintingStoreDB';
const ORDERS_STORE = 'orders';

// Demo data for AdSense Reviewers (Crucial for approval)
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
        
        // If DB exists, attempt to pull real user data
        if (db.objectStoreNames.contains(ORDERS_STORE)) {
            const transaction = db.transaction([ORDERS_STORE], 'readonly');
            const store = transaction.objectStore(ORDERS_STORE);
            const getRequest = store.getAll();

            getRequest.onsuccess = () => {
                if (getRequest.result && getRequest.result.length > 0) {
                    renderUI(getRequest.result);
                } else {
                    // DB exists but is empty, load fallback JSON
                    loadFallbackData();
                }
            };
            getRequest.onerror = () => loadFallbackData();
        } else {
            // Not running in Chrome Extension environment, load fallback
            loadFallbackData();
        }
    };

    request.onerror = () => loadFallbackData();
}

// Fetch dummy data from your GitHub root to satisfy Google Bot
async function loadFallbackData() {
    console.log("CogniSol CFMS: Loading fallback analytics...");
    try {
        const response = await fetch('./dummy_data.json');
        const data = await response.json();
        // Assuming your JSON has an "orders" key
        renderUI(data.orders);
    } catch (error) {
        console.warn("Fallback JSON not found, using internal demo data.");
        renderUI(demoOrders);
    }
}

// --- 2. UI Rendering Logic ---
function renderUI(orders) {
    const tableBody = document.getElementById('recent-orders-body');
    // Ensure orders is an array before sorting
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

// 2. Rotating Slider with Pause on Hover
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

// 3. Google Ad Manager Init
window.googletag = window.googletag || {cmd: []};
googletag.cmd.push(function() {
    googletag.defineSlot('/12345678/Dashboard_Top', [1100, 340], 'div-gpt-ad-dashboard-top')
             .addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
});

// Updated Start Everything with Ad-Block Detection
document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
    initSlider();
    googletag.cmd.push(() => googletag.display('div-gpt-ad-dashboard-top'));

    // AdBlock Detection for Revenue Protection
    setTimeout(() => {
        const adSlot = document.getElementById('div-gpt-ad-dashboard-top');
        if (adSlot && adSlot.offsetHeight === 0) {
            console.warn("AdSense blocked. Notifying user...");
            // Optional: You can trigger a small UI toast here
        }
    }, 3000);
});
function goBackToApp(tabName) {
    // 1. Try to get the ID from the URL (passed by idlehandler)
    const urlParams = new URLSearchParams(window.location.search);
    let extensionId = urlParams.get('extId');
    
    // 2. Fallback to your known ID if the URL is clean 
    if (!extensionId) {
        extensionId = "iagnoejddgdhabnaecdgkdehomdhglkg"; 
    }
    
    window.location.href = `chrome-extension://${extensionId}/index.html?tab=${tabName}`;
}
