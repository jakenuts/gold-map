import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

export interface PlacemarkData {
  id: string;
  name: string;
  description: string;
  coordinates: string;
  [key: string]: any;
}

interface KMLNode {
  Placemark?: any | any[];
  Folder?: any | any[];
  [key: string]: any;
}

export class KMLService {
  private static parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true
  });

  private static extractPlacemarks(node: KMLNode, placemarks: any[] = []): any[] {
    // Handle direct Placemarks
    if (node.Placemark) {
      const nodePlacemarks = Array.isArray(node.Placemark) ? node.Placemark : [node.Placemark];
      placemarks.push(...nodePlacemarks);
    }

    // Recursively process Folders
    if (node.Folder) {
      const folders = Array.isArray(node.Folder) ? node.Folder : [node.Folder];
      folders.forEach((folder: KMLNode) => {
        this.extractPlacemarks(folder, placemarks);
      });
    }

    return placemarks;
  }

  private static parseKMLString(kmlString: string): PlacemarkData[] {
    try {
      const result = this.parser.parse(kmlString);
      
      if (!result.kml?.Document) {
        return [];
      }

      // Extract all Placemarks recursively from Document and its Folders
      const placemarks = this.extractPlacemarks(result.kml.Document);

      return placemarks.map((placemark: any, index: number) => {
        // Extract coordinates from different possible geometries
        let coordinates = '';
        if (placemark.Point?.coordinates) {
          coordinates = placemark.Point.coordinates;
        } else if (placemark.MultiGeometry?.Point?.coordinates) {
          coordinates = placemark.MultiGeometry.Point.coordinates;
        } else if (placemark.LineString?.coordinates) {
          coordinates = placemark.LineString.coordinates;
        } else if (placemark.Polygon?.outerBoundaryIs?.LinearRing?.coordinates) {
          coordinates = placemark.Polygon.outerBoundaryIs.LinearRing.coordinates;
        }

        // Extract basic properties
        const name = placemark.name || '';
        const description = placemark.description || '';

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

  private static async parseKMZFile(file: File): Promise<PlacemarkData[]> {
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

  private static async parseKMLFile(file: File): Promise<PlacemarkData[]> {
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
