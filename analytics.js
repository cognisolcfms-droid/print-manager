const DB_NAME = 'PrintingStoreDB';
const ORDERS_STORE = 'orders';
let myChart = null; // Global chart instance

async function initAnalytics() {
    if (!window.indexedDB) {
        loadJSONFallback();
        return;
    }

    const request = indexedDB.open(DB_NAME);
    request.onsuccess = (event) => {
        const db = event.target.result;
        if (db.objectStoreNames.contains(ORDERS_STORE)) {
            const transaction = db.transaction([ORDERS_STORE], 'readonly');
            const store = transaction.objectStore(ORDERS_STORE);
            const getRequest = store.getAll();

            getRequest.onsuccess = () => {
                if (getRequest.result && getRequest.result.length > 0) {
                    const processed = processRealData(getRequest.result);
                    renderUI(processed);
                } else { loadJSONFallback(); }
            };
        } else { loadJSONFallback(); }
    };
}

function processRealData(orders) {
    const paymentMap = orders.reduce((acc, o) => {
        const m = o.paymentMethod || 'Other';
        acc[m] = (acc[m] || 0) + (o.grandTotal || 0);
        return acc;
    }, {});

    const serviceMap = {};
    orders.forEach(o => {
        if (o.items) {
            o.items.forEach(i => {
                const name = i.serviceName || 'Standard';
                if (!serviceMap[name]) serviceMap[name] = { count: 0, yield: 0 };
                serviceMap[name].count += 1;
                serviceMap[name].yield += (i.price || 0);
            });
        }
    });

    return {
        labels: Object.keys(paymentMap),
        values: Object.values(paymentMap),
        services: Object.keys(serviceMap).map(n => ({
            name: n, count: serviceMap[n].count, yield: serviceMap[n].yield
        })).sort((a,b) => b.count - a.count).slice(0, 5)
    };
}

function renderUI(data) {
    // 1. Render Table
    const tableBody = document.getElementById('top-services-body');
    tableBody.innerHTML = data.services.map(s => `
        <tr>
            <td><strong>${s.name}</strong></td>
            <td class="text-center">${s.count}</td>
            <td class="text-right" style="color:var(--primary); font-weight:700;">₹${s.yield.toLocaleString('en-IN')}</td>
        </tr>
    `).join('');

    // 2. Render Modern Chart using Chart.js
    const ctx = document.getElementById('revenueChart').getContext('2d');
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
            cutout: '70%'
        }
    });

    // 3. Update Text Summary
    const metricsDiv = document.getElementById('revenue-metrics');
    metricsDiv.innerHTML = data.labels.map((l, i) => `
        <div class="metric-item">
            <span class="metric-label">${l}</span>
            <span class="metric-value">₹${data.values[i].toLocaleString('en-IN')}</span>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', initAnalytics);
