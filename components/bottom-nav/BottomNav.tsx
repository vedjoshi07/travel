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

/** Bottom tab bar — mobile only. The desktop rail replaces this at >=960px
 *  via CSS (.has-rail hides this on desktop). */
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
        padding: '0 0.5rem calc(0.5rem + env(safe-area-inset-bottom, 0px))',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--hairline)',
          borderRadius: 28,
          padding: '0.5rem 1rem',
          display: 'flex',
          gap: 4,
          alignItems: 'flex-end',
          pointerEvents: 'all',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          width: '100%',
          maxWidth: 480,
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
                  minHeight: 44,
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'var(--beacon)',
                    color: '#1A1300',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isActive
                      ? '0 0 24px rgba(242,184,75,0.7), 0 8px 20px rgba(0,0,0,0.3)'
                      : '0 0 16px rgba(242,184,75,0.4), 0 4px 12px rgba(0,0,0,0.3)',
                    marginBottom: -8,
                    position: 'relative',
                    bottom: 12,
                    transition: 'box-shadow 0.2s ease',
                  }}
                >
                  <Icon size={22} aria-hidden="true" />
                </motion.div>
                <span style={{ fontSize: '0.625rem', color: 'var(--beacon)', fontWeight: 700, marginTop: 2 }}>
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
                gap: 4,
                padding: '0.5rem 0',
                textDecoration: 'none',
                position: 'relative',
                minHeight: 44,
                justifyContent: 'center',
              }}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-indicator"
                  style={{
                    position: 'absolute',
                    top: 0,
                    width: 24,
                    height: 3,
                    borderRadius: 1.5,
                    background: 'var(--beacon)',
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
                  color={isActive ? 'var(--beacon)' : 'var(--text-muted)'}
                  aria-hidden="true"
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </motion.div>
              <span style={{
                fontSize: '0.625rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--beacon)' : 'var(--text-muted)',
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