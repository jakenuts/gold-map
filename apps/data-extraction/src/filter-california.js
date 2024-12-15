import { createReadStream, createWriteStream } from 'fs';
import { createInterface } from 'readline';

// Convert DMS coordinates to decimal degrees
function dmsToDecimal(degrees, minutes, seconds) {
    return degrees + (minutes / 60) + (seconds / 3600);
}

// Boundary coordinates in decimal degrees
const boundaries = {
    north: dmsToDecimal(41, 44, 27.659),   // 41°44′27.659″N
    south: dmsToDecimal(40, 4, 16.246),    // 40°04′16.246″N
    east: -dmsToDecimal(122, 23, 35.993),  // 122°23′35.993″W (negative for western longitude)
    west: -dmsToDecimal(124, 24, 25.857)   // 124°24′25.857″W (negative for western longitude)
};

async function filterRecords() {
    try {
        console.log('\nBoundary Box:');
        console.log('-------------');
        console.log(`North: ${boundaries.north.toFixed(6)}°`);
        console.log(`South: ${boundaries.south.toFixed(6)}°`);
        console.log(`East: ${boundaries.east.toFixed(6)}°`);
        console.log(`West: ${boundaries.west.toFixed(6)}°`);
        console.log('-------------\n');

        const inputPath = 'data/MRDS.txt';
        const outputPath = 'data/MRDS_NorthernCalifornia.txt';
        
        console.log(`Reading from: ${inputPath}`);
        console.log(`Writing to: ${outputPath}\n`);

        const inputStream = createReadStream(inputPath);
        const outputStream = createWriteStream(outputPath);
        const rl = createInterface({
            input: inputStream,
            crlfDelay: Infinity
        });

        let isFirstLine = true;
        let headers = [];
        let count = 0;
        let totalCount = 0;
        let errorCount = 0;

        for await (const line of rl) {
            if (isFirstLine) {
                headers = line.split('\t');
                outputStream.write(line + '\n');
                console.log('Headers found:', headers.join(', '));
                isFirstLine = false;
                continue;
            }

            totalCount++;
            const fields = line.split('\t');
            
            try {
                const longitude = parseFloat(fields[6]); // longitude is 7th column
                const latitude = parseFloat(fields[7]);  // latitude is 8th column

                // Skip if coordinates are invalid
                if (isNaN(longitude) || isNaN(latitude)) {
                    errorCount++;
                    continue;
                }

                // Check if coordinates are within boundaries
                if (latitude >= boundaries.south && 
                    latitude <= boundaries.north && 
                    longitude >= boundaries.west && 
                    longitude <= boundaries.east) {
                    outputStream.write(line + '\n');
                    count++;
                    
                    // Log first few matches for verification
                    if (count <= 3) {
                        console.log(`\nMatch #${count}:`);
                        console.log(`Name: ${fields[2]}`);
                        console.log(`Location: ${latitude.toFixed(6)}°N, ${longitude.toFixed(6)}°W`);
                    }
                    // Then log progress every 100 matches
                    else if (count % 100 === 0) {
                        console.log(`Found ${count} matching records...`);
                    }
                }

                // Log progress every 10000 records
                if (totalCount % 10000 === 0) {
                    console.log(`Processed ${totalCount} records...`);
                }
            } catch (err) {
                errorCount++;
                console.error(`Error processing record ${totalCount}:`, err.message);
            }
        }

        console.log('\nFiltering complete:');
        console.log('------------------');
        console.log(`Total records processed: ${totalCount}`);
        console.log(`Records within boundary: ${count}`);
        console.log(`Records with errors: ${errorCount}`);
        console.log(`Results written to: ${outputPath}`);

        outputStream.end();
    } catch (err) {
        console.error('Fatal error:', err);
        process.exit(1);
    }
}

console.log('Starting MRDS record filtering for Northern California...');
filterRecords().catch(console.error);
