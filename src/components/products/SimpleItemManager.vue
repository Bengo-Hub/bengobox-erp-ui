<script setup>
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    items: {
        type: Array,
        required: true
    }
});

const emit = defineEmits(['save', 'delete']);

const toast = useToast();

// State
const displayDialog = ref(false);
const deleteDialog = ref(false);
const editMode = ref(false);
const loading = ref(false);
const itemToDelete = ref(null);

const formData = ref({
    id: null,
    title: ''
});

// Methods
const openAddDialog = () => {
    editMode.value = false;
    displayDialog.value = true;
};

const editItem = (item) => {
    editMode.value = true;
    formData.value = { ...item };
    displayDialog.value = true;
};

const confirmDelete = (id) => {
    itemToDelete.value = id;
    deleteDialog.value = true;
};

const deleteItem = () => {
    emit('delete', itemToDelete.value);
    deleteDialog.value = false;
    itemToDelete.value = null;
};

const saveItem = () => {
    if (!formData.value.title) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Name is required', life: 3000 });
        return;
    }

    emit('save', formData.value);
    displayDialog.value = false;
};

const resetForm = () => {
    formData.value = {
        id: null,
        title: ''
    };
};
</script>

<template>
    <div>
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold">{{ title }} Management</h3>
            <Button label="Add New" icon="pi pi-plus" class="p-button-sm" @click="openAddDialog" />
        </div>

        <DataTable
            :value="items"
            :paginator="true"
            :rows="10"
            :loading="loading"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
            responsiveLayout="scroll"
            class="p-datatable-sm"
        >
            <Column field="title" header="Name" :sortable="true"></Column>
            <Column header="Actions" :exportable="false" style="min-width: 8rem">
                <template #body="{ data }">
                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-sm mr-2" @click="editItem(data)" />
                    <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-sm p-button-danger" @click="confirmDelete(data.id)" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="displayDialog" :header="editMode ? `Edit ${title}` : `Add New ${title}`" :modal="true" :style="{ width: '50vw' }" @hide="resetForm">
            <div class="grid grid-cols-1 gap-4">
                <div class="field">
                    <label for="title" class="block mb-2">Name</label>
                    <InputText id="title" v-model="formData.title" class="w-full" />
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="resetForm" />
                <Button label="Save" icon="pi pi-check" @click="saveItem" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteDialog" header="Confirm" :modal="true" :style="{ width: '350px' }">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span>Are you sure you want to delete this item?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteDialog = false" />
                <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteItem" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.confirmation-content {
    display: flex;
    align-items: center;
    justify-content: center;
}

.p-datatable {
    font-size: 0.875rem;
}

@media (max-width: 640px) {
    .p-dialog {
        width: 95vw !important;
    }
}
</style>
