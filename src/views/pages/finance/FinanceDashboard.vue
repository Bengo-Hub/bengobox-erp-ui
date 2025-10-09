<template>
    <div class="finance-dashboard">
        <div class="page-header mb-6">
            <h1 class="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
            <p class="text-gray-600 mt-2">Overview of financial performance and key metrics</p>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <PermissionWrapper permission="view_payment">
                <Card class="stat-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p class="text-2xl font-bold text-green-600">{{ formatCurrency(stats.totalRevenue) }}</p>
                            </div>
                            <i class="pi pi-money-bill text-3xl text-green-500"></i>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>

            <PermissionWrapper permission="view_expense">
                <Card class="stat-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Expenses</p>
                                <p class="text-2xl font-bold text-red-600">{{ formatCurrency(stats.totalExpenses) }}</p>
                            </div>
                            <i class="pi pi-credit-card text-3xl text-red-500"></i>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>

            <PermissionWrapper permission="view_payment">
                <Card class="stat-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Net Profit</p>
                                <p class="text-2xl font-bold text-blue-600">{{ formatCurrency(stats.netProfit) }}</p>
                            </div>
                            <i class="pi pi-chart-line text-3xl text-blue-500"></i>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>

            <PermissionWrapper permission="view_payment">
                <Card class="stat-card">
                    <template #content>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Cash Flow</p>
                                <p class="text-2xl font-bold text-purple-600">{{ formatCurrency(stats.cashFlow) }}</p>
                            </div>
                            <i class="pi pi-wallet text-3xl text-purple-500"></i>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>
        </div>

        <!-- Action Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <!-- Payments -->
            <PermissionWrapper permission="view_payment">
                <Card class="action-card cursor-pointer hover:shadow-lg transition-shadow" @click="viewPayments">
                    <template #content>
                        <div class="text-center">
                            <i class="pi pi-credit-card text-4xl text-blue-500 mb-4"></i>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Payments</h3>
                            <p class="text-gray-600 text-sm">Manage incoming and outgoing payments</p>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>

            <!-- Expenses -->
            <PermissionWrapper permission="view_expense">
                <Card class="action-card cursor-pointer hover:shadow-lg transition-shadow" @click="viewExpenses">
                    <template #content>
                        <div class="text-center">
                            <i class="pi pi-receipt text-4xl text-red-500 mb-4"></i>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Expenses</h3>
                            <p class="text-gray-600 text-sm">Track and manage business expenses</p>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>

            <!-- Accounts -->
            <PermissionWrapper permission="view_paymentaccounts">
                <Card class="action-card cursor-pointer hover:shadow-lg transition-shadow" @click="viewAccounts">
                    <template #content>
                        <div class="text-center">
                            <i class="pi pi-building text-4xl text-green-500 mb-4"></i>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Accounts</h3>
                            <p class="text-gray-600 text-sm">Manage bank accounts and financial accounts</p>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>

            <!-- Budgets -->
            <PermissionWrapper permission="view_payment">
                <Card class="action-card cursor-pointer hover:shadow-lg transition-shadow" @click="viewBudgets">
                    <template #content>
                        <div class="text-center">
                            <i class="pi pi-chart-pie text-4xl text-orange-500 mb-4"></i>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Budgets</h3>
                            <p class="text-gray-600 text-sm">Create and monitor budgets</p>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>

            <!-- Taxes -->
            <PermissionWrapper permission="view_tax">
                <Card class="action-card cursor-pointer hover:shadow-lg transition-shadow" @click="viewTaxes">
                    <template #content>
                        <div class="text-center">
                            <i class="pi pi-calculator text-4xl text-purple-500 mb-4"></i>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Taxes</h3>
                            <p class="text-gray-600 text-sm">Manage tax calculations and compliance</p>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>

            <!-- Reports -->
            <PermissionWrapper permission="view_payment">
                <Card class="action-card cursor-pointer hover:shadow-lg transition-shadow" @click="viewReports">
                    <template #content>
                        <div class="text-center">
                            <i class="pi pi-chart-bar text-4xl text-indigo-500 mb-4"></i>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Financial Reports</h3>
                            <p class="text-gray-600 text-sm">Generate comprehensive financial reports</p>
                        </div>
                    </template>
                </Card>
            </PermissionWrapper>
        </div>

        <!-- Recent Transactions -->
        <PermissionWrapper permission="view_payment">
            <Card>
                <template #title>Recent Transactions</template>
                <template #content>
                    <DataTable 
                        :value="recentTransactions" 
                        :paginator="true" 
                        :rows="10"
                        :loading="isLoading"
                        class="p-datatable-sm"
                    >
                        <Column field="date" header="Date" sortable>
                            <template #body="slotProps">
                                {{ formatDate(slotProps.data.date) }}
                            </template>
                        </Column>
                        <Column field="type" header="Type" sortable>
                            <template #body="slotProps">
                                <Tag 
                                    :value="slotProps.data.type" 
                                    :severity="getTypeSeverity(slotProps.data.type)"
                                />
                            </template>
                        </Column>
                        <Column field="description" header="Description" sortable></Column>
                        <Column field="amount" header="Amount" sortable>
                            <template #body="slotProps">
                                <span :class="slotProps.data.amount > 0 ? 'text-green-600' : 'text-red-600'">
                                    {{ formatCurrency(slotProps.data.amount) }}
                                </span>
                            </template>
                        </Column>
                        <Column field="status" header="Status" sortable>
                            <template #body="slotProps">
                                <Tag 
                                    :value="slotProps.data.status" 
                                    :severity="getStatusSeverity(slotProps.data.status)"
                                />
                            </template>
                        </Column>
                        <Column header="Actions">
                            <template #body="slotProps">
                                <div class="flex gap-2">
                                    <PermissionButton 
                                        permission="view_payment"
                                        icon="pi pi-eye" 
                                        size="small" 
                                        @click="viewTransaction(slotProps.data.id)"
                                    />
                                    <PermissionButton 
                                        permission="change_payment"
                                        icon="pi pi-pencil" 
                                        size="small" 
                                        severity="info"
                                        @click="editTransaction(slotProps.data.id)"
                                    />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </PermissionWrapper>
    </div>
