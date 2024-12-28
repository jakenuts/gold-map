import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use same bounding box as USGS data
const BOUNDS = {
    north: 41.7410164,
    south: 40.0711794,
    east: -122.3933314,
    west: -124.4071825
};

async function fetchClaimsData(layerId) {
    const url = new URL('https://gis.blm.gov/nlsdb/rest/services/Mining_Claims/MiningClaims/MapServer/' + layerId + '/query');
    
    // Set query parameters
    url.searchParams.set('where', '1=1');
    url.searchParams.set('outFields', 'CSE_DISP,BLM_PROD,CSE_NAME,CSE_NR,RCRD_ACRS,MC_PATENTED,CSE_META');
    url.searchParams.set('geometry', `${BOUNDS.west},${BOUNDS.south},${BOUNDS.east},${BOUNDS.north}`);
    url.searchParams.set('geometryType', 'esriGeometryEnvelope');
    url.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    url.searchParams.set('inSR', '4269');
    url.searchParams.set('outSR', '4269');
    url.searchParams.set('f', 'geojson');

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${layerId === 1 ? 'active' : 'closed'} claims:`, error);
        return null;
    }
}

async function fetchAllClaims() {
    console.log('Fetching BLM mining claims data...');
    
    // Fetch both active and closed claims
    const [activeClaims, closedClaims] = await Promise.all([
        fetchClaimsData(1),  // Active claims
        fetchClaimsData(2)   // Closed claims
    ]);

    if (!activeClaims || !closedClaims) {
        throw new Error('Failed to fetch claims data');
    }

    // Add a status property to distinguish between active and closed claims
    activeClaims.features.forEach(feature => {
        feature.properties.status = 'active';
    });
    closedClaims.features.forEach(feature => {
        feature.properties.status = 'closed';
    });

    // Create a map to track overlapping claims
    const locationMap = new Map();
    
    // Process active claims first
    activeClaims.features.forEach(feature => {
        const coords = JSON.stringify(feature.geometry.coordinates);
        if (!locationMap.has(coords)) {
            locationMap.set(coords, { active: [], closed: [] });
        }
        locationMap.get(coords).active.push(feature);
    });
    
    // Process closed claims and check for overlaps
    closedClaims.features.forEach(feature => {
        const coords = JSON.stringify(feature.geometry.coordinates);
        if (!locationMap.has(coords)) {
            locationMap.set(coords, { active: [], closed: [] });
        }
        locationMap.get(coords).closed.push(feature);
    });
    
    // Add overlap information to features
    locationMap.forEach(({active, closed}, coords) => {
        const hasOverlap = active.length > 0 && closed.length > 0;
        [...active, ...closed].forEach(feature => {
            feature.properties.hasOverlap = hasOverlap;
            feature.properties.totalClaimsAtLocation = active.length + closed.length;
        });
    });

    // Combine active and closed claims
    const combinedClaims = {
        type: 'FeatureCollection',
        features: [...activeClaims.features, ...closedClaims.features]
    };

    // Save the raw GeoJSON data for combined, active, and closed claims
    const outputDir = path.join(__dirname, '..', 'extracted');
    
    // Write combined claims
    const combinedPath = path.join(outputDir, 'blm_mining_claims.geojson');
    await fs.writeFile(combinedPath, JSON.stringify(combinedClaims, null, 2));
    
    // Write active claims
    const activePath = path.join(outputDir, 'blm_mining_claims_active.geojson');
    await fs.writeFile(activePath, JSON.stringify({
        type: 'FeatureCollection',
        features: activeClaims.features
    }, null, 2));
    
    // Write closed claims
    const closedPath = path.join(outputDir, 'blm_mining_claims_closed.geojson');
    await fs.writeFile(closedPath, JSON.stringify({
        type: 'FeatureCollection',
        features: closedClaims.features
    }, null, 2));
    
    console.log(`Saved ${combinedClaims.features.length} total mining claims:`);
    console.log(`- ${activeClaims.features.length} active claims to blm_mining_claims_active.geojson`);
    console.log(`- ${closedClaims.features.length} closed claims to blm_mining_claims_closed.geojson`);
    console.log('- Combined claims saved to blm_mining_claims.geojson');
    
    return combinedClaims;
}

// Run the fetch operation
fetchAllClaims().catch(console.error);
