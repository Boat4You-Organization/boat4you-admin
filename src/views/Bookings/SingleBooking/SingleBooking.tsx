/* eslint-disable @typescript-eslint/no-use-before-define, no-nested-ternary, react/no-unescaped-entities, consistent-return */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Alert, AlertTitle, Box, Button, Stack, Tooltip, Typography } from '@mui/material';

import Layout from '@/components/Layout';
import { ReservationSysStatus } from '@/models/booking.model';
import ReservationsService, { YachtSwapInfoAdminDto } from '@/services/reservations.service';
import { bbColors, bbFont } from '@/styles/bb';
import { showToast } from '@/valtio/global/global.actions';
import {
  getSelectedBookingByOrderNo,
  markBookingAsViewed,
  reloadSelectedBooking,
  toggleCancelBookingModal,
  toggleConfirmBookingModal,
  toggleEditNotesModal,
  toggleMarkAsPaidBookingModal,
  toggleRejectCancellationModal,
  toggleSyncBookingModal,
} from '@/valtio/bookings/bookings.actions';
import { useBookingsStore } from '@/valtio/bookings/bookings.store';
import CancelBookingModal from '@/views/Bookings/partials/CancelBookingModal';
import ConfirmBookingModal from '@/views/Bookings/partials/ConfirmBookingModal';
import EditNotesModal from '@/views/Bookings/partials/EditNotesModal';
import MarkAsPaidBookingModal from '@/views/Bookings/partials/MarkAsPaidBookingModal';
import CancellationRequestModal from '@/views/Bookings/partials/CancellationRequestModal';
import SyncBookingModal from '@/views/Bookings/partials/SyncBookingModal';

import BookingCrewListUrl from './BookingCrewListUrl/BookingCrewListUrl';
import BookingTripHub from './BookingTripHub/BookingTripHub';
import BookingDocuments from './BookingDocuments';
import BookingInformation from './BookingInformation';

/**
 * Single booking detail page — Broker Desk redesign.
 *
 * Shell wrapped in bb tokens: navy back link, card-styled content panels
 * (yacht + booking info, admin notes, action sidebar), and bb-tonal
 * action buttons. The heavy `BookingInformation` body stays unchanged
 * so we don't regress the existing layout of yacht block / payment
 * phases / price breakdown — it sits inside the main card.
 *
 * Admin notes card is new: displays `adminNotes` from the reservation
 * + opens `EditNotesModal` on click. The modal was already wired for
 * the bookings list context menu; we just also render it here so the
 * button has somewhere to dispatch to.
 */

