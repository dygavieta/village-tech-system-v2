# Theme System Documentation

This directory contains the centralized theme and color system for the Residence app.

## Files

### `app_colors.dart`
Defines all color constants used throughout the application. This ensures color consistency and makes it easy to update colors across the entire app.

#### Color Categories:

**Primary Colors**
- `AppColors.primary` - Main brand color (#1976D2)
- `AppColors.primaryLight` - Lighter variant (#1173D4)
- `AppColors.primaryContainer` - Light blue container (#E3F2FD)
- `AppColors.onPrimary` - Text/icons on primary color
- `AppColors.onPrimaryContainer` - Text/icons on primary container

**Background Colors**
- `AppColors.backgroundLight` - Main background (#F6F7F8)
- `AppColors.backgroundGrey` - Grey background (#F5F5F5)
- `AppColors.surface` - Card/surface background (white)
- `AppColors.surfaceVariant` - Alternative surface color

**Border Colors**
- `AppColors.borderLight` - Light borders (#E0E0E0)
- `AppColors.borderMedium` - Medium borders (#BDBDBD)
- `AppColors.divider` - Divider lines (#EEEEEE)

**Text Colors**
- `AppColors.textPrimary` - Primary text (#212121)
- `AppColors.textSecondary` - Secondary text (#616161)
- `AppColors.textTertiary` - Tertiary text (#757575)
- `AppColors.textDisabled` - Disabled text (#9E9E9E)
- `AppColors.textHint` - Hint text (#BDBDBD)

**Status Colors**
- `AppColors.success` - Success states (#4CAF50)
- `AppColors.warning` - Warning states (#FF9800)
- `AppColors.error` - Error states (#F44336)
- `AppColors.info` - Info states (#2196F3)

**Helper Methods**
```dart
// Get grey shades
AppColors.grey(100)  // Returns grey[100]

// Get color with opacity
AppColors.withOpacity(AppColors.primary, 0.5)
```

### `app_theme.dart`
Defines the complete Material 3 theme configuration using the colors from `app_colors.dart`.

#### Theme Configuration Includes:
- Color scheme
- AppBar styling
- Card styling
- Input field styling
- Button themes (Elevated, Filled, Outlined, Text)
- Icon themes
- Text themes
- List tile themes
- Divider themes
- Switch themes

## Usage Examples

### Using Theme Colors

```dart
// Using theme color directly
Container(
  color: Theme.of(context).colorScheme.primary,
)

// Using AppColors directly
Container(
  color: AppColors.primary,
)
```

### Using Theme Text Styles

```dart
Text(
  'Hello',
  style: Theme.of(context).textTheme.titleLarge,
)
```

### Using Custom Colors

```dart
// Avatar background
Container(
  color: AppColors.avatarPeach,
)

// Status indicators
Container(
  color: AppColors.success, // Green
)
```

### Using Grey Shades

```dart
Container(
  color: AppColors.grey(100), // Light grey
  border: Border.all(
    color: AppColors.grey(300), // Border grey
  ),
)
```

### Themed Components

The theme automatically styles:
- AppBars (centered title, no elevation, grey background)
- Cards (white background, 12px radius, no elevation)
- Input fields (white background, 8px radius, grey borders)
- Buttons (primary color, 8px radius, proper padding)
- Switches (primary color when active)

## Best Practices

1. **Always use AppColors constants** instead of hardcoding colors
   ```dart
   // Good
   color: AppColors.primary

   // Bad
   color: Color(0xFF1976D2)
   ```

2. **Use theme properties** when possible for automatic theming
   ```dart
   // Good
   color: Theme.of(context).colorScheme.primary

   // Also good
   color: AppColors.primary
   ```

3. **Don't override theme styles** unless absolutely necessary
   ```dart
   // Good - uses theme
   FilledButton(child: Text('Submit'))

   // Bad - overrides theme unnecessarily
   FilledButton(
     style: FilledButton.styleFrom(backgroundColor: Colors.blue),
     child: Text('Submit'),
   )
   ```

4. **Use semantic colors** for specific purposes
   ```dart
   // For success messages
   color: AppColors.success

   // For errors
   color: AppColors.error

   // For warnings
   color: AppColors.warning
   ```

## Updating Colors

To update colors across the app:

1. Open `app_colors.dart`
2. Modify the desired color constant
3. Hot reload the app - all screens will update automatically

## Adding New Colors

To add new colors:

1. Add constant to `app_colors.dart`:
   ```dart
   static const Color myNewColor = Color(0xFF123456);
   ```

2. Use throughout the app:
   ```dart
   Container(color: AppColors.myNewColor)
   ```

## Dark Theme

Dark theme support is prepared but not fully implemented. To implement:

1. Update `AppTheme.darkTheme` in `app_theme.dart`
2. Add dark mode colors to `app_colors.dart` if needed
3. Test all screens in dark mode

## Testing

When adding new screens or components:

1. Ensure they use theme colors and styles
2. Test with different color values to ensure consistency
3. Verify text readability with theme text colors
4. Check button states (pressed, disabled, etc.)
