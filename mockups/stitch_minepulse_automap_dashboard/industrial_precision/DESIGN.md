---
name: Industrial Precision
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#39393a'
  surface-container-lowest: '#0e0e0f'
  surface-container-low: '#1c1b1c'
  surface-container: '#201f20'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e5e2e3'
  on-surface-variant: '#c6c6cc'
  inverse-surface: '#e5e2e3'
  inverse-on-surface: '#313031'
  outline: '#909096'
  outline-variant: '#45464c'
  surface-tint: '#c2c6d8'
  primary: '#c2c6d8'
  on-primary: '#2b303e'
  primary-container: '#1a1f2c'
  on-primary-container: '#828697'
  inverse-primary: '#595e6d'
  secondary: '#ffb77d'
  on-secondary: '#4d2600'
  secondary-container: '#fd8b00'
  on-secondary-container: '#603100'
  tertiary: '#92ccff'
  on-tertiary: '#003351'
  tertiary-container: '#002136'
  on-tertiary-container: '#228dd0'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dee2f4'
  primary-fixed-dim: '#c2c6d8'
  on-primary-fixed: '#161b28'
  on-primary-fixed-variant: '#424655'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#92ccff'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#004b73'
  background: '#131314'
  on-background: '#e5e2e3'
  surface-variant: '#353436'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  gutter: 16px
  sidebar-width: 280px
---

## Brand & Style

The design system is engineered for high-stakes industrial environments where clarity and rapid data processing are critical. The brand personality is authoritative, technical, and vigilant, reflecting the robust nature of heavy mining operations.

The visual style is **Corporate Modern with a "Tactical" edge**. It utilizes a dark-mode-first approach to reduce eye strain in control rooms and field environments while maximizing the contrast of critical status indicators. The UI prioritizes information density without sacrificing legibility, employing a systematic hierarchy that guides the operator's eye to anomalies and performance metrics. Expect a clean, structured aesthetic that feels like an advanced instrumentation panel rather than a traditional consumer app.

## Colors

The palette is rooted in a deep indigo-navy base to provide a stable, low-light background for 24/7 monitoring. 

- **Primary & Backgrounds**: Use `#1A1F2C` for main application surfaces. Use subtle variations of slate gray for card containers to create depth.
- **Action & Safety**: Safety Orange (`#FF8C00`) is reserved for primary actions, critical alerts, and physical-world interactions. High-Visibility Yellow (`#FFD700`) is used for non-critical warnings.
- **Functional Status**: Emerald Green and Signal Red provide immediate binary feedback on fleet health. Cyan Blue is strictly for informational overlays and telemetry data.
- **Contrast**: Text must maintain a high contrast ratio against dark backgrounds, primarily using Crisp White for headings and Light Slate for secondary data.

## Typography

This design system uses **Inter** for its exceptional legibility and neutral, professional tone. It is optimized for reading dense tables and complex labels.

**JetBrains Mono** (or a similar technical monospaced font) is introduced for telemetry data, coordinates, and vehicle IDs to ensure that numeric values align perfectly in shifting data streams. 

Use heavy weights (600+) for status labels and headlines to ensure they "pop" against dark backgrounds. Small labels should use increased letter spacing and uppercase styling to maintain readability at 12px or smaller.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a 12-column structure for desktop. 

- **Desktop**: A fixed left-hand sidebar (280px) houses primary navigation. The main content area uses 24px margins with 16px gutters between data widgets.
- **Data Density**: For tables and instrument panels, use a condensed spacing scale (8px increments) to maximize the "at-a-glance" information available to the operator.
- **Mobile**: The sidebar collapses into a bottom navigation bar or a hamburger menu. Margins reduce to 16px. Vertical stacking is prioritized for data cards.
- **The "Command Center" View**: Dashboard widgets should occupy specific grid spans (e.g., Map: 8 columns, Alerts: 4 columns) to maintain a logical visual hierarchy.

## Elevation & Depth

This design system avoids traditional shadows to maintain a clean, technical look. Instead, it uses **Tonal Layering and Border Definition**:

- **Level 0 (Floor)**: Deepest indigo (`#1A1F2C`) for the main background.
- **Level 1 (Containers)**: A slightly lighter slate (`#2D3436`) for cards and panels, defined by a 1px solid border in a subtle gray-blue.
- **Level 2 (Popovers/Modals)**: Use a medium-depth shadow with a slight color tint of the primary background to suggest float, combined with a brighter 1px border.
- **Active States**: Highlighting is achieved through inner glows or "lit" borders using the Primary or Secondary colors, rather than drop shadows.

## Shapes

The shape language is **Soft (0.25rem)**. While the industry is rugged, sharp corners are avoided to keep the UI modern and reduce visual fatigue. 

- **Buttons & Inputs**: 4px (0.25rem) corner radius.
- **Large Panels/Cards**: 8px (0.5rem) corner radius for a distinct container feel.
- **Status Pills**: Fully rounded (pill-shaped) to distinguish them from interactive buttons.
- **Icons**: Linear, 2px stroke weight with slight corner rounding to match the UI components.

## Components

- **Buttons**: Primary buttons are solid Safety Orange with black text for maximum visibility. Secondary buttons are outlined with Cyan Blue.
- **Data Tables**: High-density with Zebra-striping using subtle tonal shifts. Header cells are uppercase and slightly darker. 
- **Status Badges**: Use a "Dot + Label" pattern. A glowing 8px dot of the status color (Green/Red/Orange) next to a JetBrains Mono label.
- **Input Fields**: Dark backgrounds with 1px slate borders. The "Focus" state uses a Safety Orange bottom-border or halo.
- **Alert Panels**: Docked to the right or bottom. They use a solid color vertical "indicator bar" on the left edge to denote severity.
- **Vehicle Cards**: Compact layouts featuring a small map snippet, battery/fuel percentage bars, and a clear "Target" icon.
- **Navigation**: Sidebar links use high-contrast white for active states and 60% opacity for inactive states, accompanied by functional icons.