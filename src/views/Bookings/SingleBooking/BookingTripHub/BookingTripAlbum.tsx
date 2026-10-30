import { useEffect, useState } from 'react';

import { Box, Button, Stack, Typography } from '@mui/material';

import TripService, { TripAlbumSummary } from '@/services/trip.service';
import { bbColors, bbOverlineSx } from '@/styles/bb';

interface BookingTripAlbumProps {
  reservationId: number;
}

/**
 * GDPR-minimal trip-album panel in the booking detail (Mario 5.7.2026): the
 * broker never browses the crew chat, the participant list or the photos.
 * When the crew has uploaded photos this shows only the counts and a download
 * — the full album, or just the marketing-consented photos we're allowed to
 * reuse. Renders nothing until at least one photo exists.
 */
const BookingTripAlbum = ({ reservationId }: BookingTripAlbumProps) => {
  const [summary, setSummary] = useState<TripAlbumSummary | null>(null);
  const [downloading, setDownloading] = useState<'all' | 'marketing' | null>(null);

  useEffect(() => {
    TripService.getAlbumSummary(reservationId).then(setSummary);
  }, [reservationId]);

  if (!summary || summary.total === 0) return null;

  const download = async (marketingOnly: boolean) => {
    setDownloading(marketingOnly ? 'marketing' : 'all');
    await TripService.downloadAlbum(reservationId, marketingOnly);
    setDownloading(null);
  };

  return (
    <Stack spacing={1} sx={{ pt: 1.5 }}>
      <Typography sx={bbOverlineSx}>Trip album</Typography>

      <Box sx={{ border: `1px solid ${bbColors.gray200}`, borderRadius: '10px', background: '#fff', p: 1.5 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
          {summary.total} photo(s) · {summary.marketingConsented} with marketing consent
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: bbColors.gray500, mt: 0.25 }}>
          The crew keeps and downloads these in their own trip app. Download here only when a guest asks, or to reuse
          the marketing-approved shots.
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
          <Button size="small" variant="outlined" disabled={downloading !== null} onClick={() => download(false)}>
            {downloading === 'all' ? 'Preparing…' : 'Download all (ZIP)'}
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={downloading !== null || summary.marketingConsented === 0}
            onClick={() => download(true)}
          >
            {downloading === 'marketing' ? 'Preparing…' : `Marketing photos (${summary.marketingConsented})`}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
};

export default BookingTripAlbum;