const SingleBooking = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orderNo } = useParams();

  const {
    selectedBooking,
    cancelBookingModalOpen,
    syncBookingModalOpen,
    confirmBookingModalOpen,
    markAsPaidBookingModalOpen,
    editNotesModalOpen,
    rejectCancellationModalOpen,
  } = useBookingsStore();

  const [yachtSwap, setYachtSwap] = useState<YachtSwapInfoAdminDto | null>(null);

  useEffect(() => {
    if (!orderNo) return;

    getSelectedBookingByOrderNo(orderNo);
  }, [orderNo]);

  useEffect(() => {
    const reservationId = selectedBooking?.reservationId;

    if (!reservationId) return;

    // Drop the "new" highlight + Header badge as soon as the admin lands
    // on the detail page — Mario asked for the count to clear on click.
    markBookingAsViewed(reservationId);

    let cancelled = false;

    (async () => {
      const info = await ReservationsService.getYachtSwapInfo(reservationId);

      if (!cancelled) setYachtSwap(info);
    })();
    
return () => {
      cancelled = true;
    };
  }, [selectedBooking?.reservationId]);

  if (!selectedBooking) return null;

  const status = selectedBooking.reservationSysStatus;
  const isBookingCancellable = status !== ReservationSysStatus.CANCELLED;
  const paymentPhases = selectedBooking.reservationPaymentPhases || [];
  const phasesWithPaidOn = paymentPhases.filter(p => !!p.paidOn);
  const allPhasesPaid = paymentPhases.length > 0 && phasesWithPaidOn.length === paymentPhases.length;
  const somePhasesPaid = phasesWithPaidOn.length > 0;
  const noPhasesPaid = phasesWithPaidOn.length === 0;

  const showConfirmBooking = noPhasesPaid;
  const showMarkAsPaid = somePhasesPaid && !allPhasesPaid;

  const adminNotes = selectedBooking.adminNotes?.trim() || '';

  return (
    <>
      <CancelBookingModal isSinglePage isOpen={cancelBookingModalOpen} onClose={toggleCancelBookingModal} />
      <SyncBookingModal isSinglePage isOpen={syncBookingModalOpen} onClose={toggleSyncBookingModal} />
      <ConfirmBookingModal isSinglePage isOpen={confirmBookingModalOpen} onClose={toggleConfirmBookingModal} />
      <MarkAsPaidBookingModal isSinglePage isOpen={markAsPaidBookingModalOpen} onClose={toggleMarkAsPaidBookingModal} />
      <EditNotesModal isSinglePage isOpen={editNotesModalOpen} onClose={toggleEditNotesModal} />
      <CancellationRequestModal
        isSinglePage
        isOpen={rejectCancellationModalOpen}
        onClose={toggleRejectCancellationModal}
      />
      <Layout>
        <Box
          sx={{
            backgroundColor: bbColors.gray50,
            minHeight: '100vh',
            fontFamily: bbFont.stack,
            color: bbColors.navy900,
            pt: '74px',
            pb: 4,
            px: { xs: 2, sm: 3 },
          }}
        >
          {/* Breadcrumb / page head */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'flex-start', md: 'flex-end' }}
            justifyContent="space-between"
            gap={2}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography
                component="a"
                onClick={() => navigate('/bookings')}
                sx={{ fontSize: 12, color: bbColors.navy700, fontWeight: 700, cursor: 'pointer', display: 'inline-block', mb: 0.5 }}
              >
                ← All bookings
              </Typography>
              <Typography component="h1" sx={{ fontSize: { xs: 20, sm: 22 }, fontWeight: 800, letterSpacing: '-0.01em' }}>
                Booking {selectedBooking.reservationNumber ?? `#${selectedBooking.reservationId}`}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: bbColors.gray500, mt: 0.5 }}>
                Charter detail, payment phases & admin actions
              </Typography>
            </Box>
          </Stack>

          {/* Yacht-swap banner keeps original semantics but restyled */}
          {yachtSwap && (
            <Alert
              severity={yachtSwap.action === 'AUTO_UPDATED' ? 'warning' : 'error'}
              icon={<CompareArrowsIcon />}
              sx={{ mb: 2, borderRadius: '10px', fontFamily: bbFont.stack }}
            >
              <AlertTitle sx={{ fontWeight: 700 }}>
                {yachtSwap.action === 'AUTO_UPDATED'
                  ? 'Yacht swap detected and auto-applied'
                  : yachtSwap.action === 'MANUAL_REVIEW'
                    ? 'Yacht swap detected — manual review required'
                    : 'Yacht swap detected (logged only)'}
              </AlertTitle>
              <Typography variant="body2">
                Detected on {new Date(yachtSwap.detectedAt).toLocaleString()}. Previous yacht:{' '}
                <strong>#{yachtSwap.previousYachtId}</strong>
                {yachtSwap.previousYachtName ? ` (${yachtSwap.previousYachtName})` : ''}. New yacht:{' '}
                <strong>{yachtSwap.newYachtId ? `#${yachtSwap.newYachtId}` : 'UNKNOWN'}</strong>
                {yachtSwap.newYachtName ? ` (${yachtSwap.newYachtName})` : ''}.{' '}
                {yachtSwap.acknowledged ? '(Acknowledged by customer)' : '(Not yet acknowledged)'}
              </Typography>
              {yachtSwap.notes && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Notes:</strong> {yachtSwap.notes}
                </Typography>
              )}
            </Alert>
          )}

          {/* Two-column layout: main content + action sidebar */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 320px' },
              gap: 1.75,
              alignItems: 'flex-start',
            }}
          >
            {/* Main card — booking info + notes */}
            <Stack gap={1.75}>
              <Box
                sx={{
                  backgroundColor: bbColors.white,
                  border: `1px solid ${bbColors.gray200}`,
                  borderRadius: '10px',
                  padding: { xs: 2, md: 3 },
                }}
              >
                <BookingInformation selectedBooking={selectedBooking} />
              </Box>

              {/* Admin notes card — always shown (empty state lives here
                  too). Edit button opens the shared EditNotesModal. */}
              <Box
                sx={{
                  backgroundColor: bbColors.white,
                  border: `1px solid ${bbColors.gray200}`,
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ p: '12px 16px', borderBottom: `1px solid ${bbColors.gray100}` }}
                >
                  <Box>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>Admin notes</Typography>
                    <Typography sx={{ fontSize: 11, color: bbColors.gray500 }}>
                      Internal-only — never shown to the customer
                    </Typography>
                  </Box>
                  <Button
                    startIcon={<EditOutlinedIcon sx={{ fontSize: 14 }} />}
                    onClick={() => toggleEditNotesModal(true)}
                    sx={{
                      textTransform: 'none',
                      fontSize: 12,
                      fontWeight: 700,
                      color: bbColors.navy700,
                      border: `1px solid ${bbColors.gray300}`,
                      borderRadius: '6px',
                      padding: '4px 10px',
                      backgroundColor: bbColors.white,
                      '&:hover': { backgroundColor: bbColors.gray75, borderColor: bbColors.navy700 },
                    }}
                  >
                    {adminNotes ? 'Edit' : 'Add notes'}
                  </Button>
                </Stack>
                <Box sx={{ p: '14px 16px' }}>
                  {adminNotes ? (
                    <Typography
                      sx={{
                        fontSize: 13,
                        color: bbColors.navy900,
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.55,
                      }}
                    >
                      {adminNotes}
                    </Typography>
                  ) : (
                    <Typography sx={{ fontSize: 12.5, color: bbColors.gray500, fontStyle: 'italic' }}>
                      No notes yet. Click "Add notes" to capture charter-specific context,
                      special handling, or follow-ups.
                    </Typography>
                  )}
                </Box>
              </Box>
            </Stack>

            {/* Right sidebar — actions */}
            <Box
              sx={{
                backgroundColor: bbColors.white,
                border: `1px solid ${bbColors.gray200}`,
                borderRadius: '10px',
                padding: 2,
                position: { md: 'sticky' },
                top: { md: '74px' },
              }}
            >
              <Typography sx={{ fontSize: 13.5, fontWeight: 800, mb: 1.5 }}>
                {t('booking.update-booking', 'Update booking')}
              </Typography>
              <Stack gap={1}>
                <Tooltip
                  title={t(
                    'booking.sync-booking-tooltip',
                    'Pull-only provjera s partnera. Ništa ne mijenja na partner strani, samo povlači trenutno stanje sa Nausys/MMK (status, yacht, datumi, cijena) i upisuje u naš DB.'
                  )}
                  placement="left"
                  arrow
                  enterDelay={300}
                  slotProps={{
                    tooltip: {
                      sx: {
                        fontSize: 12,
                        lineHeight: 1.45,
                        maxWidth: 320,
                        padding: '10px 12px',
                      },
                    },
                  }}
                >
                  <Button
                    fullWidth
                    onClick={() => toggleSyncBookingModal(true)}
                    sx={{ ...outlinedDark }}
                  >
                    {t('booking.sync-booking', 'Sync with partner')}
                  </Button>
                </Tooltip>
                {showConfirmBooking && (
                  <Button
                    fullWidth
                    onClick={() => toggleConfirmBookingModal(true)}
                    sx={{
                      backgroundColor: bbColors.yellow500,
                      color: bbColors.yellowText,
                      fontWeight: 800,
                      textTransform: 'none',
                      fontSize: 13,
                      borderRadius: '6px',
                      boxShadow: '0 4px 10px -4px rgba(255,210,74,0.5)',
                      '&:hover': { backgroundColor: '#ffca2e' },
                    }}
                  >
                    {t('booking.confirm-booking', 'Confirm booking')}
                  </Button>
                )}
                {showMarkAsPaid && (
                  <Button
                    fullWidth
                    onClick={() => toggleMarkAsPaidBookingModal(true)}
                    sx={{ ...greenFilled }}
                  >
                    {t('booking.mark-as-paid', 'Mark as paid')}
                  </Button>
                )}
              </Stack>
              <Box sx={{ borderTop: `1px solid ${bbColors.gray100}`, my: 2 }} />
              {(() => {
                // Cancellation surface is mode-switched:
                //   - Pending customer request (request stamped, not yet decided,
                //     not already in CANCELLED state) → single amber "Cancellation
                //     request" button that opens a unified modal with Reject /
                //     Confirm / Close. Replaces the old two-button stack ("Reject"
                //     + "Cancel booking") which was too noisy in the side column.
                //   - No pending request → admin-initiated "Cancel booking" button
                //     (existing CancelBookingModal path).
                const hasPendingRequest =
                  !!selectedBooking.cancellationRequestAt &&
                  !selectedBooking.cancellationRejectedAt &&
                  selectedBooking.reservationSysStatus !== ReservationSysStatus.CANCELLED;

                if (hasPendingRequest) {
                  return (
                    <Button
                      fullWidth
                      onClick={() => toggleRejectCancellationModal(true)}
                      sx={{
                        backgroundColor: bbColors.yellow500,
                        color: bbColors.yellowText,
                        fontWeight: 800,
                        textTransform: 'none',
                        fontSize: 13,
                        borderRadius: '6px',
                        boxShadow: '0 4px 10px -4px rgba(255,210,74,0.5)',
                        '&:hover': { backgroundColor: '#ffca2e' },
                      }}
                    >
                      {t('booking.cancellation-request', 'Cancellation request')}
                    </Button>
                  );
                }

                
return (
                  <Button
                    fullWidth
                    disabled={!isBookingCancellable}
                    onClick={() => toggleCancelBookingModal(true)}
                    sx={{
                      backgroundColor: bbColors.red100,
                      color: bbColors.red600,
                      fontWeight: 700,
                      textTransform: 'none',
                      fontSize: 13,
                      borderRadius: '6px',
                      border: `1px solid ${bbColors.red100}`,
                      '&:hover': { backgroundColor: '#fcdad3' },
                      '&.Mui-disabled': { backgroundColor: bbColors.gray100, color: bbColors.gray500, border: `1px solid ${bbColors.gray200}` },
                    }}
                  >
                    {t('booking.cancel-booking', 'Cancel booking')}
                  </Button>
                );
              })()}
              {/* Delete (purge) — only for CANCELLED bookings. Hard-removes the
                  reservation from our DB; for cleaning up spam / fake bot
                  bookings so the fake user can then be deleted (the reservation
                  FK otherwise blocks user deletion). Backend snapshots rows to
                  _purged_*_backup first. Cancel the partner option first. */}
              {!isBookingCancellable && selectedBooking?.reservationId && (
                <Button
                  fullWidth
                  sx={{
                    mt: 1,
                    backgroundColor: bbColors.red600,
                    color: '#fff',
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: 13,
                    borderRadius: '6px',
                    '&:hover': { backgroundColor: '#a52f22' },
                  }}
                  onClick={async () => {
                    const ref = selectedBooking.reservationNumber ?? `#${selectedBooking.reservationId}`;

                    // eslint-disable-next-line no-alert
                    if (!window.confirm(`Permanently DELETE booking ${ref} from the database? This cannot be undone (a backup row is kept). Use only for spam/fake bookings.`)) {
                      return;
                    }

                    const { payload, message } = await ReservationsService.purgeReservation(selectedBooking.reservationId!);

                    showToast({
                      status: payload ? 'success' : 'error',
                      text: payload ? `Booking ${ref} deleted` : message || 'Delete failed',
                    });

                    if (payload) navigate('/bookings');
                  }}
                >
                  {t('booking.delete-booking', 'Delete booking (spam)')}
                </Button>
              )}
              {/* Charter agreement download — fetches the per-reservation
                  PDF (same artefact attached to the confirmation email)
                  and triggers a download via a hidden anchor. Separated
                  from the Cancel booking button by a divider so the two
                  destructive vs. neutral actions don't read as a stack. */}
              {selectedBooking?.reservationId && (
                <>
                  <Box sx={{ borderTop: `1px solid ${bbColors.gray100}`, my: 2 }} />
                  <Button
                    fullWidth
                    onClick={() =>
                      ReservationsService.openCharterAgreement(
                        selectedBooking.reservationId!,
                        selectedBooking.reservationNumber ?? undefined,
                      )
                    }
                    sx={{
                      backgroundColor: bbColors.gray100,
                      color: bbColors.gray600,
                      fontWeight: 700,
                      textTransform: 'none',
                      fontSize: 13,
                      borderRadius: '6px',
                      border: `1px solid ${bbColors.gray200}`,
                      '&:hover': { backgroundColor: bbColors.gray200 },
                    }}
                  >
                    {t('booking.charter-agreement', 'Charter agreement')}
                  </Button>
                  {/* Crew-list URL (partner-supplied or admin-entered) shown
                      to the customer in /my-bookings sidebar as "Open link". */}
                  <BookingTripHub tripToken={selectedBooking.reservationTripToken} />
                  <BookingCrewListUrl
                    reservationId={selectedBooking.reservationId}
                    initialUrl={selectedBooking.reservationCrewListUrl}
                    // Refresh the store copy after save so the input's dirty
                    // state resets and dependent UI reads the new link.
                    onSaved={() => {
                      reloadSelectedBooking();
                    }}
                  />
                  {/* Customer-visible documents — what we want the client to
                      see in /my-bookings sidebar (crew-list docx, pickup
                      info, contract scans). PDF/DOC/DOCX, ≤20MB. */}
                  <BookingDocuments reservationId={selectedBooking.reservationId} />
                  {/* Admin-internal documents — Mario rule (3.5.2026):
                      handover notes, agency back-office files, accounting
                      receipts. Red INTERNAL DOCUMENTATION heading + customer
                      backend endpoint blocks download even by document id. */}
                  <BookingDocuments reservationId={selectedBooking.reservationId} internal />
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Layout>
    </>
  );
};

const outlinedDark = {
  backgroundColor: bbColors.navy900,
  color: bbColors.white,
  fontWeight: 700,
  textTransform: 'none' as const,
  fontSize: 13,
  borderRadius: '6px',
  boxShadow: 'none',
  '&:hover': { backgroundColor: '#132333', boxShadow: 'none' },
};

// Green variant for "Mark as paid" — money-positive action. Distinct
// from navy "Sync" so the broker's eye can tell them apart at a glance
// on a stack of sidebar buttons.
const greenFilled = {
  backgroundColor: bbColors.green600,
  color: bbColors.white,
  fontWeight: 700,
  textTransform: 'none' as const,
  fontSize: 13,
  borderRadius: '6px',
  boxShadow: 'none',
  '&:hover': { backgroundColor: '#0f7643', boxShadow: 'none' },
};

export default SingleBooking;
