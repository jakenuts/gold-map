declare module 'react-leaflet' {
  import { FC, ReactNode } from 'react';
  import { LatLngTuple, MapOptions, TileLayerOptions, MarkerOptions, PopupOptions, CircleMarkerOptions } from 'leaflet';

  interface MapContainerProps extends MapOptions {
    center: LatLngTuple;
    zoom: number;
    children?: ReactNode;
    style?: React.CSSProperties;
  }

  interface TileLayerProps extends TileLayerOptions {
    url: string;
    attribution?: string;
  }

  interface MarkerProps extends MarkerOptions {
    position: LatLngTuple;
    children?: ReactNode;
  }

  interface CircleMarkerProps extends CircleMarkerOptions {
    center: LatLngTuple;
    radius?: number;
    children?: ReactNode;
  }

  interface PopupProps extends PopupOptions {
    children?: ReactNode;
  }

  export const MapContainer: FC<MapContainerProps>;
  export const TileLayer: FC<TileLayerProps>;
  export const Marker: FC<MarkerProps>;
  export const CircleMarker: FC<CircleMarkerProps>;
  export const Popup: FC<PopupProps>;
}
