import { Box, Stack, Typography } from '@mui/material';

import { bbColors } from '@/styles/bb';

/**
 * 9 brokered vessel types. Mirrors the customer picker curation (same list &
 * order). Trimaran / Houseboat / Rubber boat intentionally omitted — backend
 * still stores them on existing yachts but we don't offer them.
 */
export const VESSEL_TYPES_ADMIN: { id: string; label: string }[] = [
  { id: 'CATAMARAN', label: 'Catamaran' },
  { id: 'SAILING_YACHT', label: 'Sailing Yacht' },
  { id: 'POWER_CATAMARAN', label: 'Power Catamaran' },
  { id: 'GULET', label: 'Gulet' },
  { id: 'LUXURY_MOTOR_YACHT', label: 'Luxury Motor Yacht' },
  { id: 'MINI_CRUISER', label: 'Mini Cruiser' },
  { id: 'MOTORBOAT', label: 'Motorboat' },
  { id: 'MOTOR_YACHT', label: 'Motor Yacht' },
  { id: 'MOTORSAILER', label: 'Motorsailer' },
];

interface VesselTypePickerProps {
  value: string[];
  onChange: (next: string[]) => void;
}

const VesselTypePicker = ({ value, onChange }: VesselTypePickerProps) => {
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  };

  return (
    <Stack spacing={1}>
      <Typography
        sx={{
          fontSize: 10.5,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: bbColors.gray500,
          fontWeight: 700,
        }}
      >
        Yacht type (multi-select; empty = all)
      </Typography>
      <Stack direction="row" spacing={0.75} flexWrap="wrap" rowGap={0.75}>
        {VESSEL_TYPES_ADMIN.map(t => {
          const selected = value.includes(t.id);
          return (
            <Box
              key={t.id}
              onClick={() => toggle(t.id)}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: 12,
                fontWeight: selected ? 800 : 600,
                cursor: 'pointer',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                backgroundColor: selected ? bbColors.navy900 : bbColors.white,
                color: selected ? bbColors.white : bbColors.navy900,
                border: `1px solid ${selected ? bbColors.navy900 : bbColors.gray300}`,
                '&:hover': {
                  backgroundColor: selected ? bbColors.navy900 : bbColors.gray75,
                  borderColor: selected ? bbColors.navy900 : bbColors.navy700,
                },
              }}
            >
              {t.label}
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
};

export default VesselTypePicker;
