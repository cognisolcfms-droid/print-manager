/**
 * CogniSol | CFMS - Analytics Engine (Clean Version)
 */

const DB_NAME = 'PrintingStoreDB';
const ORDERS_STORE = 'orders';
let myChart = null; 

async function initAnalytics() {
    console.log("Analytics: Initializing Data Bridge (Ads Disabled)...");
    
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
                        renderUI(processRealData(getRequest.result));
                    } else {
                        loadJSONFallback(); 
                    }
                };
            } else {
                loadJSONFallback(); 
            }
        };
        request.onerror = () => loadJSONFallback();
    } else {
        loadJSONFallback();
    }
}

async function loadJSONFallback() {
    try {
        const response = await fetch('./dummy_data.json');
        const data = await response.json();
        
        // Calculate totals based on the dummy_data.json structure
        const digitalTotal = data.orders.filter(o => o.grandTotal > 5000).reduce((s, o) => s + o.grandTotal, 0);
        const cashTotal = data.orders.filter(o => o.grandTotal <= 5000).reduce((s, o) => s + o.grandTotal, 0);

        const processedData = {
            labels: ["Digital Payment", "Cash"],
            values: [digitalTotal, cashTotal],
            services: [
                { name: "Premium Printing", count: 12, yield: 15400 },
                { name: "Standard Copy", count: 85, yield: 4250 }
            ]
        };

        renderUI(processedData);
    } catch (error) {
        console.error("Analytics Error:", error);
    }
}

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
            name: "Current Operations", 
            count: orders.length, 
            yield: orders.reduce((s,o) => s + o.grandTotal, 0) 
        }]
    };
}

function renderUI(data) {
    // 1. Render Table
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

    // 2. Render Chart
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
                    hoverOffset: 15
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: { 
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } 
                },
                cutout: '72%'
            }
        });
    }

    // 3. Render Metrics
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

// Start once DOM is ready
document.addEventListener('DOMContentLoaded', initAnalytics);
