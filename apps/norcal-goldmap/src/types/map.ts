export interface LayerConfig {
  id: string;
  name: string;
  type: 'base' | 'overlay';
  url: string;
  attribution: string;
  maxZoom: number;
  overlay?: {
    url: string;
  };
}

export interface LayerControlProps {
  layers: LayerConfig[];
  activeLayer: string;
  onLayerChange: (layerId: string) => void;
}
