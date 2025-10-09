<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { manufacturingService } from '@/services/manufacturingService';
import BreadcrumbNav from '@/components/manufacturing/BreadcrumbNav.vue';
import ManufacturingToolbar from '@/components/manufacturing/ManufacturingToolbar.vue';
import StatsCard from '@/components/manufacturing/StatsCard.vue';
import AddPurchase from '@/components/purchase/AddPurchase.vue';

const router = useRouter();
const toast = useToast();
const loading = ref(false);
const period = ref('month');
const periodOptions = ref([
    { name: 'This Week', value: 'week' },
    { name: 'This Month', value: 'month' },
    { name: 'This Quarter', value: 'quarter' },
    { name: 'This Year', value: 'year' }
]);

// Stats
const stats = ref({
    total_batches: 0,
    planned_batches: 0,
    completion_rate: 0,
    completed_batches: 0,
    in_progress_batches: 0,
    material_alerts_count: 0
});

// Charts data
const productionChartData = ref(null);
const materialsChartData = ref({
    labels: ['Sodium hydroxide', 'Sodium laureth sulfate', 'Citric acid', 'Fragrance', 'Colorant'],
    datasets: [
        {
            backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#EC407A', '#AB47BC'],
            hoverBackgroundColor: ['#64B5F6', '#81C784', '#FFB74D', '#F48FB1', '#CE93D8'],
            data: [45, 20, 15, 10, 10]
        }
    ]
});

// Tables
const materialAlerts = ref([]);
const recentBatches = ref([]);

// Period selection
const selectedPeriod = ref({ name: 'Last 30 Days', value: 30 });

// Load dashboard data
const loadDashboardData = () => {
    loading.value = true;
    // Simulate data loading
    setTimeout(() => {
        loading.value = false;
        toast.add({
            severity: 'success',
            summary: 'Period Updated',
            detail: `Dashboard data updated for ${selectedPeriod.value.name}`,
            life: 3000
        });
    }, 1000);
};

// Navigation functions
const navigateToNewBatch = () => {
    router.push('/manufacturing/batches/new');
};

const navigateToRawMaterials = () => {
    router.push('/inventory/raw-materials');
    toast.add({ severity: 'info', summary: 'Navigation', detail: 'Navigating to Raw Materials page', life: 3000 });
};

// Watch for period changes
watch(period, () => {
    fetchDashboardData();
});

// Main dashboard data fetching function
const fetchDashboardData = () => {
    loading.value = true;

    // Call the manufacturing service API
    manufacturingService
        .getDashboardData(period.value)
        .then((response) => {
            // Process the response data according to the provided format
            const data = response.data;

            // Update stats
            stats.value = data.stats || {
                total_batches: 0,
                completed_batches: 0,
                in_progress_batches: 0,
                planned_batches: 0,
                completion_rate: 0,
                material_alerts_count: 0
            };

            // Set up production chart data from the API response
            if (data.production_chart) {
                productionChartData.value = data.production_chart;
            }

            // Set up materials chart data from the API response
            if (data.materials_chart) {
                materialsChartData.value = data.materials_chart;
            }

            // Set material alerts
            materialAlerts.value = data.material_alerts || [];

            // Set recent batches
            recentBatches.value = data.recent_batches || [];

            loading.value = false;
            toast.add({
                severity: 'success',
                summary: 'Dashboard Updated',
                detail: `Manufacturing data loaded for ${periodOptions.value.find((p) => p.value === period.value)?.name || 'selected period'}`,
                life: 3000
            });
        })
        .catch((error) => {
            console.error('Error fetching dashboard data:', error);
            loading.value = false;
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load dashboard data. Please try again.',
                life: 5000
            });
        });
};

const navigateToDetails = (id) => {
    router.push(`/manufacturing/batches/${id}`);
};

const navigateToForecasting = () => {
    router.push('/manufacturing/material-forecasting');
};

const navigateToInventory = () => {
    router.push('/ecommerce/inventory');
};

const navigateToMaterialAlerts = () => {
    router.push('/ecommerce/inventory?filter=below_reorder');
};

