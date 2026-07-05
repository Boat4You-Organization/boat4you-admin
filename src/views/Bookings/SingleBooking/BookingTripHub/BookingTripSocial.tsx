import { useCallback, useEffect, useRef, useState } from 'react';

import { Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';

import TripService, {
  TripChatMessageDto,
  TripParticipantDto,
  TripPhotoDto,
} from '@/services/trip.service';
import { bbColors } from '@/styles/bb';

interface BookingTripSocialProps {
  reservationId: number;
}

const ROLE_BADGES: Record<string, string> = {
  OWNER: '👑',
  SKIPPER: '🧭',
  CONCIERGE: '⚓',
  GUEST: '⛵',
};

const sectionTitleSx = {
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  fontSize: 11,
  fontWeight: 700,
  color: bbColors.gray500,
} as const;

/** Lazy auth-fetched thumbnail (object URL, revoked on unmount). */
const TripPhotoThumb = ({ reservationId, photo }: { reservationId: number; photo: TripPhotoDto }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked: string | null = null;

    TripService.photoObjectUrl(reservationId, photo.id).then(objectUrl => {
      revoked = objectUrl;
      setUrl(objectUrl);
    });

    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [reservationId, photo.id]);

  return (
    <Box sx={{ position: 'relative' }}>
      {url ? (
        <img
          src={url}
          alt={photo.uploaderName ?? 'Trip photo'}
          style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 6, display: 'block' }}
        />
      ) : (
        <Box sx={{ width: '100%', aspectRatio: '1/1', borderRadius: '6px', background: bbColors.gray100 }} />
      )}
      <Box
        sx={{
          position: 'absolute',
          bottom: 4,
          left: 4,
          fontSize: 9,
          fontWeight: 800,
          padding: '1px 5px',
          borderRadius: '4px',
          backgroundColor: photo.marketingConsent ? '#d3f2e2' : '#f4e3e3',
          color: photo.marketingConsent ? '#0a6b46' : '#8a1f1f',
        }}
        title={photo.marketingConsent ? 'Marketing consent given' : 'NO marketing consent'}
      >
        {photo.marketingConsent ? 'MKT ✓' : 'NO MKT'}
      </Box>
    </Box>
  );
};

/**
 * Trip communication panel in the booking detail (phase 3): chat as the
 * Concierge (each post also push-notifies the crew's phones), participant
 * management and the crew album with marketing-consent flags. Opening this
 * panel marks the chat as seen (clears the list badge).
 */
const BookingTripSocial = ({ reservationId }: BookingTripSocialProps) => {
  const [messages, setMessages] = useState<TripChatMessageDto[]>([]);
  const [participants, setParticipants] = useState<TripParticipantDto[]>([]);
  const [photos, setPhotos] = useState<TripPhotoDto[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);

  const refresh = useCallback(() => {
    TripService.getChat(reservationId).then(setMessages);
    TripService.getParticipants(reservationId).then(setParticipants);
    TripService.getPhotos(reservationId).then(setPhotos);
  }, [reservationId]);

  useEffect(() => {
    refresh();

    const poll = setInterval(() => {
      TripService.getChat(reservationId).then(setMessages);
    }, 30_000);

    return () => clearInterval(poll);
  }, [reservationId, refresh]);

  useEffect(() => {
    const box = chatBoxRef.current;

    if (box) box.scrollTop = box.scrollHeight;
  }, [messages.length]);

  const send = async () => {
    if (!draft.trim() || sending) return;

    setSending(true);

    const message = await TripService.postChat(reservationId, draft.trim());

    if (message) {
      setMessages(prev => [...prev, message]);
      setDraft('');
    }

    setSending(false);
  };

  const remove = async (participant: TripParticipantDto) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Remove ${participant.name} from this trip?`)) return;

    if (await TripService.removeParticipant(reservationId, participant.id)) refresh();
  };

  const active = participants.filter(p => !p.removed);

  return (
    <Stack spacing={1} sx={{ pt: 2.5 }}>
      <Typography variant="body2" sx={sectionTitleSx}>
        Trip chat & crew
      </Typography>

      {/* ---------- participants ---------- */}
      <Stack direction="row" flexWrap="wrap" gap={0.75}>
        {active.length === 0 && (
          <Typography sx={{ fontSize: 12, color: bbColors.gray500 }}>
            Nobody has joined this trip yet.
          </Typography>
        )}
        {active.map(participant => (
          <Chip
            key={participant.id}
            size="small"
            label={`${ROLE_BADGES[participant.role] ?? '⛵'} ${participant.name}`}
            onDelete={participant.role === 'OWNER' ? undefined : () => remove(participant)}
            sx={{ fontWeight: 700, fontSize: 12 }}
          />
        ))}
      </Stack>

      {/* ---------- chat ---------- */}
      <Box sx={{ border: `1px solid ${bbColors.gray200}`, borderRadius: '8px', background: '#fff', overflow: 'hidden' }}>
        <Box
          ref={chatBoxRef}
          sx={{ maxHeight: 260, minHeight: 90, overflowY: 'auto', p: 1.25, display: 'flex', flexDirection: 'column', gap: 0.75 }}
        >
          {messages.length === 0 && (
            <Typography sx={{ fontSize: 12, color: bbColors.gray500, textAlign: 'center', py: 1.5 }}>
              No messages yet. Anything you write here reaches the whole crew as “Boat4You Concierge” (+ push).
            </Typography>
          )}
          {messages.map(message => {
            const concierge = message.senderRole === 'CONCIERGE';

            return (
              <Box key={message.id} sx={{ alignSelf: concierge ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <Typography sx={{ fontSize: 10, color: bbColors.gray500, mb: 0.25, textAlign: concierge ? 'right' : 'left' }}>
                  {concierge ? '⚓ ' : ''}
                  {message.senderName} · {new Date(message.createdAt).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
                <Box
                  sx={{
                    backgroundColor: concierge ? '#0c2461' : bbColors.gray100,
                    color: concierge ? '#fff' : 'inherit',
                    borderRadius: '10px',
                    px: 1.25,
                    py: 0.75,
                    fontSize: 13,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {message.body}
                </Box>
              </Box>
            );
          })}
        </Box>
        <Stack direction="row" gap={1} sx={{ p: 1, borderTop: `1px solid ${bbColors.gray200}` }}>
          <TextField
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Reply as Boat4You Concierge…"
            size="small"
            fullWidth
            multiline
            maxRows={4}
          />
          <Button
            variant="contained"
            size="small"
            onClick={send}
            disabled={sending || !draft.trim()}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', px: 2 }}
          >
            Send
          </Button>
        </Stack>
      </Box>

      {/* ---------- album ---------- */}
      {photos.length > 0 && (
        <>
          <Typography variant="body2" sx={{ ...sectionTitleSx, pt: 1 }}>
            Trip album · {photos.length} photo(s) · {photos.filter(p => p.marketingConsent).length} with marketing consent
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.75 }}>
            {photos.map(photo => (
              <TripPhotoThumb key={photo.id} reservationId={reservationId} photo={photo} />
            ))}
          </Box>
        </>
      )}
    </Stack>
  );
};

export default BookingTripSocial;
