# California Mining Sites GeoJSON Project

## Overview
This project processes and organizes California mining site data into a structured GeoJSON format. The data includes various types of mining features (points and polygons) organized into logical groups for easy visualization and management in GIS applications.

## Quick Start
```bash
# Install dependencies
npm install

# Generate the merged GeoJSON file
npx tsx merge-geojson.ts
```

## Data Structure

### Main GeoJSON Organization
The data is organized hierarchically with 8 main feature groups:
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
- `category`: Consolidated category name
- `original_type`: Original feature type from source data
- `geometry_type`: Either 'point' or 'polygon'
- `feature_class`: Common 'mining_site' identifier

## Project Files
- `merge-geojson.ts`: Main script for processing and organizing features
- `types.d.ts`: TypeScript type declarations
- `package.json`: Project configuration and dependencies
- `tsconfig.json`: TypeScript configuration

### Output
Running `merge-geojson.ts` generates `CA-merged-filtered.json`, which contains:
- Total features: 3,340 (2,614 points, 726 polygons)
- Hierarchical organization with 8 main groups
- Consolidated categories with preserved original types

## Development Notes

### TypeScript Types
The project uses TypeScript interfaces for type safety:
```typescript
interface GeoJSONFeature {
    type: string;
    geometry: {
        type: string;
        coordinates: any;
    };
    properties: {
        category: string;
        original_type: string;
        geometry_type: string;
        feature_class: string;
        [key: string]: any;
    };
}
```

### Data Structure Example
```json
{
    "type": "FeatureCollection",
    "features": [
        {
            "type": "FeatureCollection",
            "name": "Mines",
            "features": [
                {
                    "type": "Feature",
                    "geometry": { ... },
                    "properties": {
                        "category": "Open Pit Mine",
                        "original_type": "Open Pit Mine",
                        "geometry_type": "point",
                        "feature_class": "mining_site"
                    }
                }
            ]
        }
    ]
}
```

## Category Consolidations
Several categories were consolidated for simplicity:
- Gravel/Borrow Pit includes: Borrow Pit, Gravel Pit, Gravel/Borrow Pit
- Open Pit Mine includes: Open Pit Mine, Open Pit Mine or Quarry
- Tailings includes: Tailings - Dredge, Tailings - Undifferentiated
- Quarry includes: Quarry, Quarry - Rock

## Usage in GIS Applications
The hierarchical structure allows for:
- Organized display in layer lists
- Group-based styling and filtering
- Separate handling of points and polygons
- Maintenance of original feature types while using simplified categories

### Recommended Styling
- Points: Use symbols appropriate for the feature type (e.g., shaft symbols for Mine Shaft)
- Polygons: Use semi-transparent fills with distinct colors per category
- Consider using different symbols for different mining feature types within each group

## Future Improvements
Potential areas for enhancement:
1. Add metadata for each group (description, typical features, etc.)
2. Include styling recommendations for different feature types
3. Add temporal data if available (mine establishment dates, operational periods)
4. Implement additional data validation and quality checks
5. Add support for feature properties specific to mining operations
6. Add scripts for automated testing and validation
7. Implement a build process for different output formats

## Contributing
When contributing to this project:
1. Maintain the established type system
2. Preserve the hierarchical structure
3. Document any new feature properties or categories
4. Test changes with GIS applications to ensure compatibility
5. Run `merge-geojson.ts` to regenerate the output file after changes
