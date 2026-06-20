'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Map, TrendingUp, User, Sparkles, type LucideIcon } from 'lucide-react';

interface TabDef {
  href: string;
  label: string;
  Icon: LucideIcon;
  id: string;
  fab?: boolean;
}

const TABS: TabDef[] = [
  { href: '/',         label: 'Home',     Icon: Home,       id: 'nav-home' },
  { href: '/map',      label: 'Map',      Icon: Map,        id: 'nav-map' },
  { href: '/chat',     label: 'AI',       Icon: Sparkles,   id: 'nav-ai', fab: true },
  { href: '/forecast', label: 'Forecast', Icon: TrendingUp, id: 'nav-forecast' },
  { href: '/profile',  label: 'Profile',  Icon: User,       id: 'nav-profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 8px 8px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'rgba(10, 14, 26, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 28,
          padding: '8px 16px',
          display: 'flex',
          gap: 4,
          alignItems: 'flex-end',
          pointerEvents: 'all',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          width: '100%',
          maxWidth: 440,
        }}
      >
        {TABS.map(({ href, label, Icon, id, fab }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

          if (fab) {
            return (
              <Link
                key={href}
                href={href}
                id={id}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textDecoration: 'none',
                  position: 'relative',
                  paddingBottom: 4,
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7B5CFA, #6A4CE8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isActive
                      ? '0 0 24px rgba(123,92,250,0.7), 0 8px 20px rgba(0,0,0,0.3)'
                      : '0 0 16px rgba(123,92,250,0.4), 0 4px 12px rgba(0,0,0,0.3)',
                    marginBottom: -8,
                    position: 'relative',
                    bottom: 12,
                    transition: 'box-shadow 0.2s ease',
                  }}
                >
                  <Icon size={22} color="white" aria-hidden="true" />
                </motion.div>
                <span style={{ fontSize: '0.6rem', color: 'var(--color-accent-glow)', fontWeight: 600, marginTop: 2 }}>
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              id={id}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '6px 0',
                textDecoration: 'none',
                position: 'relative',
              }}
            >
              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: 'absolute',
                    top: -1,
                    width: 20,
                    height: 2,
                    borderRadius: 1,
                    background: 'var(--color-accent)',
                  }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Icon
                  size={20}
                  color={isActive ? 'var(--color-accent-glow)' : 'var(--color-text-muted)'}
                  aria-hidden="true"
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </motion.div>
              <span style={{
                fontSize: '0.6rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--color-accent-glow)' : 'var(--color-text-muted)',
                transition: 'color 0.2s ease',
              }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
