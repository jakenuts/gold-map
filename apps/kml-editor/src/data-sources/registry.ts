import { DataSource } from '../types/data-source';
import { MRDSDataSource } from './mrds-source';
import { KMLFileSource } from './kml-source'; // We'll create this next

class DataSourceRegistry {
  private sources: Map<string, DataSource> = new Map();

  constructor() {
    // Register built-in data sources
    this.register(new MRDSDataSource());
    this.register(new KMLFileSource());
  }

  register(source: DataSource) {
    this.sources.set(source.metadata.id, source);
  }

  get(id: string): DataSource | undefined {
    return this.sources.get(id);
  }

  getAll(): DataSource[] {
    return Array.from(this.sources.values());
  }

  getByType(type: string): DataSource[] {
    return this.getAll().filter(source => source.metadata.type === type);
  }
}

// Export singleton instance
export const dataSourceRegistry = new DataSourceRegistry();