const navigateToBatches = () => {
    router.push('/manufacturing/batches');
};

const navigateToSchedule = () => {
    router.push('/manufacturing/schedule');
};

const refreshDashboard = () => {
    fetchDashboardData();
};

// Helper functions
const getBatchStatusSeverity = (status) => {
    switch (status) {
        case 'completed':
            return 'success';
        case 'in_progress':
            return 'warning';
        case 'planned':
            return 'info';
        case 'cancelled':
            return 'secondary';
        case 'failed':
            return 'danger';
        default:
            return 'info';
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatStatus = (status) => {
    if (!status) return '';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

// Format metric values with appropriate units
const formatMetric = (value) => {
    if (value === null || value === undefined) return '0';
    if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'k';
    }
    return value.toString();
};

const requestMaterialPurchase = (material) => {
    router.push({
        path: '/procurement/purchase-order/new',
        query: { material_id: material.id }
    });
};

// Helper function to handle API errors
const handleApiError = (error, message) => {
    console.error(`${message}:`, error);
    toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000
    });
};

// Colors for chart datasets
const chartColors = ['#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#607D8B'];

// Chart options for better appearance
const productionChartOptions = ref({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                usePointStyle: true,
                font: {
                    size: 12
                }
            }
        },
        tooltip: {
            mode: 'index',
            intersect: false
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: {
                display: true,
                drawBorder: false
            }
        },
        x: {
            grid: {
                display: false
            }
        }
    }
});

const materialsChartOptions = ref({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'right',
            labels: {
                usePointStyle: true,
                font: {
                    size: 12
                }
            }
        },
        tooltip: {
            callbacks: {
                label: (context) => {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                    const percentage = Math.round((value / total) * 100);
                    return `${label}: ${value} (${percentage}%)`;
                }
            }
        }
    }
});

// Add a simulated purchase order creation function
const createPurchaseOrderForMaterial = (material) => {
    router.push({
        path: '/procurement/purchase-orders/new',
        query: {
            material_id: material.id,
            material_name: material.name
        }
    });
};

onMounted(() => {
    fetchDashboardData();

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-item')) {
            // Close any open dropdowns
        }
    });
});

// Cleanup event listeners
onUnmounted(() => {
    document.removeEventListener('click', () => {});
});
</script>

