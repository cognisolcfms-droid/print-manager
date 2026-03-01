const DB_NAME = 'PrintingStoreDB';
const ORDERS_STORE = 'orders';
let myChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initAnalytics();

    document.getElementById('backBtn')
        ?.addEventListener('click', () => window.history.back());

    document.getElementById('exportBtn')
        ?.addEventListener('click', exportAnalytics);
});


/* ==============================
   MAIN INITIALIZER
================================= */

async function initAnalytics() {

    // 1️⃣ If IndexedDB not supported
    if (!window.indexedDB) {
        console.warn("IndexedDB not supported. Loading fallback data...");
        await loadFallbackData();
        return;
    }

    try {
        const request = indexedDB.open(DB_NAME);

        request.onsuccess = async (event) => {
            const db = event.target.result;

            // 2️⃣ If object store missing
            if (!db.objectStoreNames.contains(ORDERS_STORE)) {
                console.warn("Orders store not found. Loading fallback...");
                await loadFallbackData();
                return;
            }

            const tx = db.transaction([ORDERS_STORE], 'readonly');
            const store = tx.objectStore(ORDERS_STORE);
            const getAll = store.getAll();

            getAll.onsuccess = async () => {

                // 3️⃣ If no data available
                if (!getAll.result || getAll.result.length === 0) {
                    console.warn("No orders found. Loading fallback...");
                    await loadFallbackData();
                    return;
                }

                const processed = processData(getAll.result);
                renderUI(processed);
            };

            getAll.onerror = async () => {
                console.warn("Error reading DB. Loading fallback...");
                await loadFallbackData();
            };
        };

        request.onerror = async () => {
            console.warn("DB open failed. Loading fallback...");
            await loadFallbackData();
        };

    } catch (error) {
        console.error("Unexpected DB error:", error);
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

        if (!data.orders || data.orders.length === 0) {
            console.warn("Fallback JSON empty.");
            renderUI(processData([]));
            return;
        }

        const processed = processData(data.orders);
        renderUI(processed);

    } catch (error) {
        console.error("Fallback loading failed:", error);
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

    // KPI
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
    if (loader) loader.style.display = "none";

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


/* ==============================
   EXPORT PLACEHOLDER
================================= */

function exportAnalytics() {
    console.log("Export CSV triggered.");
}
