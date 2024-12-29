import React, { useState, useEffect } from 'react';
import { Map } from './components/Map';
import { FileUpload } from './components/FileUpload';
import './styles.css';

interface Location {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  location: {
    coordinates: [number, number];
  };
  properties: Record<string, any>;
  dataSource: {
    name: string;
    description: string;
  };
}

interface Category {
  category: string;
  subcategories: string[];
}

interface IngestResponse {
  success: boolean;
  message: string;
  stats: {
    totalLocations: number;
    sources: string[];
    categories: string[];
    bbox?: string;
  };
}

// GeoJSON types
interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    id?: string;
    name?: string;
    development_status?: string;
    [key: string]: any;
  };
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

const DEFAULT_CENTER: [number, number] = [40.9061, -123.4003];
const DEFAULT_ZOOM = 8;
const API_BASE_URL = 'http://localhost:3010';

// Default bounding box for the area of interest
const DEFAULT_BBOX = '-124.407182,40.071180,-122.393331,41.740961';

export default function App() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('mineral_deposit');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [lastRefreshStats, setLastRefreshStats] = useState<IngestResponse['stats'] | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [selectedCategory, selectedSubcategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    }
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        category: selectedCategory
      });
      if (selectedSubcategory) {
        params.append('subcategory', selectedSubcategory);
      }
      const response = await fetch(`${API_BASE_URL}/api/locations?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch locations');
      }
      const data = await response.json();
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const params = new URLSearchParams({
        bbox: DEFAULT_BBOX
      });
      const response = await fetch(`${API_BASE_URL}/api/ingest/usgs?${params}`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to refresh USGS data');
      }
      const data: IngestResponse = await response.json();
      setLastRefreshStats(data.stats);
      await fetchLocations();
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFileUpload = async (file: File) => {

    try {
      setLoading(true);
      setError(null);

      const text = await file.text();
      const geojson = JSON.parse(text) as GeoJSONFeatureCollection;

      if (!geojson.features || !Array.isArray(geojson.features)) {
        throw new Error('Invalid GeoJSON: missing features array');
      }

      // Transform GeoJSON features to Location format
      const transformedLocations: Location[] = geojson.features.map((feature: GeoJSONFeature, index: number) => ({
        id: feature.properties?.id || String(index),
        name: feature.properties?.name || `Location ${index}`,
        category: 'mineral_deposit',
        subcategory: feature.properties?.development_status || 'Unknown',
        location: {
          coordinates: feature.geometry.coordinates
        },
        properties: {
          ...feature.properties,
          // Add any additional property transformations here
        },
        dataSource: {
          name: 'GeoJSON Upload',
          description: `Uploaded from ${file.name}`
        }
      }));

      setLocations(transformedLocations);
      setLastRefreshStats({
        totalLocations: transformedLocations.length,
        sources: ['GeoJSON Upload'],
        categories: ['mineral_deposit']
      });

      // Update categories if needed
      const subcategories = [...new Set(transformedLocations.map(loc => loc.subcategory))];
      setCategories([{ category: 'mineral_deposit', subcategories }]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse GeoJSON file');
      console.error('Error processing file:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentCategory = categories.find(c => c.category === selectedCategory);

  const renderRefreshStats = () => {
    if (!lastRefreshStats) return null;
    return React.createElement('div', { 
      key: 'refresh-stats',
      className: 'refresh-stats'
    }, [
      React.createElement('h3', { key: 'stats-title' }, 'Last Refresh Results:'),
      React.createElement('p', { key: 'total' }, `Total Locations: ${lastRefreshStats.totalLocations}`),
      React.createElement('p', { key: 'sources' }, `Sources: ${lastRefreshStats.sources.join(', ')}`),
      React.createElement('p', { key: 'categories' }, `Categories: ${lastRefreshStats.categories.join(', ')}`)
    ]);
  };

  return React.createElement('div', { className: 'app-container' }, [
    React.createElement('div', { key: 'header', className: 'header' }, [
      React.createElement('h1', { key: 'title' }, 'GeoData Manager'),
      React.createElement('div', { key: 'controls', className: 'controls' }, [
        // File upload component
        React.createElement(FileUpload, {
          key: 'file-upload',
          onFileSelect: handleFileUpload,
          loading: loading,
          accept: '.json,.geojson',
          maxSize: 50 * 1024 * 1024 // 50MB limit
        }),
        React.createElement('select', {
          key: 'category-select',
          value: selectedCategory,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
            setSelectedCategory(e.target.value);
            setSelectedSubcategory('');
          },
          disabled: loading || refreshing
        }, categories.map(cat => 
          React.createElement('option', { 
            key: cat.category, 
            value: cat.category 
          }, cat.category.replace('_', ' '))
        )),
        currentCategory && React.createElement('select', {
          key: 'subcategory-select',
          value: selectedSubcategory,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedSubcategory(e.target.value),
          disabled: loading || refreshing
        }, [
          React.createElement('option', { key: 'all', value: '' }, 'All Subcategories'),
          ...currentCategory.subcategories.map(sub => 
            React.createElement('option', { key: sub, value: sub }, sub)
          )
        ]),
        React.createElement('button', {
          key: 'refresh-btn',
          onClick: handleRefreshData,
          disabled: loading || refreshing || selectedCategory !== 'mineral_deposit',
          className: refreshing ? 'loading' : ''
        }, refreshing ? 'Refreshing USGS Data...' : 'Refresh USGS Data'),
        error && React.createElement('div', {
          key: 'error',
          className: 'error-message'
        }, error)
      ].filter(Boolean))
    ]),
    React.createElement('div', { key: 'content', className: 'content' }, [
      React.createElement('div', { key: 'map', className: 'map-container' },
        React.createElement(Map, {
          locations,
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          selectedCategory,
          selectedSubcategory
        })
      ),
      React.createElement('div', { key: 'sidebar', className: 'sidebar' }, [
        renderRefreshStats(),
        React.createElement('div', { key: 'table', className: 'table-container' }, [
          React.createElement('h2', { key: 'table-title' }, 
            loading ? 'Loading Locations...' : `Locations (${locations.length})`
          ),
          React.createElement('table', { key: 'table-content' }, [
            React.createElement('thead', { key: 'thead' },
              React.createElement('tr', null, [
                React.createElement('th', { key: 'name' }, 'Name'),
                React.createElement('th', { key: 'category' }, 'Category'),
                React.createElement('th', { key: 'subcategory' }, 'Subcategory'),
                React.createElement('th', { key: 'source' }, 'Source'),
                React.createElement('th', { key: 'properties' }, 'Properties')
              ])
            ),
            React.createElement('tbody', { key: 'tbody' },
              locations.map(location =>
                React.createElement('tr', { key: location.id }, [
                  React.createElement('td', { key: 'name' }, location.name),
                  React.createElement('td', { key: 'category' }, location.category.replace('_', ' ')),
                  React.createElement('td', { key: 'subcategory' }, location.subcategory),
                  React.createElement('td', { key: 'source' }, location.dataSource.name),
                  React.createElement('td', { key: 'properties' }, 
                    Object.entries(location.properties || {})
                      .filter(([key]) => !['id', 'name', 'location'].includes(key))
                      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                      .join('; ')
                  )
                ])
              )
            )
          ])
        ])
      ])
    ])
  ]);
}
