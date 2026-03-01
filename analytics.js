/**
 * CogniSol CFMS: Advanced Analytics Bridge
 * Developed for: Business Insights UI
 * Date: 2026-03-01
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
            // UI Components
            servicesTable: document.getElementById('top-services-body'),
            metricsSummary: document.getElementById('revenue-metrics')
        },

        async init() {
            this.bindEvents();
            await this.loadData();
        },

        bindEvents() {
            // Navigation
            this.elements.backBtn.addEventListener('click', () => {
                window.history.back();
            });

            // Filter Change
            this.elements.dateFilter.addEventListener('change', () => {
                this.loadData(); 
            });
        },

        async loadData() {
            this.toggleLoader(true);
            
            try {
                // Fetch from your dummy-data.json
                const response = await fetch('dummy-data.json');
                if (!response.ok) throw new Error('Data fetch failed');
                const data = await response.json();

                // Process UI components
                this.updateKPIs(data.orders);
                this.renderServicesTable(data.analytics.services);
                this.renderRevenueMetrics(data.analytics.revenue);
                this.initChart(data.analytics.revenue);

            } catch (error) {
                console.error("Analytics Error:", error);
                this.elements.servicesTable.innerHTML = `<tr><td colspan="3" class="text-center">Failed to load analytics data.</td></tr>`;
            } finally {
                this.toggleLoader(false);
            }
        },

        /**
         * Dynamic KPI calculation from the orders array
         */
        updateKPIs(orders) {
            const totalRevenue = orders.reduce((sum, ord) => sum + ord.grandTotal, 0);
            const orderCount = orders.length;
            const avgOrder = totalRevenue / orderCount;
            const netProfit = totalRevenue * 0.65; // Example 65% margin logic

            this.elements.kpiRevenue.textContent = `₹${totalRevenue.toLocaleString()}`;
            this.elements.kpiOrders.textContent = orderCount;
            this.elements.kpiAvg.textContent = `₹${avgOrder.toFixed(2)}`;
            this.elements.kpiNet.textContent = `₹${netProfit.toLocaleString()}`;
        },

        /**
         * Populates the "Top Performing Services" table
         */
        renderServicesTable(services) {
            this.elements.servicesTable.innerHTML = services.map(service => `
                <tr>
                    <td>${service.name}</td>
                    <td class="text-center">${service.count.toLocaleString()}</td>
                    <td class="text-right">
                        <span class="badge">${service.yield}</span>
                    </td>
                </tr>
            `).join('');
        },

        /**
         * Populates the revenue distribution metrics summary
         */
        renderRevenueMetrics(revenueData) {
            this.elements.metricsSummary.innerHTML = revenueData.map(item => `
                <div class="metric-item">
                    <span class="metric-label">${item.label}</span>
                    <span class="metric-value">${item.value}</span>
                </div>
            `).join('');
        },

        /**
         * Initializes Chart.js using JSON data
         */
        initChart(revenueData) {
            if (this.chart) this.chart.destroy();

            const ctx = this.elements.revenueChart.getContext('2d');
            
            // Extract numerical values from strings like "₹ 92,450.00"
            const chartLabels = revenueData.map(r => r.label);
            const chartValues = revenueData.map(r => 
                parseFloat(r.value.replace(/[₹, ]/g, ''))
            );

            this.chart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        data: chartValues,
                        backgroundColor: ['#4361ee', '#4cc9f0', '#3f37c9'],
                        borderWidth: 2,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    },
                    cutout: '70%'
                }
            });
        },

        toggleLoader(show) {
            if (this.elements.loader) {
                this.elements.loader.style.display = show ? 'flex' : 'none';
            }
        }
    };

    AnalyticsApp.init();
});
