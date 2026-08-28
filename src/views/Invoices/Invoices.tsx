/* eslint-disable @typescript-eslint/no-use-before-define */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Box, Button, Checkbox as MuiCheckbox, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { pdf } from '@react-pdf/renderer';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

import Layout from '@/components/Layout';
import {
  INVOICE_STATUS_TAB_LABEL_MAP,
  INVOICE_STATUS_TAB_VALUES,
  InvoiceLanguage,
  InvoiceStatus,
} from '@/models/invoices.model';
import InvoicesService from '@/services/invoices.service';
import { bbColors, bbFont, bbStatusPill } from '@/styles/bb';
import useQueryParams from '@/utils/hooks/useQueryParams';
import DateTime from '@/utils/static/DateTime';
import { formatPrice } from '@/utils/static/formatNumber';
import { showToast } from '@/valtio/global/global.actions';
import {
  getInvoices,
  getSelectedInvoice,
  toggleCreateInvoiceModal,
  toggleMarkAsPaidInvoiceModal,
  toggleUpdateInvoiceModal,
} from '@/valtio/invoices/invoices.actions';
import { useInvoicesStore } from '@/valtio/invoices/invoices.store';

import CreateInvoiceModal from './partials/CreateInvoiceModal';
import InvoicePDF from './partials/InvoicePDF';
import MarkAsSentInvoiceModal from './partials/MarkAsSentInvoiceModal';
import SingleInvoiceModal from './partials/SingleInvoiceModal';
import UpdateInvoiceModal from './partials/UpdateInvoiceModal';
import useInvoicesView from './useInvoicesView';

/**
 * Invoices list — Broker Desk redesign.
 *
 * PageHead + status TabGroup + FilterBar + table card. Columns: Invoice
 * ID · Client · Booking · Amount · Issued · Status pill · Open. The
 * handoff row also proposes a Commission column, but backend
 * `InvoiceModel` doesn't carry a commission figure today — add once
 * the invoice DTO joins the booking side (or derives from related
 * reservation.commission). Due/Paid date + PDF link are TODO placeholders.
 */

const statusToVariant = (s: InvoiceStatus): string => {
  if (s === InvoiceStatus.SENT) return 'sent';

  if (s === InvoiceStatus.READY) return 'ready';

  return 'draft';
};

// Subtle full-row tint so the list scans by state at a glance (Mario
// 28.8.2026): Ready = warm amber, Sent = green, Draft = plain white.
const statusRowTint = (s: InvoiceStatus): string | undefined => {
  if (s === InvoiceStatus.SENT) return '#f2fbf6';

  if (s === InvoiceStatus.READY) return '#fdf9ec';

  return undefined;
};

const CURRENT_YEAR = new Date().getFullYear();

