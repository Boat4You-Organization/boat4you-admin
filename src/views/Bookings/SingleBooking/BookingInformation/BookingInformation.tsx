/* eslint-disable no-nested-ternary */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, Divider, Grid, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';

import Avatar from '@/components/Avatar';
import FlagIcon from '@/components/FlagIcon';
import { api } from '@/config/axios.config';
import StatusChip from '@/components/StatusChip';
import Email from '@/components/SvgIcons/Contact/Email';
import ExternalLink from '@/components/SvgIcons/ExternalLink';
import PhoneOutlined from '@/components/SvgIcons/PhoneOutlined';
import {
  RESERVATION_SYS_STATUS_COLOR_MAP,
  RESERVATION_SYS_STATUS_LABEL_MAP,
  ReservationModel,
  ReservationSysStatus,
  getEffectiveReservationSysStatus,
} from '@/models/booking.model';
import { bbColors } from '@/styles/bb';
import colors from '@/styles/themes/colors';
import { bankFeeShareForPhase } from '@/utils/static/bankTransferFee';
import DateTime from '@/utils/static/DateTime';
import { formatPrice } from '@/utils/static/formatNumber';
import { generateGoogleMapsLink } from '@/utils/static/googleMapsUtils';
import { sortByNumericProp } from '@/utils/static/sortUtils';

import BookingInfoItem from './BookingInfoItem';
import styles from './BookingInformation.module.scss';

interface BookingInformationProps {
  selectedBooking: ReservationModel;
}

