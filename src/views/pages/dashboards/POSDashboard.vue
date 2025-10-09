<script setup>
import { POSService } from '@/services/POSService';
import { formatDate } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/formatters';
import { onMounted, ref } from 'vue';
// Initialize the exporting module
//exportingInit(Highcharts);

// Reactive data
const dateRange = ref(null);
const stats = ref({});
const salesLast30DaysChartOptions = ref({});
const salesCurrentYearChartOptions = ref({});
const salesPaymentDue = ref([]);
const productStockAlert = ref([]);
const salesOrders = ref([]);
const pendingShipments = ref([]);
const chart1Data = ref([]);
const chartOptions = ref({});
const chart2Data = ref([]);
const isLoading = ref(true);
const hasError = ref(false);

onMounted(() => {
    fetchDashboardData();
});
const formatCamelCase = (str) => {
    return str
        .replace(/_/g, ' ') // Replace underscores with spaces
        .toLowerCase() // Convert to lowercase
        .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
};
// Fetch dashboard data
const fetchDashboardData = async () => {
    isLoading.value = true;
    hasError.value = false;
    try {
        const params = {
            start_date: dateRange.value ? dateRange.value[0].toISOString().split('T')[0] : null,
            end_date: dateRange.value ? dateRange.value[1].toISOString().split('T')[0] : null
        };

        const response = await POSService.getDashboardStats(params);
        const data = response.data;

        // Update reactive data with safe fallbacks
        stats.value = data.stats || {};
        salesPaymentDue.value = data.sales_payment_due || [];
        productStockAlert.value = data.product_stock_alert || [];
        salesOrders.value = data.sales_orders || [];
        pendingShipments.value = data.pending_shipments || [];

        const last_30_days_dates = Object.keys(data.sales_last_30_days || {});
        const current_year_dates = Object.keys(data.sales_current_year || {});

        // Update charts with safe fallbacks
        chart1Data.value = setChartData(Object.values(data.sales_last_30_days || {}), last_30_days_dates, 'Last 30 Days');
        chart2Data.value = setChartData(Object.values(data.sales_current_year || {}), current_year_dates, 'Current Financial Year');
        chartOptions.value = setChartOptions();
        // Chart options
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        hasError.value = true;
    } finally {
        isLoading.value = false;
    }
};
//chart 1
const setChartData = (data, labels, title) => {
    const documentStyle = getComputedStyle(document.documentElement);

    return {
        labels: labels,
        datasets: [
            {
                label: title,
                fill: false,
                borderColor: documentStyle.getPropertyValue('--p-cyan-500'),
                yAxisID: 'y',
                tension: 0.4,
                data: data
            }
        ]
    };
};
const setChartOptions = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');
    return {
        stacked: false,
        maintainAspectRatio: false,
        aspectRatio: 0.6,
        plugins: {
            legend: {
                labels: {
                    color: textColor
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder
                }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    drawOnChartArea: false,
                    color: surfaceBorder
                }
            }
        }
    };
};
// Function to return a matching icon
const getIcon = (key) => {
    const icons = {
        total_sales: 'pi pi-shopping-cart',
        net_sales: 'pi pi-chart-line',
        invoice_due: 'pi pi-credit-card',
        total_sell_retrn: 'pi pi-refresh',
        total_purchase: 'pi pi-truck',
        purchase_due: 'pi pi-money-bill',
        total_purchase_return: 'pi pi-undo',
        total_expense: 'pi pi-wallet'
    };
    return icons[key] || 'pi pi-info-circle';
};
</script>

