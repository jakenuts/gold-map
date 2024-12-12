import { createReadStream } from 'fs';
import { createInterface } from 'readline';

async function analyzeTableStructure(filename) {
    const stream = createReadStream(`data/${filename}`);
    const rl = createInterface({
        input: stream,
        crlfDelay: Infinity
    });

    let headers = null;
    let firstDataRow = null;
    let lineCount = 0;

    for await (const line of rl) {
        if (lineCount === 0) {
            headers = line.split('\t').map(h => h.trim());
        } else if (lineCount === 1) {
            firstDataRow = line.split('\t').map(d => d.trim());
            break;
        }
        lineCount++;
    }
    rl.close();

    return {
        filename,
        headers,
        sample: firstDataRow,
        keyFields: headers.filter(h => 
            h.toLowerCase().includes('id') || 
            h.toLowerCase().includes('record') ||
            h.toLowerCase().includes('dep_') ||
            h.toLowerCase().includes('line') ||
            h.toLowerCase().includes('sub')
        )
    };
}

async function analyzeAllTables() {
    const tables = [
        'About.txt', 'Accession.txt', 'Ages.txt', 'Alteration.txt',
        'Analytical_data.txt', 'Comments.txt', 'Commodity.txt',
        'Conc_proc.txt', 'Coords.txt', 'Datadxny.txt', 'Deposits.txt',
        'Districts.txt', 'Dups.txt', 'Groupings.txt', 'Holdings.txt',
        'Land_status.txt', 'Location.txt', 'Materials.txt', 'Model.txt',
        'MRDS.txt', 'Names.txt', 'Ore_control.txt', 'Orebody.txt',
        'Other_dbs.txt', 'Ownership.txt', 'Physiography.txt', 'Place.txt',
        'Plss_coordinates.txt', 'Production_detail.txt', 'Production.txt',
        'Reporter.txt', 'Resource_detail.txt', 'Resources.txt', 'Rocks.txt',
        'Structure.txt', 'Tectonic.txt', 'Workings.txt'
    ];

    console.log('Analyzing all tables in the USGS MRDS database...\n');

    const tableAnalysis = new Map();
    
    for (const table of tables) {
        try {
            const analysis = await analyzeTableStructure(table);
            tableAnalysis.set(table, analysis);
            
            console.log(`\n=== ${table} ===`);
            console.log('Key Fields:', analysis.keyFields.join(', '));
            console.log('All Fields:', analysis.headers.join(', '));
            
            // Show relationships based on key fields
            const relationships = analysis.headers.filter(h => 
                h.toLowerCase().includes('_id') || 
                h.toLowerCase().includes('record') ||
                h.toLowerCase().includes('dep_')
            );
            
            if (relationships.length > 0) {
                console.log('Potential Relations:', relationships.join(', '));
            }
        } catch (error) {
            console.error(`Error analyzing ${table}:`, error.message);
        }
    }

    // Analyze relationships between tables
    console.log('\n\n=== Table Relationships Analysis ===\n');
    
    const relationships = new Map();
    
    tableAnalysis.forEach((analysis, tableName) => {
        const tableRelations = [];
        
        // Check each field for potential relationships
        analysis.headers.forEach(field => {
            const fieldLower = field.toLowerCase();
            
            // Look for fields that might reference other tables
            tableAnalysis.forEach((otherAnalysis, otherTableName) => {
                if (tableName !== otherTableName) {
                    const otherTableBase = otherTableName.replace('.txt', '').toLowerCase();
                    if (fieldLower.includes(otherTableBase) || 
                        (fieldLower.includes('_id') && otherAnalysis.headers.some(h => 
                            h.toLowerCase() === fieldLower))) {
                        tableRelations.push({
                            toTable: otherTableName,
                            viaField: field
                        });
                    }
                }
            });
        });
        
        if (tableRelations.length > 0) {
            relationships.set(tableName, tableRelations);
        }
    });

    // Output relationships
    console.log('Table Relationships:');
    relationships.forEach((relations, tableName) => {
        console.log(`\n${tableName} relates to:`);
        relations.forEach(rel => {
            console.log(`  - ${rel.toTable} via ${rel.viaField}`);
        });
    });
}

console.log('Starting comprehensive database analysis...');
analyzeAllTables()
    .then(() => console.log('\nAnalysis complete'))
    .catch(console.error);
