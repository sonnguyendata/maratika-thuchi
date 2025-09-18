// src/components/Layout.tsx
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function Layout({ children, title, description }: LayoutProps) {
  return (
    <div className="min-h-screen flex">
      <Navigation />
      <main className="flex-1 lg:ml-64">
        <div className="p-6 lg:p-8">
          {(title || description) && (
            <header className="mb-8">
              {title && (
                <h1 className="text-3xl lg:text-4xl font-display font-semibold text-foreground mb-2">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-foreground/70 text-lg">
                  {description}
                </p>
              )}
            </header>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
