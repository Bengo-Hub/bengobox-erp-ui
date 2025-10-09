<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Button from 'primevue/button';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import CategoryManager from '@/components/products/CategoryManager.vue';
import SimpleItemManager from '@/components/products/SimpleItemManager.vue';
import { EcommerceService } from '@/services/EcommerceService';

const toast = useToast();

// Data
const activeTab = ref(0);
const settingsVisible = ref(false);
const apiEndpoint = ref(import.meta.env.VITE_API_BASE_URL || '');

// Category data
const mainCategories = ref([]);
const categories = ref([]);
const subcategories = ref([]);
const brands = ref([]);
const models = ref([]);

// Fetch all data on mount
onMounted(async () => {
    await Promise.all([fetchMainCategories(), fetchCategories(), fetchSubcategories(), fetchBrands(), fetchModels()]);
});

// Fetch functions
const fetchMainCategories = async () => {
    try {
        const response = await EcommerceService.getMainCategories();
        mainCategories.value = response.data.results;
    } catch (error) {
        showError('Failed to fetch main categories');
    }
};

const fetchCategories = async () => {
    try {
        const response = await EcommerceService.getCategories();
        categories.value = response.data.results;
    } catch (error) {
        showError('Failed to fetch categories');
    }
};

const fetchSubcategories = async () => {
    try {
        const response = await EcommerceService.getSubcategories();
        subcategories.value = response.data.results;
    } catch (error) {
        showError('Failed to fetch subcategories');
    }
};

const fetchBrands = async () => {
    try {
        const response = await EcommerceService.getBrands();
        brands.value = response.data.results;
    } catch (error) {
        showError('Failed to fetch brands');
    }
};

const fetchModels = async () => {
    try {
        const response = await EcommerceService.getModels();
        models.value = response.data.results;
    } catch (error) {
        showError('Failed to fetch models');
    }
};

// Save handlers
const handleSaveMainCategory = async (categoryData) => {
    try {
        if (categoryData.id) {
            await EcommerceService.updateMainCategory(categoryData.id, categoryData);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Main category updated', life: 3000 });
        } else {
            await EcommerceService.createMainCategory(categoryData);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Main category created', life: 3000 });
        }
        await fetchMainCategories();
    } catch (error) {
        showError('Failed to save main category');
    }
};

const handleSaveCategory = async (categoryData) => {
    try {
        if (categoryData.id) {
            await EcommerceService.updateCategory(categoryData.id, categoryData);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Category updated', life: 3000 });
        } else {
            await EcommerceService.createCategory(categoryData);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Category created', life: 3000 });
        }
        await fetchCategories();
    } catch (error) {
        showError('Failed to save category');
    }
};

const handleSaveSubcategory = async (categoryData) => {
    try {
        if (categoryData.id) {
            await EcommerceService.updateSubcategory(categoryData.id, categoryData);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Subcategory updated', life: 3000 });
        } else {
            await EcommerceService.createSubcategory(categoryData);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Subcategory created', life: 3000 });
        }
        await fetchSubcategories();
    } catch (error) {
        showError('Failed to save subcategory');
    }
};

const handleSaveBrand = async (brandData) => {
    try {
        if (brandData.id) {
            await EcommerceService.updateBrand(brandData.id, brandData);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Brand updated', life: 3000 });
        } else {
            await EcommerceService.createBrand(brandData);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Brand created', life: 3000 });
        }
        await fetchBrands();
    } catch (error) {
        showError('Failed to save brand');
    }
};

const handleSaveModel = async (modelData) => {
    try {
        if (modelData.id) {
            await EcommerceService.updateModel(modelData.id, modelData);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Model updated', life: 3000 });
        } else {
            await EcommerceService.createModel(modelData);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Model created', life: 3000 });
        }
        await fetchModels();
    } catch (error) {
        showError('Failed to save model');
    }
};

// Delete handlers
const handleDeleteMainCategory = async (id) => {
    try {
        await EcommerceService.deleteMainCategory(id);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Main category deleted', life: 3000 });
        await fetchMainCategories();
    } catch (error) {
        showError('Failed to delete main category');
    }
};

const handleDeleteCategory = async (id) => {
    try {
        await EcommerceService.deleteCategory(id);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Category deleted', life: 3000 });
        await fetchCategories();
    } catch (error) {
        showError('Failed to delete category');
    }
};

const handleDeleteSubcategory = async (id) => {
    try {
        await EcommerceService.deleteSubcategory(id);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Subcategory deleted', life: 3000 });
        await fetchSubcategories();
    } catch (error) {
        showError('Failed to delete subcategory');
    }
};

const handleDeleteBrand = async (id) => {
    try {
        await EcommerceService.deleteBrand(id);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Brand deleted', life: 3000 });
        await fetchBrands();
    } catch (error) {
        showError('Failed to delete brand');
    }
};

const handleDeleteModel = async (id) => {
    try {
        await EcommerceService.deleteModel(id);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Model deleted', life: 3000 });
        await fetchModels();
    } catch (error) {
        showError('Failed to delete model');
    }
};

// Settings
const toggleSettings = () => {
    settingsVisible.value = !settingsVisible.value;
};

const saveSettings = () => {
    // Save settings logic here
    settingsVisible.value = false;
    toast.add({ severity: 'success', summary: 'Success', detail: 'Settings saved', life: 3000 });
};

// Helper functions
const showError = (message) => {
    toast.add({ severity: 'error', summary: 'Error', detail: message, life: 3000 });
};
</script>

<template>
    <div class="container mx-auto px-4 py-6">
        <Card class="mb-6">
            <template #title>
                <div class="flex justify-between items-center">
                    <span>Product Management</span>
                    <Button icon="pi pi-cog" class="p-button-rounded p-button-text" @click="toggleSettings" />
                </div>
            </template>
            <template #content>
                <TabView v-model:activeIndex="activeTab">
                    <TabPanel header="Main Categories">
                        <CategoryManager type="main" :items="mainCategories" @save="handleSaveMainCategory" @delete="handleDeleteMainCategory" />
                    </TabPanel>
                    <TabPanel header="Categories">
                        <CategoryManager type="category" :items="categories" @save="handleSaveCategory" @delete="handleDeleteCategory" />
                    </TabPanel>
                    <TabPanel header="Subcategories">
                        <CategoryManager type="subcategory" :items="subcategories" @save="handleSaveSubcategory" @delete="handleDeleteSubcategory" />
                    </TabPanel>
                    <TabPanel header="Brands">
                        <SimpleItemManager title="Brand" :items="brands" @save="handleSaveBrand" @delete="handleDeleteBrand" />
                    </TabPanel>
                    <TabPanel header="Models">
                        <SimpleItemManager title="Model" :items="models" @save="handleSaveModel" @delete="handleDeleteModel" />
                    </TabPanel>
                </TabView>
            </template>
        </Card>

        <Dialog v-model:visible="settingsVisible" header="Settings" :modal="true" :style="{ width: '50vw' }">
            <div class="grid grid-cols-1 gap-4">
                <div class="field">
                    <label for="apiEndpoint" class="block mb-2">API Endpoint</label>
                    <InputText id="apiEndpoint" v-model="apiEndpoint" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Save" icon="pi pi-check" @click="saveSettings" />
            </template>
        </Dialog>
    </div>
</template>
