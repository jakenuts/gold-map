import { LayerConfig } from '../types/map';

const STADIA_API_KEY = 'c7625c96-063e-4b97-b870-9c501173c31c';

export const MAP_LAYERS: LayerConfig[] = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    type: 'base',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  {
    id: 'stadia-outdoors',
    name: 'Topographic',
    type: 'base',
    url: `https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}.png?api_key=${STADIA_API_KEY}`,
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
    maxZoom: 20
  },
  {
    id: 'stadia-alidade',
    name: 'Satellite',
    type: 'base',
    url: `https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.png?api_key=${STADIA_API_KEY}`,
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
    maxZoom: 20
  },
  {
    id: 'stadia-hybrid',
    name: 'Hybrid',
    type: 'base',
    url: `https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.png?api_key=${STADIA_API_KEY}`,
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
    maxZoom: 20,
    overlay: {
      url: `https://tiles.stadiamaps.com/tiles/alidade_smooth_labels/{z}/{x}/{y}.png?api_key=${STADIA_API_KEY}`
    }
  }
];
