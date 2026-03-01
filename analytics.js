const DB_NAME = 'PrintingStoreDB';
const ORDERS_STORE = 'orders';
let myChart = null; 

/**
 * 1. Entry Point
 * Tries to load local data, otherwise fetches the JSON fallback
 */
async function initAnalytics() {
    console.log("Analytics: Initializing Data Bridge...");
    
    // Explicitly check for IndexedDB support
    if (!window.indexedDB) {
        console.warn("No IndexedDB support. Loading JSON fallback.");
        loadJSONFallback();
        return;
    }

    const request = indexedDB.open(DB_NAME);

    request.onsuccess = (event) => {
        const db = event.target.result;
        
        // If the store doesn't exist (e.g. Bot view on GitHub), load JSON
        if (!db.objectStoreNames.contains(ORDERS_STORE)) {
            console.log("Store not found. Loading JSON fallback for Bot/Remote view.");
            loadJSONFallback();
            return;
        }

        const transaction = db.transaction([ORDERS_STORE], 'readonly');
        const store = transaction.objectStore(ORDERS_STORE);
        const getRequest = store.getAll();

        getRequest.onsuccess = () => {
            if (getRequest.result && getRequest.result.length > 0) {
                console.log("Real store data found.");
                const processed = processRealData(getRequest.result);
                renderUI(processed);
            } else {
                console.log("Store empty. Loading JSON fallback.");
                loadJSONFallback();
            }
        };
    };

    request.onerror = () => {
        console.error("IndexedDB access error. Loading JSON fallback.");
        loadJSONFallback();
    };
}

/**
 * 2. The JSON Fallback Bridge
 * Fetches data from your external dummy_data.json file
 */
async function loadJSONFallback() {
    try {
        const response = await fetch('./dummy_data.json');
        if (!response.ok) throw new Error("JSON file not found at root.");
        
        const data = await response.json();
        console.log("CogniSol CFMS: Successfully loaded dummy_data.json");

        // Format the JSON data to match the UI requirements
        const fallbackProcessed = {
            labels: data.analytics.revenue.map(r => r.label),
            values: data.analytics.revenue.map(r => parseFloat(r.value.replace(/[₹, ]/g, ''))),
            services: data.analytics.services
        };

        renderUI(fallbackProcessed);
    } catch (error) {
        console.error("Critical: Could not load dummy_data.json", error);
        // Display empty state to prevent UI crash
        renderUI({ labels: [], values: [], services: [] });
    }
}

/**
 * 3. Real Data Processing
 * Converts raw IndexedDB orders into Chart and Table formats
 */
function processRealData(orders) {
    const paymentMap = orders.reduce((acc, o) => {
        const m = o.paymentMethod || 'Other';
        acc[m] = (acc[m] || 0) + (o.grandTotal || 0);
        return acc;
    }, {});

    // For simplicity, we create dummy service yield from real orders
    // In a full build, you would iterate through order.items
    const labels = Object.keys(paymentMap);
    const values = Object.values(paymentMap);

    return {
        labels: labels,
        values: values,
        services: [
            { name: "Real Time Sales", count: orders.length, yield: orders.reduce((s,o)=>s+o.grandTotal, 0) }
        ]
    };
}

/**
 * 4. UI Rendering (Charts & Tables)
 */
function renderUI(data) {
    // 1. Table Rendering
    const tableBody = document.getElementById('top-services-body');
    if (data.services.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">No data available</td></tr>';
    } else {
        tableBody.innerHTML = data.services.map(s => `
            <tr>
                <td><strong>${s.name}</strong></td>
                <td class="text-center">${s.count}</td>
                <td class="text-right" style="color:var(--primary); font-weight:700;">
                    ${typeof s.yield === 'string' ? s.yield : '₹' + s.yield.toLocaleString('en-IN')}
                </td>
            </tr>
        `).join('');
    }

    // 2. Chart.js Rendering
    const ctx = document.getElementById('revenueChart').getContext('2d');
    if (myChart) myChart.destroy();
    
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: ['#4361ee', '#4cc9f0', '#3f37c9', '#f72585'],
                borderWidth: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
            },
            cutout: '70%'
        }
    });

    // 3. Text Summary
    const metricsDiv = document.getElementById('revenue-metrics');
    metricsDiv.innerHTML = data.labels.map((l, i) => `
        <div class="metric-item">
            <span class="metric-label">${l}</span>
            <span class="metric-value">₹${data.values[i].toLocaleString('en-IN')}</span>
        </div>
    `).join('');
}

// 5. AdSense / GPT Setup
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
