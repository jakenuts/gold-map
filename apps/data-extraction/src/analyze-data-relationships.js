import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to read first few lines of a file
async function readFileHeader(filename, numLines = 5) {
    try {
        const content = await fs.readFile(path.join(__dirname, '..', 'data', filename), 'utf8');
        return content.split('\n').slice(0, numLines).filter(line => line.trim());
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return [];
    }
}

// Analyze a file's structure and potential relationship to MRDS
async function analyzeFile(filename) {
    const lines = await readFileHeader(filename);
    if (lines.length === 0) return null;

    const headers = lines[0].split('\t').map(h => h.trim());
    const sampleRows = lines.slice(1).map(line => 
        line.split('\t').map(val => val.trim())
    );

    // Check for DEP_ID or similar identifier fields
    const hasDepId = headers.some(h => h.toUpperCase() === 'DEP_ID');
    const otherIds = headers.filter(h => h.toUpperCase().includes('ID') || h.toUpperCase().includes('KEY'));

    return {
        filename,
        headers,
        numHeaders: headers.length,
        hasDepId,
        otherIds: otherIds.filter(id => id.toUpperCase() !== 'DEP_ID'),
        sampleData: sampleRows.map(row => 
            headers.reduce((obj, header, idx) => {
                obj[header] = row[idx] || '';
                return obj;
            }, {})
        )
    };
}

async function analyzeAllFiles() {
    // Get all .txt files except About.txt, Accession.txt, and Datadxny.txt which are likely metadata
    const files = (await fs.readdir(path.join(__dirname, '..', 'data')))
        .filter(f => f.endsWith('.txt') && 
                    !['About.txt', 'Accession.txt', 'Datadxny.txt', 'mrds.met'].includes(f));

    const analyses = await Promise.all(files.map(analyzeFile));
    
    // Group files by their relationship type
    const relationships = {
        directlyRelated: [],
        potentiallyRelated: [],
        needsInvestigation: [],
        unrelated: []
    };

    analyses.forEach(analysis => {
        if (!analysis) return;

        if (analysis.hasDepId) {
            relationships.directlyRelated.push({
                file: analysis.filename,
                linkingFields: ['DEP_ID'],
                numFields: analysis.numHeaders,
                sampleData: analysis.sampleData[0] // Include first row as sample
            });
        } else if (analysis.otherIds.length > 0) {
            relationships.potentiallyRelated.push({
                file: analysis.filename,
                potentialLinks: analysis.otherIds,
                numFields: analysis.numHeaders,
                sampleData: analysis.sampleData[0]
            });
        } else if (analysis.headers.some(h => 
            h.toUpperCase().includes('NAME') || 
            h.toUpperCase().includes('LOC') ||
            h.toUpperCase().includes('SITE'))) {
            relationships.needsInvestigation.push({
                file: analysis.filename,
                possibleJoinFields: analysis.headers,
                numFields: analysis.numHeaders,
                sampleData: analysis.sampleData[0]
            });
        } else {
            relationships.unrelated.push({
                file: analysis.filename,
                headers: analysis.headers,
                numFields: analysis.numHeaders,
                sampleData: analysis.sampleData[0]
            });
        }
    });

    // Write analysis results
    await fs.writeFile(
        path.join(__dirname, '..', 'data-relationships-analysis.json'),
        JSON.stringify(relationships, null, 2)
    );

    console.log('Analysis complete. Results written to data-relationships-analysis.json');
    
    // Return true if we found any unrelated files
    return relationships.unrelated.length > 0;
}

// Run the analysis
analyzeAllFiles().then(hasUnrelated => {
    if (hasUnrelated) {
        console.log('Found potentially unrelated files. Please check data-relationships-analysis.json');
    }
}).catch(error => {
    console.error('Error during analysis:', error);
});