<template>
    <div class="p-4">
        <!-- Date Filter -->
        <div class="flex justify-center font-bold bg-primary text text-white h-10">
            <h2 class="text-xl primary-text text-white pt-2">POS DASHBOARD</h2>
        </div>

        <!-- Toolbar Section -->
        <Toolbar class="mb-0">
            <template #end>
                <div class="mb-0">
                    <label for="dateRange" class="block text-sm font-medium text-gray-700">Filter By Date Range</label>
                    <Calendar v-model="dateRange" selectionMode="range" :manualInput="false" class="w-full md:w-48" @date-select="fetchDashboardData" />
                </div>
            </template>
        </Toolbar>

        <!-- Loading/Error States -->
        <div v-if="isLoading" class="text-center py-8">
            <div class="flex items-center justify-center">
                <i class="pi pi-spin pi-spinner text-4xl text-blue-500 mr-3"></i>
                <p class="text-lg">Loading dashboard data...</p>
            </div>
        </div>

        <div v-if="hasError" class="text-center py-8">
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <p class="text-red-700 mb-4">Failed to load dashboard data. Please try again.</p>
                <Button label="Retry" icon="pi pi-refresh" @click="fetchDashboardData" severity="danger" />
            </div>
        </div>

        <!-- Section 1: Stats -->
        <div class="p-4">
            <!-- Section 1: Stats -->
            <div class="card bg-white p-4 rounded-lg shadow-md justify-center items-center">
                <p class="text-lg font-bold justify-center items-center">POS STATS</p>
                <hr class="my-2" />
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div v-for="(value, key) in stats" :key="key" class="card p-4 shadow-md flex items-center space-x-4">
                        <!-- Icon Container -->
                        <div class="w-14 h-14 flex items-center justify-center rounded-full bg-blue-200 text-blue-600 text-xl">
                            <!-- Dynamic Icon Based on Key -->
                            <i :class="getIcon(key)" class="text-2xl" />
                        </div>

                        <!-- Content -->
                        <div>
                            <h3 class="text-lg font-semibold">{{ formatCamelCase(key) }}</h3>
                            <p class="text-2xl font-bold">{{ formatCurrency(value) }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section 2: Sales Last 30 Days -->
        <div class="mb-8">
            <h2 class="text-xl font-bold mb-4">Sales Last 30 Days</h2>
            <Chart type="line" :data="chart1Data" :options="chartOptions" class="h-[30rem]" />
        </div>

        <!-- Section 3: Sales Current Financial Year -->
        <div class="mb-8">
            <h2 class="text-xl font-bold mb-4">Sales Current Financial Year</h2>
            <Chart type="line" :data="chart2Data" :options="chartOptions" class="h-[30rem]" />
        </div>

        <!-- Section 4: Sales Payment Due -->
        <div class="mb-8">
            <h2 class="text-xl font-bold mb-4">Sales Payment Due</h2>
            <DataTable :value="salesPaymentDue" class="p-datatable-sm">
                <Column field="customer__name" header="Customer"></Column>
                <Column field="sale_id" header="Invoice No."></Column>
                <Column field="balance_due" header="Due Amount"></Column>
            </DataTable>
        </div>

        <!-- Section 5: Product Stock Alert -->
        <div class="mb-8">
            <h2 class="text-xl font-bold mb-4">Product Stock Alert</h2>
            <DataTable :value="productStockAlert" class="p-datatable-sm">
                <Column field="product__name" header="Product"></Column>
                <Column field="location__name" header="Location"></Column>
                <Column field="stock_level" header="Current Stock"></Column>
            </DataTable>
        </div>

        <!-- Section 6: Sales Orders -->
        <div class="mb-8">
            <h2 class="text-xl font-bold mb-4">Sales Orders</h2>
            <DataTable :value="salesOrders" class="p-datatable-sm">
                <Column field="date_added" header="Date">
                    <template #body="{ data }">
                        {{ formatDate(data.date_added) }}
                    </template>
                </Column>
                <Column field="sale_id" header="Order No."></Column>
                <Column field="customer__name" header="Customer Name"></Column>
                <Column field="customer__phone" header="Contact Number"></Column>
                <Column field="register__branch__name" header="Branch"></Column>
                <Column field="status" header="Status"></Column>
                <Column field="shippings__status" header="Shipping Status"></Column>
                <Column field="shippings__quantity_remaining" header="Quantity Remaining"></Column>
                <Column field="attendant__username" header="Added By"></Column>
            </DataTable>
        </div>

        <!-- Section 7: Pending Shipments -->
        <div class="mb-8">
            <h2 class="text-xl font-bold mb-4">Pending Shipments</h2>
            <DataTable :value="pendingShipments" class="p-datatable-sm">
                <Column field="created_at" header="Date">
                    <template #body="{ data }">
                        {{ formatDate(data.created_at) }}
                    </template>
                </Column>
                <Column field="sale__sale_id" header="Invoice No."></Column>
                <Column field="sale__customer__name" header="Customer Name"></Column>
                <Column field="sale__customer__phone" header="Contact Number"></Column>
                <Column field="sale__register__branch__name" header="Branch"></Column>
                <Column field="status" header="Shipping Status"></Column>
                <Column field="sale__payment_status" header="Payment Status"></Column>
            </DataTable>
        </div>
    </div>
</template>

<style>
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';
.highcharts-figure,
.highcharts-data-table table {
    min-width: 360px;
    max-width: 800px;
    margin: 1em auto;
}

.highcharts-data-table table {
    font-family: Verdana, sans-serif;
    border-collapse: collapse;
    border: 1px solid #ebebeb;
    margin: 10px auto;
    text-align: center;
    width: 100%;
    max-width: 500px;
}

.highcharts-data-table caption {
    padding: 1em 0;
    font-size: 1.2em;
    color: #555;
}

.highcharts-data-table th {
    font-weight: 600;
    padding: 0.5em;
}

.highcharts-data-table td,
.highcharts-data-table th,
.highcharts-data-table caption {
    padding: 0.5em;
}

.highcharts-data-table thead tr,
.highcharts-data-table tr:nth-child(even) {
    background: #f8f8f8;
}

.highcharts-data-table tr:hover {
    background: #f1f7ff;
}

.highcharts-description {
    margin: 0.3rem 10px;
}
</style>
