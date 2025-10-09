<script setup>
import { userManagementService } from '@/services/auth/userManagementService';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Checkbox from 'primevue/checkbox';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Steps from 'primevue/steps';
import Textarea from 'primevue/textarea';
import { useToast } from '@/composables/useToast';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();
const loading = ref(false);

// 2FA Setup
const twoFASetup = ref({
    isEnabled: false,
    qrCode: '',
    secretKey: '',
    backupCodes: [],
    verificationCode: ''
});
const showSecretKey = ref(false);
const twoFASetupDialog = ref(false);
const twoFASetupStep = ref(0);
const twoFASteps = [{ label: 'Generate Setup' }, { label: 'Scan QR Code' }, { label: 'Verify Code' }, { label: 'Save Backup Codes' }];

// Password Policy
const passwordPolicy = ref({
    min_length: 8,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_special_chars: true,
    password_expiry_days: 90,
    max_login_attempts: 5,
    lockout_duration_minutes: 30
});

// Organization
const organization = ref({
    name: '',
    email: '',
    phone: '',
    address: '',
    logo: null
});

// Departments
const departments = ref([]);
const users = ref([]);
const department = ref({});
const selectedDepartment = ref(null);
const departmentDialog = ref(false);
const deleteDepartmentDialog = ref(false);
const departmentFilter = ref('');

const loadData = async () => {
    loading.value = true;
    try {
        const [policyRes, orgRes, deptRes, usersRes, twoFARes] = await Promise.all([
            userManagementService.getPasswordPolicy(),
            userManagementService.getOrganization(),
            userManagementService.getDepartments(),
            userManagementService.getUsers(),
            userManagementService.get2FAStatus()
        ]);

        passwordPolicy.value = policyRes.data;
        organization.value = orgRes.data;
        departments.value = deptRes.data;
        users.value = usersRes.data.map((user) => ({
            ...user,
            full_name: `${user.first_name} ${user.last_name}`
        }));
        twoFASetup.value.isEnabled = twoFARes.data.is_enabled;
    } catch (error) {
        showToast('error', 'Error', 'Failed to load data', 3000);
    } finally {
        loading.value = false;
    }
};

const savePasswordPolicy = async () => {
    try {
        await userManagementService.updatePasswordPolicy(passwordPolicy.value);
        showToast('success', 'Success', 'Password policy updated successfully', 3000);
    } catch (error) {
        showToast('error', 'Error', 'Failed to update password policy', 3000);
    }
};

const saveOrganization = async () => {
    try {
        await userManagementService.updateOrganization(organization.value);
        showToast('success', 'Success', 'Organization settings updated successfully', 3000);
    } catch (error) {
        showToast('error', 'Error', 'Failed to update organization settings', 3000);
    }
};

const uploadLogo = async (event) => {
    const file = event.files[0];
    const formData = new FormData();
    formData.append('logo', file);

    try {
        const response = await userManagementService.uploadLogo(formData);
        organization.value.logo = response.data.logo_url;
        showToast('success', 'Success', 'Logo uploaded successfully', 3000);
    } catch (error) {
        showToast('error', 'Error', 'Failed to upload logo', 3000);
    }
};

const showDepartmentDialog = () => {
    department.value = {};
    departmentDialog.value = true;
};

const hideDepartmentDialog = () => {
    departmentDialog.value = false;
};

const editDepartment = (dept) => {
    department.value = { ...dept };
    departmentDialog.value = true;
};

const saveDepartment = async () => {
    try {
        if (department.value.id) {
            await userManagementService.updateDepartment(department.value.id, department.value);
        } else {
            await userManagementService.createDepartment(department.value);
        }
        hideDepartmentDialog();
        await loadData();
        showToast('success', 'Success', 'Department saved successfully', 3000);
    } catch (error) {
        showToast('error', 'Error', 'Failed to save department', 3000);
    }
};

const confirmDeleteDepartment = (dept) => {
    department.value = dept;
    deleteDepartmentDialog.value = true;
};

const deleteDepartment = async () => {
    try {
        await userManagementService.deleteDepartment(department.value.id);
        deleteDepartmentDialog.value = false;
        await loadData();
        showToast('success', 'Success', 'Department deleted successfully', 3000);
    } catch (error) {
        showToast('error', 'Error', 'Failed to delete department', 3000);
    }
};

