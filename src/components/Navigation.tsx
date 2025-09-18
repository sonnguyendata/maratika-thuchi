// src/components/Navigation.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  description: string;
}

const navItems: NavItem[] = [
  {
    href: '/admin/upload',
    label: 'Upload Statement',
    icon: '📄',
    description: 'Parse bank statements'
  },
  {
    href: '/admin/categories',
    label: 'Categories',
    icon: '🏷️',
    description: 'Manage categories'
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: '👥',
    description: 'User management'
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: '📊',
    description: 'Financial reports'
  },
  {
    href: '/transactions',
    label: 'Transactions',
    icon: '💰',
    description: 'View transactions'
  }
];

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-1 backdrop-blur-sm border border-surface-2"
        aria-label="Toggle menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center space-y-1">
          <div className={`w-full h-0.5 bg-accent-gold transition-all ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
          <div className={`w-full h-0.5 bg-accent-gold transition-all ${isOpen ? 'opacity-0' : ''}`} />
          <div className={`w-full h-0.5 bg-accent-gold transition-all ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </div>
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-background/80 backdrop-blur-xl border-r border-surface-2
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-surface-2">
            <Link href="/admin" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-soft to-accent-warm flex items-center justify-center">
                <span className="text-xl font-display">M</span>
              </div>
              <div>
                <h1 className="text-xl font-display font-semibold text-foreground">Maratika Thuchi</h1>
                <p className="text-sm text-foreground/60">Financial Management</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-accent-soft/20 text-accent-soft border border-accent-soft/30' 
                      : 'text-foreground/80 hover:bg-surface-1 hover:text-foreground'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-foreground/60 truncate">{item.description}</div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-accent-soft" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-surface-2">
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="w-full flex items-center space-x-3 p-3 rounded-lg text-foreground/80 hover:bg-surface-1 hover:text-foreground transition-all duration-200"
              >
                <span className="text-xl">🚪</span>
                <span className="font-medium">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
