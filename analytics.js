/**
 * CogniSol CFMS: Advanced Analytics Bridge
 * Developed for: Business Insights UI
 * Logic: Production Data -> Fallback to dummy-data.json
 */

document.addEventListener('DOMContentLoaded', () => {
    const AnalyticsApp = {
        chart: null,
        
        elements: {
            backBtn: document.getElementById('backBtn'),
            dateFilter: document.getElementById('date-filter'),
            loader: document.getElementById('chart-loader'),
            revenueChart: document.getElementById('revenueChart'),
            kpiRevenue: document.getElementById('kpi-total-revenue'),
            kpiOrders: document.getElementById('kpi-total-orders'),
            kpiAvg: document.getElementById('kpi-avg-order'),
            kpiNet: document.getElementById('kpi-net-profit'),
            servicesTable: document.getElementById('top-services-body'),
            metricsSummary: document.getElementById('revenue-metrics')
        },

        async init() {
            this.bindEvents();
            await this.refreshDashboard();
        },

        bindEvents() {
            this.elements.backBtn.onclick = () => window.history.back();
            this.elements.dateFilter.onchange = () => this.refreshDashboard();
        },

        /**
         * Orchestrates data fetching with fallback bridge logic
         */
        async refreshDashboard() {
            this.toggleLoader(true);
            let data = null;

            try {
                // Primary Bridge: Attempt to fetch live data (Placeholder for your API)
                // data = await this.fetchLiveAnalytics(); 
                
                if (!data) {
                    console.warn("Live data unavailable. Engaging dummy-data.json fallback.");
                    const response = await fetch('dummy-data.json');
                    if (!response.ok) throw new Error("Fallback data source failed.");
                    data = await response.json();
                }

                this.renderUI(data);

            } catch (error) {
                console.error("Critical Analytics Error:", error);
                this.elements.servicesTable.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 20px;">Data source unreachable. Please check connection.</td></tr>`;
            } finally {
                this.toggleLoader(false);
            }
        },

        renderUI(data) {
            // 1. Process KPIs from the 'orders' array
            this.calculateKPIs(data.orders);

            // 2. Populate Top Services Table from 'analytics.services'
            this.renderTable(data.analytics.services);

            // 3. Populate Bottom Metrics from 'analytics.revenue'
            this.renderMetrics(data.analytics.revenue);

            // 4. Initialize Chart from 'analytics.revenue'
            this.renderChart(data.analytics.revenue);
        },

        calculateKPIs(orders) {
            const totalRevenue = orders.reduce((acc, obj) => acc + obj.grandTotal, 0);
            const orderCount = orders.length;
            const avgOrder = orderCount > 0 ? (totalRevenue / orderCount) : 0;

            this.elements.kpiRevenue.textContent = `₹${totalRevenue.toLocaleString()}`;
            this.elements.kpiOrders.textContent = orderCount;
            this.elements.kpiAvg.textContent = `₹${avgOrder.toFixed(2)}`;
            // Net Profit estimation (approx 65% after expenses)
            this.elements.kpiNet.textContent = `₹${(totalRevenue * 0.65).toLocaleString()}`;
        },

        renderTable(services) {
            this.elements.servicesTable.innerHTML = services.map(service => `
                <tr>
                    <td>${service.name}</td>
                    <td class="text-center">${service.count.toLocaleString()}</td>
                    <td class="text-right"><span class="badge">${service.yield}</span></td>
                </tr>
            `).join('');
        },

        renderMetrics(revenueData) {
            this.elements.metricsSummary.innerHTML = revenueData.map(item => `
                <div class="metric-item">
                    <span class="metric-label">${item.label}</span>
                    <span class="metric-value">${item.value}</span>
                </div>
            `).join('');
        },

        renderChart(revenueData) {
            if (this.chart) this.chart.destroy();

            const labels = revenueData.map(r => r.label);
            // Parse numerical values from strings like "₹ 92,450.00"
            const values = revenueData.map(r => parseFloat(r.value.replace(/[₹, ]/g, '')));

            const ctx = this.elements.revenueChart.getContext('2d');
            this.chart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: ['#4361ee', '#4cc9f0', '#3f37c9'],
                        hoverOffset: 10,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
                    },
                    cutout: '75%'
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
