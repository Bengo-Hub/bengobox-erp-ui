<script setup>
import Spinner from '@/components/ui/Spinner.vue';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';

const isLoading = ref(false);
const spinner_title = ref('Please wait! Importing employee data...');
const csvData = ref([]);
const dt = ref();
const selectedFile = ref(null); // Store the selected file
const toast = useToast();

// Export the CSV template (if required)
function exportCSV() {
    dt.value.exportCSV();
}

// Handle file change and parse the CSV for preview
function onFileChange(event) {
    const file = event.target.files[0];
    selectedFile.value = file; // Store the selected file
    if (file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target.result;
            parseCSV(content);
        };

        reader.readAsText(file);
    }
}

// Parse the CSV file to preview
function parseCSV(content) {
    const rows = content.split('\n').map((row) => row.split(','));
    const headers = rows[0];
    const data = rows.slice(1).map((row) => {
        const obj = {};
        row.forEach((cell, i) => {
            obj[headers[i]] = cell;
        });
        return obj;
    });
    csvData.value = data;
}

// Submit CSV function
async function submitCSV() {
    if (!selectedFile.value) {
        alert('No file selected');
        return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile.value);
    formData.append('fileType', 'employees');

    try {
        isLoading.value = true; // Show spinner
        const response = await axios.post('uploads/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `${response.data.message}`,
            life: 3000
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.toString(),
            life: 3000
        });
    } finally {
        isLoading.value = false; // Hide spinner
    }
}
</script>

<template>
    <div class="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <h1 class="text-2xl font-bold mb-5 text-center lg:text-left">Import Employees</h1>

        <!-- Button to download the CSV template -->
        <div class="mb-5 flex justify-center lg:justify-start">
            <Button label="Download Employee CSV Template" icon="pi pi-download" @click="exportCSV($event)" class="mb-5" />
        </div>

        <!-- File input for uploading the CSV -->
        <div class="mb-5">
            <h2 class="text-xl mb-2 text-center lg:text-left">Upload and Preview Employee CSV</h2>
            <input type="file" @change="onFileChange" accept=".csv" class="border p-2 w-full sm:w-auto" />
        </div>

        <!-- Preview the uploaded CSV file -->
        <div class="w-full overflow-x-auto mb-5">
            <DataTable ref="dt" :value="csvData" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 25]" :responsiveLayout="'scroll'" class="w-full">
                <Column field="Staff No" header="Staff No" sortable></Column>
                <Column field="Name" header="Name" sortable></Column>
                <Column field="Job Title" header="Job Title" sortable></Column>
                <Column field="Type" header="Type" sortable></Column>
                <Column field="Emp. Date" header="Emp. Date" sortable></Column>
                <Column field="Emp. Duration" header="Emp. Duration" sortable></Column>
                <Column field="Contract Exp.(Days)" header="Contract Exp.(Days)" sortable></Column>
                <Column field="Basic Pay" header="Basic Pay" sortable></Column>
                <Column field="Gender" header="Gender" sortable></Column>
                <Column field="Date of Birth" header="Date of Birth" sortable></Column>
                <Column field="Age" header="Age" sortable></Column>
                <Column field="Email" header="Email" sortable></Column>
                <Column field="Email(Personal)" header="Email(Personal)" sortable></Column>
                <Column field="Phone" header="Phone" sortable></Column>
                <Column field="PIN" header="PIN" sortable></Column>
                <Column field="ID" header="ID" sortable></Column>
                <Column field="NSSF" header="NSSF" sortable></Column>
                <Column field="NHIF" header="NHIF" sortable></Column>
                <Column field="Dept." header="Dept." sortable></Column>
                <Column field="Region" header="Region" sortable></Column>
                <Column field="Bank" header="Bank" sortable></Column>
                <Column field="Bank Branch" header="Bank Branch" sortable></Column>
                <Column field="Bank Code" header="Bank Code" sortable></Column>
                <Column field="Bank Acc" header="Bank Acc" sortable></Column>
            </DataTable>
        </div>

        <!-- Button to submit the CSV for importing employees -->
        <div class="flex justify-center lg:justify-start">
            <Button v-if="csvData.length" label="Import Employees" icon="pi pi-upload" class="mt-5" @click="submitCSV" :disabled="isLoading" />
        </div>

        <!-- Progress Spinner -->
        <Spinner :isLoading="isLoading" :title="spinner_title" />
    </div>
</template>

<style scoped>
/* Add any additional custom styles */
</style>
