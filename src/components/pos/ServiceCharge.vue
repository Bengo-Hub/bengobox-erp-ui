<script setup>
import Spinner from '@/components/ui/Spinner.vue';
import { ref } from 'vue';

const isProcessing = ref(false);
const spinner_title = ref('Processing...');

// Add your service charge logic here
</script>

<template>
    <div>
        <Spinner :isLoading="isProcessing" :title="spinner_title" />
        <!-- Service charge input and logic go here -->
    </div>
</template>
