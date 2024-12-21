import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import tokml from 'tokml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createCombinedData() {
    console.log('Creating combined gold and mining claims data...');

    // Read USGS sites data
    const usgsPath = path.join(__dirname, '..', 'extracted', 'northern_california_gold_focused.geojson');
    const usgsSites = JSON.parse(await fs.readFile(usgsPath, 'utf8'));

    // Read BLM claims data
    const blmPath = path.join(__dirname, '..', 'extracted', 'blm_mining_claims.geojson');
    const blmClaims = JSON.parse(await fs.readFile(blmPath, 'utf8'));

    // Add source property to distinguish features
    usgsSites.features.forEach(feature => {
        feature.properties.source = 'USGS';
        feature.properties.dataType = 'mine_site';
    });

    blmClaims.features.forEach(feature => {
        feature.properties.source = 'BLM';
        feature.properties.dataType = 'mining_claim';
        // Create a descriptive name for KML
        feature.properties.description = `
            <h3>${feature.properties.CSE_NAME || 'Unnamed Claim'}</h3>
            <p><strong>Type:</strong> ${feature.properties.BLM_PROD || 'Unknown'}</p>
            <p><strong>Status:</strong> ${feature.properties.status}</p>
            <p><strong>Case Number:</strong> ${feature.properties.CSE_NR}</p>
            <p><strong>Acres:</strong> ${feature.properties.RCRD_ACRS}</p>
            ${feature.properties.MC_PATENTED ? '<p><strong>Patented:</strong> Yes</p>' : ''}
        `.trim();
    });

    // Combine all features
    const combinedData = {
        type: 'FeatureCollection',
        features: [...usgsSites.features, ...blmClaims.features]
    };

    // Save combined GeoJSON
    const combinedGeoJsonPath = path.join(__dirname, '..', 'extracted', 'combined_gold_data.geojson');
    await fs.writeFile(combinedGeoJsonPath, JSON.stringify(combinedData, null, 2));
    console.log(`Saved combined GeoJSON to combined_gold_data.geojson`);

    // Convert to KML
    const kml = tokml(combinedData, {
        name: 'name',
        description: 'description',
        documentName: 'Northern California Gold Sites and Mining Claims',
        documentDescription: 'Combined dataset of USGS gold sites and BLM mining claims',
        simplestyle: true,
        timestamp: 'timestamp'
    });

    // Save KML
    const kmlPath = path.join(__dirname, '..', 'extracted', 'combined_gold_data.kml');
    await fs.writeFile(kmlPath, kml);
    console.log(`Saved combined KML to combined_gold_data.kml`);

    return {
        totalFeatures: combinedData.features.length,
        usgsSites: usgsSites.features.length,
        blmClaims: blmClaims.features.length
    };
}

// Run the combination process
createCombinedData().catch(console.error);
