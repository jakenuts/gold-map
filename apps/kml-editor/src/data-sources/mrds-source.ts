import { DataSource, DataSourceMetadata, DataSourceOptions, DataFetchResult } from '../types/data-source';

export class MRDSDataSource implements DataSource {
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
      outputFormat: 'application/json'
    });

    if (options?.bbox) {
      params.append('bbox', options.bbox);
    }
    if (options?.maxFeatures) {
      params.append('maxFeatures', options.maxFeatures.toString());
    }

    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      return {
        records: data.features.map((feature: any) => ({
          id: feature.id,
          ...feature.properties,
          geometry: feature.geometry
        })),
        total: data.totalFeatures,
        hasMore: data.totalFeatures > (options?.maxFeatures || 0)
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
      { id: 'state', header: 'State', type: 'string' },
      { id: 'county', header: 'County', type: 'string' },
      { id: 'geometry', header: 'Location', type: 'geometry' }
    ];
  }
}
