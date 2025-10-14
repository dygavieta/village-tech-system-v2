import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcutOptions {
  /**
   * Whether the shortcut is enabled
   */
  enabled?: boolean;
  /**
   * Whether to prevent default browser behavior
   */
  preventDefault?: boolean;
  /**
   * Whether to stop event propagation
   */
  stopPropagation?: boolean;
  /**
   * Target element (defaults to window)
   */
  target?: HTMLElement | Window | null;
}

type KeyCombo = string | string[];

/**
 * Hook to register keyboard shortcuts with accessibility support
 *
 * @param keys - Key combination(s) to listen for (e.g., 'ctrl+k', ['ctrl+k', 'cmd+k'])
 * @param callback - Function to call when the shortcut is triggered
 * @param options - Configuration options
 *
 * @example
 * useKeyboardShortcut('ctrl+k', () => setSearchOpen(true));
 * useKeyboardShortcut(['ctrl+k', 'cmd+k'], () => setSearchOpen(true));
 * useKeyboardShortcut('escape', () => setModalOpen(false));
 */
export function useKeyboardShortcut(
  keys: KeyCombo,
  callback: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions = {}
) {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    target = typeof window !== 'undefined' ? window : null,
  } = options;

  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const keysArray = Array.isArray(keys) ? keys : [keys];
      const pressedCombo = getKeyCombo(event);

      const matches = keysArray.some((keyCombo) => {
        return matchesKeyCombo(pressedCombo, keyCombo);
      });

      if (matches) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }
        callbackRef.current(event);
      }
    },
    [keys, enabled, preventDefault, stopPropagation]
  );

  useEffect(() => {
    if (!target) return;

    target.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [target, handleKeyDown]);
}

/**
 * Get the current key combination from a keyboard event
 */
function getKeyCombo(event: KeyboardEvent): string {
  const parts: string[] = [];

  if (event.ctrlKey) parts.push('ctrl');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  if (event.metaKey) parts.push('cmd');

  const key = event.key.toLowerCase();
  if (!['control', 'alt', 'shift', 'meta'].includes(key)) {
    parts.push(key);
  }

  return parts.join('+');
}

/**
 * Check if the pressed combo matches the target combo
 */
function matchesKeyCombo(pressed: string, target: string): boolean {
  const normalizedPressed = normalizeKeyCombo(pressed);
  const normalizedTarget = normalizeKeyCombo(target);
  return normalizedPressed === normalizedTarget;
}

/**
 * Normalize a key combination string
 */
function normalizeKeyCombo(combo: string): string {
  const parts = combo
    .toLowerCase()
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);

  // Sort modifiers in consistent order
  const modifierOrder = ['ctrl', 'alt', 'shift', 'cmd', 'meta'];
  const modifiers = parts
    .filter((part) => modifierOrder.includes(part))
    .sort((a, b) => modifierOrder.indexOf(a) - modifierOrder.indexOf(b));

  const keys = parts.filter((part) => !modifierOrder.includes(part));

  return [...modifiers, ...keys].join('+');
}

/**
 * Hook to handle common navigation shortcuts
 */
export function useNavigationShortcuts() {
  // Skip to main content
  useKeyboardShortcut('alt+1', () => {
    const mainContent = document.querySelector('main');
    if (mainContent) {
      (mainContent as HTMLElement).focus();
      mainContent.scrollIntoView();
    }
  });

  // Focus search
  useKeyboardShortcut(['ctrl+k', 'cmd+k'], () => {
    const searchInput = document.querySelector<HTMLInputElement>(
      'input[type="search"], input[role="search"]'
    );
    if (searchInput) {
      searchInput.focus();
    }
  });
}
