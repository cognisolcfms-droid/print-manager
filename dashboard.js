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

// 1. Data Management (The Bridge)
async function fetchDashboardData() {
    const isLocal = window.location.protocol === 'chrome-extension:' || window.location.hostname === 'localhost';
    
    const request = indexedDB.open(DB_NAME);

    request.onsuccess = (event) => {
        const db = event.target.result;
        
        // If store doesn't exist (Remote GitHub view), show Demo Data
        if (!db.objectStoreNames.contains(ORDERS_STORE)) {
            renderUI(demoOrders);
            return;
        }

        const transaction = db.transaction([ORDERS_STORE], 'readonly');
        const store = transaction.objectStore(ORDERS_STORE);
        const getRequest = store.getAll();

        getRequest.onsuccess = () => {
            const data = getRequest.result.length > 0 ? getRequest.result : demoOrders;
            renderUI(data);
        };
    };

    request.onerror = () => renderUI(demoOrders);
}

function renderUI(orders) {
    const tableBody = document.getElementById('recent-orders-body');
    const recent = [...orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).slice(0, 5);
    
    const totalRev = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    document.getElementById('dash-total-revenue').textContent = `₹ ${totalRev.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('dash-today-orders').textContent = orders.length;

    tableBody.innerHTML = recent.map(o => `
        <tr>
            <td>#${o.orderId ? o.orderId.slice(-6) : 'N/A'}</td>
            <td>${o.customerName || 'Walking Customer'}</td>
            <td>${new Date(o.orderDate).toLocaleDateString()}</td>
            <td>₹${(o.grandTotal || 0).toFixed(2)}</td>
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

// Start Everything
document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
    initSlider();
    googletag.cmd.push(() => googletag.display('div-gpt-ad-dashboard-top'));

});
function goBackToApp(tabName) {
    // 1. Try to get the ID from the URL (passed by idlehandler)
    const urlParams = new URLSearchParams(window.location.search);
    let extensionId = urlParams.get('extId');
    
    // 2. Fallback to your known ID if the URL is clean (like for AdSense reviewers)
    if (!extensionId) {
        extensionId = "iagnoejddgdhabnaecdgkdehomdhglkg"; 
    }
    
    window.location.href = `chrome-extension://${extensionId}/index.html?tab=${tabName}`;
}

