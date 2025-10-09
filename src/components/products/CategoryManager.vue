<script setup>
import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
    type: {
        type: String,
        required: true,
        validator: (value) => ['main', 'category', 'subcategory'].includes(value)
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
const uploadError = ref(null);
const imagePreview = ref(null);
const itemToDelete = ref(null);

const formData = ref({
    id: null,
    name: '',
    status: 'active',
    display_image: null
});

const statusOptions = ref([
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
]);

// Computed
const typeLabel = computed(() => {
    const labels = {
        main: 'Main Category',
        category: 'Category',
        subcategory: 'Subcategory'
    };
    return labels[props.type] || props.type;
});

const uploadUrl = computed(() => {
    return `${import.meta.env.VITE_API_BASE_URL}/upload/${props.type}-image`;
});

// Methods
const openAddDialog = () => {
    editMode.value = false;
    displayDialog.value = true;
};

const editItem = (item) => {
    editMode.value = true;
    formData.value = { ...item };
    if (item.display_image) {
        imagePreview.value = item.display_image;
    }
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
    if (!formData.value.name) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Name is required', life: 3000 });
        return;
    }

    emit('save', formData.value);
    displayDialog.value = false;
};

const resetForm = () => {
    formData.value = {
        id: null,
        name: '',
        status: 1,
        display_image: null
    };
    imagePreview.value = null;
    uploadError.value = null;
};

const onImageUpload = (event) => {
    const file = event.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
        uploadError.value = 'Only image files are allowed';
        return;
    }

    // Validate file size (2MB max)
    if (file.size > 2000000) {
        uploadError.value = 'File size must be less than 2MB';
        return;
    }

    uploadError.value = null;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.value = e.target.result;
        formData.value.display_image = file;
    };
    reader.readAsDataURL(file);
};
</script>

<template>
    <div>
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold capitalize">{{ type }} Management</h3>
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
            <Column field="name" header="Name" :sortable="true"></Column>
            <Column field="status" header="Status" :sortable="true">
                <template #body="{ data }">
                    <Tag :value="data.status === 'active' ? 'Active' : 'Inactive'" :severity="data.status === 'active' ? 'success' : 'danger'" />
                </template>
            </Column>
            <Column header="Image">
                <template #body="{ data }">
                    <img v-if="data.display_image" :src="data.display_image" :alt="data.name" class="w-10 h-10 object-cover rounded" />
                    <span v-else class="text-gray-400">No image</span>
                </template>
            </Column>
            <Column header="Actions" :exportable="false" style="min-width: 8rem">
                <template #body="{ data }">
                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-sm mr-2" @click="editItem(data)" />
                    <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-sm p-button-danger" @click="confirmDelete(data.id)" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="displayDialog" :header="editMode ? `Edit ${type}` : `Add New ${type}`" :modal="true" :style="{ width: '50vw' }" @hide="resetForm">
            <div class="grid grid-cols-1 gap-4">
                <div class="field">
                    <label for="name" class="block mb-2">Name</label>
                    <InputText id="name" v-model="formData.name" class="w-full" />
                </div>

                <div class="field">
                    <label for="status" class="block mb-2">Status</label>
                    <Dropdown id="status" v-model="formData.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                </div>

                <div class="field">
                    <label for="image" class="block mb-2">Display Image</label>
                    <FileUpload mode="basic" name="image" :url="uploadUrl" accept="image/*" :maxFileSize="2000000" chooseLabel="Upload Image" @upload="onImageUpload" />
                    <small class="p-error" v-if="uploadError">{{ uploadError }}</small>
                    <div v-if="imagePreview" class="mt-2">
                        <img :src="imagePreview" class="w-20 h-20 object-cover rounded" />
                    </div>
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
