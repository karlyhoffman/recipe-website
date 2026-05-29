import type { CSSProperties } from 'react';

const NUM_COLORS = 9; // must match --color-list-length in styles/_tokens.scss

export const randomColorStart = () => Math.floor(Math.random() * NUM_COLORS);

export const highlightStyle = (i: number, start = 0): CSSProperties =>
  ({ '--highlight-color': `var(--color-${((i + start) % NUM_COLORS) + 1})` } as CSSProperties);
