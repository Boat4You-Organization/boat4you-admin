/* eslint-disable @typescript-eslint/no-use-before-define */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import dayjs from 'dayjs';

import Layout from '@/components/Layout';
import { PAGE_NUMBER, PAGE_SIZE } from '@/config/constants.config';
import {
  INVOICE_STATUS_TAB_LABEL_MAP,
  INVOICE_STATUS_TAB_VALUES,
  InvoiceStatus,
} from '@/models/invoices.model';
import { bbColors, bbFont, bbStatusPill } from '@/styles/bb';
import useQueryParams from '@/utils/hooks/useQueryParams';
import DateTime from '@/utils/static/DateTime';
import { formatPrice } from '@/utils/static/formatNumber';
import {
  getInvoices,
  getSelectedInvoice,
  toggleMarkAsPaidInvoiceModal,
  toggleUpdateInvoiceModal,
} from '@/valtio/invoices/invoices.actions';
import { useInvoicesStore } from '@/valtio/invoices/invoices.store';

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

const statusToVariant = (s: InvoiceStatus): string =>
  s === InvoiceStatus.SENT ? 'pending' : 'draft';

const Invoices = () => {
  const { t } = useTranslation();
  const { params: queryParams, handlePageChange, setParam } = useQueryParams();
  const { search, page, sortBy, sortDirection, invoiceStatus } = queryParams;

  const [statusFilter, setStatusFilter] = useState<string>(invoiceStatus || INVOICE_STATUS_TAB_VALUES[0]);
  const [searchInput, setSearchInput] = useState<string>(search || '');

  const { isLoading, invoices, selectedInvoice, totalCount, updateInvoiceModalOpen, markAsPaidModalOpen } =
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
    const pageNumber = page - PAGE_NUMBER;
    const status = (statusFilter === 'all' ? '' : statusFilter) as InvoiceStatus;

    getInvoices(pageNumber, sortBy, sortDirection, status, search);
  }, [page, sortBy, sortDirection, statusFilter, search]);

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') setParam({ search: searchInput, page: 1 });
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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
            {INVOICE_STATUS_TAB_VALUES.map(v => {
              const active = v === statusFilter;

              
return (
                <Box
                  key={v}
                  onClick={() => {
                    setStatusFilter(v);
                    setParam({ invoiceStatus: v === 'all' ? '' : v, page: 1 });
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
                  }}
                >
                  {t(INVOICE_STATUS_TAB_LABEL_MAP[v])}
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
              placeholder="Search invoice, client, booking…"
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
                    {[
                      { label: 'Invoice', align: 'left' },
                      { label: 'Client', align: 'left' },
                      { label: 'Booking', align: 'left' },
                      { label: 'Amount', align: 'right' },
                      { label: 'Issued', align: 'left' },
                      { label: 'Status', align: 'left' },
                      { label: '', align: 'right' },
                    ].map((h, i) => (
                      <Box
                        component="th"
                        key={h.label || `col-${i}`}
                        sx={{
                          fontSize: 10,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: bbColors.gray500,
                          fontWeight: 700,
                          padding: '10px 14px',
                          textAlign: h.align as 'left' | 'right',
                          backgroundColor: bbColors.gray75,
                          borderBottom: `1px solid ${bbColors.gray200}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h.label}
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {isLoading && (
                    <Box component="tr">
                      <Box component="td" colSpan={7} sx={{ padding: '40px 20px', textAlign: 'center', color: bbColors.gray500, fontSize: 13 }}>
                        Loading…
                      </Box>
                    </Box>
                  )}
                  {!isLoading && invoices.length === 0 && (
                    <Box component="tr">
                      <Box component="td" colSpan={7} sx={{ padding: '40px 20px', textAlign: 'center', color: bbColors.gray500, fontSize: 13 }}>
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
                          sx={{ cursor: 'pointer', '&:hover': { backgroundColor: bbColors.gray75 } }}
                        >
                          <Box component="td" sx={{ ...tdBase, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            {inv.invoiceNumber}
                          </Box>
                          <Box component="td" sx={tdBase}>
                            <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{inv.clientName}</Typography>
                            <Typography sx={{ fontSize: 11, color: bbColors.gray500 }}>{inv.clientEmail}</Typography>
                          </Box>
                          <Box component="td" sx={{ ...tdBase, fontVariantNumeric: 'tabular-nums' }}>
                            {inv.reservationNumber ?? '—'}
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

          {totalCount > PAGE_SIZE && (
            <Stack direction="row" alignItems="center" justifyContent="center" gap={2} sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                disabled={page <= PAGE_NUMBER}
                onClick={() => handlePageChange(page - 1)}
                sx={{ textTransform: 'none', fontSize: 12, borderColor: bbColors.gray300, color: bbColors.navy900 }}
              >
                ← Prev
              </Button>
              <Typography sx={{ fontSize: 12, color: bbColors.gray500 }}>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </Typography>
              <Button
                variant="outlined"
                size="small"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                sx={{ textTransform: 'none', fontSize: 12, borderColor: bbColors.gray300, color: bbColors.navy900 }}
              >
                Next →
              </Button>
            </Stack>
          )}
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
