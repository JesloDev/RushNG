import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for default marker icons in Leaflet with Vite
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapEvents({ onMapClick, center, zoom }: { onMapClick?: (e: any) => void, center?: { lat: number, lng: number }, zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, map]);

  useMapEvents({
    click: (e) => {
      onMapClick?.({
        detail: {
          latLng: {
            lat: e.latlng.lat,
            lng: e.latlng.lng
          }
        }
      });
    },
  });
  return null;
}

export default function LeafletMap({ 
  center = { lat: 6.5244, lng: 3.3792 }, // Lagos
  zoom = 12,
  markers = [],
  onMapClick,
  onMarkerClick
}: {
  center?: { lat: number, lng: number };
  zoom?: number;
  markers?: { id: string, position: { lat: number, lng: number }, title?: string, color?: string }[];
  onMapClick?: (e: any) => void;
  onMarkerClick?: (markerId: string) => void;
}) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#0A0A0A' }}>
      <MapContainer 
        center={[center.lat, center.lng]} 
        zoom={zoom} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapEvents onMapClick={onMapClick} center={center} zoom={zoom} />
        {markers.map((m) => (
          <Marker 
            key={m.id} 
            position={[m.position.lat, m.position.lng]}
            eventHandlers={{
              click: () => onMarkerClick?.(m.id),
            }}
          >
            {m.title && <Popup>{m.title}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