// 2FA Functions
const start2FASetup = async () => {
    try {
        const response = await userManagementService.setup2FA();
        const data = response.data;
        twoFASetup.value.qrCode = data.qr_code;
        twoFASetup.value.secretKey = data.secret_key;
        twoFASetup.value.backupCodes = data.backup_codes;
        twoFASetupStep.value = 1;
        twoFASetupDialog.value = true;
    } catch (error) {
        showToast('error', 'Error', 'Failed to generate 2FA setup', 3000);
    }
};

const verify2FACode = async () => {
    if (!twoFASetup.value.verificationCode) {
        showToast('error', 'Error', 'Please enter the verification code', 3000);
        return;
    }

    try {
        await userManagementService.verify2FA(twoFASetup.value.verificationCode);
        twoFASetup.value.isEnabled = true;
        twoFASetupStep.value = 3;
        showToast('success', 'Success', '2FA enabled successfully', 3000);
    } catch (error) {
        showToast('error', 'Error', error.response?.data?.error || 'Invalid verification code', 3000);
        twoFASetup.value.verificationCode = '';
    }
};

const disable2FA = async () => {
    if (confirm('Are you sure you want to disable two-factor authentication? This will reduce your account security.')) {
        try {
            await userManagementService.disable2FA();
            twoFASetup.value.isEnabled = false;
            showToast('success', 'Success', '2FA disabled successfully', 3000);
        } catch (error) {
            showToast('error', 'Error', 'Failed to disable 2FA', 3000);
        }
    }
};

