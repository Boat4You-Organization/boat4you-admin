import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Button, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material';

import Layout from '@/components/Layout';
import {
  CUSTOM_PAYMENT_SITES,
  CUSTOM_PAYMENT_STATUS_ARRAY,
  CUSTOM_PAYMENT_STATUS_LABEL_MAP,
  CUSTOM_PAYMENT_STATUS_PILL,
  CustomPaymentStatus,
  customPaymentSiteLabel,
} from '@/models/customPayment.model';
import { bbColors, bbFont, bbStatusPill } from '@/styles/bb';
import DateTime from '@/utils/static/DateTime';
import { formatPrice } from '@/utils/static/formatNumber';
import {
  closeNoteModal,
  getCustomPayments,
  openNoteModal,
  refreshCustomPayment,
} from '@/valtio/customPayments/customPayments.actions';
import { useCustomPaymentsStore } from '@/valtio/customPayments/customPayments.store';
import { showToast } from '@/valtio/global/global.actions';

import NoteModal from './partials/NoteModal/NoteModal';

/**
 * Payments made through the secret /pay/<linkKey> page on the 7 sites
 * (Revolut hosted checkout). Record only: nothing here touches reservations.
 * `?q=` pre-filters the list; the office notification e-mail links here
 * with the payment reference.
 */

const ALL = 'all';

type TabId = typeof ALL | CustomPaymentStatus;

const TABS: TabId[] = [ALL, ...CUSTOM_PAYMENT_STATUS_ARRAY];

const COLUMNS = ['date', 'site', 'reference', 'amount', 'status', 'email', 'orderId', 'note'] as const;

const thBase = {
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: bbColors.gray500,
  fontWeight: 700,
  padding: '10px 14px',
  textAlign: 'left',
  backgroundColor: bbColors.gray75,
  borderBottom: `1px solid ${bbColors.gray200}`,
  whiteSpace: 'nowrap',
} as const;

const tdBase = {
  padding: '12px 14px',
  fontSize: 12.5,
  borderBottom: `1px solid ${bbColors.gray100}`,
  color: '#2c3e56',
  whiteSpace: 'nowrap' as const,
  verticalAlign: 'top',
};

const formatEur = (minor: number): string => `€${formatPrice(minor / 100)}`;

const formatDateTime = (iso: string): string => {
  const d = DateTime.date(iso);

  if (!iso || !d.isValid()) return '—';

  return `${DateTime.formatHR(d)} ${DateTime.formatTime(d)}`;
};

