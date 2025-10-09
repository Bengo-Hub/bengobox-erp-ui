<script setup>
import { onMounted, ref } from 'vue';

//Net pay
onMounted(() => {
    chartData1.value = setChartData1();
    chartOptions1.value = setChartOptions1();
});

const chartData1 = ref();
const chartOptions1 = ref();

const setChartData1 = () => {
    return {
        labels: ['September', 'October'],
        datasets: [
            {
                label: 'Net Pay',
                data: [500000, 300000],
                backgroundColor: ['rgba(135, 206, 235, 1)', 'rgba(135, 206, 235, 1)'],
                borderColor: ['rgb(0, 0, 205)', 'rgb(0, 0, 205)'],
                borderWidth: 1
            }
        ]
    };
};
const setChartOptions1 = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

    return {
        plugins: {
            legend: {
                labels: {
                    color: textColor
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder
                }
            }
        }
    };
};
//

//PAYE
onMounted(() => {
    chartData2.value = setChartData2();
    chartOptions2.value = setChartOptions2();
});

const chartData2 = ref();
const chartOptions2 = ref();

const setChartData2 = () => {
    return {
        labels: ['September', 'October'],
        datasets: [
            {
                label: 'PAYE',
                data: [300000, 500000],
                backgroundColor: ['rgba(255, 165, 0, 1)', 'rgba(255, 165, 0, 1)'],
                borderColor: ['rgb(0, 0, 205)', 'rgb(0, 0, 205)'],
                borderWidth: 1
            }
        ]
    };
};
const setChartOptions2 = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

    return {
        plugins: {
            legend: {
                labels: {
                    color: textColor
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder
                }
            }
        }
    };
};
//
//
</script>
<template>
    <div class="flex justify-center font-bold bg-primary text text-white h-10">
        <h2 class="text-xl primary-text text-white pt-2">PAYROLL ANALYTICS</h2>
    </div>
    <div class="flex gap-4 mt-4">
        <div class="w-1/2 h-full bg-white rounded-lg shadow-lg p-4 flex flex-col justify-center items-center">
            <p class="font-bold">NET PAY</p>
            <hr class="mb-1" />
            <div class="card w-full h-full flex justify-center items-center">
                <Chart type="bar" :data="chartData1" :options="chartOptions1" class="mr-4" />
                <p class="font-bold text-2xl">NET PAY (-20%)</p>
            </div>
        </div>
        <div class="w-1/2 h-full bg-white rounded-lg shadow-lg p-4 flex flex-col justify-center items-center">
            <p class="font-bold">PAYE</p>
            <hr class="mb-1" />
            <div class="card w-full h-full flex justify-center items-center">
                <Chart type="bar" :data="chartData2" :options="chartOptions2" class="mr-4" />
                <p class="font-bold text-2xl">PAYE (+30%)</p>
            </div>
        </div>
    </div>
    <div class="flex gap-4 mt-4">
        <div class="w-1/2 h-full bg-white rounded-lg shadow-lg p-4 flex flex-col justify-center items-center">
            <p class="font-bold">NSSF</p>
            <hr class="mb-1" />
            <div class="card w-full h-full flex justify-center items-center">
                <Chart type="bar" :data="chartData1" :options="chartOptions1" class="mr-4" />
                <p class="font-bold text-2xl">NSSF (-20%)</p>
            </div>
        </div>
        <div class="w-1/2 h-full bg-white rounded-lg shadow-lg p-4 flex flex-col justify-center items-center">
            <p class="font-bold">NHIF/SHIF</p>
            <hr class="mb-1" />
            <div class="card w-full h-full flex justify-center items-center">
                <Chart type="bar" :data="chartData2" :options="chartOptions2" class="mr-4" />
                <p class="font-bold text-2xl">NHIF (+30%)</p>
            </div>
        </div>
    </div>
</template>
