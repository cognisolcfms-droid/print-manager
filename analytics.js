const DB_NAME = 'PrintingStoreDB';
const ORDERS_STORE = 'orders';
let myChart = null; 

/**
 * 1. Data Bridge Initialization
 */
async function initAnalytics() {
    console.log("Analytics: Initializing Data Bridge...");
    
    if (window.indexedDB) {
        const request = indexedDB.open(DB_NAME);

        request.onsuccess = (event) => {
            const db = event.target.result;
            
            if (db.objectStoreNames.contains(ORDERS_STORE)) {
                const transaction = db.transaction([ORDERS_STORE], 'readonly');
                const store = transaction.objectStore(ORDERS_STORE);
                const getRequest = store.getAll();

                getRequest.onsuccess = () => {
                    if (getRequest.result && getRequest.result.length > 0) {
                        console.log("Analytics: Local data found.");
                        renderUI(processRealData(getRequest.result));
                    } else {
                        loadJSONFallback(); 
                    }
                };
            } else {
                console.log("Analytics: Store not found. Loading Fallback.");
                loadJSONFallback(); 
            }
        };

        request.onerror = () => loadJSONFallback();
    } else {
        loadJSONFallback();
    }
}

/**
 * 2. Remote/Bot Fallback
 */
async function loadJSONFallback() {
    try {
        console.log("Analytics: Fetching dummy_data.json...");
        const response = await fetch('./dummy_data.json');
        const data = await response.json();
        
        // Match the dummy_data.json format to our UI needs
        const processedData = {
            labels: ["Digital Payment", "Cash", "Pending"],
            values: [
                data.orders.filter(o => o.grandTotal > 5000).reduce((s, o) => s + o.grandTotal, 0),
                data.orders.filter(o => o.grandTotal <= 5000).reduce((s, o) => s + o.grandTotal, 0),
                500 // Sample pending value
            ],
            services: [
                { name: "Premium Printing", count: 15, yield: 12500 },
                { name: "Bulk Photocopy", count: 45, yield: 2250 },
                { name: "Graphic Design", count: 5, yield: 7500 }
            ]
        };

        renderUI(processedData);
        console.log("Analytics: Fallback UI Rendered.");
    } catch (error) {
        console.error("Analytics Error:", error);
    }
}

/**
 * 3. Real Data Processing
 */
function processRealData(orders) {
    const paymentMap = orders.reduce((acc, o) => {
        const m = o.paymentMethod || 'Other';
        acc[m] = (acc[m] || 0) + (o.grandTotal || 0);
        return acc;
    }, {});

    return {
        labels: Object.keys(paymentMap),
        values: Object.values(paymentMap),
        services: [{ 
            name: "Local Operations", 
            count: orders.length, 
            yield: orders.reduce((s,o) => s + o.grandTotal, 0) 
        }]
    };
}

/**
 * 4. UI Rendering (Chart.js)
 */
function renderUI(data) {
    // Render Table
    const tableBody = document.getElementById('top-services-body');
    if(tableBody) {
        tableBody.innerHTML = data.services.map(s => `
            <tr>
                <td><strong>${s.name}</strong></td>
                <td class="text-center">${s.count}</td>
                <td class="text-right" style="color:#4361ee; font-weight:700;">
                    ₹${s.yield.toLocaleString('en-IN')}
                </td>
            </tr>
        `).join('');
    }

    // Render Chart
    const canvas = document.getElementById('revenueChart');
    if(canvas) {
        const ctx = canvas.getContext('2d');
        if (myChart) myChart.destroy();
        
        myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: ['#4361ee', '#4cc9f0', '#3f37c9', '#f72585'],
                    borderWidth: 0,
                    hoverOffset: 20
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
                cutout: '75%'
            }
        });
    }

    // Render Metrics
    const metricsDiv = document.getElementById('revenue-metrics');
    if(metricsDiv) {
        metricsDiv.innerHTML = data.labels.map((l, i) => `
            <div class="metric-item">
                <span class="metric-label">${l}</span>
                <span class="metric-value">₹${data.values[i].toLocaleString('en-IN')}</span>
            </div>
        `).join('');
    }
}

/**
 * 5. AdSense / GPT Setup
 */
window.googletag = window.googletag || {cmd: []};
googletag.cmd.push(function() {
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
