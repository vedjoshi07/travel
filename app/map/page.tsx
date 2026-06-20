'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, X, CheckCircle } from 'lucide-react';
import Map, { Source, Layer, Marker } from 'react-map-gl/mapbox';

import 'mapbox-gl/dist/mapbox-gl.css';
import { useAppStore, LayerId } from '@/lib/store/app-store';
import { usePlaceState } from '@/lib/hooks/use-place-state';
import { MOCK_PLACES } from '@/lib/simulation/engine';
import { CrowdMeter } from '@/components/crowd-meter/CrowdMeter';
import { useRouter } from 'next/navigation';

// ─── Layer definitions ────────────────────────────────────────────────────────

const ACTIVE_LAYERS: { id: LayerId; label: string; color: string; desc: string }[] = [
  { id: 'crowd',   label: 'Crowd',   color: '#7B5CFA', desc: 'Live crowd heatmap' },
  { id: 'traffic', label: 'Traffic', color: '#E74C3C', desc: 'Real-time traffic' },
  { id: 'weather', label: 'Weather', color: '#60A5FA', desc: 'Temperature overlay' },
  { id: 'events',  label: 'Events',  color: '#F4C430', desc: 'Active events' },
];

const STUB_LAYERS: { id: LayerId; label: string }[] = [
  { id: 'safety', label: 'Safety' },
  { id: 'price',  label: 'Price' },
  { id: 'air',    label: 'Air Quality' },
  { id: 'photo',  label: 'Photo Spots' },
];

// ─── Mapbox Layers ────────────────────────────────────────────────────────────

const crowdLayer = {
  id: 'crowd-heat',
  type: 'heatmap' as const,
  source: 'crowd-data',
  maxzoom: 15,
  paint: {
    'heatmap-weight': ['interpolate', ['linear'], ['get', 'crowd'], 0, 0, 100, 1],
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(123,92,250,0)',
      0.2, 'rgba(96,165,250,0.5)',
      0.5, 'rgba(244,196,48,0.7)',
      0.8, 'rgba(231,76,60,0.8)'
    ],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 15, 15, 50],
    'heatmap-opacity': 0.8
  }
};

// ─── Marker component ─────────────────────────────────────────────────────────

function MapMarker({ place, onClick }: {
  place: typeof MOCK_PLACES[number];
  onClick: (id: string) => void;
}) {
  const { data: state } = usePlaceState(place.id);
  const color =
    !state ? '#888' :
    state.crowdPercent < 35 ? 'var(--color-status-good)' :
    state.crowdPercent < 70 ? 'var(--color-status-mid)' :
    'var(--color-status-bad)';

  return (
    <Marker latitude={place.lat} longitude={place.lng} anchor="center" onClick={(e) => { e.originalEvent.stopPropagation(); onClick(place.id); }}>
      <motion.button
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          position: 'relative',
        }}
        whileHover={{ scale: 1.3 }}
        whileTap={{ scale: 0.9 }}
        aria-label={`${place.name} — ${state?.crowdPercent ?? '?'}% crowd`}
      >
        {/* Pulse ring */}
        <motion.div
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            inset: -6,
            borderRadius: '50%',
            background: color,
            opacity: 0.3,
          }}
        />
        {/* Marker dot */}
        <div style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: color,
          border: '2px solid var(--color-bg)',
          boxShadow: `0 0 10px ${color}88`,
          position: 'relative',
        }} />
      </motion.button>
    </Marker>
  );
}

// ─── Place popup panel ────────────────────────────────────────────────────────

function PlacePopup({ placeId, onClose }: { placeId: string; onClose: () => void }) {
  const router = useRouter();
  const place = MOCK_PLACES.find((p) => p.id === placeId);
  const { data: state } = usePlaceState(placeId);

  if (!place) return null;

  return (
    <motion.div
      className="glass-card-accent"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: 16, margin: '0 16px' }}
      role="dialog"
      aria-label={`${place.name} details`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{place.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-accent-glow)' }}>{place.category}</div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          aria-label="Close popup"
        >
          <X size={16} color="var(--color-text-muted)" />
        </button>
      </div>
      {state && (
        <div style={{ marginBottom: 12 }}>
          <CrowdMeter percent={state.crowdPercent} size="lg" showLabel={true} />
        </div>
      )}
      <button
        className="btn-primary"
        onClick={() => router.push(`/place/${placeId}`)}
        style={{ width: '100%', fontSize: '0.8rem' }}
      >
        View Digital Twin
      </button>
    </motion.div>
  );
}

// ─── Layer toggle panel ────────────────────────────────────────────────────────