</template>

<script setup>
import PermissionButton from '@/components/common/PermissionButton.vue';
import PermissionWrapper from '@/components/common/PermissionWrapper.vue';
import { usePermissions } from '@/composables/usePermissions';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Tag from 'primevue/tag';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { hasPermission, canRead, canUpdate, canCreate, canDelete } = usePermissions();

const isLoading = ref(false);
const stats = ref({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    cashFlow: 0
});

const recentTransactions = ref([]);

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES'
    }).format(amount);
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-KE');
};

const getTypeSeverity = (type) => {
    const typeMap = {
        'income': 'success',
        'expense': 'danger',
        'transfer': 'info',
        'refund': 'warning'
    };
    return typeMap[type] || 'secondary';
};

const getStatusSeverity = (status) => {
    const statusMap = {
        'completed': 'success',
        'pending': 'warning',
        'failed': 'danger',
        'cancelled': 'secondary'
    };
    return statusMap[status] || 'secondary';
};

const viewPayments = () => {
    router.push('/finance/payments');
};

const viewExpenses = () => {
    router.push('/finance/expenses');
};

const viewAccounts = () => {
    router.push('/finance/accounts');
};

const viewBudgets = () => {
    router.push('/finance/budgets');
};

const viewTaxes = () => {
    router.push('/finance/taxes');
};

const viewReports = () => {
    router.push('/finance/reports');
};

const viewTransaction = (id) => {
    router.push(`/finance/transactions/${id}`);
};

const editTransaction = (id) => {
    router.push(`/finance/transactions/${id}/edit`);
};

const loadStats = async () => {
    // Load financial statistics
    stats.value = {
        totalRevenue: 2500000,
        totalExpenses: 1800000,
        netProfit: 700000,
        cashFlow: 500000
    };
};

const loadRecentTransactions = async () => {
    isLoading.value = true;
    try {
        // Load recent transactions from API
        recentTransactions.value = [
            {
                id: 1,
                date: '2024-01-15',
                type: 'income',
                description: 'Client Payment - Project Alpha',
                amount: 150000,
                status: 'completed'
            },
            {
                id: 2,
                date: '2024-01-15',
                type: 'expense',
                description: 'Office Rent',
                amount: -50000,
                status: 'completed'
            },
            {
                id: 3,
                date: '2024-01-14',
                type: 'income',
                description: 'Service Revenue',
                amount: 75000,
                status: 'pending'
            }
        ];
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    loadStats();
    loadRecentTransactions();
});
</script>

<style scoped>
.finance-dashboard {
    @apply max-w-7xl mx-auto p-6;
}

.stat-card {
    @apply bg-white border border-gray-200 rounded-lg shadow-sm;
}

.action-card {
    @apply bg-white border border-gray-200 rounded-lg shadow-sm;
}

.page-header {
    @apply border-b border-gray-200 pb-4;
}
</style>
