'use client';

import React from 'react';

interface SkipNavProps {
  /**
   * ID of the main content element to skip to
   * @default 'main-content'
   */
  mainContentId?: string;
  /**
   * Additional navigation skip links
   */
  additionalLinks?: Array<{
    id: string;
    label: string;
  }>;
}

/**
 * Skip navigation component for keyboard accessibility
 * Allows keyboard users to skip repetitive navigation and jump to main content
 *
 * This component should be placed at the very top of your layout,
 * before any other content.
 *
 * @example
 * <SkipNav
 *   mainContentId="main-content"
 *   additionalLinks={[
 *     { id: 'sidebar', label: 'Skip to sidebar' },
 *     { id: 'footer', label: 'Skip to footer' }
 *   ]}
 * />
 */
export function SkipNav({
  mainContentId = 'main-content',
  additionalLinks = [],
}: SkipNavProps) {
  const handleSkipToContent = (
    event: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    event.preventDefault();
    const target = document.getElementById(targetId);

    if (target) {
      // Set tabindex to make the element focusable if it isn't already
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }

      // Focus the target element
      target.focus();

      // Scroll to the target
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="skip-nav">
      <a
        href={`#${mainContentId}`}
        onClick={(e) => handleSkipToContent(e, mainContentId)}
        className="skip-nav-link"
      >
        Skip to main content
      </a>

      {additionalLinks.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          onClick={(e) => handleSkipToContent(e, link.id)}
          className="skip-nav-link"
        >
          {link.label}
        </a>
      ))}

      <style jsx>{`
        .skip-nav {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9999;
        }

        .skip-nav-link {
          position: absolute;
          left: -9999px;
          top: 0;
          z-index: 9999;
          padding: 0.75rem 1rem;
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          text-decoration: none;
          border-radius: 0 0 0.375rem 0;
          font-weight: 600;
          font-size: 0.875rem;
          line-height: 1.25rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          transition: all 0.2s ease;
        }

        .skip-nav-link:focus {
          left: 0;
          outline: 2px solid hsl(var(--ring));
          outline-offset: 2px;
        }

        .skip-nav-link:hover:focus {
          background-color: hsl(var(--primary) / 0.9);
        }
      `}</style>
    </div>
  );
}

/**
 * Helper component to mark the main content area
 * Use this to wrap your main content for skip navigation
 *
 * @example
 * <MainContent>
 *   <h1>Page Title</h1>
 *   <p>Content...</p>
 * </MainContent>
 */
export function MainContent({
  children,
  id = 'main-content',
  className = '',
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <main id={id} className={className} tabIndex={-1}>
      {children}
    </main>
  );
}
