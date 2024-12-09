import React, { useState, useEffect } from 'react';
import { Map } from './components/Map';

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

const DEFAULT_CENTER: [number, number] = [40.9061, -123.4003];
const DEFAULT_ZOOM = 8;
const API_BASE_URL = 'http://localhost:3010';

export default function App() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('mineral_deposit');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');

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
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
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
        throw new Error('Failed to fetch locations');
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
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/ingest/usgs`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to refresh USGS data');
      }
      await fetchLocations();
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentCategory = categories.find(c => c.category === selectedCategory);

  return React.createElement('div', { className: 'app-container' }, [
    React.createElement('div', { key: 'header', className: 'header' }, [
      React.createElement('h1', { key: 'title' }, 'GeoData Manager'),
      React.createElement('div', { key: 'controls', className: 'controls' }, [
        React.createElement('select', {
          key: 'category-select',
          value: selectedCategory,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
            setSelectedCategory(e.target.value);
            setSelectedSubcategory('');
          },
          disabled: loading
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
          disabled: loading
        }, [
          React.createElement('option', { key: 'all', value: '' }, 'All Subcategories'),
          ...currentCategory.subcategories.map(sub => 
            React.createElement('option', { key: sub, value: sub }, sub)
          )
        ]),
        React.createElement('button', {
          key: 'refresh-btn',
          onClick: handleRefreshData,
          disabled: loading || selectedCategory !== 'mineral_deposit'
        }, loading ? 'Loading...' : 'Refresh USGS Data'),
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
      React.createElement('div', { key: 'table', className: 'table-container' }, [
        React.createElement('h2', { key: 'table-title' }, 'Locations'),
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
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join('; ')
                )
              ])
            )
          )
        ])
      ])
    ])
  ]);
}
