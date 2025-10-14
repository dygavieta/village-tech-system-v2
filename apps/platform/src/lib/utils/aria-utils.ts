/**
 * Utility functions for ARIA attributes and accessibility
 */

/**
 * Generate a unique ID for ARIA relationships
 */
let idCounter = 0;
export function generateId(prefix = 'aria'): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now()}`;
}

/**
 * Props for visually hidden text (screen reader only)
 */
export const visuallyHiddenStyles = {
  position: 'absolute' as const,
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap' as const,
  borderWidth: '0',
};

/**
 * Create ARIA props for a button
 */
export function buttonAriaProps(label: string, options: {
  pressed?: boolean;
  expanded?: boolean;
  haspopup?: boolean | 'menu' | 'dialog' | 'listbox' | 'tree' | 'grid';
  controls?: string;
  describedby?: string;
  disabled?: boolean;
} = {}) {
  const {
    pressed,
    expanded,
    haspopup,
    controls,
    describedby,
    disabled,
  } = options;

  return {
    'aria-label': label,
    'aria-pressed': pressed !== undefined ? pressed : undefined,
    'aria-expanded': expanded !== undefined ? expanded : undefined,
    'aria-haspopup': haspopup || undefined,
    'aria-controls': controls || undefined,
    'aria-describedby': describedby || undefined,
    'aria-disabled': disabled || undefined,
  };
}

/**
 * Create ARIA props for a dialog/modal
 */
export function dialogAriaProps(
  labelledby: string,
  describedby?: string
) {
  return {
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': labelledby,
    'aria-describedby': describedby || undefined,
  };
}

/**
 * Create ARIA props for a form field
 */
export function fieldAriaProps(
  id: string,
  options: {
    label?: string;
    describedby?: string;
    invalid?: boolean;
    required?: boolean;
    readonly?: boolean;
    disabled?: boolean;
    errormessage?: string;
  } = {}
) {
  const {
    label,
    describedby,
    invalid,
    required,
    readonly,
    disabled,
    errormessage,
  } = options;

  return {
    id,
    'aria-label': label || undefined,
    'aria-describedby': describedby || undefined,
    'aria-invalid': invalid || undefined,
    'aria-required': required || undefined,
    'aria-readonly': readonly || undefined,
    'aria-disabled': disabled || undefined,
    'aria-errormessage': invalid && errormessage ? errormessage : undefined,
  };
}

/**
 * Create ARIA props for a live region
 */
export function liveRegionAriaProps(
  politeness: 'polite' | 'assertive' = 'polite',
  atomic = false
) {
  return {
    'aria-live': politeness,
    'aria-atomic': atomic,
  };
}

/**
 * Create ARIA props for a loading indicator
 */
export function loadingAriaProps(label = 'Loading') {
  return {
    role: 'status',
    'aria-label': label,
    'aria-live': 'polite' as const,
    'aria-atomic': true,
  };
}

/**
 * Create ARIA props for a list
 */
export function listAriaProps(options: {
  label?: string;
  describedby?: string;
  multiselectable?: boolean;
  orientation?: 'horizontal' | 'vertical';
} = {}) {
  const { label, describedby, multiselectable, orientation } = options;

  return {
    role: 'list',
    'aria-label': label || undefined,
    'aria-describedby': describedby || undefined,
    'aria-multiselectable': multiselectable || undefined,
    'aria-orientation': orientation || undefined,
  };
}

/**
 * Create ARIA props for a list item
 */
export function listItemAriaProps(options: {
  selected?: boolean;
  posinset?: number;
  setsize?: number;
  level?: number;
} = {}) {
  const { selected, posinset, setsize, level } = options;

  return {
    role: 'listitem',
    'aria-selected': selected !== undefined ? selected : undefined,
    'aria-posinset': posinset || undefined,
    'aria-setsize': setsize || undefined,
    'aria-level': level || undefined,
  };
}

/**
 * Create ARIA props for a tab
 */
export function tabAriaProps(
  id: string,
  controls: string,
  selected: boolean
) {
  return {
    id,
    role: 'tab',
    'aria-controls': controls,
    'aria-selected': selected,
    tabIndex: selected ? 0 : -1,
  };
}

/**
 * Create ARIA props for a tab panel
 */
export function tabPanelAriaProps(id: string, labelledby: string) {
  return {
    id,
    role: 'tabpanel',
    'aria-labelledby': labelledby,
    tabIndex: 0,
  };
}

/**
 * Create ARIA props for a combobox/dropdown
 */
export function comboboxAriaProps(options: {
  expanded: boolean;
  controls?: string;
  activedescendant?: string;
  autocomplete?: 'none' | 'list' | 'both';
  haspopup?: 'listbox' | 'menu' | 'tree' | 'grid' | 'dialog';
} = { expanded: false }) {
  const {
    expanded,
    controls,
    activedescendant,
    autocomplete,
    haspopup = 'listbox',
  } = options;

  return {
    role: 'combobox',
    'aria-expanded': expanded,
    'aria-controls': controls || undefined,
    'aria-activedescendant': activedescendant || undefined,
    'aria-autocomplete': autocomplete || undefined,
    'aria-haspopup': haspopup,
  };
}

/**
 * Create ARIA props for a menu
 */
export function menuAriaProps(labelledby?: string) {
  return {
    role: 'menu',
    'aria-labelledby': labelledby || undefined,
  };
}

/**
 * Create ARIA props for a menu item
 */
export function menuItemAriaProps(options: {
  disabled?: boolean;
  haspopup?: boolean | 'menu';
  expanded?: boolean;
} = {}) {
  const { disabled, haspopup, expanded } = options;

  return {
    role: 'menuitem',
    'aria-disabled': disabled || undefined,
    'aria-haspopup': haspopup || undefined,
    'aria-expanded': expanded !== undefined ? expanded : undefined,
    tabIndex: disabled ? -1 : 0,
  };
}

/**
 * Create ARIA props for a disclosure widget (show/hide)
 */
export function disclosureAriaProps(
  expanded: boolean,
  controls: string
) {
  return {
    'aria-expanded': expanded,
    'aria-controls': controls,
  };
}

/**
 * Create ARIA props for an alert
 */
export function alertAriaProps(
  type: 'error' | 'warning' | 'info' | 'success' = 'info'
) {
  return {
    role: type === 'error' ? 'alert' : 'status',
    'aria-live': type === 'error' ? ('assertive' as const) : ('polite' as const),
    'aria-atomic': true,
  };
}

/**
 * Create ARIA props for a tooltip
 */
export function tooltipAriaProps(id: string) {
  return {
    id,
    role: 'tooltip',
  };
}

/**
 * Announce a message to screen readers
 */
export function announceToScreenReader(
  message: string,
  politeness: 'polite' | 'assertive' = 'polite'
) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', politeness);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check if an element has valid color contrast
 * Returns true if contrast ratio is >= 4.5:1 for normal text
 * or >= 3:1 for large text (18pt+ or 14pt+ bold)
 */
export function checkColorContrast(
  foreground: string,
  background: string,
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const minimumRatio = isLargeText ? 3 : 4.5;
  return ratio >= minimumRatio;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(color: string): number {
  // This is a simplified version - you may want to use a library like chroma-js
  // for production use
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map((val) => {
    const normalized = val / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
}
