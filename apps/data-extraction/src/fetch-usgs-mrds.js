import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { USGSMRDSClient } from './clients/usgs-mrds-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Northern California bounding box
const BOUNDS = {
    minLon: -124.482003, // Western edge
    minLat: 39.000000,   // Southern edge (just below Sacramento)
    maxLon: -120.000000, // Eastern edge (Sierra Nevada)
    maxLat: 42.009518    // Northern edge (Oregon border)
};

async function fetchMRDSData() {
    console.log('Fetching USGS MRDS data...');
    
    const client = new USGSMRDSClient();
    
    try {
        const features = await client.getMRDSFeatures(BOUNDS);
        
        // Filter and score sites for gold mining potential
        const scoredFeatures = features.map(feature => {
            const props = feature.properties;
            let score = 0;
            
            // Development status scoring
            if (props.development_status === 'Producer') score += 3;
            if (props.development_status === 'Past Producer') score += 2;
            if (props.development_status === 'Prospect') score += 1;
            
            // Name indicators
            const nameLower = props.name?.toLowerCase() || '';
            if (nameLower.includes('mine')) score += 1;
            if (nameLower.includes('gold')) score += 2;
            if (nameLower.includes('quartz')) score += 1;
            if (nameLower.includes('placer')) score += 1;
            
            // Commodity scoring
            const commodities = props.commodities || [];
            if (commodities.includes('AU')) score += 3;
            if (commodities.includes('AG')) score += 1;
            if (commodities.includes('CU')) score += 0.5;
            
            // Production size scoring
            if (props.production_size === 'Large') score += 2;
            if (props.production_size === 'Medium') score += 1;
            
            // Deposit type scoring
            const depositType = props.deposit_type?.toLowerCase() || '';
            if (depositType.includes('lode')) score += 2;
            if (depositType.includes('vein')) score += 2;
            if (depositType.includes('placer')) score += 1;
            
            // Workings type scoring
            const workingsType = props.workings_type?.toLowerCase() || '';
            if (workingsType.includes('underground')) score += 1;
            if (workingsType.includes('surface')) score += 0.5;
            
            // Commodity description scoring
            const commodityDesc = props.commodity_desc?.toLowerCase() || '';
            if (commodityDesc.includes('gold')) score += 1;
            if (commodityDesc.includes('silver')) score += 0.5;
            
            return {
                ...feature,
                properties: {
                    ...props,
                    goldPotentialScore: score
                }
            };
        });

        // Analyze score distribution
        const scoreDistribution = scoredFeatures.reduce((acc, feature) => {
            const score = feature.properties.goldPotentialScore;
            acc[score] = (acc[score] || 0) + 1;
            return acc;
        }, {});

        console.log('\nScore distribution:');
        Object.entries(scoreDistribution)
            .sort(([a], [b]) => Number(b) - Number(a))
            .forEach(([score, count]) => {
                console.log(`Score ${score}: ${count} sites`);
            });

        // Filter for features with high gold potential (score > 4)
        const goldLodeFeatures = scoredFeatures
            .filter(feature => feature.properties.goldPotentialScore > 4)
            .sort((a, b) => b.properties.goldPotentialScore - a.properties.goldPotentialScore);

        // Log some examples of high-scoring sites
        console.log('\nTop 5 highest scoring sites:');
        goldLodeFeatures.slice(0, 5).forEach(feature => {
            const props = feature.properties;
            console.log(`\n- ${props.name} (Score: ${props.goldPotentialScore})`);
            console.log(`  Status: ${props.development_status}`);
            console.log(`  Commodities: ${props.commodity_desc}`);
            console.log(`  Deposit Type: ${props.deposit_type}`);
            console.log(`  Production Size: ${props.production_size}`);
            console.log(`  Workings: ${props.workings_type}`);
        });

        // Create output directory if it doesn't exist
        const outputDir = path.join(__dirname, '..', 'extracted');
        await fs.mkdir(outputDir, { recursive: true });

        // Save all MRDS features
        const allOutputPath = path.join(outputDir, 'usgs_mrds_sites.geojson');
        await fs.writeFile(allOutputPath, JSON.stringify({
            type: 'FeatureCollection',
            features: features
        }, null, 2));

        // Save filtered gold lode features
        const goldOutputPath = path.join(outputDir, 'usgs_mrds_gold_lode.geojson');
        await fs.writeFile(goldOutputPath, JSON.stringify({
            type: 'FeatureCollection',
            features: goldLodeFeatures
        }, null, 2));

        console.log(`\nSaved ${features.length} total MRDS sites to usgs_mrds_sites.geojson`);
        console.log(`Saved ${goldLodeFeatures.length} gold/quartz lode sites to usgs_mrds_gold_lode.geojson`);
        
        return { features, goldLodeFeatures };
    } catch (error) {
        console.error('Error fetching MRDS data:', error);
        throw error;
    }
}

// Run the fetch operation
fetchMRDSData().catch(console.error);
