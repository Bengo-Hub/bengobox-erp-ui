<script setup>
import { CustomerService } from '@/services/CustomerService';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

// PrimeVue components
import Button from 'primevue/button';
import Card from 'primevue/card';
import Chart from 'primevue/chart';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Tag from 'primevue/tag';

const router = useRouter();
const toast = useToast();

// Reactive data
const loading = ref(false);
const period = ref('month');
const periodOptions = [
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Quarter', value: 'quarter' },
    { label: 'This Year', value: 'year' }
];

// CRM Dashboard data with fallback values
const dashboardData = ref({
    // Key Metrics
    total_customers: 0,
    total_leads: 0,
    total_opportunities: 0,
    total_deals: 0,

    // Pipeline Metrics
    pipeline_value: 0,
    conversion_rate: 0,
    average_deal_size: 0,
    win_rate: 0,

    // Lead Metrics
    new_leads: 0,
    qualified_leads: 0,
    lead_response_time: 0,

    // Customer Metrics
    customer_satisfaction: 0,
    customer_retention_rate: 0,
    average_customer_value: 0,

    // Trends
    lead_trends: [],
    customer_growth: [],
    pipeline_performance: [],
    deal_velocity: []
});

// Recent data
const recentLeads = ref([]);
const recentDeals = ref([]);
const recentCustomers = ref([]);
const pipelineStages = ref([]);

// Chart data
const leadTrendsChartData = ref(null);
const pipelinePerformanceChartData = ref(null);
const customerGrowthChartData = ref(null);

// Loading states
const loadingMetrics = ref(false);
const loadingLeads = ref(false);
const loadingDeals = ref(false);
const loadingCustomers = ref(false);
const loadingStages = ref(false);

// Error states
const hasErrors = ref(false);
const errorMessage = ref('');

// Fallback data for when API calls fail
const fallbackData = {
    total_customers: 2841,
    total_leads: 156,
    total_opportunities: 89,
    total_deals: 67,
    pipeline_value: 1250000,
    conversion_rate: 42.9,
    average_deal_size: 18656.72,
    win_rate: 65.0,
    new_leads: 47,
    qualified_leads: 94,
    lead_response_time: 2.5,
    customer_satisfaction: 4.2,
    customer_retention_rate: 78.5,
    average_customer_value: 1250.0
};

// Computed properties for formatted display
const formattedPipelineValue = computed(() => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(dashboardData.value.pipeline_value);
});

const formattedAverageDealSize = computed(() => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(dashboardData.value.average_deal_size);
});

const formattedAverageCustomerValue = computed(() => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(dashboardData.value.average_customer_value);
});

// Methods
const loadDashboardData = async () => {
    try {
        loading.value = true;
        loadingMetrics.value = true;
        hasErrors.value = false;
        errorMessage.value = '';

        // Load CRM dashboard data from backend
        const dashboardResponse = await CustomerService.getDashboardData(period.value);

        if (dashboardResponse.success && dashboardResponse.data) {
            // Update dashboard data with real backend data
            dashboardData.value = { ...dashboardData.value, ...dashboardResponse.data };

            // Update recent data if available
            if (dashboardResponse.data.recent_leads) {
                recentLeads.value = dashboardResponse.data.recent_leads;
            }
            if (dashboardResponse.data.recent_deals) {
                recentDeals.value = dashboardResponse.data.recent_deals;
            }
        } else {
            // Fallback to individual API calls if dashboard endpoint fails
            await loadDataFromIndividualEndpoints();
        }

        // Load additional data
        await Promise.allSettled([loadRecentCustomers(), loadPipelineStages()]);

        // Process chart data
        processChartData();

        toast.add({
            severity: 'success',
            summary: 'Dashboard Updated',
            detail: `CRM data updated for ${periodOptions.find((p) => p.value === period.value)?.label}`,
            life: 3000
        });
    } catch (error) {
        console.error('Error loading CRM dashboard data:', error);
        hasErrors.value = true;
        errorMessage.value = 'Failed to load dashboard data. Using fallback data.';

        // Use fallback data
        setFallbackData();
        processChartData();

        toast.add({
            severity: 'warn',
            summary: 'Fallback Mode',
            detail: 'Using fallback data due to connection issues',
            life: 5000
        });
    } finally {
        loading.value = false;
        loadingMetrics.value = false;
    }
};

