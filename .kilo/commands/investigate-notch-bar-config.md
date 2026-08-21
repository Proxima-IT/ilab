---
description: Test official AnimatedNotchBottomBar package defaults for icon alignment fix
---
# Investigate: Official AnimatedNotchBottomBar Configuration

## Context
The current bottom navigation bar in `mobile/lib/shared/screens/main_shell.dart` uses `AnimatedNotchBottomBar` with custom overrides. The active icon inside the circular notch is misaligned: ~3px right horizontally, ~2px down vertically, and the icon appears too small. The package's official example uses different defaults that reportedly fix alignment.

## Task
Temporarily switch to the official package defaults and test alignment.

## Instructions

### 1. Read the current configuration
File: `mobile/lib/shared/screens/main_shell.dart` (around line 289-325)

### 2. Understand the package defaults
Read the package source at:
- `~/.pub-cache/hosted/pub.dev/animated_notch_bottom_bar-1.0.4/lib/src/notch_bottom_bar.dart` (constructor defaults at lines 102-134)
- `~/.pub-cache/hosted/pub.dev/animated_notch_bottom_bar-1.0.4/lib/src/constants/constants.dart`

Key defaults:
- `bottomBarHeight`: 62.0
- `circleMargin`: 8.0
- `topMargin`: 10.0
- `kIconSize` constant: 24.0
- `showLabel` default: true
- `removeMargins` default: false

### 3. Modify the configuration
Edit `mobile/lib/shared/screens/main_shell.dart`. Change ONLY the `AnimatedNotchBottomBar` parameters to match the official defaults:

```dart
bottomNavigationBar: AnimatedNotchBottomBar(
  notchBottomBarController: _notchBottomBarController,
  color: AppColors.primary,
  notchColor: Colors.white,
  // circleMargin: 8.0,  // REMOVED — use default
  durationInMilliSeconds: 300,
  // bottomBarHeight: 60, // REMOVED — use default (62.0)
  showLabel: true,        // CHANGED from false
  removeMargins: false,   // CHANGED from true
  kIconSize: 24.0,        // CHANGED from 28.0
  showBottomRadius: false,
  kBottomRadius: 0,
  // Do NOT pass topMargin — use default (10.0)
  bottomBarItems: [ /* unchanged */ ],
  onTap: (index) { /* unchanged */ },
),
```

Keep all other properties (`notchBottomBarController`, `color`, `notchColor`, `durationInMilliSeconds`, `showBottomRadius`, `kBottomRadius`, `bottomBarItems`, `onTap`) unchanged.

### 4. Run
```bash
cd mobile
flutter analyze  # verify no syntax errors
flutter run      # on Android emulator/device
```

### 5. Inspect
Visually inspect the active icon inside the circular notch:
- Is it centered horizontally?
- Is it centered vertically?
- Does the icon size look appropriate?

### 6. Screenshot
Take a screenshot showing the bottom navigation bar with the active notch circle visible.

### 7. Report
Report back:
- Whether alignment improved, stayed the same, or got worse
- Exact horizontal and vertical alignment observation (centered, off by X px, etc.)
- Whether the icon size looks appropriate or still too small
- Any layout differences from `removeMargins: false` and `showLabel: true` (e.g., margins around the bar, label text below icons)
- The screenshot file path

### 8. Do NOT commit
Do not permanently commit these changes. After testing, leave the temporary config in place but do not delete the original values from comments.

## Verification
- `flutter analyze` must pass with no errors
- App must build and run successfully