<template>
    <div class="manufacturing-dashboard">
        <!-- Header Section -->
        <div class="dashboard-header">
            <div class="header-content">
                <BreadcrumbNav :items="[{ label: 'Manufacturing', to: '/manufacturing' }, { label: 'Dashboard' }]" class="breadcrumb" />

                <div class="header-actions">
                    <Dropdown v-model="period" :options="periodOptions" optionLabel="name" optionValue="value" placeholder="Select Period" class="period-selector" />
                    <Button label="New Batch" icon="pi pi-plus" class="new-batch-btn" @click="navigateToNewBatch" />
                </div>
            </div>
        </div>

        <!-- Stats Cards Grid -->
        <div class="stats-grid">
            <!-- Total Batches -->
            <div class="stat-card">
                <div class="stat-content">
                    <div class="stat-text">
                        <span class="stat-label">Total Batches</span>
                        <span class="stat-value">{{ stats.total_batches || 0 }}</span>
                    </div>
                    <div class="stat-icon bg-blue-100">
                        <i class="pi pi-box text-blue-500"></i>
                    </div>
                </div>
                <Button icon="pi pi-plus" label="New Batch" class="stat-action" @click="navigateToNewBatch" />
            </div>

            <!-- Completed Batches -->
            <div class="stat-card">
                <div class="stat-content">
                    <div class="stat-text">
                        <span class="stat-label">Completed</span>
                        <span class="stat-value">{{ stats.completed_batches || 0 }}</span>
                    </div>
                    <div class="stat-icon bg-green-100">
                        <i class="pi pi-check-circle text-green-500"></i>
                    </div>
                </div>
                <div class="completion-progress">
                    <ProgressBar :value="stats.completion_rate || 0" :class="completionBarClass" />
                    <span class="completion-text">{{ stats.completion_rate || 0 }}% completion</span>
                </div>
            </div>

            <!-- In Progress -->
            <div class="stat-card">
                <div class="stat-content">
                    <div class="stat-text">
                        <span class="stat-label">In Progress</span>
                        <span class="stat-value">{{ stats.in_progress_batches || 0 }}</span>
                    </div>
                    <div class="stat-icon bg-orange-100">
                        <i class="pi pi-spin pi-sync text-orange-500"></i>
                    </div>
                </div>
                <Button icon="pi pi-eye" label="View Active" class="stat-action" @click="navigateToBatches" />
            </div>

            <!-- Planned Batches -->
            <div class="stat-card">
                <div class="stat-content">
                    <div class="stat-text">
                        <span class="stat-label">Planned</span>
                        <span class="stat-value">{{ stats.planned_batches || 0 }}</span>
                    </div>
                    <div class="stat-icon bg-blue-100">
                        <i class="pi pi-calendar text-blue-500"></i>
                    </div>
                </div>
                <Button icon="pi pi-calendar" label="Schedule" class="stat-action" @click="navigateToSchedule" />
            </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-row">
            <!-- Production Activity Chart -->
            <div class="chart-card">
                <div class="chart-header">
                    <h3><i class="pi pi-chart-line"></i> Production Activity</h3>
                    <div class="chart-actions">
                        <Button icon="pi pi-refresh" text rounded @click="refreshDashboard" />
                        <Button icon="pi pi-download" text rounded />
                    </div>
                </div>
                <div class="chart-container">
                    <Chart type="bar" :data="productionChartData" :options="productionChartOptions" />
                </div>
            </div>

            <!-- Materials Usage Chart -->
            <div class="chart-card">
                <div class="chart-header">
                    <h3><i class="pi pi-percentage"></i> Materials Usage</h3>
                    <div class="chart-actions">
                        <Button icon="pi pi-plus" label="Order" severity="success" size="small" @click="navigateToForecasting" />
                        <Button icon="pi pi-search-plus" label="Details" text size="small" @click="navigateToInventory" />
                    </div>
                </div>
                <div class="chart-container">
                    <Chart type="doughnut" :data="materialsChartData" :options="materialsChartOptions" />
                </div>
            </div>
        </div>

        <!-- Material Alerts -->
        <div class="material-alerts">
            <div class="section-header">
                <h3><i class="pi pi-exclamation-triangle"></i> Material Alerts</h3>
                <div class="section-actions">
                    <Button icon="pi pi-search" label="View All" text size="small" @click="navigateToMaterialAlerts" />
                    <Button icon="pi pi-plus" label="Order" severity="success" size="small" @click="navigateToForecasting" />
                </div>
            </div>

            <DataTable :value="materialAlerts" :loading="loading" stripedRows class="alerts-table">
                <Column field="name" header="Material">
                    <template #body="{ data }">
                        <div class="material-info">
                            <i class="pi pi-box"></i>
                            <span>{{ data.name }}</span>
                        </div>
                    </template>
                </Column>
                <Column field="current_stock" header="Current Stock">
                    <template #body="{ data }"> {{ data.current_stock }} {{ data.unit }} </template>
                </Column>
                <Column field="reorder_level" header="Reorder Level">
                    <template #body="{ data }"> {{ data.reorder_level }} {{ data.unit }} </template>
                </Column>
                <Column field="status" header="Status">
                    <template #body="{ data }">
                        <Tag :severity="data.status === 'critical' ? 'danger' : 'warning'" :value="data.status === 'critical' ? 'Critical' : 'Low'" />
                    </template>
                </Column>
                <Column header="Actions">
                    <template #body="{ data }">
                        <Button icon="pi pi-shopping-cart" text rounded severity="success" @click="requestMaterialPurchase(data)" />
                    </template>
                </Column>
                <template #empty>
                    <div class="empty-state">
                        <i class="pi pi-check-circle"></i>
                        <p>No material alerts at this time</p>
                    </div>
                </template>
            </DataTable>
        </div>

        <!-- Recent Batches -->
        <div class="recent-batches">
            <div class="section-header">
                <h3><i class="pi pi-list"></i> Recent Production Batches</h3>
                <Button icon="pi pi-plus" label="New Batch" @click="navigateToNewBatch" />
            </div>

            <DataTable :value="recentBatches" :paginator="true" :rows="5" class="batches-table">
                <Column field="batch_number" header="Batch #">
                    <template #body="{ data }">
                        <router-link :to="'/manufacturing/batches/' + data.id" class="batch-link">
                            {{ data.batch_number }}
                        </router-link>
                    </template>
                </Column>
                <Column field="formula_details.name" header="Formula" />
                <Column field="scheduled_date" header="Scheduled">
                    <template #body="{ data }">
                        {{ formatDate(data.scheduled_date) }}
                    </template>
                </Column>
                <Column field="planned_quantity" header="Planned Qty" />
                <Column field="status" header="Status">
                    <template #body="{ data }">
                        <Tag :value="formatStatus(data.status)" :severity="getBatchStatusSeverity(data.status)" />
                    </template>
                </Column>
                <Column header="Actions">
                    <template #body="{ data }">
                        <Button icon="pi pi-eye" text rounded @click="navigateToDetails(data.id)" />
                        <Button icon="pi pi-pencil" text rounded v-if="data.status === 'planned'" @click="navigateToDetails(data.id)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Analytics CTA -->
        <div class="analytics-cta">
            <div class="cta-content">
                <div>
                    <h3>Need more detailed insights?</h3>
                    <p>View comprehensive production analytics including trends, cost analysis, and AI-powered insights.</p>
                </div>
                <Button icon="pi pi-chart-bar" label="Manufacturing Analytics" severity="secondary" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.manufacturing-dashboard {
    padding: 1.5rem;
    max-width: 1800px;
    margin: 0 auto;
}

