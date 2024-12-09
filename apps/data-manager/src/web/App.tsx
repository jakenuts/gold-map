import React, { useState, useEffect } from 'react';
import { Map } from './components/Map';

interface Location {
  id: string;
  name: string;
  locationType: string;
  location: {
    coordinates: [number, number];
  };
  properties: Record<string, any>;
}

const DEFAULT_CENTER: [number, number] = [40.9061, -123.4003];
const DEFAULT_ZOOM = 8;
const API_BASE_URL = 'http://localhost:3010';

export default function App() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('mineral_deposit');

  useEffect(() => {
    fetchLocations();
  }, [selectedType]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/locations?type=${selectedType}`);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { className: 'app-container' }, [
    React.createElement('div', { key: 'header', className: 'header' }, [
      React.createElement('h1', { key: 'title' }, 'GeoData Manager'),
      React.createElement('div', { key: 'controls', className: 'controls' }, [
        React.createElement('select', {
          key: 'type-select',
          value: selectedType,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedType(e.target.value),
          disabled: loading
        }, [
          React.createElement('option', { key: 'mineral', value: 'mineral_deposit' }, 'Mineral Deposits'),
          React.createElement('option', { key: 'historical', value: 'historical_site' }, 'Historical Sites'),
          React.createElement('option', { key: 'geological', value: 'geological_feature' }, 'Geological Features')
        ]),
        React.createElement('button', {
          key: 'refresh-btn',
          onClick: handleRefreshData,
          disabled: loading || selectedType !== 'mineral_deposit'
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
          zoom: DEFAULT_ZOOM
        })
      ),
      React.createElement('div', { key: 'table', className: 'table-container' }, [
        React.createElement('h2', { key: 'table-title' }, 'Locations'),
        React.createElement('table', { key: 'table-content' }, [
          React.createElement('thead', { key: 'thead' },
            React.createElement('tr', null, [
              React.createElement('th', { key: 'name' }, 'Name'),
              React.createElement('th', { key: 'type' }, 'Type'),
              React.createElement('th', { key: 'properties' }, 'Properties')
            ])
          ),
          React.createElement('tbody', { key: 'tbody' },
            locations.map(location =>
              React.createElement('tr', { key: location.id }, [
                React.createElement('td', { key: 'name' }, location.name),
                React.createElement('td', { key: 'type' }, location.locationType.replace('_', ' ')),
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
