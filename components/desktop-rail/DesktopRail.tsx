'use client';
/**
 * DesktopRail — left icon rail navigation, replaces BottomNav at >=960px.
 *
 * Same nav structure as BottomNav but vertical. Hidden on mobile.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Map, TrendingUp, User, Sparkles } from 'lucide-react';

const TABS = [
  { href: '/',         label: 'Home',     Icon: Home,       id: 'rail-home' },
  { href: '/map',      label: 'Map',      Icon: Map,        id: 'rail-map' },
  { href: '/chat',     label: 'AI',       Icon: Sparkles,   id: 'rail-ai' },
  { href: '/forecast', label: 'Forecast', Icon: TrendingUp, id: 'rail-forecast' },
  { href: '/profile',  label: 'Profile',  Icon: User,       id: 'rail-profile' },
] as const;

export function DesktopRail() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="desktop-rail"
    >
      <Link href="/" aria-label="NEXUS home" className="desktop-rail__brand">
        <span aria-hidden="true">N</span>
      </Link>
      <ul className="desktop-rail__list">
        {TABS.map(({ href, label, Icon, id }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                id={id}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className="desktop-rail__item"
                data-active={isActive || undefined}
              >
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  style={{ display: 'inline-flex' }}
                >
                  <Icon size={20} aria-hidden="true" />
                </motion.span>
                <span className="desktop-rail__label">{label}</span>
                {isActive && (
                  <motion.span
                    layoutId="rail-indicator"
                    className="desktop-rail__indicator"
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}