const Invoices = () => {
  const { t } = useTranslation();
  const { params: queryParams, setParam } = useQueryParams();
  const { search, sortBy, sortDirection, invoiceStatus, year, departureDate } = queryParams;

  const [statusFilter, setStatusFilter] = useState<string>(invoiceStatus || INVOICE_STATUS_TAB_VALUES[0]);
  const [searchInput, setSearchInput] = useState<string>(search || '');
  // Year tabs (Mario 26.8.2026): invoices are organised per year of the
  // invoice date — 2026, 2027… appear automatically as invoices exist.
  const [yearFilter, setYearFilter] = useState<number>(Number(year) || CURRENT_YEAR);
  const [availableYears, setAvailableYears] = useState<number[]>([CURRENT_YEAR]);
  // Multi-select for the batch ZIP download.
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [zipping, setZipping] = useState(false);

  const { isLoading, invoices, selectedInvoice, updateInvoiceModalOpen, markAsPaidModalOpen, createInvoiceModalOpen } =
    useInvoicesStore();
  const { closeInvoiceModal } = useInvoicesView();

  const params = useParams();
  const id = params['*'];
  const navigate = useNavigate();
  const [searchParamsRaw] = useSearchParams();

  useEffect(() => {
    if (!id) return;

    getSelectedInvoice(Number(id));
  }, [id]);

  useEffect(() => {
    (async () => {
      const years = await InvoicesService.getInvoiceYears();
      const merged = Array.from(new Set([CURRENT_YEAR, ...years])).sort((a, b) => a - b);

      setAvailableYears(merged);
    })();
  }, [createInvoiceModalOpen]);

  useEffect(() => {
    const status = (statusFilter === 'all' ? '' : statusFilter) as InvoiceStatus;

    setSelectedIds([]);
    // Single page — the service requests the whole year at once (no paging).
    getInvoices(0, sortBy, sortDirection, status, search, undefined, undefined, undefined, departureDate || undefined, undefined, yearFilter);
  }, [sortBy, sortDirection, statusFilter, search, departureDate, yearFilter, createInvoiceModalOpen, updateInvoiceModalOpen]);

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') setParam({ search: searchInput, page: 1 });
  };

  const allOnPageSelected = useMemo(
    () => invoices.length > 0 && invoices.every(inv => selectedIds.includes(inv.id)),
    [invoices, selectedIds]
  );

  const toggleSelectAll = () => {
    setSelectedIds(allOnPageSelected ? [] : invoices.map(inv => inv.id));
  };

  const toggleSelected = (invoiceId: number) => {
    setSelectedIds(prev => (prev.includes(invoiceId) ? prev.filter(x => x !== invoiceId) : [...prev, invoiceId]));
  };

  // Batch download: render each selected invoice through the existing
  // InvoicePDF template (in the invoice's own language) and pack everything
  // into ONE zip — no more one-by-one downloads (Mario 26.8.2026).
  const handleDownloadSelected = async () => {
    if (!selectedIds.length || zipping) return;

    setZipping(true);
    try {
      const zip = new JSZip();
      const selected = invoices.filter(inv => selectedIds.includes(inv.id));

      // Sequential on purpose — @react-pdf's WASM layouter is single-threaded
      // and parallel renders just fight for the same thread.
      // eslint-disable-next-line no-restricted-syntax
      for (const invoice of selected) {
        const locale = invoice.invoiceLanguage === InvoiceLanguage.HR ? 'hr' : 'en';
        // eslint-disable-next-line no-await-in-loop
        const blob = await pdf(<InvoicePDF invoice={invoice} locale={locale} />).toBlob();
        const safeNumber = invoice.invoiceNumber.replace(/[/\\]/g, '-');

        zip.file(`invoice-${safeNumber}.pdf`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });

      saveAs(zipBlob, `invoices-${yearFilter}-${dayjs().format('YYYY-MM-DD')}.zip`);
    } catch {
      showToast({ status: 'error', text: t('toast-messages.download-selected-failed') });
    } finally {
      setZipping(false);
    }
  };


  return (
    <>
      {selectedInvoice && (
        <Routes>
          <Route
            path=":id"
            element={
              <SingleInvoiceModal
                isOpen={!updateInvoiceModalOpen}
                onClose={closeInvoiceModal}
                onConfirm={toggleUpdateInvoiceModal}
              />
            }
          />
        </Routes>
      )}
      <UpdateInvoiceModal isOpen={updateInvoiceModalOpen} onClose={toggleUpdateInvoiceModal} />
      <MarkAsSentInvoiceModal isOpen={markAsPaidModalOpen} onClose={toggleMarkAsPaidInvoiceModal} />
      <CreateInvoiceModal isOpen={createInvoiceModalOpen} onClose={toggleCreateInvoiceModal} />
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
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'flex-start', md: 'flex-end' }}
            justifyContent="space-between"
            gap={2}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography component="h1" sx={{ fontSize: { xs: 20, sm: 22 }, fontWeight: 800, letterSpacing: '-0.01em' }}>
                {t('common.invoices')}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: bbColors.gray500, mt: 0.5 }}>
                Issued invoices, drafts & sent
              </Typography>
            </Box>
            <Stack direction="row" gap={1}>
              {selectedIds.length > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  disabled={zipping}
                  onClick={handleDownloadSelected}
                  sx={{ textTransform: 'none', fontSize: 12.5, fontWeight: 700, borderColor: bbColors.gray300, color: bbColors.navy900 }}
                >
                  {zipping ? t('actions.preparing-zip') : `${t('actions.download-selected')} (${selectedIds.length})`}
                </Button>
              )}
              <Button
                variant="contained"
                size="small"
                onClick={() => toggleCreateInvoiceModal(true)}
                sx={{
                  textTransform: 'none',
                  fontSize: 12.5,
                  fontWeight: 700,
                  backgroundColor: bbColors.navy900,
                  '&:hover': { backgroundColor: bbColors.navy700 },
                }}
              >
                + {t('actions.newInvoice')}
              </Button>
            </Stack>
          </Stack>

          <Box
            sx={{
              display: 'flex',
              gap: 0.5,
              mb: 1.75,
              backgroundColor: bbColors.white,
              border: `1px solid ${bbColors.gray200}`,
              borderRadius: '10px',
              padding: '4px',
              width: 'fit-content',
              overflowX: 'auto',
              maxWidth: '100%',
            }}
          >
            {/* Year tabs replaced the old All/Draft/Sent strip (Mario
                26.8.2026) — invoices live per calendar year of the invoice
                date; new years appear automatically. Status moved to the
                dropdown in the filter bar below. */}
            {availableYears.map(y => {
              const active = y === yearFilter;


return (
                <Box
                  key={y}
                  onClick={() => {
                    setYearFilter(y);
                    setParam({ year: y === CURRENT_YEAR ? '' : String(y), page: 1 });
                  }}
                  sx={{
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: active ? bbColors.white : bbColors.gray500,
                    backgroundColor: active ? bbColors.navy900 : 'transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {y}
                </Box>
              );
            })}
          </Box>

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
              placeholder="Search contract no., agency, invoice no.…"
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
            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setParam({ invoiceStatus: e.target.value === 'all' ? '' : e.target.value, page: 1 });
              }}
              sx={{
                minWidth: 130,
                '& .MuiOutlinedInput-root': {
                  fontSize: 12,
                  borderRadius: '6px',
                  '& fieldset': { borderColor: bbColors.gray300 },
                },
              }}
            >
              {INVOICE_STATUS_TAB_VALUES.map(v => (
                <MenuItem key={v} value={v} sx={{ fontSize: 12 }}>
                  {t(INVOICE_STATUS_TAB_LABEL_MAP[v])}
                </MenuItem>
              ))}
            </TextField>
            {/* Departure-date filter (Mario 28.8.2026): show only invoices
                whose charter starts on the picked day. */}
            <TextField
              size="small"
              type="date"
              label="Departure"
              value={departureDate || ''}
              onChange={e => setParam({ departureDate: e.target.value, page: 1 })}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{
                minWidth: 150,
                '& .MuiOutlinedInput-root': {
                  fontSize: 12,
                  borderRadius: '6px',
                  '& fieldset': { borderColor: bbColors.gray300 },
                },
              }}
            />
            {departureDate && (
              <Button
                size="small"
                onClick={() => setParam({ departureDate: '', page: 1 })}
                sx={{ textTransform: 'none', fontSize: 11.5, color: bbColors.gray500, minWidth: 0 }}
              >
                ✕ clear
              </Button>
            )}
          </Stack>

          <Box
            sx={{
              backgroundColor: bbColors.white,
              border: `1px solid ${bbColors.gray200}`,
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ overflowX: 'auto' }}>
              <Box component="table" sx={{ width: '100%', minWidth: 920, borderCollapse: 'collapse' }}>
                <Box component="thead">
                  <Box component="tr">
                    <Box
                      component="th"
                      sx={{
                        width: 36,
                        padding: '6px 4px 6px 10px',
                        backgroundColor: bbColors.gray75,
                        borderBottom: `1px solid ${bbColors.gray200}`,
                      }}
                    >
                      <MuiCheckbox
                        size="small"
                        checked={allOnPageSelected}
                        indeterminate={selectedIds.length > 0 && !allOnPageSelected}
                        onChange={toggleSelectAll}
                        sx={{ p: 0.5 }}
                      />
                    </Box>
                    {[
                      { label: 'Invoice', align: 'left', sortKey: 'invoiceNumber' },
                      { label: 'Client', align: 'left' },
                      { label: 'Booking', align: 'left', sortKey: 'contractNumber' },
                      { label: 'Booked', align: 'left', sortKey: 'bookingDate' },
                      { label: 'Charter', align: 'left', sortKey: 'charterDateFrom' },
                      { label: 'Country', align: 'left', sortKey: 'charterCountry' },
                      { label: 'Amount', align: 'right' },
                      { label: 'Issued', align: 'left', sortKey: 'invoiceDate' },
                      { label: 'Status', align: 'left' },
                      { label: '', align: 'right' },
                    ].map((h: { label: string; align: string; sortKey?: string }, i) => {
                      const active = h.sortKey && sortBy === h.sortKey;

                      
return (
                        <Box
                          component="th"
                          key={h.label || `col-${i}`}
                          onClick={
                            h.sortKey
                              ? () =>
                                  setParam({
                                    sortBy: h.sortKey,
                                    sortDirection: active && sortDirection === 'asc' ? 'desc' : 'asc',
                                    page: 1,
                                  })
                              : undefined
                          }
                          sx={{
                            fontSize: 10,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: active ? bbColors.navy900 : bbColors.gray500,
                            fontWeight: 700,
                            padding: '10px 14px',
                            textAlign: h.align as 'left' | 'right',
                            backgroundColor: bbColors.gray75,
                            borderBottom: `1px solid ${bbColors.gray200}`,
                            whiteSpace: 'nowrap',
                            cursor: h.sortKey ? 'pointer' : 'default',
                            userSelect: 'none',
                          }}
                        >
                          {h.label}
                          {active && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
                <Box component="tbody">
                  {isLoading && (
                    <Box component="tr">
                      <Box component="td" colSpan={11} sx={{ padding: '40px 20px', textAlign: 'center', color: bbColors.gray500, fontSize: 13 }}>
                        Loading…
                      </Box>
                    </Box>
                  )}
                  {!isLoading && invoices.length === 0 && (
                    <Box component="tr">
                      <Box component="td" colSpan={11} sx={{ padding: '40px 20px', textAlign: 'center', color: bbColors.gray500, fontSize: 13 }}>
                        No invoices match the current filters.
                      </Box>
                    </Box>
                  )}
                  {!isLoading &&
                    invoices.map(inv => {
                      const pill = bbStatusPill(statusToVariant(inv.invoiceStatus));

                      
return (
                        <Box
                          component="tr"
                          key={inv.id}
                          onClick={() => {
                            // Navigate URL — the `:id` route below match-a samo
                            // kad je u URL-u, i tek tada se SingleInvoiceModal
                            // render-a. Direct store-only call (raniji bug) je
                            // postavljao `selectedInvoice` ali URL ostao na
                            // /invoices, pa modal nije ulazio u DOM.
                            const qs = searchParamsRaw.toString();

                            navigate(`/invoices/${inv.id}${qs ? `?${qs}` : ''}`);
                          }}
                          sx={{
                            cursor: 'pointer',
                            backgroundColor: statusRowTint(inv.invoiceStatus),
                            '&:hover': { backgroundColor: bbColors.gray75 },
                          }}
                        >
                          <Box
                            component="td"
                            onClick={e => e.stopPropagation()}
                            sx={{ padding: '6px 4px 6px 10px', borderBottom: `1px solid ${bbColors.gray100}` }}
                          >
                            <MuiCheckbox
                              size="small"
                              checked={selectedIds.includes(inv.id)}
                              onChange={() => toggleSelected(inv.id)}
                              sx={{ p: 0.5 }}
                            />
                          </Box>
                          <Box component="td" sx={{ ...tdBase, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            {inv.invoiceNumber}
                          </Box>
                          <Box component="td" sx={tdBase}>
                            <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{inv.clientName}</Typography>
                            <Typography sx={{ fontSize: 11, color: bbColors.gray500 }}>{inv.clientEmail}</Typography>
                          </Box>
                          <Box component="td" sx={{ ...tdBase, fontVariantNumeric: 'tabular-nums' }}>
                            {/* Mario's paper contract number — his filing key
                                (e.g. contract 1001105/2026 on invoice
                                100205/2026). Auto invoices carry the
                                reservation number in the same field. */}
                            {inv.contractNumber ?? inv.reservationNumber ?? '—'}
                          </Box>
                          <Box component="td" sx={{ ...tdBase, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: bbColors.gray500 }}>
                            {/* Date the operator issued the booking confirmation
                                — Mario's "when do reservations happen" axis. */}
                            {inv.bookingDate ? dayjs(inv.bookingDate).format('DD MMM YYYY') : '—'}
                          </Box>
                          <Box component="td" sx={{ ...tdBase, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                            {/* Charter period — departure → return. */}
                            {inv.charterDateFrom
                              ? `${dayjs(inv.charterDateFrom).format('DD MMM')} → ${
                                  inv.charterDateTo ? dayjs(inv.charterDateTo).format('DD MMM YYYY') : '…'
                                }`
                              : '—'}
                          </Box>
                          <Box component="td" sx={{ ...tdBase, whiteSpace: 'nowrap' }}>
                            {/* Charter departure country (Croatia / Greece / …). */}
                            {inv.charterCountry ?? '—'}
                          </Box>
                          <Box
                            component="td"
                            sx={{
                              ...tdBase,
                              textAlign: 'right',
                              color: bbColors.green600,
                              fontWeight: 800,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {/* Amount = broker commission on the related
                                booking (mirrors the Bookings listing's
                                COMMISSION column). Falls back to invoice
                                totalPrice for legacy drafts created before
                                the backend started exposing
                                reservationCommission. */}
                            {inv.reservationCommission != null
                              ? `€${formatPrice(inv.reservationCommission)}`
                              : `€${formatPrice(inv.totalPrice)}`}
                          </Box>
                          <Box component="td" sx={{ ...tdBase, color: bbColors.gray500 }}>
                            {DateTime.formatHR(dayjs(inv.invoiceDate))}
                          </Box>
                          <Box component="td" sx={tdBase}>
                            <Box component="span" sx={pill.style}>
                              {pill.label}
                            </Box>
                          </Box>
                          <Box component="td" sx={{ ...tdBase, textAlign: 'right' }}>
                            <Typography component="span" sx={{ color: bbColors.navy700, fontWeight: 700, fontSize: 12 }}>
                              Open →
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                </Box>
              </Box>
            </Box>
          </Box>

        </Box>
      </Layout>
    </>
  );
};

const tdBase = {
  padding: '12px 14px',
  fontSize: 12.5,
  borderBottom: `1px solid ${bbColors.gray100}`,
  color: '#2c3e56',
  whiteSpace: 'nowrap' as const,
};

export default Invoices;
