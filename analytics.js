const DB_NAME = 'PrintingStoreDB';
const ORDERS_STORE = 'orders';
let myChart = null; 

async function initAnalytics() {
    // 1. Try to access local IndexedDB first
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
                        return renderUI(processRealData(getRequest.result));
                    }
                    loadJSONFallback(); // Fallback if DB is empty
                };
            } else { loadJSONFallback(); }
        };
        request.onerror = () => loadJSONFallback();
    } else { loadJSONFallback(); }
}

async function loadJSONFallback() {
    try {
        const response = await fetch('./dummy_data.json');
        const data = await response.json();
        renderUI({
            labels: data.analytics.revenue.map(r => r.label),
            values: data.analytics.revenue.map(r => parseFloat(r.value.replace(/[₹, ]/g, ''))),
            services: data.analytics.services
        });
    } catch (e) { console.error("Data failure", e); }
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
        services: [{ name: "Extension Sales", count: orders.length, yield: orders.reduce((s,o)=>s+o.grandTotal, 0) }]
    };
}

function renderUI(data) {
    const tableBody = document.getElementById('top-services-body');
    tableBody.innerHTML = data.services.map(s => `
        <tr>
            <td><strong>${s.name}</strong></td>
            <td class="text-center">${s.count}</td>
            <td class="text-right" style="color:#4361ee; font-weight:700;">
                ${typeof s.yield === 'string' ? s.yield : '₹' + s.yield.toLocaleString('en-IN')}
            </td>
        </tr>
    `).join('');

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
            plugins: { legend: { position: 'bottom' } },
            cutout: '70%'
        }
    });

    document.getElementById('revenue-metrics').innerHTML = data.labels.map((l, i) => `
        <div class="metric-item">
            <span class="metric-label">${l}</span>
            <span class="metric-value">₹${data.values[i].toLocaleString('en-IN')}</span>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', initAnalytics);
