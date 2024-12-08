declare module 'react-leaflet' {
  import { FC, ReactNode } from 'react';
  import { LatLngExpression, MapOptions, MarkerOptions, PopupOptions, TileLayerOptions } from 'leaflet';

  export interface MapContainerProps extends MapOptions {
    center: LatLngExpression;
    zoom: number;
    children?: ReactNode;
    style?: React.CSSProperties;
    scrollWheelZoom?: boolean;
  }

  export interface TileLayerProps extends TileLayerOptions {
    url: string;
    attribution?: string;
  }

  export interface MarkerProps extends MarkerOptions {
    position: LatLngExpression;
    children?: ReactNode;
  }

  export interface PopupProps extends PopupOptions {
    children?: ReactNode;
  }

  export const MapContainer: FC<MapContainerProps>;
  export const TileLayer: FC<TileLayerProps>;
  export const Marker: FC<MarkerProps>;
  export const Popup: FC<PopupProps>;
}

declare module '*.css';
