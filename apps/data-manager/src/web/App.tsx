import React, { useState, useEffect } from 'react';
import { Map } from './components/Map';
import type { MineralDeposit } from '../types/MineralDeposit';

const DEFAULT_CENTER: [number, number] = [40.9061, -123.4003];
const DEFAULT_ZOOM = 8;

export default function App() {
  const [deposits, setDeposits] = useState<MineralDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:3001/api/deposits');
      if (!response.ok) {
        throw new Error('Failed to fetch deposits');
      }
      const data = await response.json();
      setDeposits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching deposits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:3001/api/deposits/refresh', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to refresh deposits');
      }
      await fetchDeposits();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error refreshing deposits:', err);
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { className: 'app-container' }, [
    React.createElement('div', { key: 'header', className: 'header' }, [
      React.createElement('h1', { key: 'title' }, 'GeoData Manager'),
      React.createElement('div', { key: 'controls', className: 'controls' }, [
        React.createElement('button', {
          key: 'refresh-btn',
          onClick: handleRefreshData,
          disabled: loading
        }, loading ? 'Loading...' : 'Refresh Data'),
        error && React.createElement('div', {
          key: 'error',
          className: 'error-message'
        }, error)
      ].filter(Boolean))
    ]),
    React.createElement('div', { key: 'content', className: 'content' }, [
      React.createElement('div', { key: 'map', className: 'map-container' },
        React.createElement(Map, {
          deposits,
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM
        })
      ),
      React.createElement('div', { key: 'table', className: 'table-container' }, [
        React.createElement('h2', { key: 'table-title' }, 'Mineral Deposits'),
        React.createElement('table', { key: 'table-content' }, [
          React.createElement('thead', { key: 'thead' },
            React.createElement('tr', null, [
              React.createElement('th', { key: 'name' }, 'Name'),
              React.createElement('th', { key: 'type' }, 'Type'),
              React.createElement('th', { key: 'commodities' }, 'Commodities')
            ])
          ),
          React.createElement('tbody', { key: 'tbody' },
            deposits.map(deposit =>
              React.createElement('tr', { key: deposit.id }, [
                React.createElement('td', { key: 'name' }, deposit.name),
                React.createElement('td', { key: 'type' }, deposit.depositType || 'Unknown'),
                React.createElement('td', { key: 'commodities' }, deposit.commodities || 'Unknown')
              ])
            )
          )
        ])
      ])
    ])
  ]);
}
