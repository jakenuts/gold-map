export interface DataSourceMetadata {
  id: string;
  name: string;
  description: string;
  type: 'file' | 'wfs' | 'database' | 'text';
  capabilities: {
    canFilter?: boolean;
    canSort?: boolean;
    canPage?: boolean;
    supportsGeometry?: boolean;
  };
}

export interface DataSourceOptions {
  bbox?: string;
  maxFeatures?: number;
  filter?: Record<string, any>;
}

export interface DataRecord {
  id: string;
  [key: string]: any;
}

export interface DataFetchResult {
  records: DataRecord[];
  total?: number;
  hasMore?: boolean;
}

export interface DataSource {
  metadata: DataSourceMetadata;
  fetchData(options?: DataSourceOptions): Promise<DataFetchResult>;
  getColumns(): Promise<Array<{
    id: string;
    header: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'geometry';
  }>>;
}
