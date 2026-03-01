/**
 * CogniSol | CFMS - Analytics Engine
 * Product: PrintStore v1.1.2
 * Features: IndexedDB Integration, JSON Fallback, AdSense Compliance
 */

const DB_NAME = 'PrintingStoreDB';
const ORDERS_STORE = 'orders';

// Final fallback stats if even dummy_data.json fails (Emergency use only)
const hardcodedBackup = {
    revenue: [
        { label: 'UPI / Digital', value: '₹ 0.00' },
        { label: 'Cash', value: '₹ 0.00' }
    ],
    services: []
};

/**
 * 1. INITIALIZATION
 * Connects to IndexedDB or triggers JSON Fallback
 */
async function initAnalytics() {
    console.log("Analytics Engine Initializing...");
    
    // Check if we are in a browser environment that supports IndexedDB
    if (!window.indexedDB) {
        console.warn("IndexedDB not supported. Loading JSON fallback.");
        loadJSONFallback();
        return;
    }

    const request = indexedDB.open(DB_NAME);

    request.onsuccess = (event) => {
        const db = event.target.result;
        
        // If the store exists, try to pull real data
        if (db.objectStoreNames.contains(ORDERS_STORE)) {
            const transaction = db.transaction([ORDERS_STORE], 'readonly');
            const store = transaction.objectStore(ORDERS_STORE);
            const getRequest = store.getAll();

            getRequest.onsuccess = () => {
                if (getRequest.result && getRequest.result.length > 0) {
                    console.log("Real store data detected. Processing...");
                    const processedData = processRealData(getRequest.result);
                    renderAnalytics(processedData);
                } else {
                    console.log("Store empty. Loading professional fallback.");
                    loadJSONFallback();
                }
            };
        } else {
            // View is remote/bot: Use JSON Fallback
            loadJSONFallback();
        }
    };

    request.onerror = () => {
        console.error("DB Error. Switching to Fallback.");
        loadJSONFallback();
    };
}

/**
 * 2. FALLBACK MECHANISM
 * Fetches the separate dummy_data.json file from GitHub root
 */
async function loadJSONFallback() {
    try {
        const response = await fetch('./dummy_data.json');
        if (!response.ok) throw new Error("JSON File missing");
        
        const data = await response.json();
        
        // Use the 'analytics' object from your JSON file
        if (data.analytics) {
            renderAnalytics(data.analytics);
            console.log("CogniSol CFMS: AdSense Bot View Active.");
        } else {
            throw new Error("Invalid JSON structure");
        }
    } catch (e) {
        console.error("Critical Failure: No data source available.", e);
        renderAnalytics(hardcodedBackup);
    }
}

/**
 * 3. DATA PROCESSING
 * Aggregates raw IndexedDB orders into analytics metrics
 */
function processRealData(orders) {
    // Aggregate Revenue by Payment Method (e.g., UPI, Cash, Card)
    const paymentMap = orders.reduce((acc, order) => {
        const method = order.paymentMethod || 'Other';
        acc[method] = (acc[method] || 0) + (order.grandTotal || 0);
        return acc;
    }, {});

    // Aggregate Top Services (counting unique items in orders)
    // Note: This assumes your order object contains a 'items' array
    const serviceMap = {};
    orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const name = item.serviceName || 'Standard Service';
                if (!serviceMap[name]) {
                    serviceMap[name] = { count: 0, yield: 0 };
                }
                serviceMap[name].count += 1;
                serviceMap[name].yield += (item.price || 0);
            });
        }
    });

    return {
        revenue: Object.keys(paymentMap).map(key => ({
            label: key,
            value: `₹ ${paymentMap[key].toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        })),
        services: Object.keys(serviceMap).map(name => ({
            name: name,
            count: serviceMap[name].count,
            yield: `₹ ${serviceMap[name].yield.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        })).sort((a, b) => b.count - a.count).slice(0, 5) // Top 5
    };
}

/**
 * 4. UI RENDERING
 * Injects data into the HTML cards and tables
 */
function renderAnalytics(data) {
    // Update Revenue Stats Card
    const metricsDiv = document.getElementById('revenue-metrics');
    if (metricsDiv) {
        metricsDiv.innerHTML = data.revenue.map(item => `
            <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid #f9f9f9; padding-bottom:5px;">
                <span style="color:#666;">${item.label}</span>
                <strong style="color:#333;">${item.value}</strong>
            </div>
        `).join('');
    }

    // Update Top Services Table
    const tableBody = document.getElementById('top-services-body');
    if (tableBody) {
        if (!data.services || data.services.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No service data found.</td></tr>';
        } else {
            tableBody.innerHTML = data.services.map(s => `
                <tr>
                    <td><strong>${s.name}</strong></td>
                    <td style="text-align:center;">${s.count}</td>
                    <td style="text-align:right; font-weight:600;">${s.yield}</td>
                </tr>
            `).join('');
        }
    }
}

/**
 * 5. ADS & LIFECYCLE
 */
window.googletag = window.googletag || {cmd: []};
googletag.cmd.push(function() {
    // Define your AdSense/GAM slots for Analytics page
    googletag.defineSlot('/12345678/Analytics_Top', [728, 90], 'div-gpt-ad-analytics-top').addService(googletag.pubads());
    googletag.defineSlot('/12345678/Analytics_Bottom', [300, 250], 'div-gpt-ad-analytics-bottom').addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
});

document.addEventListener('DOMContentLoaded', () => {
    initAnalytics();
    googletag.cmd.push(() => {
        googletag.display('div-gpt-ad-analytics-top');
        googletag.display('div-gpt-ad-analytics-bottom');
    });
});