const fs = require('fs');
const readline = require('readline');

async function analyzeFile(filePath: string, numLines: number = 5): Promise<void> {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lineCount = 0;
    console.log(`First ${numLines} lines of ${filePath}:`);
    
    for await (const line of rl) {
        if (lineCount < numLines) {
            console.log(line);
            lineCount++;
        } else {
            break;
        }
    }
    rl.close();
}

// Analyze MRDS.txt
analyzeFile('data/MRDS.txt')
    .catch(console.error);
