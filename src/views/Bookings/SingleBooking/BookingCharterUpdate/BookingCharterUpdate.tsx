import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, Stack, TextField } from '@mui/material';

import { CardHead, DeskCard } from '@/components/Desk';
import ReservationsService from '@/services/reservations.service';
import { bbColors } from '@/styles/bb';

interface BookingCharterUpdateProps {
  reservationId: number;
  initialCharterUpdate: string | null;
  /** Bubble the persisted value back so the parent can refresh dependent UI
   *  without a full reload. */
  onSaved?: (value: string | null) => void;
}

/**
 * Broker-written "Charter update" — CUSTOMER-VISIBLE (unlike admin notes).
 * The broker types negotiated extras arranged with the agency, one per line
 * (e.g. "Skipper: 1470 €", "Stand Up Paddle 200 €"); the customer sees this
 * text below the Pay-now action in /my-bookings/{id}. Highlighted amber so it
 * reads as a client-facing block, distinct from the internal admin-notes card
 * it sits under. Empty clears it (customer block then hides).
 */
const BookingCharterUpdate = ({ reservationId, initialCharterUpdate, onSaved }: BookingCharterUpdateProps) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialCharterUpdate ?? '');
  const [saving, setSaving] = useState(false);

  // Re-sync if the parent hands us a different booking (route change) or the
  // value changes after a reload.
  useEffect(() => {
    setValue(initialCharterUpdate ?? '');
  }, [initialCharterUpdate]);

  const trimmed = value.trim();
  const dirty = trimmed !== (initialCharterUpdate ?? '');

  const handleSave = async () => {
    setSaving(true);

    const next = trimmed.length === 0 ? null : trimmed;
    const { payload } = await ReservationsService.updateCharterUpdate(reservationId, next);

    setSaving(false);

    if (payload) {
      onSaved?.(next);
    }
  };

  return (
    <DeskCard sx={{ borderColor: bbColors.amber200 }}>
      <CardHead
        title={t('booking.charter-update', 'Charter update')}
        hint={t('booking.charter-update-hint', 'Shown to the customer in My bookings')}
        sx={{ backgroundColor: bbColors.unreadRow }}
      />
      <Stack spacing={1} sx={{ p: '12px 16px' }}>
        <TextField
          multiline
          minRows={3}
          fullWidth
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={t('booking.charter-update-placeholder', 'e.g. Skipper: 1470 €\nStand Up Paddle: 200 €')}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleSave} disabled={!dirty || saving} variant="outlined">
            {saving ? t('booking.saving', 'Saving...') : t('booking.save', 'Save')}
          </Button>
        </Box>
      </Stack>
    </DeskCard>
  );
};

export default BookingCharterUpdate;