function LayerPanel({ onClose }: { onClose: () => void }) {
  const { activeMapLayers, toggleLayer } = useAppStore();

  return (
    <motion.div
      className="glass-card-accent"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'absolute', top: 56, right: 16, width: 200, padding: 14, zIndex: 20 }}
      role="dialog"
      aria-label="Map layers"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Map Layers</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Close layers">
          <X size={14} color="var(--color-text-muted)" />
        </button>
      </div>

      {/* Active layers */}
      {ACTIVE_LAYERS.map((layer) => {
        const isOn = activeMapLayers.has(layer.id);
        return (
          <button
            key={layer.id}
            onClick={() => toggleLayer(layer.id)}
            id={`layer-toggle-${layer.id}`}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: '1px solid var(--color-surface-border)',
            }}
            aria-pressed={isOn}
            aria-label={`${layer.label} layer — ${isOn ? 'on' : 'off'}`}
          >
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: isOn ? layer.color : 'var(--color-text-muted)',
              transition: 'background 0.2s',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: '0.78rem', color: isOn ? 'var(--color-text-primary)' : 'var(--color-text-muted)', fontWeight: isOn ? 600 : 400 }}>
                {layer.label}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)' }}>{layer.desc}</div>
            </div>
            {isOn && <CheckCircle size={12} color={layer.color} aria-hidden="true" />}
          </button>
        );
      })}

      {/* Stub layers */}
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Coming Soon
        </div>
        {STUB_LAYERS.map((layer) => (
          <div key={layer.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 0',
            opacity: 0.4,
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-text-muted)' }} />
            <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>{layer.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Map Page ────────────────────────────────────────────────────────────

export default function MapPage() {
  const { activeMapLayers } = useAppStore();
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [showLayers, setShowLayers] = useState(false);

  const handlePlaceClick = useCallback((id: string) => {
    setSelectedPlace(id);
    setShowLayers(false);
  }, []);

  // Fetch state for all mock places to build geojson
  const state0 = usePlaceState(MOCK_PLACES[0].id).data;
  const state1 = usePlaceState(MOCK_PLACES[1].id).data;
  const state2 = usePlaceState(MOCK_PLACES[2].id).data;
  const state3 = usePlaceState(MOCK_PLACES[3].id).data;
  const state4 = usePlaceState(MOCK_PLACES[4].id).data;
  const state5 = usePlaceState(MOCK_PLACES[5].id).data;
  const state6 = usePlaceState(MOCK_PLACES[6].id).data;
  const state7 = usePlaceState(MOCK_PLACES[7].id).data;
  const allStates = [state0, state1, state2, state3, state4, state5, state6, state7];

  const geojsonData: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: MOCK_PLACES.map((p, i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: { crowd: allStates[i]?.crowdPercent ?? 0 }
    }))
  };

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Map header */}
      <div style={{
        padding: '52px 16px 12px',
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-surface-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
        position: 'relative',
      }}>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Intelligence Map</h1>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
            {activeMapLayers.size} layers active
          </p>
        </div>
        <button
          onClick={() => setShowLayers(!showLayers)}
          id="map-layers-btn"
          className="btn-secondary"
          style={{ padding: '8px 12px', fontSize: '0.78rem' }}
          aria-label="Toggle map layers"
          aria-expanded={showLayers}
        >
          <Layers size={14} aria-hidden="true" />
          Layers
        </button>

        {/* Layer panel */}
        <AnimatePresence>
          {showLayers && <LayerPanel onClose={() => setShowLayers(false)} />}
        </AnimatePresence>
      </div>

      {/* Real Mapbox canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Map
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          initialViewState={{
            longitude: 77.2080,
            latitude: 28.6140,
            zoom: 14.5
          }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          onClick={() => setSelectedPlace(null)}
        >
          {/* Active layer overlays */}
          {activeMapLayers.has('crowd') && (
            <Source type="geojson" data={geojsonData}>
              <Layer {...(crowdLayer as any)} />
            </Source>
          )}

          {/* Place markers */}
          {MOCK_PLACES.map((place) => (
            <MapMarker key={place.id} place={place} onClick={handlePlaceClick} />
          ))}
        </Map>

        {/* Visual placeholders for other layers */}
        {activeMapLayers.has('traffic') && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2,
            background: 'linear-gradient(90deg, transparent 32%, rgba(231,76,60,0.05) 35%, rgba(231,76,60,0.04) 42%, transparent 45%)',
            pointerEvents: 'none',
          }} aria-hidden="true" />
        )}
        {activeMapLayers.has('weather') && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 3,
            background: 'radial-gradient(ellipse 100% 50% at 50% 0%, rgba(96,165,250,0.06) 0%, transparent 50%)',
            pointerEvents: 'none',
          }} aria-hidden="true" />
        )}

        {/* Layer badges */}
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          zIndex: 10,
          maxWidth: 200,
        }}>
          {ACTIVE_LAYERS.filter(l => activeMapLayers.has(l.id)).map((layer) => (
            <span key={layer.id} style={{
              background: `${layer.color}22`,
              border: `1px solid ${layer.color}44`,
              color: layer.color,
              fontSize: '0.62rem',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 100,
              backdropFilter: 'blur(8px)',
            }}>
              {layer.label}
            </span>
          ))}
        </div>
      </div>

      {/* Place popup */}
      <AnimatePresence>
        {selectedPlace && (
          <div style={{
            position: 'absolute',
            bottom: 'calc(var(--nav-height) + 16px)',
            left: 0,
            right: 0,
            zIndex: 50,
          }}>
            <PlacePopup placeId={selectedPlace} onClose={() => setSelectedPlace(null)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
