/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#f5efe5",
      "foreground": "#453329",
      "border": "#d5cabe",
      "card": "#eee6d8",
      "cardForeground": "#453329",
      "popover": "#eee6d8",
      "popoverForeground": "#453329",
      "primary": "#c4622d",
      "primaryForeground": "#faf3e3",
      "secondary": "#688a52",
      "secondaryForeground": "#faf3e3",
      "muted": "#c4829a",
      "mutedForeground": "#453329",
      "accent": "#d4a44c",
      "accentForeground": "#453329",
      "destructive": "#c93b3b",
      "destructiveForeground": "#faf3e3",
      "input": "#d5cabe",
      "ring": "#c4622d",
      "chart1": "#c4622d",
      "chart2": "#688a52",
      "chart3": "#d4a44c",
      "chart4": "#c4829a",
      "chart5": "#8b7355",
      "sidebar": "#eee6d8",
      "sidebarForeground": "#453329",
      "sidebarBorder": "#d0c4b5",
      "sidebarPrimary": "#c4622d",
      "sidebarPrimaryForeground": "#faf3e3",
      "sidebarAccent": "#d4a44c",
      "sidebarAccentForeground": "#453329",
      "sidebarRing": "#c4622d"
    },
    "dark": {
      "background": "#2a1f18",
      "foreground": "#f5efe5",
      "border": "#5a4035",
      "card": "#3a2b22",
      "cardForeground": "#f5efe5",
      "popover": "#3a2b22",
      "popoverForeground": "#f5efe5",
      "primary": "#d47248",
      "primaryForeground": "#faf3e3",
      "secondary": "#8aad6e",
      "secondaryForeground": "#2a1f18",
      "muted": "#5a3a4c",
      "mutedForeground": "#d5c0c8",
      "accent": "#e8bc6e",
      "accentForeground": "#2a1f18",
      "destructive": "#e05050",
      "destructiveForeground": "#faf3e3",
      "input": "#5a4035",
      "ring": "#d47248",
      "chart1": "#d47248",
      "chart2": "#8aad6e",
      "chart3": "#e8bc6e",
      "chart4": "#d498b2",
      "chart5": "#b8a080",
      "sidebar": "#2e2018",
      "sidebarForeground": "#f5efe5",
      "sidebarBorder": "#4a3228",
      "sidebarPrimary": "#d47248",
      "sidebarPrimaryForeground": "#faf3e3",
      "sidebarAccent": "#e8bc6e",
      "sidebarAccentForeground": "#2a1f18",
      "sidebarRing": "#d47248"
    }
  },
  "fontFamily": {
    "sans": [
      "Nunito",
      "sans-serif"
    ],
    "serif": [
      "Cormorant Garamond",
      "serif"
    ],
    "mono": [
      "Caveat",
      "cursive"
    ]
  },
  "radius": "1.25rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
