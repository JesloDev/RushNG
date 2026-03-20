import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { motion } from 'motion/react';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'MY_GOOGLE_MAPS_KEY';

export default function GoogleMap({ 
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
  if (!hasValidKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-midnight p-8 font-sans text-cream">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center"
        >
          <h2 className="font-display text-2xl font-extrabold text-rush-orange">Google Maps API Key Required</h2>
          <p className="mt-4 text-sm text-white/60 leading-relaxed">
            <strong>Step 1:</strong> <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noopener" className="text-rush-orange underline">Get an API Key</a>
          </p>
          <p className="mt-4 text-sm text-white/60 leading-relaxed">
            <strong>Step 2:</strong> Add your key as a secret in AI Studio:
          </p>
          <ul className="mt-4 space-y-2 text-left text-xs text-white/40">
            <li>• Open <strong>Settings</strong> (⚙️ gear icon, top-right corner)</li>
            <li>• Select <strong>Secrets</strong></li>
            <li>• Type <code>GOOGLE_MAPS_PLATFORM_KEY</code> as the secret name</li>
            <li>• Paste your API key as the value and press <strong>Enter</strong></li>
          </ul>
          <p className="mt-6 text-xs text-white/20 italic">The app rebuilds automatically after you add the secret.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <Map
        defaultCenter={center}
        defaultZoom={zoom}
        mapId="RUSH_NG_MAP"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
        onClick={(e) => onMapClick?.(e)}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
      >
        {markers.map((m) => (
          <AdvancedMarker 
            key={m.id} 
            position={m.position} 
            title={m.title}
            onClick={() => onMarkerClick?.(m.id)}
          >
            <Pin background={m.color || "#FF5C1A"} glyphColor="#0A0A0A" />
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}