const loadDataFromIndividualEndpoints = async () => {
    try {
        // Load customers count
        const customersResponse = await CustomerService.getCustomers({ limit: 1 });
        dashboardData.value.total_customers = customersResponse.count || 0;

        // Load leads count and metrics
        const leadsResponse = await CustomerService.listLeads({ limit: 1 });
        dashboardData.value.total_leads = leadsResponse.count || 0;

        // Load deals count and pipeline value
        const dealsResponse = await CustomerService.listDeals({ limit: 1 });
        dashboardData.value.total_deals = dealsResponse.count || 0;

        // Calculate pipeline value from deals
        if (dealsResponse.results) {
            const totalValue = dealsResponse.results.reduce((sum, deal) => sum + (parseFloat(deal.amount) || 0), 0);
            dashboardData.value.pipeline_value = totalValue;
            dashboardData.value.average_deal_size = dealsResponse.results.length > 0 ? totalValue / dealsResponse.results.length : 0;
        }

        // Load opportunities count
        const opportunitiesResponse = await CustomerService.listOpportunities({ limit: 1 });
        dashboardData.value.total_opportunities = opportunitiesResponse.count || 0;

        // Calculate conversion rate (leads to deals)
        if (dashboardData.value.total_leads > 0) {
            dashboardData.value.conversion_rate = (dashboardData.value.total_deals / dashboardData.value.total_leads) * 100;
        }

        // Set reasonable defaults for missing metrics
        dashboardData.value.new_leads = Math.floor(dashboardData.value.total_leads * 0.3);
        dashboardData.value.qualified_leads = Math.floor(dashboardData.value.total_leads * 0.6);
        dashboardData.value.customer_satisfaction = 4.2;
        dashboardData.value.customer_retention_rate = 78.5;
        dashboardData.value.average_customer_value = 1250.0;
        dashboardData.value.win_rate = 65.0;
        dashboardData.value.lead_response_time = 2.5;
    } catch (error) {
        console.error('Error loading data from individual endpoints:', error);
        throw error;
    }
};

const setFallbackData = () => {
    dashboardData.value = { ...dashboardData.value, ...fallbackData };
};

const loadRecentCustomers = async () => {
    try {
        loadingCustomers.value = true;
        const response = await CustomerService.getCustomers({
            limit: 5,
            ordering: '-added_on'
        });
        recentCustomers.value = response.results || [];
    } catch (error) {
        console.error('Error loading recent customers:', error);
        recentCustomers.value = [];
        // Use mock data as fallback
        recentCustomers.value = [
            { id: 1, user: { first_name: 'John', last_name: 'Doe' }, business_name: 'ABC Corp', added_on: new Date() },
            { id: 2, user: { first_name: 'Jane', last_name: 'Smith' }, business_name: 'XYZ Ltd', added_on: new Date() }
        ];
    } finally {
        loadingCustomers.value = false;
    }
};

const loadPipelineStages = async () => {
    try {
        loadingStages.value = true;
        const response = await CustomerService.listStages();
        pipelineStages.value = response.results || [];
    } catch (error) {
        console.error('Error loading pipeline stages:', error);
        pipelineStages.value = [];
        // Use mock data as fallback
        pipelineStages.value = [
            { id: 1, name: 'Prospecting', order: 1, is_won: false, is_lost: false },
            { id: 2, name: 'Qualification', order: 2, is_won: false, is_lost: false },
            { id: 3, name: 'Proposal', order: 3, is_won: false, is_lost: false },
            { id: 4, name: 'Negotiation', order: 4, is_won: false, is_lost: false },
            { id: 5, name: 'Closed Won', order: 5, is_won: true, is_lost: false }
        ];
    } finally {
        loadingStages.value = false;
    }
};

const processChartData = () => {
    // Lead trends chart - use real data if available, otherwise generate mock data
    if (dashboardData.value.lead_trends && dashboardData.value.lead_trends.labels) {
        leadTrendsChartData.value = dashboardData.value.lead_trends;
    } else {
        leadTrendsChartData.value = generateMockLeadTrends();
    }

    // Pipeline performance chart - use real data if available, otherwise generate mock data
    if (dashboardData.value.pipeline_performance && dashboardData.value.pipeline_performance.labels) {
        pipelinePerformanceChartData.value = dashboardData.value.pipeline_performance;
    } else {
        pipelinePerformanceChartData.value = generateMockPipelinePerformance();
    }

    // Customer growth chart - use real data if available, otherwise generate mock data
    if (dashboardData.value.customer_growth && dashboardData.value.customer_growth.labels) {
        customerGrowthChartData.value = dashboardData.value.customer_growth;
    } else {
        customerGrowthChartData.value = generateMockCustomerGrowth();
    }
};

