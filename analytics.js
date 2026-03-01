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

/* ==========================================
   MAIN INITIALIZER
========================================== */

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

                const processed = processDBData(getAll.result);
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

/* ==========================================
   PROCESS REAL DB DATA
========================================== */

function processDBData(orders) {

    const totalRevenue = orders.reduce(
        (sum, order) => sum + (order.grandTotal || 0),
        0
    );

    const totalOrders = orders.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Generate service ranking based on customerName
    const serviceMap = {};

    orders.forEach(order => {
        const name = order.customerName || "General Orders";

        if (!serviceMap[name]) {
            serviceMap[name] = {
                name,
                count: 0,
                total: 0
            };
        }

        serviceMap[name].count += 1;
        serviceMap[name].total += (order.grandTotal || 0);
    });

    const services = Object.values(serviceMap)
        .sort((a, b) => b.total - a.total)
        .map(service => ({
            name: service.name,
            count: service.count,
            yield: `₹ ${service.total.toLocaleString('en-IN')}`
        }));

    return {
        totalRevenue,
        totalOrders,
        avgOrder,
        chartLabels: ["Total Revenue"],
        chartValues: [totalRevenue],
        services
    };
}

/* ==========================================
   FALLBACK USING dummy_data.json
========================================== */

async function loadFallbackData() {
    try {
        const response = await fetch('./dummy_data.json');
        const data = await response.json();

        const orders = data.orders || [];
        const analytics = data.analytics || {};

        const totalRevenue = orders.reduce(
            (sum, order) => sum + (order.grandTotal || 0),
            0
        );

        const totalOrders = orders.length;
        const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        const chartLabels = (analytics.revenue || []).map(r => r.label);

        const chartValues = (analytics.revenue || []).map(r =>
            parseFloat(r.value.replace(/[₹,\s]/g, ''))
        );

        const services = (analytics.services || []).map(service => ({
            name: service.name,
            count: service.count,
            yield: service.yield
        }));

        renderUI({
            totalRevenue,
            totalOrders,
            avgOrder,
            chartLabels,
            chartValues,
            services
        });

    } catch (error) {
        console.error("Fallback failed:", error);
        renderUI(emptyState());
    }
}

/* ==========================================
   RENDER UI
========================================== */

function renderUI(data) {

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

/* ==========================================
   RENDER CHART
========================================== */

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

/* ==========================================
   RENDER SERVICES TABLE
========================================== */

function renderServices(services) {

    const tableBody = document.getElementById('top-services-body');
    if (!tableBody) return;

    if (!services || services.length === 0) {
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

/* ==========================================
   EMPTY STATE
========================================== */

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