const CustomPayments = () => {
  const { t } = useTranslation('custom-payments');
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';

  const { isLoading, loadFailed, customPayments, totalPages, totalReceivedMinor, noteModalOpen } =
    useCustomPaymentsStore();
  const [tab, setTab] = useState<TabId>(ALL);
  const [site, setSite] = useState<string>(ALL);
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState(q);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);

  useEffect(() => setSearchInput(q), [q]);

  useEffect(() => {
    getCustomPayments({
      page,
      status: tab === ALL ? undefined : tab,
      site: site === ALL ? undefined : site,
      q,
    });
  }, [page, tab, site, q]);

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;

    const next = new URLSearchParams(searchParams);
    const value = searchInput.trim();

    if (value) {
      next.set('q', value);
    } else {
      next.delete('q');
    }

    setSearchParams(next, { replace: true });
    setPage(0);
  };

  let tableMessage: string | null = null;

  if (isLoading) {
    tableMessage = t('loading');
  } else if (loadFailed) {
    tableMessage = t('loadFailed');
  } else if (customPayments.length === 0) {
    tableMessage = t('empty');
  }

  const onRefresh = async (id: number) => {
    setRefreshingId(id);

    const ok = await refreshCustomPayment(id);

    setRefreshingId(null);

    if (!ok) showToast({ status: 'error', text: t('refreshFailed') });
  };

  return (
    <>
      <NoteModal isOpen={noteModalOpen} onClose={closeNoteModal} />
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
          {/* Page head */}
          <Box sx={{ mb: 2 }}>
            <Typography component="h1" sx={{ fontSize: { xs: 20, sm: 22 }, fontWeight: 800, letterSpacing: '-0.01em' }}>
              {t('title')}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: bbColors.gray500, mt: 0.5 }}>{t('subtitle')}</Typography>
          </Box>

          {/* Status tabs + site filter */}
          <Stack direction="row" gap={1} sx={{ mb: 1.75, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                backgroundColor: bbColors.white,
                border: `1px solid ${bbColors.gray200}`,
                borderRadius: '10px',
                padding: '4px',
                width: 'fit-content',
                overflowX: 'auto',
                maxWidth: '100%',
              }}
            >
              {TABS.map(id => {
                const active = id === tab;

                return (
                  <Box
                    key={id}
                    component="button"
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setTab(id);
                      setPage(0);
                    }}
                    sx={{
                      padding: '7px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      color: active ? bbColors.white : bbColors.gray500,
                      backgroundColor: active ? bbColors.navy900 : 'transparent',
                      border: 0,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {id === ALL ? t('all') : t(`status.${id}`, { defaultValue: CUSTOM_PAYMENT_STATUS_LABEL_MAP[id] })}
                  </Box>
                );
              })}
            </Box>
            <TextField
              select
              size="small"
              value={site}
              onChange={e => {
                setSite(e.target.value);
                setPage(0);
              }}
              slotProps={{ htmlInput: { 'aria-label': t('columns.site') } }}
              sx={{
                minWidth: 200,
                backgroundColor: bbColors.white,
                '& .MuiOutlinedInput-root': {
                  fontSize: 12,
                  borderRadius: '6px',
                  '& fieldset': { borderColor: bbColors.gray300 },
                },
              }}
            >
              <MenuItem value={ALL} sx={{ fontSize: 12 }}>
                {t('allSites')}
              </MenuItem>
              {CUSTOM_PAYMENT_SITES.map(s => (
                <MenuItem key={s.key} value={s.key} sx={{ fontSize: 12 }}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {/* Filter bar */}
          <Stack
            direction="row"
            gap={1}
            sx={{
              backgroundColor: bbColors.white,
              border: `1px solid ${bbColors.gray200}`,
              borderRadius: '10px',
              padding: '10px 12px',
              mb: 1.75,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <TextField
              placeholder={t('searchPlaceholder')}
              size="small"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={onSearchKey}
              sx={{
                flex: 1,
                minWidth: 240,
                '& .MuiOutlinedInput-root': {
                  fontSize: 12,
                  borderRadius: '6px',
                  '& fieldset': { borderColor: bbColors.gray300 },
                },
              }}
            />
          </Stack>

          {/* Table card */}
          <Box
            sx={{
              backgroundColor: bbColors.white,
              border: `1px solid ${bbColors.gray200}`,
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ overflowX: 'auto' }}>
              <Box component="table" sx={{ width: '100%', minWidth: 1100, borderCollapse: 'collapse' }}>
                <Box component="thead">
                  <Box component="tr">
                    {COLUMNS.map(col => (
                      <Box component="th" key={col} sx={thBase}>
                        {t(`columns.${col}`)}
                      </Box>
                    ))}
                    {/* No header text: the refresh buttons carry their own aria-label. */}
                    <Box component="td" sx={thBase} />
                  </Box>
                </Box>
                <Box component="tbody">
                  {tableMessage && (
                    <Box component="tr">
                      <Box
                        component="td"
                        colSpan={COLUMNS.length + 1}
                        sx={{
                          padding: '40px 20px',
                          textAlign: 'center',
                          color: loadFailed && !isLoading ? bbColors.red600 : bbColors.gray500,
                          fontSize: 13,
                        }}
                      >
                        {tableMessage}
                      </Box>
                    </Box>
                  )}
                  {!isLoading &&
                    customPayments.map(p => {
                      const pill = bbStatusPill(CUSTOM_PAYMENT_STATUS_PILL[p.status] ?? p.status);
                      const refunded = p.refundedAmountMinor ?? 0;

                      return (
                        <Box component="tr" key={p.id} sx={{ '&:hover': { backgroundColor: bbColors.gray75 } }}>
                          <Box component="td" sx={{ ...tdBase, fontVariantNumeric: 'tabular-nums' }}>
                            {formatDateTime(p.createdAt)}
                          </Box>
                          <Box component="td" sx={tdBase}>
                            {customPaymentSiteLabel(p.site)}
                          </Box>
                          <Box component="td" sx={tdBase}>
                            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: bbColors.navy900 }}>
                              {p.reference}
                            </Typography>
                            {p.reservationNumber && (
                              <Typography
                                component={RouterLink}
                                to={`/bookings/${encodeURIComponent(p.reservationNumber.replace('/', '-'))}`}
                                sx={{ fontSize: 11, fontWeight: 700, color: bbColors.navy700, textDecoration: 'none' }}
                              >
                                {`${t('booking')} ${p.reservationNumber} →`}
                              </Typography>
                            )}
                          </Box>
                          <Box component="td" sx={{ ...tdBase, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            {formatEur(p.amountMinor - refunded)}
                            {refunded > 0 && (
                              <Typography sx={{ fontSize: 11, color: bbColors.gray500 }}>
                                {`${t('refunded')} ${formatEur(refunded)}`}
                              </Typography>
                            )}
                          </Box>
                          <Box component="td" sx={tdBase}>
                            <Box component="span" sx={pill.style}>
                              {t(`status.${p.status}`, {
                                defaultValue: CUSTOM_PAYMENT_STATUS_LABEL_MAP[p.status] ?? p.status,
                              })}
                            </Box>
                          </Box>
                          <Box component="td" sx={tdBase}>
                            {p.payerEmail}
                          </Box>
                          <Box
                            component="td"
                            sx={{
                              ...tdBase,
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                              fontSize: 11,
                            }}
                          >
                            {p.providerOrderId || '—'}
                          </Box>
                          <Box component="td" sx={tdBase}>
                            <Stack direction="row" alignItems="center" gap={0.5}>
                              <Box
                                component="span"
                                title={p.adminNote ?? undefined}
                                sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}
                              >
                                {p.adminNote || '—'}
                              </Box>
                              <Tooltip title={t('editNote')}>
                                <IconButton size="small" aria-label={t('editNote')} onClick={() => openNoteModal(p)}>
                                  <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Box>
                          <Box component="td" sx={{ ...tdBase, textAlign: 'right' }}>
                            <Tooltip title={t('refresh')}>
                              <span>
                                <IconButton
                                  size="small"
                                  aria-label={t('refresh')}
                                  disabled={refreshingId === p.id}
                                  onClick={() => onRefresh(p.id)}
                                >
                                  <RefreshIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        </Box>
                      );
                    })}
                </Box>
              </Box>
            </Box>
            {/* Footer: total received (backend sum over the current filter) */}
            <Stack
              direction="row"
              justifyContent="flex-end"
              gap={1}
              sx={{
                padding: '12px 14px',
                backgroundColor: bbColors.gray75,
                borderTop: `1px solid ${bbColors.gray200}`,
              }}
            >
              <Typography sx={{ fontSize: 12, color: bbColors.gray500 }}>{t('totalReceived')}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                {formatEur(totalReceivedMinor)}
              </Typography>
            </Stack>
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Stack direction="row" alignItems="center" justifyContent="center" gap={2} sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                disabled={page <= 0}
                onClick={() => setPage(page - 1)}
                sx={{ textTransform: 'none', fontSize: 12, borderColor: bbColors.gray300, color: bbColors.navy900 }}
              >
                {t('prev')}
              </Button>
              <Typography sx={{ fontSize: 12, color: bbColors.gray500 }}>
                {t('pageOf', { page: page + 1, total: totalPages })}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(page + 1)}
                sx={{ textTransform: 'none', fontSize: 12, borderColor: bbColors.gray300, color: bbColors.navy900 }}
              >
                {t('next')}
              </Button>
            </Stack>
          )}
        </Box>
      </Layout>
    </>
  );
};

export default CustomPayments;
