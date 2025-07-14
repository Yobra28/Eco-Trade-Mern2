import React from 'react';
// @ts-ignore
import { MapContainer as LeafletMap, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapPreviewProps {
  lat: number;
  lng: number;
  address?: string;
}

const MapPreview: React.FC<MapPreviewProps> = ({ lat, lng, address }) => {
  if (typeof window === 'undefined') return null;
  const center: [number, number] = [lat, lng];
  return (
    <div style={{ height: 180, width: '100%', borderRadius: 8, overflow: 'hidden', marginTop: 8 }}>
      {/* @ts-ignore */}
      <LeafletMap center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} dragging={false} doubleClickZoom={false} zoomControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={center}>
          {address && <Popup>{address}</Popup>}
        </Marker>
      </LeafletMap>
    </div>
  );
};

export default MapPreview; 