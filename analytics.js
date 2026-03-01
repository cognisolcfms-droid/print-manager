const DB_NAME = 'PrintingStoreDB';
const ORDERS_STORE = 'orders';
let myChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initAnalytics();

    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => window.history.back());
    }
});


/* ==============================
   MAIN INITIALIZER
================================= */

async function initAnalytics() {

    if (!window.indexedDB) {
        await loadFallbackData();
        return;
    }

    try {
        const request = indexedDB.open(DB_NAME);

        request.onsuccess = async (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(ORDERS_STORE)) {
                await loadFallbackData();
                return;
            }

            const tx = db.transaction([ORDERS_STORE], 'readonly');
            const store = tx.objectStore(ORDERS_STORE);
            const getAll = store.getAll();

            getAll.onsuccess = async () => {
                if (!getAll.result || getAll.result.length === 0) {
                    await loadFallbackData();
                    return;
                }

                renderUI(processData(getAll.result));
            };

            getAll.onerror = async () => {
                await loadFallbackData();
            };
        };

        request.onerror = async () => {
            await loadFallbackData();
        };

    } catch (error) {
        await loadFallbackData();
    }
}


/* ==============================
   FALLBACK LOADER
================================= */

async function loadFallbackData() {
    try {
        const response = await fetch('./dummy_data.json');
        const data = await response.json();
        renderUI(processData(data.orders || []));
    } catch (error) {
        renderUI(processData([]));
    }
}


/* ==============================
   DATA PROCESSOR
================================= */

function processData(orders) {

    const totalRevenue = orders.reduce(
        (sum, order) => sum + (order.grandTotal || 0),
        0
    );

    const totalOrders = orders.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const paymentMap = {};

    orders.forEach(order => {
        const method = order.paymentMethod || "Other";
        paymentMap[method] =
            (paymentMap[method] || 0) + (order.grandTotal || 0);
    });

    return {
        totalRevenue,
        totalOrders,
        avgOrder,
        labels: Object.keys(paymentMap),
        values: Object.values(paymentMap)
    };
}


/* ==============================
   UI RENDERER
================================= */

function renderUI(data) {

    document.getElementById('kpi-total-revenue').textContent =
        `₹${data.totalRevenue.toLocaleString('en-IN')}`;

    document.getElementById('kpi-total-orders').textContent =
        data.totalOrders;

    document.getElementById('kpi-avg-order').textContent =
        `₹${Math.round(data.avgOrder).toLocaleString('en-IN')}`;

    document.getElementById('kpi-net-profit').textContent =
        `₹${data.totalRevenue.toLocaleString('en-IN')}`;

    renderChart(data.labels, data.values);
}


/* ==============================
   CHART RENDERER
================================= */

function renderChart(labels, values) {

    const loader = document.getElementById('chart-loader');
    if (loader) loader.classList.add('hidden');

    const canvas = document.getElementById('revenueChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['No Data'],
            datasets: [{
                data: values.length ? values : [1],
                backgroundColor: ['#4361ee', '#4cc9f0', '#3f37c9', '#f72585']
            }]
        },
        options: {
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}
