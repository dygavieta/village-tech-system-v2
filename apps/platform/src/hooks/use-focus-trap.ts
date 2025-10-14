import { useEffect, useRef } from 'react';

interface UseFocusTrapOptions {
  /**
   * Whether the focus trap is active
   */
  enabled?: boolean;
  /**
   * Element to focus when the trap is activated
   */
  initialFocus?: HTMLElement | null;
  /**
   * Element to focus when the trap is deactivated
   */
  returnFocus?: HTMLElement | null;
}

/**
 * Hook to trap focus within a container element (e.g., modal, dialog)
 * This ensures keyboard navigation stays within the container for accessibility
 *
 * @param options - Configuration options for the focus trap
 * @returns Ref to attach to the container element
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  options: UseFocusTrapOptions = {}
) {
  const { enabled = true, initialFocus, returnFocus } = options;
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the initial element or the first focusable element
    const focusableElements = getFocusableElements(container);

    if (initialFocus) {
      initialFocus.focus();
    } else if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle Tab key navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: move backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: move forwards
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Restore focus to the previously focused element
      if (returnFocus) {
        returnFocus.focus();
      } else if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [enabled, initialFocus, returnFocus]);

  return containerRef;
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]',
  ].join(', ');

  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelectors)
  );

  // Filter out elements that are hidden or have display: none
  return elements.filter((element) => {
    return (
      element.offsetWidth > 0 &&
      element.offsetHeight > 0 &&
      window.getComputedStyle(element).visibility !== 'hidden'
    );
  });
}
