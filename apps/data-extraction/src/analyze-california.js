import { createReadStream } from 'fs';
import { createInterface } from 'readline';

async function analyzeCaliforniaData() {
    console.log('Analyzing Northern California MRDS Records...\n');

    const stats = {
        totalDeposits: 0,
        developmentStatus: {},
        commodities: new Map(),
        depositTypes: new Set(),
        counties: new Set(),
        yearRange: {
            earliest: Infinity,
            latest: -Infinity
        }
    };

    const rl = createInterface({
        input: createReadStream('data/MRDS_NorthernCalifornia.txt'),
        crlfDelay: Infinity
    });

    let isFirstLine = true;
    let headers = [];

    for await (const line of rl) {
        if (isFirstLine) {
            headers = line.split('\t');
            isFirstLine = false;
            continue;
        }

        const fields = line.split('\t');
        stats.totalDeposits++;

        // Development Status
        const status = fields[3].replace(/"/g, '').trim();
        stats.developmentStatus[status] = (stats.developmentStatus[status] || 0) + 1;

        // Commodities
        const commodities = fields[5].replace(/"/g, '').trim().split(' ');
        commodities.forEach(commodity => {
            if (commodity) {
                stats.commodities.set(commodity, (stats.commodities.get(commodity) || 0) + 1);
            }
        });

        // Extract year if present in the name or status (rough estimation)
        const yearMatch = fields[2].match(/\b(18|19|20)\d{2}\b/);
        if (yearMatch) {
            const year = parseInt(yearMatch[0]);
            stats.yearRange.earliest = Math.min(stats.yearRange.earliest, year);
            stats.yearRange.latest = Math.max(stats.yearRange.latest, year);
        }
    }

    // Sort commodities by frequency
    const sortedCommodities = Array.from(stats.commodities.entries())
        .sort((a, b) => b[1] - a[1]);

    // Generate report
    console.log('Summary Statistics:');
    console.log('------------------');
    console.log(`Total Deposits: ${stats.totalDeposits}`);
    
    console.log('\nDevelopment Status Distribution:');
    console.log('------------------------------');
    Object.entries(stats.developmentStatus)
        .sort((a, b) => b[1] - a[1])
        .forEach(([status, count]) => {
            const percentage = ((count / stats.totalDeposits) * 100).toFixed(1);
            console.log(`${status}: ${count} (${percentage}%)`);
        });

    console.log('\nTop 10 Commodities:');
    console.log('------------------');
    sortedCommodities.slice(0, 10).forEach(([commodity, count]) => {
        const percentage = ((count / stats.totalDeposits) * 100).toFixed(1);
        console.log(`${commodity}: ${count} deposits (${percentage}%)`);
    });

    if (stats.yearRange.earliest !== Infinity) {
        console.log('\nTimeline:');
        console.log('---------');
        console.log(`Earliest recorded year: ${stats.yearRange.earliest}`);
        console.log(`Latest recorded year: ${stats.yearRange.latest}`);
    }

    // Generate commodity groups
    console.log('\nCommodity Groups:');
    console.log('----------------');
    const groups = {
        'Precious Metals': ['AU', 'AG', 'PT', 'PD'],
        'Base Metals': ['CU', 'PB', 'ZN', 'NI', 'CO'],
        'Industrial Minerals': ['BA', 'FE', 'MN', 'CR', 'TI'],
        'Energy Materials': ['U', 'TH', 'C'],
        'Strategic Metals': ['W', 'MO', 'SN', 'BE', 'LI', 'REE']
    };

    Object.entries(groups).forEach(([groupName, elements]) => {
        let groupTotal = 0;
        const groupElements = [];
        elements.forEach(element => {
            const count = stats.commodities.get(element) || 0;
            if (count > 0) {
                groupTotal += count;
                groupElements.push(`${element}(${count})`);
            }
        });
        if (groupTotal > 0) {
            const percentage = ((groupTotal / stats.totalDeposits) * 100).toFixed(1);
            console.log(`${groupName}: ${groupTotal} deposits (${percentage}%) - ${groupElements.join(', ')}`);
        }
    });
}

console.log('Starting analysis of Northern California mineral deposits...');
analyzeCaliforniaData().catch(console.error);
