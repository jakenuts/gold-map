 # NorCal Goldmap vs Diggings Map Comparison

## Tech Stack Comparison

### NorCal Goldmap
- **Framework**: Next.js 15.0.2 with Turbopack
- **Map Library**: Leaflet with React-Leaflet
- **Styling**: Tailwind CSS
- **Key Dependencies**:
  - React 19.0.0 (RC version)
  - Leaflet 1.9.4
  - React-Leaflet 4.2.1

### Diggings Map
- **Framework**: Vite 5.4 with React
- **Map Library**: MapLibre GL
- **Styling**: Tailwind CSS
- **Key Dependencies**:
  - React 18.3.1
  - MapLibre GL 4.7.1
  - @tanstack/react-query
  - Supabase integration
  - @tmcw/togeojson for KML/KMZ parsing

## Feature Comparison

### NorCal Goldmap
- Simple, clean interface focused on basic map visualization
- Layer switching between different map types (OpenStreetMap, Satellite, Hybrid)
- Basic map controls (zoom, scale)
- Mobile-responsive design
- Server-side rendering capabilities through Next.js

### Diggings Map
- More complex feature set with multiple data layers:
  - Mining claims visualization
  - USGS records integration
  - KMZ/KML file support (currently processing 5,260 features)
- Interactive legend with multiple location types:
  - Mines
  - Prospects
  - Past Producers
  - Occurrences
  - Mineral Deposits
  - Claims
- Advanced data processing capabilities
- Built-in data normalization and type mapping
- Database integration through Supabase

## Technical Implementation Differences

1. **Map Engine**:
   - NorCal Goldmap uses Leaflet, which is lighter and simpler but less feature-rich
   - Diggings Map uses MapLibre GL, offering better performance for large datasets and vector tiles

2. **Data Handling**:
   - NorCal Goldmap: Simpler data model focused on basic map visualization
   - Diggings Map: Complex data processing with support for multiple data formats and sources

3. **Architecture**:
   - NorCal Goldmap: Monolithic Next.js application
   - Diggings Map: More modular architecture with separate services for data processing

## Recommendations

Based on the analysis, here are the recommendations:

1. **Keep Diggings Map** for the following reasons:
   - More mature and feature-complete implementation
   - Better support for complex data visualization
   - More scalable architecture with proper data processing pipelines
   - Superior performance for large datasets through MapLibre GL
   - Active integration with external data sources (USGS, mining claims)
   - More modern tech stack with better maintainability

2. **Deprecate NorCal Goldmap** because:
   - More limited in functionality
   - Using RC version of React which could cause stability issues
   - Less scalable for handling large datasets
   - Simpler architecture that would require significant work to match Diggings Map features
   - Lacks data processing capabilities present in Diggings Map

## Migration Path

If proceeding with Diggings Map:
1. Transfer any unique features or data from NorCal Goldmap to Diggings Map
2. Document any specific map layers or configurations from NorCal Goldmap
3. Update project documentation to reflect the consolidation
4. Archive NorCal Goldmap repository for reference

## Conclusion

Diggings Map represents a more mature, feature-rich, and technically superior implementation. Its architecture and technology choices better align with the needs of a complex mapping application, particularly for mining and geological data visualization. The recommendation is to consolidate efforts on Diggings Map and phase out NorCal Goldmap.
