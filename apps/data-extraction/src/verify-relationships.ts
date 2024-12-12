import * as fs from 'fs';
import * as readline from 'readline';

async function analyzeSampleRelationships(): Promise<void> {
    // Get first 5 deposit IDs from MRDS.txt
    const depositIds = new Set<string>();
    const mrdsStream = fs.createReadStream('data/MRDS.txt');
    const mrdsRL = readline.createInterface({
        input: mrdsStream,
        crlfDelay: Infinity
    });

    let lineCount = 0;
    for await (const line of mrdsRL) {
        if (lineCount > 0 && lineCount <= 5) { // Skip header, get 5 records
            const fields = line.split('\t');
            depositIds.add(fields[1].trim()); // dep_id is second column
        }
        lineCount++;
        if (lineCount > 5) break;
    }
    mrdsRL.close();

    console.log('Sample Deposit IDs:', Array.from(depositIds));

    // Check these IDs in related tables
    const tablesToCheck = [
        'Commodity.txt',
        'Location.txt',
        'Production.txt',
        'Resources.txt'
    ];

    for (const table of tablesToCheck) {
        console.log(`\nChecking relationships in ${table}:`);
        const tableStream = fs.createReadStream(`data/${table}`);
        const tableRL = readline.createInterface({
            input: tableStream,
            crlfDelay: Infinity
        });

        let matchCount = 0;
        let headerRead = false;

        for await (const line of tableRL) {
            if (!headerRead) {
                console.log(`Headers: ${line}`);
                headerRead = true;
                continue;
            }

            const fields = line.split('\t');
            const recordId = fields[1]?.trim(); // Record ID is typically second column

            if (depositIds.has(recordId)) {
                console.log(`Match found in ${table}:`, line);
                matchCount++;
            }

            // Only process first 1000 lines to avoid memory issues
            if (headerRead && matchCount > 20) break;
        }
        tableRL.close();
    }
}

console.log('Starting relationship verification...');
analyzeSampleRelationships()
    .then(() => console.log('Verification complete'))
    .catch(console.error);
