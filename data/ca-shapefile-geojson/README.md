# California Mining Sites GeoJSON Project

## Overview
This project processes and organizes California mining site data into a structured GeoJSON format. The data includes various types of mining features (points and polygons) with properties for organization and styling in GIS applications.

## Quick Start
```bash
# Install dependencies
npm install

# Filter source files to bounding box
npx tsx filter-points.ts
npx tsx filter-poly.ts

# Generate the merged GeoJSON file
npx tsx merge-geojson.ts
```

## Data Processing

### Bounding Box
The data is filtered to the following area:
- North: 41°44′27.659″N
- South: 40°04′16.246″N
- East: 122°23′35.993″W
- West: 124°24′25.857″W

### Processing Steps
1. Filter source files to bounding box:
   - Points: 61,347 → 2,617 features
   - Polygons: 7,626 → 727 features
2. Merge filtered files
3. Add organizational properties
4. Generate standard GeoJSON output

## Data Structure

### Feature Groups
Features are organized using the `group` property (3,340 total features):
1. Pits (1,309 features)
2. Adits (911 features)
3. Tailings (633 features)
4. Mines (408 features)
5. Quarries (55 features)
6. Mine Dumps (21 features)
7. Diggings (2 features)
8. Other (1 feature)

### Feature Properties
Each feature includes:
- `group`: Main organizational category (e.g., "Mines", "Pits")
- `category`: Specific feature type (e.g., "Open Pit Mine")
- `original_type`: Original feature type from source data
- `geometry_type`: Either 'point' or 'polygon'
- `feature_class`: Common 'mining_site' identifier

### GeoJSON Structure
The output follows the standard GeoJSON format:
```json
{
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [longitude, latitude]
            },
            "properties": {
                "group": "Mines",
                "category": "Open Pit Mine",
                "original_type": "Open Pit Mine",
                "geometry_type": "point",
                "feature_class": "mining_site"
            }
        }
    ]
}
```

## Project Files

### Data Files
- `CA-point.json` & `CA-poly.json`: Source files
- `CA-point-filtered.json` & `CA-poly-filtered.json`: Bounding box filtered files
- `CA-merged-filtered.json`: Final GeoJSON output

### Processing Scripts
- `filter-points.ts`: Filters point features to bounding box
- `filter-poly.ts`: Filters polygon features to bounding box
- `merge-geojson.ts`: Merges features and adds organizational properties

### Configuration
- `types.d.ts`: TypeScript type declarations
- `package.json`: Project configuration and dependencies
- `tsconfig.json`: TypeScript configuration

## Category Consolidations
Several categories were consolidated for simplicity:
- Gravel/Borrow Pit includes: Borrow Pit, Gravel Pit, Gravel/Borrow Pit
- Open Pit Mine includes: Open Pit Mine, Open Pit Mine or Quarry
- Tailings includes: Tailings - Dredge, Tailings - Undifferentiated
- Quarry includes: Quarry, Quarry - Rock

## Usage in GIS Applications

### Feature Organization
Use the `group` property to organize features in the layer list:
1. Create a single layer for the GeoJSON file
2. Use the `group` property for categorized styling
3. Filter or select features by group as needed

### Styling Recommendations
- Use the `geometry_type` property to apply different styles to points and polygons
- Use the `category` property for specific feature symbology
- Create style groups based on the `group` property
- Consider using the `original_type` for detailed symbology when needed

### Example Style Rules
```javascript
// Pseudocode for styling
if (feature.properties.geometry_type === 'point') {
    if (feature.properties.group === 'Mines') {
        // Use mine symbols
        symbol = feature.properties.category === 'Mine Shaft' 
            ? SHAFT_SYMBOL 
            : MINE_SYMBOL;
    } else if (feature.properties.group === 'Adits') {
        symbol = ADIT_SYMBOL;
    }
} else {
    // Polygon styling
    if (feature.properties.group === 'Tailings') {
        fill = TAILINGS_FILL;
    } else if (feature.properties.group === 'Mine Dumps') {
        fill = DUMP_FILL;
    }
}
```

## Future Improvements
1. Add metadata for each group (description, typical features, etc.)
2. Include default styling configurations for popular GIS applications
3. Add temporal data if available
4. Implement additional data validation
5. Add support for mining-specific properties
6. Add automated testing
7. Support additional output formats

## Contributing
When contributing to this project:
1. Maintain the standard GeoJSON structure
2. Preserve all organizational properties
3. Document any new properties or categories
4. Test changes with GIS applications
5. Run the complete processing pipeline to verify changes
