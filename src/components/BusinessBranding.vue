<script setup>
import logoImage from '@/assets/images/logos/logo.png';
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';

const props = defineProps({
    size: {
        type: String,
        default: 'medium' // small, medium, large
    },
    showName: {
        type: Boolean,
        default: true
    }
});

const emit = defineEmits(['loaded']);

const store = useStore();
const defaultLogo = ref(logoImage);
const businessName = ref('BengoBox ERP');
const businessDetails = ref(null);
const isLoaded = ref(false);

// Load business details if available
onMounted(() => {
    loadBusinessDetails();
});

function loadBusinessDetails() {
    // First check if it's in the Vuex store
    const storeBusinessDetails = store.state.auth.business;
    if (storeBusinessDetails) {
        setBusinessDetails(storeBusinessDetails);
    } else {
        // If not in store, check sessionStorage
        const storedBusinessData = sessionStorage.getItem('business');
        //console.log('Stored business data:', storedBusinessData);
        if (storedBusinessData) {
            try {
                const business = JSON.parse(storedBusinessData);
                setBusinessDetails(business);
                // Update the store if needed
                if (!storeBusinessDetails) {
                    store.dispatch('auth/updateBusinessDetails', business);
                }
            } catch (error) {
                console.error('Error parsing business data:', error);
            }
        }
    }
    isLoaded.value = true;
    emit('loaded', businessDetails.value);
}

// Set business details
function setBusinessDetails(business) {
    if (!business) return;

    businessDetails.value = business;
    if (business.business__name) {
        businessName.value = business.business__name;
    }
}

// Computed property for logo size classes
const logoSizeClass = computed(() => {
    switch (props.size) {
        case 'small':
            return 'h-36 w-48';
        case 'large':
            return 'h-60 w-80';
        case 'medium':
            return 'h-48 w-64';
        default:
            return 'h-36 w-48';
    }
});

// Computed property for logo source
const logoSrc = computed(() => {
    if (businessDetails.value && businessDetails.value.business__logo) {
        return businessDetails.value.business__logo;
    }
    return defaultLogo.value;
});

// Expose business details for parent components
defineExpose({
    businessDetails,
    businessName,
    logoSrc,
    isLoaded
});
</script>

<template>
    <div class="business-branding flex items-center space-x-2 mt-0 mb-0">
        <img :src="logoSrc" :alt="businessName" :class="[logoSizeClass, 'object-contain']" />
        <span v-if="showName" class="business-name text-lg font-bold uppercase whitespace-nowrap animate-color-wave">
            {{ businessName }}
        </span>
    </div>
</template>

<style scoped>
.business-branding {
    display: flex;
    align-items: center;
}
</style>
