import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define input paths
const inputPath = path.join(__dirname, '..', 'extracted', 'northern_california_sites.json');
const lodeOutputPath = path.join(__dirname, '..', 'extracted', 'northern_california_lode_gold.geojson');

// Helper function to safely get nested property
const getNestedValue = (obj, path) => {
    try {
        return path.split('.').reduce((current, key) => current?.[key], obj) || '';
    } catch (e) {
        return '';
    }
};

// Helper function to get all text content for a site
const getAllText = (site) => {
    return [
        getNestedValue(site, 'deposit.type'),
        site.deposit?.description,
        site.geology?.description,
        site.remarks,
        ...(site.metadata?.comments || []).map(c => c.text)
    ].join(' ').toLowerCase();
};

// Read and analyze the files
Promise.all([
    fs.promises.readFile(inputPath, 'utf8'),
    fs.promises.readFile(lodeOutputPath, 'utf8')
]).then(([sourceData, lodeData]) => {
    const sites = JSON.parse(sourceData);
    const lodeSites = new Set(JSON.parse(lodeData).features.map(f => f.properties.id));

    // Find gold sites that weren't included in lode sites
    const missedSites = sites.filter(site => {
        const allText = getAllText(site);
        const hasGold = allText.includes('gold') || 
                       site.commodities?.some(c => c.name?.toLowerCase() === 'gold');
        
        // Skip if it's not a gold site or if it's already in lode sites
        if (!hasGold || lodeSites.has(site.id)) return false;

        // Check for mine indicators
        const hasMineIndicators = [
            'mine', 'shaft', 'tunnel', 'adit', 'stope', 'drift',
            'underground', 'quartz', 'vein'
        ].some(word => allText.includes(word));

        // Check for placer indicators
        const hasPlacerIndicators = [
            'placer', 'alluvial', 'stream', 'dredge', 'hydraulic',
            'gravel', 'sand', 'wash'
        ].some(word => allText.includes(word));

        // Return true if it has mine indicators and no placer indicators
        return hasMineIndicators && !hasPlacerIndicators;
    });

    console.log('\nMissed Mine Analysis:');
    console.log('-------------------');
    console.log(`Total missed potential mines: ${missedSites.length}`);

    // Analyze a few examples in detail
    console.log('\nSample Missed Sites:');
    console.log('------------------');
    missedSites.slice(0, 5).forEach(site => {
        console.log(`\nSite: ${site.name} (ID: ${site.id})`);
        console.log('Deposit Type:', site.deposit?.type || 'None');
        console.log('Status:', site.deposit?.status || 'None');
        console.log('Workings:', site.workings?.map(w => w.type).join(', ') || 'None');
        
        // Show relevant text snippets
        const allText = getAllText(site);
        const keywords = ['mine', 'shaft', 'tunnel', 'adit', 'stope', 'drift', 'underground', 'quartz', 'vein'];
        const foundKeywords = keywords.filter(word => allText.includes(word));
        console.log('Found Keywords:', foundKeywords.join(', '));
        
        // Show comments that mention mining
        const miningComments = site.metadata?.comments?.filter(c => 
            keywords.some(word => c.text.toLowerCase().includes(word))
        ) || [];
        if (miningComments.length > 0) {
            console.log('Relevant Comments:');
            miningComments.forEach(c => console.log(`- ${c.text}`));
        }
    });

    // Special analysis of Wolverine site
    const wolverine = sites.find(s => s.id === '10165871');
    if (wolverine) {
        console.log('\nWolverine Site Analysis:');
        console.log('----------------------');
        console.log('Name:', wolverine.name);
        console.log('Deposit Type:', wolverine.deposit?.type || 'None');
        console.log('Status:', wolverine.deposit?.status || 'None');
        console.log('Workings:', wolverine.workings?.map(w => w.type).join(', ') || 'None');
        console.log('\nAll Text Content:');
        console.log(getAllText(wolverine));
    }

}).catch(error => {
    console.error('Error analyzing data:', error);
});
