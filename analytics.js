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

                // Real DB data
                const processed = processOrderData(getAll.result);
                renderUI(processed);
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
   FALLBACK LOADER (YOUR JSON)
================================= */

async function loadFallbackData() {
    try {
        const response = await fetch('./dummy_data.json');
        const data = await response.json();

        const processed = processDummyData(data);
        renderUI(processed);

    } catch (error) {
        console.error("Fallback failed:", error);
        renderUI(emptyState());
    }
}

/* ==============================
   PROCESS REAL DB DATA
================================= */

function processOrderData(orders) {

    const totalRevenue = orders.reduce(
        (sum, o) => sum + (o.grandTotal || 0),
        0
    );

    const totalOrders = orders.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
        totalRevenue,
        totalOrders,
        avgOrder,
        chartLabels: ["Total Revenue"],
        chartValues: [totalRevenue],
        services: []
    };
}

/* ==============================
   PROCESS YOUR DUMMY JSON
================================= */

function processDummyData(data) {

    const orders = data.orders || [];
    const analytics = data.analytics || {};

    const totalRevenue = orders.reduce(
        (sum, o) => sum + (o.grandTotal || 0),
        0
    );

    const totalOrders = orders.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Revenue Chart
    const chartLabels = (analytics.revenue || []).map(r => r.label);
    const chartValues = (analytics.revenue || []).map(r =>
        parseFloat(r.value.replace(/[₹,\s]/g, ''))
    );

    return {
        totalRevenue,
        totalOrders,
        avgOrder,
        chartLabels,
        chartValues,
        services: analytics.services || []
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

    renderChart(data.chartLabels, data.chartValues);
    renderServices(data.services);
}

/* ==============================
   RENDER CHART
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

/* ==============================
   RENDER SERVICES TABLE
================================= */

function renderServices(services) {

    const tableBody = document.getElementById('top-services-body');
    if (!tableBody) return;

    if (!services.length) {
        tableBody.innerHTML =
            `<tr><td colspan="3" class="text-center">No Data</td></tr>`;
        return;
    }

    tableBody.innerHTML = services.map(service => `
        <tr>
            <td><strong>${service.name}</strong></td>
            <td class="text-center">${service.count}</td>
            <td class="text-right">${service.yield}</td>
        </tr>
    `).join('');
}

/* ==============================
   EMPTY STATE
================================= */

function emptyState() {
    return {
        totalRevenue: 0,
        totalOrders: 0,
        avgOrder: 0,
        chartLabels: [],
        chartValues: [],
        services: []
    };
}
