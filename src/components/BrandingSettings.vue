<script>
import { useLayout } from '@/layout/composables/layout';
import { ref, reactive, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
import { useBusinessBranding } from '@/utils/businessBranding';

export default {
    name: 'BrandingSettings',
    emits: ['settings-saved'],
    setup(props, { emit }) {
        const store = useStore();
        const toast = useToast();
        const { getCurrentThemeSettings, DEFAULT_BRANDING } = useBusinessBranding();
        const { layoutConfig } = useLayout();

        const loading = ref(true);
        const saving = ref(false);

        // Get business details
        const business = computed(() => store.state.auth.business);
        const businessId = computed(() => business.value?.id);

        // Theme options
        const presetOptions = ref(['Lara', 'Aura']);
        const menuModeOptions = ref([
            { label: 'Static', value: 'static' },
            { label: 'Overlay', value: 'overlay' }
        ]);

        // Color options
        const primaryColors = ref([
            { name: 'blue', palette: { 500: '#3B82F6' } },
            { name: 'green', palette: { 500: '#22C55E' } },
            { name: 'yellow', palette: { 500: '#EAB308' } },
            { name: 'cyan', palette: { 500: '#06B6D4' } },
            { name: 'pink', palette: { 500: '#EC4899' } },
            { name: 'indigo', palette: { 500: '#6366F1' } },
            { name: 'red', palette: { 500: '#EF4444' } },
            { name: 'teal', palette: { 500: '#14B8A6' } },
            { name: 'orange', palette: { 500: '#F97316' } },
            { name: 'emerald', palette: { 500: '#10B981' } },
            { name: 'purple', palette: { 500: '#A855F7' } },
            { name: 'noir', palette: { 500: '#1F2937' } }
        ]);

        const surfaces = ref([
            { name: 'slate', palette: { card: '#F1F5F9', section: '#E2E8F0', border: '#CBD5E1' } },
            { name: 'sand', palette: { card: '#FAFAF9', section: '#F5F5F4', border: '#E7E5E4' } },
            { name: 'material', palette: { card: '#FAFAFA', section: '#F5F5F5', border: '#EEEEEE' } },
            { name: 'coal', palette: { card: '#1E293B', section: '#334155', border: '#475569' } },
            { name: 'iris', palette: { card: '#242456', section: '#33336F', border: '#464689' } },
            { name: 'dim', palette: { card: '#282828', section: '#3F3F3F', border: '#545454' } }
        ]);

        // Form data
        const formData = reactive({
            theme_preset: 'Lara',
            dark_mode: false,
            primary_color_name: 'blue',
            surface_name: 'slate',
            menu_mode: 'static',
            business_primary_color: '#3B82F6',
            business_secondary_color: '#10B981',
            business_text_color: '#1F2937',
            business_background_color: '#FFFFFF',
            extended_settings: {
                ripple_effect: true,
                compact_mode: false,
                scale_factor: 1.0,
                border_radius: '4px'
            }
        });

        // Methods
        const loadSettings = async () => {
            try {
                loading.value = true;

                // First try to get settings from store/API
                if (businessId.value) {
                    await store.dispatch('auth/fetchBrandingSettings');
                }

                // Then populate form data
                if (business.value?.branding_settings) {
                    const settings = business.value.branding_settings;

                    // Apply settings to form
                    formData.theme_preset = settings.theme_preset || 'Lara';
                    formData.dark_mode = settings.dark_mode || false;
                    formData.primary_color_name = settings.primary_color_name || 'blue';
                    formData.surface_name = settings.surface_name || 'slate';
                    formData.menu_mode = settings.menu_mode || 'static';
                    formData.business_primary_color = settings.business_primary_color || '#3B82F6';
                    formData.business_secondary_color = settings.business_secondary_color || '#10B981';
                    formData.business_text_color = settings.business_text_color || '#1F2937';
                    formData.business_background_color = settings.business_background_color || '#FFFFFF';

                    if (settings.extended_settings) {
                        formData.extended_settings = {
                            ...formData.extended_settings,
                            ...settings.extended_settings
                        };
                    }
                } else {
                    // Try to get from localStorage
                    const localSettings = getCurrentThemeSettings();

                    if (localSettings) {
                        formData.theme_preset = localSettings.theme_preset || formData.theme_preset;
                        formData.dark_mode = localSettings.dark_mode || formData.dark_mode;
                        formData.primary_color_name = localSettings.primary_color_name || formData.primary_color_name;
                        formData.surface_name = localSettings.surface_name || formData.surface_name;
                        formData.menu_mode = localSettings.menu_mode || formData.menu_mode;

                        if (localSettings.extended_settings) {
                            formData.extended_settings = {
                                ...formData.extended_settings,
                                ...localSettings.extended_settings
                            };
                        }
                    }

                    // Get business colors from current configuration
                    if (business.value) {
                        formData.business_primary_color = business.value.business_primary_color || formData.business_primary_color;
                        formData.business_secondary_color = business.value.business_secondary_color || formData.business_secondary_color;
                        formData.business_text_color = business.value.business_text_color || formData.business_text_color;
                        formData.business_background_color = business.value.business_background_color || formData.business_background_color;
                    }
                }
            } catch (error) {
                console.error('Error loading settings:', error);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load settings', life: 3000 });
            } finally {
                loading.value = false;
            }
        };

        const saveSettings = async () => {
            if (!businessId.value) {
                toast.add({ severity: 'warn', summary: 'Warning', detail: 'No business selected', life: 3000 });
                return;
            }

            try {
                saving.value = true;

                const result = await store.dispatch('auth/updateBrandingSettings', formData);

                toast.add({ severity: 'success', summary: 'Success', detail: 'Branding settings saved successfully', life: 3000 });
                emit('settings-saved', result);
            } catch (error) {
                console.error('Error saving settings:', error);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save settings', life: 3000 });
            } finally {
                saving.value = false;
            }
        };

        const resetToDefaults = () => {
            // Reset to application defaults
            formData.theme_preset = DEFAULT_BRANDING.theme_preset;
            formData.dark_mode = DEFAULT_BRANDING.dark_mode;
            formData.primary_color_name = DEFAULT_BRANDING.primary_color_name;
            formData.surface_name = DEFAULT_BRANDING.surface_name;
            formData.menu_mode = DEFAULT_BRANDING.menu_mode;
            formData.business_primary_color = DEFAULT_BRANDING.primaryColor;
            formData.business_secondary_color = DEFAULT_BRANDING.secondaryColor;
            formData.business_text_color = DEFAULT_BRANDING.textColor;
            formData.business_background_color = DEFAULT_BRANDING.backgroundColor;
            formData.extended_settings = { ...DEFAULT_BRANDING.extended_settings };

            toast.add({ severity: 'info', summary: 'Reset', detail: 'Settings reset to defaults', life: 3000 });
        };

        const getSurfacePreviewStyle = (surface) => {
            if (!surface) return {};

            return {
                '--surface-card': surface.palette.card,
                '--surface-section': surface.palette.section,
                '--surface-border': surface.palette.border
            };
        };

        const getPreviewStyle = () => {
            return {
                backgroundColor: formData.business_background_color,
                color: formData.business_text_color,
                borderRadius: formData.extended_settings.border_radius,
                transform: `scale(${formData.extended_settings.scale_factor})`
            };
        };

        const lightenColor = (color, percent) => {
            try {
                // Convert hex to RGB
                let r = parseInt(color.substring(1, 3), 16);
                let g = parseInt(color.substring(3, 5), 16);
                let b = parseInt(color.substring(5, 7), 16);

                // Lighten
                r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
                g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
                b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

                // Convert back to hex
                return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            } catch (error) {
                return color;
            }
        };

        // Load settings on mount
        onMounted(() => {
            loadSettings();
        });

        return {
            loading,
            saving,
            formData,
            presetOptions,
            menuModeOptions,
            primaryColors,
            surfaces,
            layoutConfig,
            saveSettings,
            resetToDefaults,
            getSurfacePreviewStyle,
            getPreviewStyle,
            lightenColor
        };
    }
};
</script>

<template>
    <div class="branding-settings-container">
        <div v-if="loading" class="flex justify-content-center">
            <ProgressSpinner />
        </div>

        <div v-else class="grid">
            <!-- Theme Settings -->
            <div class="col-12 md:col-6 xl:col-4">
                <div class="card">
                    <h5>Theme</h5>

                    <div class="field">
                        <label for="preset">Theme Preset</label>
                        <SelectButton v-model="formData.theme_preset" :options="presetOptions" id="preset" class="w-full" />
                    </div>

                    <div class="field">
                        <label for="dark-mode">Dark Mode</label>
                        <div class="flex align-items-center">
                            <InputSwitch v-model="formData.dark_mode" id="dark-mode" />
                            <span class="ml-2">{{ formData.dark_mode ? 'Enabled' : 'Disabled' }}</span>
                        </div>
                    </div>

                    <div class="field">
                        <label for="menu-mode">Menu Mode</label>
                        <Dropdown v-model="formData.menu_mode" :options="menuModeOptions" optionLabel="label" optionValue="value" id="menu-mode" class="w-full" />
                    </div>
                </div>
            </div>

            <!-- Color Settings -->
            <div class="col-12 md:col-6 xl:col-4">
                <div class="card">
                    <h5>Primary Color</h5>
                    <div class="grid">
                        <div v-for="color in primaryColors" :key="color.name" class="col-2">
                            <div
                                class="color-item cursor-pointer border-round-md flex align-items-center justify-content-center overflow-hidden"
                                :class="{ 'border-2 border-primary': formData.primary_color_name === color.name }"
                                :style="{ backgroundColor: color.palette['500'] }"
                                @click="formData.primary_color_name = color.name"
                            >
                                <i v-if="formData.primary_color_name === color.name" class="pi pi-check text-white" style="font-size: 1rem"></i>
                            </div>
                            <div class="text-center text-xs mt-1">{{ color.name }}</div>
                        </div>
                    </div>

                    <h5 class="mt-4">Surface Style</h5>
                    <div class="grid">
                        <div v-for="surface in surfaces" :key="surface.name" class="col-3">
                            <div class="surface-item cursor-pointer border-round-md overflow-hidden p-2" :class="{ 'border-2 border-primary': formData.surface_name === surface.name }" @click="formData.surface_name = surface.name">
                                <div class="flex flex-column surface-demo h-4rem" :style="getSurfacePreviewStyle(surface)">
                                    <div class="h-2rem" :style="{ backgroundColor: 'var(--surface-card)' }"></div>
                                    <div class="h-2rem flex">
                                        <div class="w-6 h-full" :style="{ backgroundColor: 'var(--surface-section)' }"></div>
                                        <div class="w-6 h-full" :style="{ backgroundColor: 'var(--surface-border)' }"></div>
                                    </div>
                                </div>
                                <div class="text-center text-xs mt-1">{{ surface.name }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Business Colors -->
            <div class="col-12 md:col-6 xl:col-4">
                <div class="card">
                    <h5>Business Colors</h5>

                    <div class="field">
                        <label for="primary-color">Primary Color</label>
                        <ColorPicker v-model="formData.business_primary_color" id="primary-color" class="w-full" />
                        <small>This color will be used for branding elements throughout the application.</small>
                    </div>

                    <div class="field">
                        <label for="secondary-color">Secondary Color</label>
                        <ColorPicker v-model="formData.business_secondary_color" id="secondary-color" class="w-full" />
                    </div>

                    <div class="field">
                        <label for="text-color">Text Color</label>
                        <ColorPicker v-model="formData.business_text_color" id="text-color" class="w-full" />
                    </div>

                    <div class="field">
                        <label for="background-color">Background Color</label>
                        <ColorPicker v-model="formData.business_background_color" id="background-color" class="w-full" />
                    </div>
                </div>
            </div>

            <!-- Extended Settings -->
            <div class="col-12">
                <div class="card">
                    <h5>Advanced Settings</h5>

                    <div class="grid">
                        <div class="col-12 md:col-3">
                            <div class="field">
                                <label for="ripple-effect">Ripple Effect</label>
                                <div class="flex align-items-center">
                                    <InputSwitch v-model="formData.extended_settings.ripple_effect" id="ripple-effect" />
                                    <span class="ml-2">{{ formData.extended_settings.ripple_effect ? 'Enabled' : 'Disabled' }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="col-12 md:col-3">
                            <div class="field">
                                <label for="compact-mode">Compact Mode</label>
                                <div class="flex align-items-center">
                                    <InputSwitch v-model="formData.extended_settings.compact_mode" id="compact-mode" />
                                    <span class="ml-2">{{ formData.extended_settings.compact_mode ? 'Enabled' : 'Disabled' }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="col-12 md:col-3">
                            <div class="field">
                                <label for="scale-factor">Scale Factor</label>
                                <Slider v-model="formData.extended_settings.scale_factor" :min="0.8" :max="1.2" :step="0.05" />
                                <div class="text-center">{{ formData.extended_settings.scale_factor }}</div>
                            </div>
                        </div>

                        <div class="col-12 md:col-3">
                            <div class="field">
                                <label for="border-radius">Border Radius</label>
                                <InputText v-model="formData.extended_settings.border_radius" id="border-radius" class="w-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Preview -->
            <div class="col-12">
                <div class="card">
                    <h5>Preview</h5>
                    <div class="preview-container border-round p-3" :style="getPreviewStyle()">
                        <div class="flex align-items-center justify-content-between mb-3">
                            <div class="flex align-items-center">
                                <i class="pi pi-th-large mr-2" :style="{ color: formData.business_primary_color }"></i>
                                <span :style="{ color: formData.business_text_color }">Dashboard</span>
                            </div>
                            <Button label="Action" :style="{ backgroundColor: formData.business_primary_color, borderColor: formData.business_primary_color }" />
                        </div>

                        <div class="flex flex-column border-round-md p-3 mb-3" :style="{ backgroundColor: lightenColor(formData.business_background_color, 10) }">
                            <h6 :style="{ color: formData.business_text_color }">Sample Card</h6>
                            <p :style="{ color: formData.business_text_color }">This is how your content will appear with the selected theme settings.</p>
                        </div>

                        <div class="flex gap-2">
                            <Button label="Primary" severity="primary" :style="{ backgroundColor: formData.business_primary_color, borderColor: formData.business_primary_color }" />
                            <Button label="Secondary" severity="secondary" :style="{ backgroundColor: formData.business_secondary_color, borderColor: formData.business_secondary_color }" />
                        </div>
                    </div>

                    <div class="flex justify-content-end mt-4">
                        <Button label="Reset to Defaults" icon="pi pi-refresh" outlined class="mr-2" @click="resetToDefaults" />
                        <Button label="Save Changes" icon="pi pi-save" :loading="saving" @click="saveSettings" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.color-item {
    height: 2.5rem;
    width: 100%;
    transition: all 0.2s;
}

.color-item:hover {
    transform: scale(1.05);
}

.surface-item {
    height: auto;
    width: 100%;
    transition: all 0.2s;
}

.surface-item:hover {
    transform: scale(1.05);
}

.preview-container {
    transition: all 0.3s;
    min-height: 200px;
}

.branding-settings-container {
    padding: 1rem 0;
}
</style>