const BookingInformation = ({ selectedBooking }: BookingInformationProps) => {
  const { t } = useTranslation();
  // Fixed wire fee (BANK_TRANSFER_FIXED_FEE, e.g. 32 €) — the customer's wire
  // transfers carry per-phase shares of it, so the phases and the booking
  // total must show the fee-inclusive amounts the wire emails ask for
  // (Mario 5.7.2026: admin showed 3,455.63 while the email wired 3,487.63).
  const [bankFeeEur, setBankFeeEur] = useState(0);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/public/settings/bank-transfer-fee')
      .then(({ data }) => {
        if (!cancelled) setBankFeeEur(parseFloat(data?.amountEur) || 0);
      })
      .catch(() => {
        /* fee row simply stays hidden */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const {
    yachtName,
    yachtMainImage,
    modelName,
    locationFromCountry,
    locationFromName,
    reservationSysStatus,
    reservationNumber,
    reservationDateFrom,
    reservationDateTo,
    offerCheckin,
    offerCheckout,
    agencyName,
    endUserEmail,
    endUserPhone,
    endUser,
    specialRequest,
    selectedExtras,
    reservationTotalPrice,
    yachtSlug,
    reservationPaymentPhases,
    services,
    obligatoryExtrasKeys,
    securityDeposit,
    insuredSecurityDeposit,
    depositCurrency,
  } = selectedBooking;

  const googleMapsLink = generateGoogleMapsLink(locationFromName);
  const days = Math.max(1, DateTime.daysBetween(dayjs(reservationDateFrom), dayjs(reservationDateTo)));
  const sortedServices = [...selectedExtras].sort(sortByNumericProp('id'));

  // Merge catalogue obligatory services with the selected ones. Selected wins
  // when keys collide (booking-specific price). Same fallback the customer
  // page uses so admin sees the same rows.
  const obligatoryKeys = obligatoryExtrasKeys ?? [];
  const selectedKeys = new Set(sortedServices.map(s => s.key).filter(Boolean));
  const catalogObligatory = (services ?? []).filter(
    s => (s.obligatory || obligatoryKeys.includes(s.key)) && !selectedKeys.has(s.key),
  );

  // Split obligatory extras by where they're settled so the admin sees the
  // same breakdown the customer does on /my-bookings/{id}: marina items are
  // cash brought to check-in (transit log, end-cleaning, tourist tax,
  // security deposit, harbour fees) while "included" items are obligatory
  // but already paid via the wire transfer. Mario rule (3.5.2026): "stavi i
  // meni u admin da vidim sta moraju jos platit u marini".
  type DisplayRow = { id: number | string; name: string; labelCode?: string; priceEur: number };

  const obligatoryAtMarinaSelected: DisplayRow[] = sortedServices.filter(service => service.obligatory && service.payableInBase);
  const obligatoryIncludedSelected: DisplayRow[] = sortedServices.filter(service => service.obligatory && !service.payableInBase);
  const obligatoryAtMarinaCatalog: DisplayRow[] = catalogObligatory
    .filter(s => s.payableInBase)
    .map(s => ({ id: s.id, name: s.name, priceEur: s.priceEur }));
  const obligatoryIncludedCatalog: DisplayRow[] = catalogObligatory
    .filter(s => !s.payableInBase)
    .map(s => ({ id: s.id, name: s.name, priceEur: s.priceEur }));
  const obligatoryAtMarina: DisplayRow[] = [...obligatoryAtMarinaSelected, ...obligatoryAtMarinaCatalog];
  const obligatoryIncluded: DisplayRow[] = [...obligatoryIncludedSelected, ...obligatoryIncludedCatalog];
  const additionalPaidNow = sortedServices.filter(service => !service.obligatory && !service.payableInBase);
  const additionalAtMarina = sortedServices.filter(service => !service.obligatory && service.payableInBase);
  const hasDeposit = typeof securityDeposit === 'number' && securityDeposit > 0;
  // Deposit insurance is the yacht's AVAILABLE deposit-waiver amount
  // (yacht.insuredDeposit), never an actual reservation extra — showing it here
  // read as if the client bought it. Mirror the customer /my-bookings fix
  // (Mario 12.7.2026): a genuinely purchased waiver surfaces as a normal extra
  // row, so never render the catalogue waiver as part of a booking.
  const hasInsurance = false;
  // Marina total sums every payableInBase row regardless of obligatory flag —
  // it's the single number the customer hands over at the dock. Refundable
  // security deposit is held (card pre-auth) rather than spent, so it stays
  // out of the cash sum even though it's listed in the marina section.
  const marinaTotal = [...sortedServices, ...catalogObligatory]
    .filter(s => s.payableInBase)
    .reduce((sum, s) => sum + (s.priceEur || 0), 0);
  const hasMarinaItems = marinaTotal > 0;
  const depositCurrencySymbol = depositCurrency === 'EUR' ? '€' : (depositCurrency ?? '€');

  return (
    <Stack className={styles.container}>
      {selectedBooking.cancellationRequestAt && (() => {
        // Cancellation banner has 3 mutually-exclusive states:
        //   1. isRejected   — admin rejected the request (agency refused).
        //                     Booking stays active. Banner is gray/red, shows
        //                     both customer's reason and admin's rejection reason.
        //   2. isFinalisedByAgent — admin confirmed the cancellation. Status
        //                     flipped to CANCELLED, "[AGENT]" / "[ADMIN]" prefix
        //                     stamped on the cancellation reason. Banner is blue.
        //   3. isPending   — request received, not yet decided. Banner is amber.
        // Stripping the agent prefix from the displayed reason so the customer's
        // own words (or the agent's note minus the marker) read cleanly.
        const raw = selectedBooking.cancellationRequest ?? '';
        const agentPrefixes = ['[AGENT]', '[ADMIN]'];
        const matchedPrefix = agentPrefixes.find(p => raw.startsWith(p));
        const cleanedReason = matchedPrefix ? raw.slice(matchedPrefix.length).trim() : raw;
        const isRejected = !!selectedBooking.cancellationRejectedAt;
        const isFinalisedByAgent =
          !isRejected &&
          !!matchedPrefix &&
          selectedBooking.reservationSysStatus === ReservationSysStatus.CANCELLED;
        const isPending =
          !isRejected &&
          !isFinalisedByAgent &&
          selectedBooking.reservationSysStatus !== ReservationSysStatus.CANCELLED;

        if (!isPending && !isFinalisedByAgent && !isRejected) return null;

        const bannerBg = isRejected
          ? bbColors.gray100
          : isFinalisedByAgent
          ? colors.blue50
          : colors.mandalay50;
        const bannerHeading = isRejected
          ? colors.red500
          : isFinalisedByAgent
          ? colors.blue500
          : colors.mandalay900;
        const bannerBody = isRejected
          ? colors.black700
          : isFinalisedByAgent
          ? colors.blue500
          : colors.mandalay800;

        return (
          <Stack
            gap={2}
            sx={{
              backgroundColor: bannerBg,
              borderRadius: 1.5,
              padding: 2,
              marginBottom: 3,
              borderLeft: isRejected ? `4px solid ${colors.red500}` : undefined,
            }}
          >
            <Stack gap={1}>
              <Typography variant="h4" component="p" fontWeight={700} color={bannerHeading}>
                {isRejected
                  ? t('booking.cancellation-rejected', 'Cancellation rejected')
                  : isFinalisedByAgent
                  ? t('booking.cancelled-by-agent')
                  : t('booking.cancellation-requested')}
              </Typography>
              {cleanedReason && (
                <Typography variant="body1" color={bannerBody}>
                  {t('booking.cancellation-reason')}: {cleanedReason}
                </Typography>
              )}
              {isRejected && selectedBooking.cancellationRejectedReason && (
                <Typography variant="body1" color={bannerBody}>
                  <strong>
                    {t('booking.rejection-reason', 'Why we couldn\'t cancel')}:
                  </strong>{' '}
                  {selectedBooking.cancellationRejectedReason}
                </Typography>
              )}
            </Stack>
            <Typography variant="body2" color={bannerBody}>
              {isRejected && selectedBooking.cancellationRejectedAt
                ? `${t('booking.rejected-on', 'Rejected on')} ${DateTime.formatHR(
                    dayjs(selectedBooking.cancellationRejectedAt),
                  )}`
                : DateTime.formatHR(dayjs(selectedBooking.cancellationRequestAt))}
            </Typography>
          </Stack>
        );
      })()}
      <Stack direction="row" gap={2} justifyContent="space-between">
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box className={styles.boatImage}>
            <img
              loading="lazy"
              sizes="auto"
              src={`${import.meta.env.VITE_BOAT_API_URL}/public/image/${yachtMainImage}`}
              alt={`${selectedBooking.yachtName} banner`}
              className={styles.image}
            />
          </Box>
          <Stack maxWidth={280}>
            <Typography component="p" variant="h3" fontWeight={700}>
              {modelName} | {yachtName}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <FlagIcon countryCode={locationFromCountry} />
              <Typography variant="body1">{locationFromName}</Typography>
            </Stack>
          </Stack>
          {(() => {
            const effStatus = getEffectiveReservationSysStatus(
              reservationSysStatus,
              reservationDateFrom,
              reservationDateTo
            );

            
return (
              <StatusChip
                label={t(RESERVATION_SYS_STATUS_LABEL_MAP[effStatus])}
                color={RESERVATION_SYS_STATUS_COLOR_MAP[effStatus]}
              />
            );
          })()}
        </Stack>
        <Stack
          direction="column"
          justifyContent="space-between"
          alignItems="flex-end"
          display={{ xs: 'none', md: 'flex' }}
          flex={1}
        >
          {reservationNumber && <Typography variant="body1">#{reservationNumber}</Typography>}

          {/* Customer-site link opens in a new tab — using plain anchor
              instead of react-router's Link so the absolute URL isn't
              rewritten as a SPA route (which produced the 404 "view boat
              doesn't work" report). VITE_CUSTOMER_WEB_URL is the env the
              rest of the admin already uses for this kind of jump. */}
          <Button
            component="a"
            href={`${import.meta.env.VITE_CUSTOMER_WEB_URL || 'http://localhost:3000'}/boat/${yachtSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            size="medium"
            color="secondary"
          >
            {t('booking.view-boat')}
          </Button>
        </Stack>
      </Stack>
      <Divider sx={{ borderColor: colors.black200, paddingBlock: 1 }} />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography component="p" variant="h3" fontWeight={700} pb={3}>
            {t('booking.booking-info')}
          </Typography>
          <Stack direction="column" spacing={3}>
            <BookingInfoItem
              label={t('booking.check-in')}
              value={`${DateTime.formatLong(dayjs(reservationDateFrom))}${offerCheckin ? ` ${offerCheckin}` : ''}`}
            />
            <BookingInfoItem
              label={t('booking.check-out')}
              value={`${DateTime.formatLong(dayjs(reservationDateTo))}${offerCheckout ? ` ${offerCheckout}` : ''}`}
            />
            <BookingInfoItem
              label={t('booking.pickup-location')}
              value={
                <a href={googleMapsLink} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  <Typography variant="body1">{locationFromName}</Typography>
                  <ExternalLink variant="secondary" />
                </a>
              }
            />
            <BookingInfoItem label={t('booking.charter-company')} value={agencyName} />
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} className={styles.generalInfoWrapper}>
          <Typography component="p" variant="h3" fontWeight={700} pb={3}>
            {t('booking.guest-info')}
          </Typography>
          <Stack direction="column" spacing={3}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar name={endUser} />
              <Typography variant="body1">{endUser}</Typography>
            </Stack>
            <BookingInfoItem icon={Email} value={endUserEmail} />
            <BookingInfoItem icon={PhoneOutlined} value={endUserPhone} />
            {specialRequest && (
              <Box sx={{ bgcolor: bbColors.amber100, borderRadius: 1, p: 1.5 }}>
                <BookingInfoItem label={t('booking.special-request')} value={specialRequest} />
              </Box>
            )}
          </Stack>
        </Grid>
      </Grid>
      <Divider sx={{ borderColor: colors.black200, paddingBlock: 1 }} />
      <Stack direction="column" spacing={2}>
        <Typography component="p" variant="h3" fontWeight={700}>
          {t('booking.payment-phases')}
        </Typography>
        {reservationPaymentPhases.map(({ id, paidOn, deadline, amount }, phaseIdx) => {
          // Show the wire amount the customer is actually asked for: phase
          // amount + this phase's share of the fixed bank fee (same split as
          // the wire emails / payment page).
          const feeShare = bankFeeShareForPhase(bankFeeEur, reservationPaymentPhases.length, phaseIdx);

          return (
            <Stack key={id} direction="row" justifyContent="space-between">
              <Stack>
                <Typography component="p" variant="h4" fontWeight={700}>
                  {`${formatPrice((amount || 0) + feeShare)} €`}
                </Typography>
                <Typography variant="body2" color={colors.black500}>
                  {DateTime.formatHR(dayjs(deadline))}
                  {feeShare > 0 && ` · ${t('booking.bank-fee-note', { fee: feeShare })}`}
                </Typography>
              </Stack>
              <StatusChip
                label={paidOn ? t('booking.paid') : t('booking.not-paid')}
                color={paidOn ? 'success' : 'error'}
                sx={{
                  alignSelf: 'center',
                }}
              />
            </Stack>
          );
        })}
      </Stack>
      <Divider sx={{ borderColor: colors.black200, paddingBlock: 1 }} />
      <Stack direction="column" spacing={2}>
        <Typography component="p" variant="h3" fontWeight={700}>
          {t('booking.price-information')}
        </Typography>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body1">{t('booking.client-price')}</Typography>
          <Typography variant="body1" display="flex" alignItems="baseline" gap={0.75}>
            {`${formatPrice(reservationTotalPrice || 0)} €`}
            <Typography component="span" variant="body2" color={colors.black500}>
              {`/ ${days} ${days === 1 ? t('booking.day') : t('booking.days')}`}
            </Typography>
          </Typography>
        </Stack>
        {(obligatoryAtMarina.length > 0 || hasDeposit || hasInsurance) && (
          <>
            <Typography variant="body1" fontWeight={700}>
              {t('booking.obligatory-paid-at-marina')}
            </Typography>
            {obligatoryAtMarina.map(({ id, name, labelCode, priceEur }) => (
              <Stack key={id} direction="row" justifyContent="space-between">
                <Typography variant="body1">{labelCode ? t(`extras.${labelCode}`) : name}</Typography>
                <Typography variant="body1">{`${formatPrice(priceEur || 0)} €`}</Typography>
              </Stack>
            ))}
            {hasDeposit && (
              <Stack key="security-deposit" direction="row" justifyContent="space-between">
                <Stack>
                  <Typography variant="body1">{t('booking.refundable-security-deposit')}</Typography>
                  <Typography variant="body2" color={colors.black500}>
                    {t('booking.refundable-security-deposit-hint')}
                  </Typography>
                </Stack>
                <Typography variant="body1">
                  {`${formatPrice(securityDeposit as number)} ${depositCurrencySymbol}`}
                </Typography>
              </Stack>
            )}
            {hasInsurance && (
              <Stack key="deposit-insurance" direction="row" justifyContent="space-between">
                <Typography variant="body1">{t('booking.deposit-insurance')}</Typography>
                <Typography variant="body1">
                  {`${formatPrice(insuredSecurityDeposit as number)} ${depositCurrencySymbol}`}
                </Typography>
              </Stack>
            )}
          </>
        )}
        {obligatoryIncluded.length > 0 && (
          <>
            <Typography variant="body1" fontWeight={700}>
              {t('booking.obligatory-included')}
            </Typography>
            {obligatoryIncluded.map(({ id, name, labelCode, priceEur }) => (
              <Stack key={id} direction="row" justifyContent="space-between">
                <Typography variant="body1">{labelCode ? t(`extras.${labelCode}`) : name}</Typography>
                <Typography variant="body1">{`${formatPrice(priceEur || 0)} €`}</Typography>
              </Stack>
            ))}
          </>
        )}
        {additionalPaidNow.length > 0 && (
          <>
            <Typography variant="body1" fontWeight={700}>
              {t('booking.additional-paid-now')}
            </Typography>
            {additionalPaidNow.map(({ id, name, labelCode, priceEur }) => (
              <Stack key={id} direction="row" justifyContent="space-between">
                <Typography variant="body1">{labelCode ? t(`extras.${labelCode}`) : name}</Typography>
                <Typography variant="body1">{`${formatPrice(priceEur || 0)} €`}</Typography>
              </Stack>
            ))}
          </>
        )}
        {additionalAtMarina.length > 0 && (
          <>
            <Typography variant="body1" fontWeight={700}>
              {t('booking.additional-paid-at-marina')}
            </Typography>
            {additionalAtMarina.map(({ id, name, labelCode, priceEur }) => (
              <Stack key={id} direction="row" justifyContent="space-between">
                <Typography variant="body1">{labelCode ? t(`extras.${labelCode}`) : name}</Typography>
                <Typography variant="body1">{`${formatPrice(priceEur || 0)} €`}</Typography>
              </Stack>
            ))}
          </>
        )}
        {/* Aggregate marina cash — visible whenever any obligatory or
            additional row is paid at marina, so the admin sees the single
            sum the customer brings to the dock without having to add up
            obligatory + additional groups by hand. */}
        {hasMarinaItems && (
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{
              mt: 0.5,
              pt: 1,
              borderTop: `1px dashed ${colors.black200}`,
            }}
          >
            <Typography variant="body1" fontWeight={700}>
              {t('booking.marina-total')}
            </Typography>
            <Typography variant="body1" fontWeight={700} sx={{ color: bbColors.amber700 }}>
              {`${formatPrice(marinaTotal)} €`}
            </Typography>
          </Stack>
        )}
        <Stack direction="row" justifyContent="space-between" pt={1}>
          <Stack>
            <Typography component="p" variant="h3" fontWeight={700}>
              {t('booking.total')}
            </Typography>
            {reservationPaymentPhases.length > 0 && bankFeeEur > 0 && (
              <Typography variant="body2" color={colors.black500}>
                {t('booking.bank-fee-note', { fee: bankFeeEur })}
              </Typography>
            )}
          </Stack>
          <Typography
            component="p"
            variant="h3"
            fontWeight={700}
            color={colors.blue500}
            display="flex"
            alignItems="center"
          >
            {/* Booking total = the wire transfers we actually ask for: sum of
                phases + the full fixed bank fee. Falls back to the stored
                total when a legacy booking has no phases. */}
            {`${formatPrice(
              reservationPaymentPhases.length > 0
                ? reservationPaymentPhases.reduce((sum, p) => sum + (p.amount || 0), 0) + bankFeeEur
                : reservationTotalPrice || 0,
            )} €`}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default BookingInformation;
