<script setup>
import Spinner from '@/components/ui/Spinner.vue'; // Import your Spinner component
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import moment from 'moment';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();

// Props
const props = defineProps({
    sale: Object
});

// Data
const business = ref(null);
const isProcessing = ref(false);
const spinner_title = ref('Generating Receipt...');

// Create a custom event bus for Vue 3
const emitter = {
    listeners: {},
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
    emit(event, ...args) {
        if (this.listeners[event]) {
            this.listeners[event].forEach((callback) => callback(...args));
        }
    }
};

// Expose the emitter globally to allow other components to access it
window.eventBus = emitter;

// Lifecycle Hooks
onMounted(() => {
    business.value = JSON.parse(sessionStorage.getItem('business'));
    // Register the event listener with our custom event bus
    window.eventBus.on('printReceipt', handlePrint);
});

// Methods
const handlePrint = async () => {
    isProcessing.value = true;
    try {
        // Document of 120mm wide and 180mm high
        const doc = new jsPDF('p', 'mm', [120, 180]);
        let startY = 10;

        // Add watermark (shop logo)
        const logo = new Image();
        const logoUrl = business.value.business__watermarklogo ? `${business.value.business__watermarklogo}` : '@/assets/img/logo.png';
        logo.src = logoUrl;
        doc.addImage(logo, 'PNG', 2, 10, 80, 30);

        const middle_w = doc.internal.pageSize.width / 2;
        const doc_width = doc.internal.pageSize.width;

        // Add date and receipt number
        doc.setFontSize(14);
        doc.text(`${moment(new Date()).format('DD/MM/YYYY HH:MM')}`, 5, startY);
        doc.setFontSize(12);
        doc.line(5, startY + 1, 49, startY + 1);
        doc.text(`Receipt No:#${props.sale.invoice_no}`, doc_width - 5, startY, {
            align: 'right'
        });

        // Shop Info
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(middle_w - 58, startY + 23, doc_width - 4, 24, 1, 1, 'FD');
        doc.setTextColor(0.5, 0.5, 0.5);
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`${business.value.branch_name} - ${business.value.city}`, middle_w - 10, startY + 30, { align: 'center' });
        doc.text(`MTN: ${business.value.contact_number}`, middle_w - 10, startY + 35, {
            align: 'center'
        });
        doc.text(`TEL 1: ${business.value.alternate_contact_number}`, middle_w - 10, startY + 40, { align: 'center' });
        doc.text('TEL 2: XXXXXXXXXXX', middle_w - 10, startY + 45, { align: 'center' });

        // Add sale details
        doc.setFontSize(16);
        doc.text(`BILL TO: ${props.sale.customer}`, 10, startY + 55);
        doc.text(`Cashier: ${props.sale.attendant}`, middle_w - 20, startY + 65);

        // Add sale items
        doc.setFontSize(12);
        startY += 68;

        // Table headers and body
        const headers = ['Item Name', 'Qty', 'Price', 'Ext. Price'];
        const body = props.sale.sales_items.map((item) => [item.product.title, item.quantity, new Intl.NumberFormat().format(item.unit_price), new Intl.NumberFormat().format(item.unit_price * item.quantity)]);

        // Add subtotal and total rows
        body.push([{ content: 'Sub Total:', colSpan: 3 }, new Intl.NumberFormat().format(props.sale.sub_total)]);
        body.push([{ content: 'RECEIPT TOTAL:', colSpan: 3 }, new Intl.NumberFormat().format(props.sale.total)]);

        // Generate table
        doc.autoTable({
            head: [headers],
            body: body,
            startY: startY,
            didDrawCell: (data) => {
                if (data.section === 'body' && data.row.index === body.length - 1) {
                    data.cell.colSpan = 3;
                }
            },
            margin: { horizontal: 2 },
            styles: {
                columnWidth: 'wrap',
                fontSize: 12,
                overflow: 'linebreak',
                cellWidth: 'auto'
            },
            columnStyles: {
                2: { cellWidth: 'auto' },
                nil: { halign: 'center' },
                tgl: { halign: 'center' }
            },
            headerStyles: {
                halign: 'center',
                valign: 'middle',
                fillColor: [0, 0, 0],
                textColor: [255, 255, 255],
                lineColor: [1, 1, 1]
            },
            bodyStyles: { lineColor: [1, 1, 1] },
            theme: 'grid'
        });

        startY = doc.autoTable.previous.finalY + 5;

        // Add total quantity sold
        doc.text(`Total Quantity Sold: ${props.sale.sales_items.reduce((acc, item) => acc + item.quantity, 0)}`, 2, startY);

        // Add "Thanks for shopping with us" at the bottom
        const textX = 10;
        const textY = doc.internal.pageSize.height - 10;
        doc.line(textX, textY - 10, textX + 100, textY - 10);
        doc.setFontSize(12);
        doc.text(middle_w - 35, textY, 'THANKS FOR SHOPPING WITH US');

        // Generate the preview link
        const previewLink = doc.output('bloburl');
        const openedDoc = window.open(previewLink, 'Receipt', 'toolbar=no,status=no,menubar=no,scrollbars=no,resizable=no,modal=yes,top=000,left=500,width=1000,height=1500');
        openedDoc.focus();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to generate receipt.',
            life: 3000
        });
    } finally {
        isProcessing.value = false;
    }
};
</script>

<template>
    <div>
        <Spinner :isLoading="isProcessing" :title="spinner_title" />
    </div>
</template>

<style scoped>
/* Add your Tailwind CSS classes here */
</style>
