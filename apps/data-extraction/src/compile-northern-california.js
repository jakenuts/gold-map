import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bounding box coordinates in decimal format
const BOUNDS = {
    north: 41.7410164,
    south: 40.0711794,
    east: -122.3933314,
    west: -124.4071825
};

// Helper to read and parse a data file
async function readDataFile(filename) {
    try {
        const content = await fs.readFile(path.join(__dirname, '..', 'data', filename), 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        const headers = lines[0].split('\t').map(h => h.trim());
        
        return lines.slice(1).map(line => {
            const values = line.split('\t');
            return headers.reduce((obj, header, index) => {
                // Remove quotes and trim whitespace
                let value = values[index]?.trim() || '';
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                obj[header] = value;
                return obj;
            }, {});
        });
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return [];
    }
}

// Check if coordinates are within bounds
function isWithinBounds(lat, lon) {
    const numLat = parseFloat(lat);
    const numLon = parseFloat(lon);
    return !isNaN(numLat) && !isNaN(numLon) &&
           numLat >= BOUNDS.south && 
           numLat <= BOUNDS.north && 
           numLon >= BOUNDS.west && 
           numLon <= BOUNDS.east;
}

// Convert measurement to schema format
function formatMeasurement(value, units) {
    if (!value || !units) return null;
    return {
        value: parseFloat(value),
        units: units.toLowerCase()
    };
}

async function compileNorthernCaliforniaData() {
    // Read all data files
    const [
        mrdsData,
        agesData,
        alterationData,
        analyticalData,
        commentsData,
        commodityData,
        concProcData,
        coordsData,
        depositsData,
        districtsData,
        dupsData,
        groupingsData,
        holdingsData,
        landStatusData,
        locationData,
        materialsData,
        modelData,
        namesData,
        orebodyData,
        oreControlData,
        otherDbsData,
        ownershipData,
        physiographyData,
        placeData,
        plssCoordinatesData,
        productionData,
        productionDetailData,
        reporterData,
        resourcesData,
        resourceDetailData,
        rocksData,
        structureData,
        tectonicData,
        workingsData
    ] = await Promise.all([
        'MRDS.txt',
        'Ages.txt',
        'Alteration.txt',
        'Analytical_data.txt',
        'Comments.txt',
        'Commodity.txt',
        'Conc_proc.txt',
        'Coords.txt',
        'Deposits.txt',
        'Districts.txt',
        'Dups.txt',
        'Groupings.txt',
        'Holdings.txt',
        'Land_status.txt',
        'Location.txt',
        'Materials.txt',
        'Model.txt',
        'Names.txt',
        'Orebody.txt',
        'Ore_control.txt',
        'Other_dbs.txt',
        'Ownership.txt',
        'Physiography.txt',
        'Place.txt',
        'Plss_coordinates.txt',
        'Production.txt',
        'Production_detail.txt',
        'Reporter.txt',
        'Resources.txt',
        'Resource_detail.txt',
        'Rocks.txt',
        'Structure.txt',
        'Tectonic.txt',
        'Workings.txt'
    ].map(filename => readDataFile(filename)));

    // Filter MRDS entries within bounding box
    const filteredSites = mrdsData.filter(site => 
        isWithinBounds(site.latitude, site.longitude)
    );

    console.log(`Found ${filteredSites.length} sites within bounding box`);

    // Compile comprehensive data for each site
    const sites = filteredSites.map(site => {
        const depId = site.dep_id;
        
        // Get all related data for this site
        const coords = coordsData.find(c => c.dep_id === depId) || {};
        const deposits = depositsData.find(d => d.dep_id === depId) || {};
        const location = locationData.find(l => l.dep_id === depId) || {};
        const physiography = physiographyData.find(p => p.dep_id === depId) || {};
        const plssCoords = plssCoordinatesData.find(p => p.dep_id === depId) || {};

        // Compile data according to schema
        return {
            id: depId,
            name: site.name,
            alternativeNames: namesData
                .filter(n => n.dep_id === depId)
                .map(n => ({
                    name: n.name,
                    status: n.status
                })),
            location: {
                coordinates: {
                    latitude: parseFloat(site.latitude),
                    longitude: parseFloat(site.longitude),
                    datum: coords.datum || 'WGS84',
                    precision: coords.loc_prec
                },
                administrative: {
                    country: location.country,
                    state: location.state_prov,
                    county: location.county,
                    district: districtsData
                        .filter(d => d.dep_id === depId)
                        .map(d => d.district)
                        .join(', ')
                },
                physiography: {
                    division: physiography.phys_div,
                    province: physiography.phys_prov,
                    section: physiography.phys_sect
                },
                plssCoordinates: {
                    meridian: plssCoords.meridian,
                    township: plssCoords.township,
                    range: plssCoords.range,
                    section: plssCoords.section
                }
            },
            deposit: {
                type: deposits.dep_tp,
                status: deposits.dev_st,
                discoveryYear: deposits.disc_yr ? {
                    year: deposits.disc_yr,
                    modifier: deposits.dy_ba
                } : undefined,
                productionYears: deposits.prod_yrs,
                size: deposits.deposit_size,
                model: (() => {
                    const model = modelData.find(m => m.dep_id === depId);
                    return model ? {
                        name: model.model_name,
                        code: model.mod_cd,
                        usgsNumber: model.usgs_num
                    } : undefined;
                })()
            },
            geology: {
                rocks: rocksData
                    .filter(r => r.dep_id === depId)
                    .map(r => ({
                        name: r.low_name,
                        type: r.rock_cls,
                        role: r.rock_text,
                        description: r.rock_desc
                    })),
                ages: agesData
                    .filter(a => a.dep_id === depId)
                    .map(a => ({
                        type: a.age_tp,
                        age: parseFloat(a.chron_age),
                        uncertainty: parseFloat(a.plus_minus),
                        method: a.method
                    })),
                structure: structureData
                    .filter(s => s.dep_id === depId)
                    .map(s => ({
                        type: s.struct_type,
                        description: s.struct_text
                    })),
                alteration: alterationData
                    .filter(a => a.dep_id === depId)
                    .map(a => ({
                        type: a.alt_type,
                        description: a.alterat_text
                    }))
            },
            orebody: orebodyData
                .filter(o => o.dep_id === depId)
                .map(o => ({
                    name: o.orebody_name,
                    form: o.form,
                    dimensions: {
                        area: formatMeasurement(o.area, o.area_u),
                        length: formatMeasurement(o.len, o.len_u),
                        width: formatMeasurement(o.wid, o.wid_u),
                        depth: {
                            top: formatMeasurement(o.depth_top, o.depth_top_u),
                            bottom: formatMeasurement(o.depth_bot, o.depth_bot_u)
                        }
                    }
                })),
            commodities: commodityData
                .filter(c => c.dep_id === depId)
                .map(c => ({
                    name: c.commod,
                    code: c.code,
                    type: c.commod_tp,
                    group: c.commod_group,
                    importance: c.import
                })),
            production: productionData
                .filter(p => p.dep_id === depId)
                .map(p => {
                    const details = productionDetailData
                        .filter(d => d.dep_id === depId && d.yr === p.yr)
                        .map(d => ({
                            commodity: d.commod,
                            recovery: formatMeasurement(d.amt, d.units),
                            grade: formatMeasurement(d.grd, d.grd_units)
                        }));
                    
                    return {
                        year: p.yr,
                        amount: formatMeasurement(p.mined, p.units),
                        material: p.item,
                        details
                    };
                }),
            resources: resourcesData
                .filter(r => r.dep_id === depId)
                .map(r => {
                    const details = resourceDetailData
                        .filter(d => d.dep_id === depId && d.yr === r.yr)
                        .map(d => ({
                            commodity: d.commod,
                            grade: formatMeasurement(d.grd, d.grd_units)
                        }));
                    
                    return {
                        year: r.yr,
                        type: r.res_tp,
                        amount: formatMeasurement(r.tot_resources, r.units),
                        details
                    };
                }),
            workings: workingsData
                .filter(w => w.dep_id === depId)
                .map(w => ({
                    type: w.wrk_tp,
                    name: w.wrk_name,
                    dimensions: {
                        area: formatMeasurement(w.area, w.area_u),
                        length: formatMeasurement(w.len, w.len_u),
                        width: formatMeasurement(w.wid, w.wid_u),
                        depth: formatMeasurement(w.depth, w.depth_u)
                    }
                })),
            ownership: ownershipData
                .filter(o => o.dep_id === depId)
                .map(o => ({
                    owner: o.owner_name,
                    type: o.owner_tp,
                    percentage: parseFloat(o.pct),
                    period: {
                        start: o.beg_yr,
                        end: o.end_yr
                    }
                })),
            references: otherDbsData
                .filter(o => o.dep_id === depId)
                .map(o => ({
                    database: o.db_name,
                    recordId: o.rec_id,
                    agency: o.agency
                })),
            metadata: {
                reporters: reporterData
                    .filter(r => r.dep_id === depId)
                    .map(r => ({
                        name: r.reporter,
                        type: r.rpr_tp,
                        date: r.rpt_date,
                        affiliation: r.affil
                    })),
                lastUpdated: deposits.update_date || site.update_date,
                comments: commentsData
                    .filter(c => c.dep_id === depId)
                    .map(c => ({
                        category: c.ctg,
                        text: c.cmt_txt
                    }))
            }
        };
    });

    // Write the compiled data to a JSON file
    const outputPath = path.join(__dirname, '..', 'extracted', 'northern_california_sites.json');
    await fs.writeFile(outputPath, JSON.stringify(sites, null, 2));
    
    console.log(`Compiled data for ${sites.length} sites written to northern_california_sites.json`);
    return sites.length;
}

// Run the compilation
compileNorthernCaliforniaData().catch(console.error);
