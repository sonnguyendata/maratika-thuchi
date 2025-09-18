// src/components/Card.tsx
import Link from 'next/link';

interface CardProps {
  href: string;
  title: string;
  description: string;
  icon: string;
  className?: string;
}

export default function Card({ href, title, description, icon, className = '' }: CardProps) {
  return (
    <Link
      href={href}
      className={`
        group block p-6 rounded-2xl bg-surface-1/50 backdrop-blur-sm border border-surface-2
        hover:bg-surface-2/50 hover:border-accent-soft/30 transition-all duration-300
        hover:shadow-lg hover:shadow-accent-soft/10 hover:-translate-y-1
        ${className}
      `}
    >
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-soft to-accent-warm flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-display font-semibold text-foreground mb-2 group-hover:text-accent-soft transition-colors duration-200">
            {title}
          </h3>
          <p className="text-foreground/70 leading-relaxed">
            {description}
          </p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-6 h-6 rounded-full bg-accent-soft/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-accent-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
