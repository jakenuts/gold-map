import { createReadStream } from 'fs';
import { createInterface } from 'readline';

async function analyzeSampleRelationships() {
    // Get first 5 deposit IDs from MRDS.txt
    const depositIds = new Set();
    const depositDetails = new Map(); // Store deposit names for reference
    const mrdsStream = createReadStream('data/MRDS.txt');
    const mrdsRL = createInterface({
        input: mrdsStream,
        crlfDelay: Infinity
    });

    console.log('Analyzing MRDS main records:');
    let lineCount = 0;
    for await (const line of mrdsRL) {
        if (lineCount === 0) {
            console.log('MRDS Headers:', line);
        } else if (lineCount <= 5) {
            const fields = line.split('\t');
            const depId = fields[1].trim();
            const depName = fields[2].trim();
            depositIds.add(depId);
            depositDetails.set(depId, depName);
            console.log(`Deposit ${depId}: ${depName}`);
        }
        lineCount++;
        if (lineCount > 5) break;
    }
    mrdsRL.close();

    // Check these IDs in related tables
    const tablesToCheck = [
        'Commodity.txt',
        'Location.txt',
        'Production.txt',
        'Resources.txt',
        'Deposits.txt',
        'Orebody.txt'
    ];

    const relationships = new Map(); // Track relationships for each deposit

    for (const table of tablesToCheck) {
        console.log(`\nAnalyzing relationships in ${table}:`);
        const tableStream = createReadStream(`data/${table}`);
        const tableRL = createInterface({
            input: tableStream,
            crlfDelay: Infinity
        });

        let headerFields = [];
        let lineCount = 0;

        for await (const line of tableRL) {
            if (lineCount === 0) {
                headerFields = line.split('\t').map(f => f.trim());
                console.log(`Table columns: ${headerFields.join(', ')}`);
            } else {
                const fields = line.split('\t');
                const recordId = fields[1]?.trim(); // dep_id is typically second column

                if (depositIds.has(recordId)) {
                    const depositName = depositDetails.get(recordId);
                    console.log(`\nRelated record found for ${depositName} (${recordId}):`);
                    
                    // Create a formatted display of the record
                    const record = {};
                    headerFields.forEach((header, index) => {
                        if (fields[index]) {
                            record[header] = fields[index].trim();
                        }
                    });
                    
                    // Track relationship
                    if (!relationships.has(recordId)) {
                        relationships.set(recordId, new Set());
                    }
                    relationships.get(recordId).add(table);

                    // Display relevant fields (skip empty/administrative fields)
                    Object.entries(record).forEach(([key, value]) => {
                        if (value && !key.includes('insert') && !key.includes('update')) {
                            console.log(`  ${key}: ${value}`);
                        }
                    });
                }
            }
            lineCount++;
        }
        tableRL.close();
    }

    // Summary of relationships
    console.log('\nRelationship Summary:');
    for (const [depId, tables] of relationships) {
        const depName = depositDetails.get(depId);
        console.log(`\n${depName} (${depId}) has related records in:`);
        tables.forEach(table => console.log(`  - ${table}`));
    }
}

console.log('Starting detailed relationship analysis...');
analyzeSampleRelationships()
    .then(() => console.log('\nAnalysis complete'))
    .catch(console.error);
