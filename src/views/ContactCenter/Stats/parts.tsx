/* Building blocks of the Statistics view: KPI cards and bar lists (shared by Stats and Funnel). */
import { Box } from '@mui/material';

import { Count } from '@/types/contactCenter.type';
import { cc } from '@/views/ContactCenter/ui';

export const cardSx = {
  bgcolor: '#FFFFFF',
  border: `1px solid ${cc.border}`,
  borderRadius: '12px',
  p: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  minWidth: 0,
} as const;

export const Metric = ({ label, value, color = cc.ink }: { label: string; value: string | number; color?: string }) => (
  <Box sx={cardSx}>
    <Box component="span" sx={{ fontSize: 12.5, color: cc.text2 }}>
      {label}
    </Box>
    <Box
      component="span"
      sx={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', color }}
    >
      {value}
    </Box>
  </Box>
);

export const Bars = ({
  title,
  rows,
  label,
  color = cc.ink,
}: {
  title: string;
  rows: Count[];
  label?(key: string): string;
  color?: string;
}) => {
  const max = Math.max(1, ...rows.map(r => r.value));

  return (
    <Box sx={{ ...cardSx, gap: '10px' }}>
      <Box component="h3" sx={{ m: 0, fontSize: 14, fontWeight: 700, color: cc.ink }}>
        {title}
      </Box>
      {!rows.length && <Box sx={{ fontSize: 12.5, color: cc.muted }}>—</Box>}
      {rows.map(r => (
        <Box
          key={r.key}
          sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 44px', gap: '4px 10px', alignItems: 'center' }}
        >
          <Box
            component="span"
            sx={{ fontSize: 12.5, color: cc.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {label ? label(r.key) : r.key}
          </Box>
          <Box
            component="span"
            sx={{ textAlign: 'right', fontSize: 12.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
          >
            {r.value}
          </Box>
          <Box sx={{ gridColumn: '1 / -1', height: 8, borderRadius: '4px', bgcolor: cc.hover }}>
            <Box sx={{ height: 8, borderRadius: '4px', bgcolor: color, width: `${(r.value / max) * 100}%` }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export const kpiGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
  gap: '12px',
} as const;
export const barGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
  gap: '12px',
} as const;