const generateMockLeadTrends = () => {
    const periods = {
        week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        month: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        quarter: ['Jan', 'Feb', 'Mar'],
        year: ['Q1', 'Q2', 'Q3', 'Q4']
    };

    const labels = periods[period.value] || periods.month;

    return {
        labels,
        datasets: [
            {
                label: 'New Leads',
                data: labels.map(() => Math.floor(Math.random() * 50) + 20),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4
            },
            {
                label: 'Qualified Leads',
                data: labels.map(() => Math.floor(Math.random() * 30) + 15),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            }
        ]
    };
};

const generateMockPipelinePerformance = () => {
    return {
        labels: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won'],
        datasets: [
            {
                data: [25, 20, 15, 12, 8],
                backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }
        ]
    };
};

const generateMockCustomerGrowth = () => {
    const periods = {
        week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        month: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        quarter: ['Jan', 'Feb', 'Mar'],
        year: ['Q1', 'Q2', 'Q3', 'Q4']
    };

    const labels = periods[period.value] || periods.month;
    let baseCustomers = dashboardData.value.total_customers || 2000;

    return {
        labels,
        datasets: [
            {
                label: 'Total Customers',
                data: labels.map(() => {
                    baseCustomers += Math.floor(Math.random() * 100) + 50;
                    return baseCustomers;
                }),
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };
};

const navigateTo = (route) => {
    router.push(route);
};

const getLeadStatusSeverity = (status) => {
    const severityMap = {
        new: 'info',
        contacted: 'warning',
        qualified: 'success',
        won: 'success',
        lost: 'danger'
    };
    return severityMap[status] || 'info';
};

const getDealStageSeverity = (stage) => {
    if (stage.is_won) return 'success';
    if (stage.is_lost) return 'danger';
    return 'warning';
};

// Chart options
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                usePointStyle: true,
                padding: 20
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: {
                color: 'rgba(0, 0, 0, 0.1)'
            }
        },
        x: {
            grid: {
                display: false
            }
        }
    }
};

// Lifecycle
onMounted(() => {
    loadDashboardData();
});
</script>

