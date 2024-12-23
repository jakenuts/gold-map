import { DataSource, DataSourceMetadata, DataSourceOptions, DataFetchResult } from '../types/data-source';
import { XMLParser } from 'fast-xml-parser';

export class MRDSDataSource implements DataSource {
  private parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
    parseTagValue: false,
    textNodeName: '_text',
    isArray: (name) => {
      return ['featureMember', 'pos'].includes(name);
    },
    processEntities: true,
    htmlEntities: true
  });

  metadata: DataSourceMetadata = {
    id: 'mrds',
    name: 'USGS Mineral Resources Data System',
    description: 'Mineral resources and deposit information from USGS MRDS',
    type: 'wfs',
    capabilities: {
      canFilter: true,
      canSort: true,
      canPage: true,
      supportsGeometry: true
    }
  };

  async fetchData(options?: DataSourceOptions): Promise<DataFetchResult> {
    const baseUrl = 'https://mrdata.usgs.gov/services/wfs/mrds';
    const params = new URLSearchParams({
      service: 'WFS',
      version: '1.1.0',
      request: 'GetFeature',
      typename: 'mrds',
      outputFormat: 'text/xml; subtype=gml/3.1.1',
      // Default to Northern California if no bbox provided
      bbox: options?.bbox || '-124.4071825,40.0711794,-122.3933314,41.7410164',
      maxFeatures: (options?.maxFeatures || 100).toString()
    });

    try {
      console.log('Fetching MRDS data with params:', params.toString());
      const response = await fetch(`${baseUrl}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      console.log('Raw response:', text.substring(0, 500));
      const result = this.parser.parse(text);
      console.log('Parsed result:', JSON.stringify(result, null, 2));

      // Extract features from WFS response
      const features = result?.FeatureCollection?.featureMember || [];
      console.log('Features:', JSON.stringify(features, null, 2));

      return {
        records: features.map((feature: any) => {
          const mrds = feature.mrds || {};
          console.log('Processing feature:', JSON.stringify(mrds, null, 2));

          // Extract coordinates from GML Point geometry
          let coordinates: number[] = [];
          const point = mrds?.geometry?.Point;
          if (point?.pos?._text) {
            coordinates = point.pos._text.split(' ').map(Number);
          }
          console.log('Geometry:', point, 'Coordinates:', coordinates);

          // Extract commodity codes and map to full names
          const commodityCodes = (mrds?.code_list || '').split(' ').filter(Boolean);
          const commodityMap: Record<string, string> = {
            'AU': 'Gold',
            'AG': 'Silver', 
            'CU': 'Copper',
            'PB': 'Lead',
            'ZN': 'Zinc',
            'CR': 'Chromium',
            'NI': 'Nickel',
            'MN': 'Manganese',
            'PGE_PT': 'Platinum Group',
            'SN': 'Tin',
            'AS': 'Arsenic'
          };
          const commodityNames = commodityCodes.map((code: string) => commodityMap[code] || code).join(', ');
          
          // Extract text content from fields that might be wrapped in _text
          const extractText = (field: any) => {
            if (!field) return '';
            if (typeof field === 'object' && '_text' in field) return field._text;
            if (typeof field === 'object') return '';
            return field.toString();
          };

          // Extract all properties for detailed view
          const allProps: Record<string, string> = {};
          Object.entries(mrds).forEach(([key, value]) => {
            if (key !== 'geometry' && value) {
              const cleanKey = key.replace(/^ms:/, '');
              allProps[cleanKey] = extractText(value);
            }
          });

          const record = {
            id: extractText(mrds?.dep_id) || `mrds-${Math.random()}`,
            dep_id: extractText(mrds?.dep_id),
            site_name: extractText(mrds?.site_name),
            dev_stat: extractText(mrds?.dev_stat),
            commod_type: commodityNames,
            state: 'California',
            county: mrds?.fips_code === 'f06093' ? 'Siskiyou' : 'Trinity',
            commodities: commodityNames,
            ore_minerals: extractText(mrds?.ore_minerals),
            prod_size: extractText(mrds?.prod_size),
            geometry: coordinates.length === 2 ? {
              type: 'Point',
              coordinates: [coordinates[1], coordinates[0]] // Convert to [lon, lat]
            } : null,
            // Store all properties for detailed view
            _allProperties: {
              ...Object.fromEntries(
                Object.entries(allProps)
                  .filter(([_, value]) => value && value.trim() !== '')
                  .sort(([a], [b]) => a.localeCompare(b))
              ),
              commodities: commodityNames,
              state: 'California',
              county: mrds?.fips_code === 'f06093' ? 'Siskiyou' : 'Trinity'
            }
          };

          console.log('Created record:', JSON.stringify(record, null, 2));
          return record;
        }),
        total: features.length
      };
    } catch (error) {
      console.error('Error fetching MRDS data:', error);
      throw error;
    }
  }

  async getColumns(): Promise<Array<{
    id: string;
    header: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'geometry';
  }>> {
    return [
      { id: 'dep_id', header: 'Deposit ID', type: 'string' },
      { id: 'site_name', header: 'Site Name', type: 'string' },
      { id: 'dev_stat', header: 'Development Status', type: 'string' },
      { id: 'commod_type', header: 'Commodity Type', type: 'string' },
      { id: 'commodities', header: 'Commodities', type: 'string' },
      { id: 'ore_minerals', header: 'Ore Minerals', type: 'string' },
      { id: 'prod_size', header: 'Production Size', type: 'string' },
      { id: 'state', header: 'State', type: 'string' },
      { id: 'county', header: 'County', type: 'string' },
      { id: 'geometry', header: 'Location', type: 'geometry' }
    ];
  }
}