.dashboard-header {
    margin-bottom: 1.5rem;
}

.header-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.breadcrumb {
    margin-bottom: 0.5rem;
}

.header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.period-selector {
    min-width: 180px;
}

.new-batch-btn {
    margin-left: auto;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.stat-card {
    background: var(--surface-card);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition:
        transform 0.2s,
        box-shadow 0.2s;
}

.stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.stat-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.stat-text {
    display: flex;
    flex-direction: column;
}

.stat-label {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin-bottom: 0.25rem;
}

.stat-value {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--text-color);
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.stat-icon i {
    font-size: 1.5rem;
}

.stat-action {
    width: 100%;
}

.completion-progress {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.completion-text {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

.charts-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
}

.chart-card {
    background: var(--surface-card);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.chart-header h3 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
}

.chart-actions {
    display: flex;
    gap: 0.5rem;
}

.chart-container {
    height: 300px;
    position: relative;
}

.material-alerts,
.recent-batches {
    background: var(--surface-card);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    margin-bottom: 1.5rem;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.section-header h3 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
}

.section-actions {
    display: flex;
    gap: 0.5rem;
}

.alerts-table,
.batches-table {
    margin-top: 1rem;
}

.material-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.material-info i {
    color: var(--primary-color);
    font-size: 1.25rem;
}

.batch-link {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
}

.batch-link:hover {
    text-decoration: underline;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    color: var(--text-color-secondary);
    text-align: center;
}

.empty-state i {
    font-size: 2rem;
    color: var(--green-500);
    margin-bottom: 0.5rem;
}

.analytics-cta {
    background: var(--surface-card);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.cta-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
}

.cta-content h3 {
    margin: 0 0 0.5rem 0;
}

.cta-content p {
    margin: 0;
    color: var(--text-color-secondary);
}

@media (max-width: 768px) {
    .header-actions {
        flex-direction: column;
        align-items: stretch;
    }

    .new-batch-btn {
        margin-left: 0;
    }

    .charts-row {
        grid-template-columns: 1fr;
    }

    .cta-content {
        flex-direction: column;
        align-items: flex-start;
    }
}

@media (max-width: 480px) {
    .manufacturing-dashboard {
        padding: 1rem;
    }

    .stat-card {
        padding: 1rem;
    }

    .chart-card,
    .material-alerts,
    .recent-batches,
    .analytics-cta {
        padding: 1rem;
    }
}
</style>
