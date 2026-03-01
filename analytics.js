/**
 * CogniSol CFMS: Analytics Bridge Logic
 * Handles Chart.js initialization, KPI updates, and data filtering.
 */

document.addEventListener('DOMContentLoaded', () => {
    const AnalyticsApp = {
        chart: null,
        
        // Element Selectors
        elements: {
            backBtn: document.getElementById('backBtn'),
            dateFilter: document.getElementById('date-filter'),
            loader: document.getElementById('chart-loader'),
            revenueChart: document.getElementById('revenueChart'),
            // KPIs
            kpiRevenue: document.getElementById('kpi-total-revenue'),
            kpiOrders: document.getElementById('kpi-total-orders'),
            kpiAvg: document.getElementById('kpi-avg-order'),
            kpiNet: document.getElementById('kpi-net-profit'),
            // Lists
            servicesTable: document.getElementById('top-services-body'),
            metricsSummary: document.getElementById('revenue-metrics')
        },

        init() {
            this.bindEvents();
            this.loadDashboardData(this.elements.dateFilter.value);
        },

        bindEvents() {
            // Navigation
            this.elements.backBtn.addEventListener('click', () => {
                window.history.back();
            });

            // Filtering
            this.elements.dateFilter.addEventListener('change', (e) => {
                this.loadDashboardData(e.target.value);
            });
        },

        async loadDashboardData(days) {
            this.toggleLoader(true);
            
            // Simulate API Latency
            const data = await this.fetchAnalyticsData(days);
            
            this.updateKPIs(data.stats);
            this.renderTable(data.topServices);
            this.renderChart(data.chartData);
            this.renderMetricsSummary(data.metrics);
            
            this.toggleLoader(false);
        },

        // --- Bridge Logic: Data Fetching ---
        async fetchAnalyticsData(days) {
            // In a real MV3 app, this would use fetch() or chrome.storage
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        stats: {
                            totalRevenue: `₹${(days * 1250).toLocaleString()}`,
                            totalOrders: days * 12,
                            avgOrder: `₹${(Math.random() * 500 + 500).toFixed(2)}`,
                            netProfit: `₹${(days * 850).toLocaleString()}`
                        },
                        topServices: [
                            { name: 'Cloud Migration', orders: days * 3, yield: 'High' },
                            { name: 'Security Audit', orders: days * 2, yield: 'Medium' },
                            { name: 'AI Integration', orders: Math.floor(days * 1.5), yield: 'Premium' }
                        ],
                        metrics: [
                            { label: 'Growth', value: '+12.5%' },
                            { label: 'Churn', value: '1.2%' },
                            { label: 'Retention', value: '94%' }
                        ],
                        chartData: {
                            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                            values: [3000, 4500, 3200, 5000]
                        }
                    });
                }, 800);
            });
        },

        // --- UI Rendering Methods ---
        updateKPIs(stats) {
            this.elements.kpiRevenue.textContent = stats.totalRevenue;
            this.elements.kpiOrders.textContent = stats.totalOrders;
            this.elements.kpiAvg.textContent = stats.avgOrder;
            this.elements.kpiNet.textContent = stats.netProfit;
        },

        renderTable(services) {
            this.elements.servicesTable.innerHTML = services.map(s => `
                <tr>
                    <td>${s.name}</td>
                    <td class="text-center">${s.orders}</td>
                    <td class="text-right"><span class="badge">${s.yield}</span></td>
                </tr>
            `).join('');
        },

        renderMetricsSummary(metrics) {
            this.elements.metricsSummary.innerHTML = metrics.map(m => `
                <div class="metric-item">
                    <span class="metric-label">${m.label}</span>
                    <span class="metric-value">${m.value}</span>
                </div>
            `).join('');
        },

        renderChart(data) {
            if (this.chart) {
                this.chart.destroy();
            }

            const ctx = this.elements.revenueChart.getContext('2d');
            
            // Check if Chart.js is loaded (since it's deferred)
            if (typeof Chart === 'undefined') return;

            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Revenue',
                        data: data.values,
                        borderColor: '#4361ee',
                        backgroundColor: 'rgba(67, 97, 238, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { display: false } },
                        x: { grid: { display: false } }
                    }
                }
            });
        },

        toggleLoader(show) {
            this.elements.loader.style.display = show ? 'flex' : 'none';
        }
    };

    AnalyticsApp.init();
});