const downloadBackupCodes = () => {
    const codesText = twoFASetup.value.backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

onMounted(() => {
    loadData();
});
</script>

<template>
    <div class="settings">
        <div class="grid">
            <!-- Two-Factor Authentication -->
            <div class="col-12">
                <Card>
                    <template #title>Two-Factor Authentication</template>
                    <template #content>
                        <div v-if="twoFASetup.isEnabled" class="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-green-800 dark:text-green-200 font-semibold">2FA is Enabled</h3>
                                    <p class="text-green-700 dark:text-green-300">Your account is protected with two-factor authentication.</p>
                                </div>
                                <Button label="Disable 2FA" severity="danger" @click="disable2FA" />
                            </div>
                        </div>
                        <div v-else class="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-blue-800 dark:text-blue-200 font-semibold">2FA is Not Enabled</h3>
                                    <p class="text-blue-700 dark:text-blue-300">Enable two-factor authentication to add an extra layer of security to your account.</p>
                                </div>
                                <Button label="Enable 2FA" @click="start2FASetup" />
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Password Policy -->
            <div class="col-12 md:col-6">
                <Card>
                    <template #title>Password Policy</template>
                    <template #content>
                        <form @submit.prevent="savePasswordPolicy" class="p-fluid">
                            <div class="field">
                                <label for="minLength">Minimum Length</label>
                                <InputNumber v-model="passwordPolicy.min_length" id="minLength" :min="6" :max="32" />
                            </div>

                            <div class="field-checkbox">
                                <Checkbox v-model="passwordPolicy.require_uppercase" id="requireUppercase" />
                                <label for="requireUppercase">Require Uppercase Letters</label>
                            </div>

                            <div class="field-checkbox">
                                <Checkbox v-model="passwordPolicy.require_lowercase" id="requireLowercase" />
                                <label for="requireLowercase">Require Lowercase Letters</label>
                            </div>

                            <div class="field-checkbox">
                                <Checkbox v-model="passwordPolicy.require_numbers" id="requireNumbers" />
                                <label for="requireNumbers">Require Numbers</label>
                            </div>

                            <div class="field-checkbox">
                                <Checkbox v-model="passwordPolicy.require_special_chars" id="requireSpecialChars" />
                                <label for="requireSpecialChars">Require Special Characters</label>
                            </div>

                            <div class="field">
                                <label for="passwordExpiry">Password Expiry (days)</label>
                                <InputNumber v-model="passwordPolicy.password_expiry_days" id="passwordExpiry" :min="0" :max="365" />
                            </div>

                            <div class="field">
                                <label for="maxLoginAttempts">Maximum Login Attempts</label>
                                <InputNumber v-model="passwordPolicy.max_login_attempts" id="maxLoginAttempts" :min="1" :max="10" />
                            </div>

                            <div class="field">
                                <label for="lockoutDuration">Lockout Duration (minutes)</label>
                                <InputNumber v-model="passwordPolicy.lockout_duration_minutes" id="lockoutDuration" :min="1" :max="1440" />
                            </div>

                            <Button type="submit" label="Save Password Policy" class="mt-3" />
                        </form>
                    </template>
                </Card>
            </div>

            <!-- Organization Settings -->
            <div class="col-12 md:col-6">
                <Card>
                    <template #title>Organization Settings</template>
                    <template #content>
                        <form @submit.prevent="saveOrganization" class="p-fluid">
                            <div class="field">
                                <label for="orgName">Organization Name</label>
                                <InputText v-model="organization.name" id="orgName" />
                            </div>

                            <div class="field">
                                <label for="orgEmail">Contact Email</label>
                                <InputText v-model="organization.email" id="orgEmail" type="email" />
                            </div>

                            <div class="field">
                                <label for="orgPhone">Contact Phone</label>
                                <InputText v-model="organization.phone" id="orgPhone" />
                            </div>

                            <div class="field">
                                <label for="orgAddress">Address</label>
                                <Textarea v-model="organization.address" id="orgAddress" rows="3" />
                            </div>

                            <div class="field">
                                <label for="orgLogo">Logo</label>
                                <FileUpload mode="basic" :auto="true" :customUpload="true" @uploader="uploadLogo" accept="image/*" :maxFileSize="1000000" chooseLabel="Upload Logo" />
                                <img v-if="organization.logo" :src="organization.logo" alt="Organization Logo" class="mt-2" style="max-width: 200px" />
                            </div>

                            <Button type="submit" label="Save Organization Settings" class="mt-3" />
                        </form>
                    </template>
                </Card>
            </div>

            <!-- Departments -->
            <div class="col-12">
                <Card>
                    <template #title>Departments</template>
                    <template #content>
                        <DataTable :value="departments" :paginator="true" :rows="10" v-model:selection="selectedDepartment" selectionMode="single" dataKey="id">
                            <template #header>
                                <div class="flex justify-content-between">
                                    <Button label="Add Department" icon="pi pi-plus" @click="showDepartmentDialog" />
                                    <span class="p-input-icon-left">
                                        <i class="pi pi-search" />
                                        <InputText v-model="departmentFilter" placeholder="Search departments..." />
                                    </span>
                                </div>
                            </template>

                            <Column field="name" header="Name" sortable />
                            <Column field="manager" header="Manager" sortable>
                                <template #body="{ data }">
                                    {{ data.manager ? `${data.manager.first_name} ${data.manager.last_name}` : '-' }}
                                </template>
                            </Column>
                            <Column :exportable="false" style="min-width: 8rem">
                                <template #body="{ data }">
                                    <Button icon="pi pi-pencil" class="p-button-text" @click="editDepartment(data)" />
                                    <Button icon="pi pi-trash" class="p-button-text p-button-danger" @click="confirmDeleteDepartment(data)" />
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Department Dialog -->
        <Dialog v-model:visible="departmentDialog" :style="{ width: '450px' }" header="Department Details" :modal="true">
            <div class="p-fluid">
                <div class="field">
                    <label for="deptName">Name</label>
                    <InputText v-model="department.name" id="deptName" required />
                </div>
                <div class="field">
                    <label for="deptManager">Manager</label>
                    <Dropdown v-model="department.manager" :options="users" optionLabel="full_name" optionValue="id" placeholder="Select Manager" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDepartmentDialog" />
                <Button label="Save" icon="pi pi-check" @click="saveDepartment" />
            </template>
        </Dialog>

        <!-- Delete Department Dialog -->
        <Dialog v-model:visible="deleteDepartmentDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="department"
                    >Are you sure you want to delete <b>{{ department.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteDepartmentDialog = false" />
                <Button label="Yes" icon="pi pi-check" class="p-button-danger" @click="deleteDepartment" />
            </template>
        </Dialog>

        <!-- 2FA Setup Dialog -->
        <Dialog v-model:visible="twoFASetupDialog" :style="{ width: '600px' }" header="Two-Factor Authentication Setup" :modal="true" :closable="false">
            <Steps :model="twoFASteps" :readonly="false" :activeStep="twoFASetupStep" />

            <!-- Step 1: Generate Setup -->
            <div v-if="twoFASetupStep === 0" class="mt-4">
                <p>Two-factor authentication adds an extra layer of security to your account. You'll need to enter a code from your authenticator app in addition to your password.</p>
                <p class="mt-2 text-sm text-muted-color">You'll need an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator.</p>
                <div class="mt-4">
                    <Button label="Start Setup" @click="start2FASetup" />
                </div>
            </div>

            <!-- Step 2: Scan QR Code -->
            <div v-if="twoFASetupStep === 1" class="mt-4">
                <p>Open your authenticator app and scan the QR code below, or enter the secret key manually.</p>

                <div class="grid">
                    <div class="col-12 md:col-6">
                        <div class="text-center p-4 border rounded">
                            <div v-if="twoFASetup.qrCode">
                                <img :src="twoFASetup.qrCode" alt="QR Code" class="mx-auto" />
                            </div>
                            <div v-else class="text-6xl text-muted-color">📱</div>
                        </div>
                    </div>

                    <div class="col-12 md:col-6">
                        <h4>Manual Entry</h4>
                        <p class="text-sm text-muted-color">If you can't scan the QR code, enter this secret key manually:</p>

                        <div class="flex items-center mt-2">
                            <InputText :value="showSecretKey ? twoFASetup.secretKey : '••••••••••••••••'" readonly class="flex-1" />
                            <Button :icon="showSecretKey ? 'pi pi-eye-slash' : 'pi pi-eye'" @click="showSecretKey = !showSecretKey" class="ml-2" />
                        </div>

                        <p class="text-sm text-muted-color mt-2">
                            Account: {{ organization.email || 'your-email@example.com' }}<br />
                            Issuer: Bengo ERP
                        </p>
                    </div>
                </div>

                <div class="mt-4 flex gap-2">
                    <Button label="Back" severity="secondary" @click="twoFASetupStep = 0" />
                    <Button label="Next" @click="twoFASetupStep = 2" />
                </div>
            </div>

            <!-- Step 3: Verify Code -->
            <div v-if="twoFASetupStep === 2" class="mt-4">
                <p>Enter the 6-digit code from your authenticator app to verify the setup.</p>

                <div class="mt-4">
                    <label for="verificationCode" class="block font-medium mb-2">Verification Code</label>
                    <InputText id="verificationCode" v-model="twoFASetup.verificationCode" placeholder="000000" maxlength="6" class="w-full text-center text-2xl tracking-widest" />
                </div>

                <div class="mt-4 flex gap-2">
                    <Button label="Back" severity="secondary" @click="twoFASetupStep = 1" />
                    <Button label="Verify & Enable" @click="verify2FACode" />
                </div>
            </div>

            <!-- Step 4: Backup Codes -->
            <div v-if="twoFASetupStep === 3" class="mt-4">
                <p>Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.</p>

                <div class="mt-4 p-4 bg-warning-50 dark:bg-warning-900 rounded">
                    <p class="text-sm"><strong>Warning:</strong> Each backup code can only be used once. Generate new codes if you run out.</p>
                </div>

                <div class="mt-4">
                    <div class="flex justify-between items-center mb-2">
                        <h4>Backup Codes</h4>
                        <Button icon="pi pi-download" label="Download" @click="downloadBackupCodes" size="small" />
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div v-for="(code, index) in twoFASetup.backupCodes" :key="index" class="p-2 bg-gray-100 dark:bg-gray-800 text-center font-mono text-sm rounded">
                            {{ code }}
                        </div>
                    </div>
                </div>

                <div class="mt-4">
                    <Button label="Setup Complete" severity="success" @click="twoFASetupDialog = false" />
                </div>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
.settings {
    padding: 1rem;
}

.field {
    margin-bottom: 1rem;
}

.field-checkbox {
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
}

.field-checkbox label {
    margin-left: 0.5rem;
}
</style>
