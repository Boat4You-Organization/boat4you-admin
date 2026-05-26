import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';

import ReservationsService from '@/services/reservations.service';
import { bbColors } from '@/styles/bb';

interface BookingCrewListUrlProps {
  reservationId: number;
  initialUrl: string | null;
  /** Bubble persisted value back to parent so it can refresh dependent UI without
   *  a full reload — the customer-facing my-bookings page picks it up the next
   *  time the user opens the booking. */
  onSaved?: (url: string | null) => void;
}

/**
 * Admin-only crew-list URL editor. Sits in the booking detail right column
 * between Charter agreement and the Documents drop zone. Mario types in the
 * partner-supplied link (or NauSys/MMK auto-fill that didn't make it to our
 * DB) and clicks Save — customer then sees an "Open link" CTA on
 * /my-bookings/{id}. Empty string clears the URL.
 */
const BookingCrewListUrl = ({ reservationId, initialUrl, onSaved }: BookingCrewListUrlProps) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialUrl ?? '');
  const [saving, setSaving] = useState(false);

  // Keep the input in sync if the parent re-fetches and hands us a different
  // booking (route change) or the value updates outside (rare).
  useEffect(() => {
    setValue(initialUrl ?? '');
  }, [initialUrl]);

  const trimmed = value.trim();
  const dirty = trimmed !== (initialUrl ?? '');

  const handleSave = async () => {
    setSaving(true);
    const next = trimmed.length === 0 ? null : trimmed;
    const { payload } = await ReservationsService.updateCrewListUrl(reservationId, next);
    setSaving(false);
    if (payload) {
      onSaved?.(next);
    }
  };

  return (
    <Stack spacing={1} sx={{ pt: 2.5 }}>
      <Typography
        variant="body2"
        fontWeight={700}
        color={bbColors.gray500}
        sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 11 }}
      >
        {t('booking.crew-list-url', 'Crew list URL')}
      </Typography>
      <TextField
        size="small"
        fullWidth
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={t('booking.crew-list-url-placeholder', 'https://...')}
        sx={{
          '& .MuiOutlinedInput-root': {
            fontSize: 13,
            backgroundColor: '#fff',
          },
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          onClick={handleSave}
          disabled={!dirty || saving}
          variant="contained"
          size="small"
          sx={{
            textTransform: 'none',
            fontSize: 13,
            borderRadius: '6px',
          }}
        >
          {saving ? t('booking.saving', 'Saving...') : t('booking.save', 'Save')}
        </Button>
      </Box>
    </Stack>
  );
};

export default BookingCrewListUrl;