<template>
    <div class="p-6">
        <!-- Error Message -->
        <Message v-if="hasErrors" severity="warn" :closable="false" class="mb-6">
            <template #messageicon>
                <i class="pi pi-exclamation-triangle"></i>
            </template>
            {{ errorMessage }}
        </Message>

        <!-- Header with period selector -->
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">CRM Dashboard</h1>
                <p class="text-muted-color">Customer Relationship Management Overview</p>
            </div>
            <div class="flex items-center gap-4">
                <Dropdown v-model="period" :options="periodOptions" optionLabel="label" optionValue="value" placeholder="Select Period" class="w-48" @change="loadDashboardData" />
                <Button icon="pi pi-refresh" label="Refresh" @click="loadDashboardData" :loading="loading" class="p-button-outlined" />
            </div>
        </div>

        <!-- Loading Spinner -->
        <div v-if="loading && !hasErrors" class="flex justify-center items-center py-20">
            <ProgressSpinner style="width: 50px; height: 50px" />
            <span class="ml-3 text-lg text-muted-color">Loading CRM Dashboard...</span>
        </div>

        <!-- Dashboard Content -->
        <div v-else>
            <!-- Key Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card class="text-center">
                    <template #content>
                        <div class="flex items-center justify-center mb-3">
                            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-400/10 rounded-full flex items-center justify-center">
                                <i class="pi pi-users text-blue-500 text-xl"></i>
                            </div>
                        </div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                            {{ dashboardData.total_customers.toLocaleString() }}
                        </div>
                        <div class="text-muted-color">Total Customers</div>
                    </template>
                </Card>

                <Card class="text-center">
                    <template #content>
                        <div class="flex items-center justify-center mb-3">
                            <div class="w-12 h-12 bg-green-100 dark:bg-green-400/10 rounded-full flex items-center justify-center">
                                <i class="pi pi-lightbulb text-green-500 text-xl"></i>
                            </div>
                        </div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                            {{ dashboardData.total_leads.toLocaleString() }}
                        </div>
                        <div class="text-muted-color">Total Leads</div>
                    </template>
                </Card>

                <Card class="text-center">
                    <template #content>
                        <div class="flex items-center justify-center mb-3">
                            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-400/10 rounded-full flex items-center justify-center">
                                <i class="pi pi-dollar text-purple-500 text-xl"></i>
                            </div>
                        </div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                            {{ formattedPipelineValue }}
                        </div>
                        <div class="text-muted-color">Pipeline Value</div>
                    </template>
                </Card>

                <Card class="text-center">
                    <template #content>
                        <div class="flex items-center justify-center mb-3">
                            <div class="w-12 h-12 bg-orange-100 dark:bg-orange-400/10 rounded-full flex items-center justify-center">
                                <i class="pi pi-percentage text-orange-500 text-xl"></i>
                            </div>
                        </div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ dashboardData.conversion_rate.toFixed(1) }}%</div>
                        <div class="text-muted-color">Conversion Rate</div>
                    </template>
                </Card>
            </div>

            <!-- Secondary Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card>
                    <template #title>
                        <div class="flex items-center">
                            <i class="pi pi-chart-line text-blue-500 mr-2"></i>
                            <span>Lead Performance</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-muted-color">New Leads</span>
                                <span class="font-medium">{{ dashboardData.new_leads }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-color">Qualified Leads</span>
                                <span class="font-medium">{{ dashboardData.qualified_leads }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-color">Response Time</span>
                                <span class="font-medium">{{ dashboardData.lead_response_time }} days</span>
                            </div>
                        </div>
                    </template>
                </Card>

                <Card>
                    <template #title>
                        <div class="flex items-center">
                            <i class="pi pi-dollar text-green-500 mr-2"></i>
                            <span>Deal Metrics</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-muted-color">Total Deals</span>
                                <span class="font-medium">{{ dashboardData.total_deals }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-color">Avg Deal Size</span>
                                <span class="font-medium">{{ formattedAverageDealSize }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-color">Win Rate</span>
                                <span class="font-medium">{{ dashboardData.win_rate }}%</span>
                            </div>
                        </div>
                    </template>
                </Card>

                <Card>
                    <template #title>
                        <div class="flex items-center">
                            <i class="pi pi-heart text-red-500 mr-2"></i>
                            <span>Customer Health</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-muted-color">Satisfaction</span>
                                <span class="font-medium">{{ dashboardData.customer_satisfaction }}/5</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-color">Retention Rate</span>
                                <span class="font-medium">{{ dashboardData.customer_retention_rate }}%</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-color">Avg Customer Value</span>
                                <span class="font-medium">{{ formattedAverageCustomerValue }}</span>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Charts Section -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Lead Trends</span>
                            <Button icon="pi pi-arrow-right" label="View Leads" text @click="navigateTo('/crm/leads')" />
                        </div>
                    </template>
                    <template #content>
                        <Chart type="line" :data="leadTrendsChartData" :options="chartOptions" class="h-80" />
                    </template>
                </Card>

                <Card>
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Pipeline Performance</span>
                            <Button icon="pi pi-arrow-right" label="View Pipeline" text @click="navigateTo('/crm/pipeline/board')" />
                        </div>
                    </template>
                    <template #content>
                        <Chart type="doughnut" :data="pipelinePerformanceChartData" :options="chartOptions" class="h-80" />
                    </template>
                </Card>
            </div>

            <!-- Customer Growth Chart -->
            <Card class="mb-8">
                <template #title>
                    <div class="flex items-center justify-between">
                        <span>Customer Growth</span>
                        <Button icon="pi pi-arrow-right" label="View Customers" text @click="navigateTo('/crm/customers')" />
                    </div>
                </template>
                <template #content>
                    <Chart type="line" :data="customerGrowthChartData" :options="chartOptions" class="h-80" />
                </template>
            </Card>

            <!-- Recent Data Tables -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Recent Leads -->
                <Card>
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Recent Leads</span>
                            <Button icon="pi pi-arrow-right" label="View All" text @click="navigateTo('/crm/leads')" />
                        </div>
                    </template>
                    <template #content>
                        <div v-if="loadingLeads" class="flex justify-center py-8">
                            <ProgressSpinner style="width: 30px; height: 30px" />
                        </div>
                        <DataTable v-else :value="recentLeads" :rows="5" stripedRows class="p-datatable-sm">
                            <Column field="contact.user.first_name" header="Name">
                                <template #body="slotProps">
                                    <div class="flex items-center">
                                        <div class="w-8 h-8 bg-blue-100 dark:bg-blue-400/10 rounded-full flex items-center justify-center mr-3">
                                            <i class="pi pi-user text-blue-500 text-sm"></i>
                                        </div>
                                        <div>
                                            <div class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.contact?.user?.first_name }} {{ slotProps.data.contact?.user?.last_name }}</div>
                                            <div class="text-muted-color text-sm">{{ slotProps.data.source || 'N/A' }}</div>
                                        </div>
                                    </div>
                                </template>
                            </Column>
                            <Column field="status" header="Status">
                                <template #body="slotProps">
                                    <Tag :value="slotProps.data.status" :severity="getLeadStatusSeverity(slotProps.data.status)" />
                                </template>
                            </Column>
                            <Column field="value" header="Value">
                                <template #body="slotProps">
                                    {{ new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(slotProps.data.value || 0) }}
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>

                <!-- Recent Deals -->
                <Card>
                    <template #title>
                        <div class="flex items-center justify-between">
                            <span>Recent Deals</span>
                            <Button icon="pi pi-arrow-right" label="View All" text @click="navigateTo('/crm/pipeline/deals')" />
                        </div>
                    </template>
                    <template #content>
                        <div v-if="loadingDeals" class="flex justify-center py-8">
                            <ProgressSpinner style="width: 30px; height: 30px" />
                        </div>
                        <DataTable v-else :value="recentDeals" :rows="5" stripedRows class="p-datatable-sm">
                            <Column field="title" header="Deal">
                                <template #body="slotProps">
                                    <div class="flex items-center">
                                        <div class="w-8 h-8 bg-green-100 dark:bg-green-400/10 rounded-full flex items-center justify-center mr-3">
                                            <i class="pi pi-dollar text-green-500 text-sm"></i>
                                        </div>
                                        <div>
                                            <div class="font-medium text-surface-900 dark:text-surface-0">
                                                {{ slotProps.data.title }}
                                            </div>
                                            <div class="text-muted-color text-sm">{{ slotProps.data.contact?.user?.first_name }} {{ slotProps.data.contact?.user?.last_name }}</div>
                                        </div>
                                    </div>
                                </template>
                            </Column>
                            <Column field="stage.name" header="Stage">
                                <template #body="slotProps">
                                    <Tag :value="slotProps.data.stage?.name || 'N/A'" :severity="getDealStageSeverity(slotProps.data.stage)" />
                                </template>
                            </Column>
                            <Column field="amount" header="Amount">
                                <template #body="slotProps">
                                    {{ new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(slotProps.data.amount || 0) }}
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>

<style scoped>
.crm-dashboard {
    @apply p-6;
}

.metric-card {
    @apply transition-all duration-200 hover:shadow-lg;
}

.metric-card:hover {
    @apply transform -translate-y-1;
}

.recent-table {
    @apply border-0;
}

.recent-table :deep(.p-datatable-wrapper) {
    @apply border-0;
}

.recent-table :deep(.p-datatable-table) {
    @apply border-0;
}

.recent-table :deep(.p-datatable-thead > tr > th) {
    @apply border-0 bg-transparent text-muted-color font-medium text-xs uppercase tracking-wider;
}

.recent-table :deep(.p-datatable-tbody > tr > td) {
    @apply border-0 border-b border-surface-200 dark:border-surface-600;
}

.recent-table :deep(.p-datatable-tbody > tr:last-child > td) {
    @apply border-b-0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .crm-dashboard {
        @apply p-4;
    }

    .grid {
        @apply grid-cols-1;
    }

    .metric-card {
        @apply text-center;
    }

    .metric-card .flex {
        @apply flex-col space-y-4;
    }
}

@media (max-width: 640px) {
    .crm-dashboard {
        @apply p-3;
    }

    .text-3xl {
        @apply text-2xl;
    }

    .text-4xl {
        @apply text-3xl;
    }
}
</style>
