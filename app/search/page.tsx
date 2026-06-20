'use client';
import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ImageOff, ExternalLink, Camera, Loader2 } from 'lucide-react';
import { searchPhotos, type PexelsPhoto } from '@/lib/pexels';

const SUGGESTIONS = [
  'Central Park', 'Beach Sunset', 'Street Food', 'Mountain View',
  'Ancient Temple', 'Night Market', 'Coffee Shop', 'Harbor',
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<PexelsPhoto | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setLoading(true);
    setError('');
    setSearched(true);
    setSelected(null);
    try {
      const result = await searchPhotos(trimmed, 24, 1, 'landscape');
      setPhotos(result.photos);
    } catch {
      setError('Failed to load images. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSearch(query);
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 52, marginBottom: 12 }}>
          <Camera size={18} color="var(--color-accent-glow)" aria-hidden="true" />
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Image Search</h1>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 14 }}>
          Search millions of free stock photos from Pexels
        </p>

        {/* Search form */}
        <form onSubmit={handleSubmit} style={{ position: 'relative', marginBottom: 12 }}>
          <Search
            size={16}
            style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)', pointerEvents: 'none',
            }}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search travel photos…"
            aria-label="Search Pexels images"
            style={{
              width: '100%',
              padding: '12px 40px 12px 42px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-surface-border)',
              borderRadius: 16,
              color: 'var(--color-text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--color-surface-border)'}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              aria-label="Clear search"
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--color-text-muted)',
                cursor: 'pointer', padding: 4, display: 'flex',
              }}
            >
              <X size={16} />
            </button>
          )}
        </form>

        {/* Suggestions */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSearch(s)}
              style={{
                padding: '5px 12px',
                borderRadius: 100,
                background: query === s ? 'var(--color-accent-dim)' : 'var(--color-surface)',
                border: '1px solid var(--color-surface-border)',
                color: query === s ? 'var(--color-accent-glow)' : 'var(--color-text-secondary)',
                fontSize: '0.7rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 0' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 size={28} color="var(--color-accent-glow)" />
          </motion.div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Searching Pexels…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          padding: '40px 0', color: 'var(--color-status-bad)',
        }}>
          <ImageOff size={28} />
          <span style={{ fontSize: '0.85rem' }}>{error}</span>
        </div>
      )}

      {/* Empty state */}
      {searched && !loading && !error && photos.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          padding: '60px 0', color: 'var(--color-text-muted)',
        }}>
          <Camera size={32} opacity={0.4} />
          <span style={{ fontSize: '0.85rem' }}>No results for &ldquo;{query}&rdquo;</span>
          <span style={{ fontSize: '0.7rem' }}>Try a different search term</span>
        </div>
      )}

      {/* Results grid */}
      {!loading && photos.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 16 }}
        >
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
            {photos.length} photos
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {photos.map((photo, i) => (
              <motion.button
                key={photo.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                onClick={() => setSelected(photo)}
                style={{
                  padding: 0,
                  border: 'none',
                  borderRadius: 14,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  aspectRatio: '16/10',
                  background: 'var(--color-surface-border)',
                }}
              >
                <img
                  src={photo.src.medium}
                  alt={photo.alt || ''}
                  loading="lazy"
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                  }}
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                  padding: '20px 8px 6px',
                }}>
                  <span style={{
                    fontSize: '0.55rem', color: 'rgba(255,255,255,0.75)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                  }}>
                    {photo.photographer}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
          <p style={{
            fontSize: '0.6rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 8,
          }}>
            Photos provided by{' '}
            <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent-glow)' }}>
              Pexels
            </a>
          </p>
        </motion.div>
      )}

      {/* Not searched yet */}
      {!searched && !loading && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          padding: '80px 0', color: 'var(--color-text-muted)',
        }}>
          <Search size={40} opacity={0.3} />
          <span style={{ fontSize: '0.85rem' }}>Search for travel photos</span>
          <span style={{ fontSize: '0.7rem' }}>Try a suggestion above</span>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20,
              backdropFilter: 'blur(8px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: 600, width: '100%',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-surface-border)',
                borderRadius: 20,
                overflow: 'hidden',
              }}
            >
              <img
                src={selected.src.large2x}
                alt={selected.alt || ''}
                style={{ width: '100%', display: 'block' }}
              />
              <div style={{ padding: '14px 16px' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                  Photo by{' '}
                  <a
                    href={selected.photographer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--color-accent-glow)', fontWeight: 600 }}
                  >
                    {selected.photographer}
                  </a>
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{ flex: 1, textAlign: 'center', textDecoration: 'none', fontSize: '0.75rem' }}
                  >
                    <ExternalLink size={12} />
                    View on Pexels
                  </a>
                  <button
                    onClick={() => setSelected(null)}
                    className="btn-secondary"
                    style={{ fontSize: '0.75rem' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
