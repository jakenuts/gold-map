import JSZip from 'jszip';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXMLString = promisify(parseString);

export interface PlacemarkData {
  id: string;
  name: string;
  description: string;
  coordinates: string;
  [key: string]: any;
}

export class KMLService {
  private static async parseKMLString(kmlString: string): Promise<PlacemarkData[]> {
    try {
      const result = await parseXMLString(kmlString);
      
      if (!result.kml?.Document?.[0]) {
        throw new Error('Invalid KML structure');
      }

      const placemarks = result.kml.Document[0].Placemark || [];
      return placemarks.map((placemark: any, index: number) => {
        // Extract coordinates from different possible geometries
        let coordinates = '';
        if (placemark.Point?.[0]?.coordinates?.[0]) {
          coordinates = placemark.Point[0].coordinates[0];
        } else if (placemark.MultiGeometry?.[0]?.Point?.[0]?.coordinates?.[0]) {
          coordinates = placemark.MultiGeometry[0].Point[0].coordinates[0];
        } else if (placemark.LineString?.[0]?.coordinates?.[0]) {
          coordinates = placemark.LineString[0].coordinates[0];
        } else if (placemark.Polygon?.[0]?.outerBoundaryIs?.[0]?.LinearRing?.[0]?.coordinates?.[0]) {
          coordinates = placemark.Polygon[0].outerBoundaryIs[0].LinearRing[0].coordinates[0];
        }

        // Extract basic properties
        const name = placemark.name?.[0] || '';
        const description = placemark.description?.[0] || '';

        // Extract extended data
        const extendedData = placemark.ExtendedData?.[0]?.Data || [];
        const extendedDataObj: { [key: string]: string } = {};
        
        extendedData.forEach((data: any) => {
          if (data.$ && data.$.name) {
            const name = data.$.name;
            const value = data.value?.[0] || '';
            if (name && value) {
              extendedDataObj[name] = value;
            }
          }
        });

        // Create the placemark object
        const placemarkObj: PlacemarkData = {
          id: `placemark-${index}`,
          name: name.trim(),
          description: description.trim(),
          coordinates: coordinates.trim(),
          ...extendedDataObj
        };

        // Remove any undefined or null values
        Object.keys(placemarkObj).forEach(key => {
          if (placemarkObj[key] === undefined || placemarkObj[key] === null) {
            delete placemarkObj[key];
          }
        });

        return placemarkObj;
      });
    } catch (error) {
      console.error('Error parsing KML:', error);
      throw new Error('Failed to parse KML content');
    }
  }

  static async parseKMZFile(file: File): Promise<PlacemarkData[]> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = new JSZip();
      const zipContents = await zip.loadAsync(arrayBuffer);
      
      // Find the .kml file in the zip
      const kmlFile = Object.values(zipContents.files).find(file => 
        file.name.toLowerCase().endsWith('.kml')
      );

      if (!kmlFile) {
        throw new Error('No KML file found in KMZ archive');
      }

      const kmlString = await kmlFile.async('text');
      return this.parseKMLString(kmlString);
    } catch (error) {
      console.error('Error parsing KMZ:', error);
      throw new Error('Failed to parse KMZ file');
    }
  }

  static async parseKMLFile(file: File): Promise<PlacemarkData[]> {
    try {
      const text = await file.text();
      return this.parseKMLString(text);
    } catch (error) {
      console.error('Error reading KML file:', error);
      throw new Error('Failed to read KML file');
    }
  }

  static async parseFile(file: File): Promise<PlacemarkData[]> {
    const fileName = file.name.toLowerCase();
    try {
      if (fileName.endsWith('.kmz')) {
        return await this.parseKMZFile(file);
      } else if (fileName.endsWith('.kml')) {
        return await this.parseKMLFile(file);
      } else {
        throw new Error('Unsupported file type. Please provide a KML or KMZ file.');
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      throw error;
    }
  }
}
