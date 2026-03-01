const DB_NAME = 'PrintingStoreDB';
const ORDERS_STORE = 'orders';
let myChart = null; 

/**
 * 1. Data Initialization Bridge
 */
async function initAnalytics() {
    console.log("Analytics: Initializing Data Bridge...");
    
    if (!window.indexedDB) {
        loadJSONFallback();
        return;
    }

    const request = indexedDB.open(DB_NAME);

    request.onsuccess = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(ORDERS_STORE)) {
            console.log("Store not found. Loading JSON fallback.");
            loadJSONFallback();
            return;
        }

        const transaction = db.transaction([ORDERS_STORE], 'readonly');
        const store = transaction.objectStore(ORDERS_STORE);
        const getRequest = store.getAll();

        getRequest.onsuccess = () => {
            if (getRequest.result && getRequest.result.length > 0) {
                renderUI(processRealData(getRequest.result));
            } else {
                loadJSONFallback();
            }
        };
    };

    request.onerror = () => loadJSONFallback();
}

/**
 * 2. Fallback Logic
 */
async function loadJSONFallback() {
    try {
        const response = await fetch('./dummy_data.json');
        if (!response.ok) throw new Error("Fallback data missing.");
        
        const data = await response.json();
        console.log("CogniSol CFMS: Successfully loaded dummy_data.json");

        const processed = {
            labels: data.analytics.revenue.map(r => r.label),
            values: data.analytics.revenue.map(r => parseFloat(r.value.replace(/[₹, ]/g, ''))),
            services: data.analytics.services
        };

        renderUI(processed);
    } catch (error) {
        console.error("Bridge Failure:", error);
        renderUI({ labels: [], values: [], services: [] });
    }
}

/**
 * 3. Data Processor
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
        services: [
            { 
                name: "Real Time Sales", 
                count: orders.length, 
                yield: orders.reduce((s,o) => s + (o.grandTotal || 0), 0) 
            }
        ]
    };
}

/**
 * 4. UI Rendering
 */
function renderUI(data) {
    // Table
    const tableBody = document.getElementById('top-services-body');
    if (data.services.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">No data available</td></tr>';
    } else {
        tableBody.innerHTML = data.services.map(s => `
            <tr>
                <td><strong>${s.name}</strong></td>
                <td class="text-center">${s.count}</td>
                <td class="text-right" style="color:#4361ee; font-weight:700;">
                    ${typeof s.yield === 'string' ? s.yield : '₹' + s.yield.toLocaleString('en-IN')}
                </td>
            </tr>
        `).join('');
    }

    // Chart
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
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
            cutout: '75%'
        }
    });

    // Metrics Text
    const metricsDiv = document.getElementById('revenue-metrics');
    metricsDiv.innerHTML = data.labels.map((l, i) => `
        <div class="metric-item">
            <span class="metric-label">${l}</span>
            <span class="metric-value">₹${data.values[i].toLocaleString('en-IN')}</span>
        </div>
    `).join('');
}

/**
 * 5. Google Ad Management
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
