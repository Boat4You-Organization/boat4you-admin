import { TypographyVariantsOptions } from '@mui/material';

// Broker Desk v2.2 type scale: Inter only. display 28/800, page h1 22/800, modal h2 18/800,
// card h3 15/700, body 14/400, table 13/400, label 12/600, caption 12/400. Nothing below 11px.
const typography: TypographyVariantsOptions = {
  fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
  hero: {
    fontSize: '28px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  h1: {
    fontSize: '22px',
    fontWeight: 800,
    letterSpacing: '-0.015em',
    lineHeight: 1.25,
  },
  h2: {
    fontSize: '18px',
    fontWeight: 800,
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
  },
  h3: {
    fontSize: '15px',
    fontWeight: 700,
    lineHeight: 1.35,
  },
  h4: {
    fontSize: '13px',
    fontWeight: 700,
    lineHeight: 1.4,
  },
  body1: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  body2: {
    fontSize: '13px',
    fontWeight: 400,
    lineHeight: 1.45,
  },
  body3: {
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  button: {
    textTransform: 'none',
  },
};

export default typography;
