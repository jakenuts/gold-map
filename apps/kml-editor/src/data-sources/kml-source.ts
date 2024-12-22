import { DataSource, DataSourceMetadata, DataSourceOptions, DataFetchResult } from '../types/data-source';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

export class KMLFileSource implements DataSource {
  private parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true
  });

  metadata: DataSourceMetadata = {
    id: 'kml',
    name: 'KML/KMZ Files',
    description: 'Load data from KML and KMZ files',
    type: 'file',
    capabilities: {
      canFilter: true,
      canSort: true,
      supportsGeometry: true
    }
  };

  private currentFile: File | null = null;

  async setFile(file: File) {
    this.currentFile = file;
  }

  private extractPlacemarks(node: any, placemarks: any[] = []): any[] {
    if (node.Placemark) {
      const nodePlacemarks = Array.isArray(node.Placemark) ? node.Placemark : [node.Placemark];
      placemarks.push(...nodePlacemarks);
    }

    if (node.Folder) {
      const folders = Array.isArray(node.Folder) ? node.Folder : [node.Folder];
      folders.forEach((folder: any) => {
        this.extractPlacemarks(folder, placemarks);
      });
    }

    return placemarks;
  }

  private async parseKMLString(kmlString: string): Promise<any[]> {
    try {
      const result = this.parser.parse(kmlString);
      
      if (!result.kml?.Document) {
        return [];
      }

      const placemarks = this.extractPlacemarks(result.kml.Document);

      return placemarks.map((placemark: any, index: number) => {
        // Extract coordinates from different possible geometries
        let coordinates = '';
        let geometry = null;
        
        if (placemark.Point?.coordinates) {
          coordinates = placemark.Point.coordinates;
          const [lon, lat] = coordinates.split(',').map(Number);
          geometry = { type: 'Point', coordinates: [lon, lat] };
        } else if (placemark.LineString?.coordinates) {
          coordinates = placemark.LineString.coordinates;
          geometry = {
            type: 'LineString',
            coordinates: coordinates.split(' ').map((coord: string) => 
              coord.split(',').map(Number).slice(0, 2)
            )
          };
        }

        // Extract extended data
        const extendedDataObj: { [key: string]: string } = {};
        if (placemark.ExtendedData?.Data) {
          const extendedData = Array.isArray(placemark.ExtendedData.Data)
            ? placemark.ExtendedData.Data
            : [placemark.ExtendedData.Data];

          extendedData.forEach((data: any) => {
            if (data['@_name'] && data.value) {
              extendedDataObj[data['@_name']] = data.value;
            }
          });
        }

        return {
          id: `placemark-${index}`,
          name: placemark.name || '',
          description: placemark.description || '',
          geometry,
          ...extendedDataObj
        };
      });
    } catch (error) {
      console.error('Error parsing KML:', error);
      throw new Error('Failed to parse KML content');
    }
  }

  private async parseKMZFile(file: File): Promise<any[]> {
    const arrayBuffer = await file.arrayBuffer();
    const zip = new JSZip();
    const zipContents = await zip.loadAsync(arrayBuffer);
    
    const kmlFile = Object.values(zipContents.files).find(file => 
      file.name.toLowerCase().endsWith('.kml')
    );

    if (!kmlFile) {
      throw new Error('No KML file found in KMZ archive');
    }

    const kmlString = await kmlFile.async('text');
    return this.parseKMLString(kmlString);
  }

  async fetchData(options?: DataSourceOptions): Promise<DataFetchResult> {
    if (!this.currentFile) {
      return { records: [], total: 0 };
    }

    try {
      let records;
      if (this.currentFile.name.toLowerCase().endsWith('.kmz')) {
        records = await this.parseKMZFile(this.currentFile);
      } else {
        const text = await this.currentFile.text();
        records = await this.parseKMLString(text);
      }

      return {
        records,
        total: records.length
      };
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  }

  async getColumns(): Promise<Array<{
    id: string;
    header: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'geometry';
  }>> {
    return [
      { id: 'name', header: 'Name', type: 'string' },
      { id: 'description', header: 'Description', type: 'string' },
      { id: 'geometry', header: 'Location', type: 'geometry' }
    ];
  }
}
