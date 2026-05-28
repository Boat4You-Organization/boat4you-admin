/* eslint-disable @typescript-eslint/no-use-before-define, react/no-unescaped-entities */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import dayjs from 'dayjs';

import Layout from '@/components/Layout';
import { PAGE_NUMBER, PAGE_SIZE } from '@/config/constants.config';
import { InquiriesStatus } from '@/models/inquiries.model';
import { bbColors, bbFont, bbStatusPill } from '@/styles/bb';
import useQueryParams from '@/utils/hooks/useQueryParams';
import { getInquiries, getSelectedInquiry, toggleChangeInquiryStatusModal } from '@/valtio/inquiries/inquiries.actions';
import { useInquiriesStore } from '@/valtio/inquiries/inquiries.store';

import StatusInquiryModal from './partials/StatusInquiryModal';

/**
 * Inquiries list — Broker Desk redesign.
 *
 * Mirrors the handoff prototype: PageHead + pill TabGroup + FilterBar +
 * card-wrapped table. Backend currently only supports NEW / ANSWERED /
 * ARCHIVED, so the tab set is scoped to those + All — the "Offer sent"
 * / "Closed" variants from the design wait for backend status expansion.
 *
 * Per-row identity column uses the initials avatar + name + email (no
 * country today — backend InquiryBasicDto doesn't carry a country
 * field; add once the detail endpoint surfaces one). "Open →" link
 * navigates to the single-inquiry detail route.
 */

// Simple relative-time helper — keeps this module dependency-free.
const formatReceived = (iso: string): string => {
  if (!iso) return '—';

  const t = dayjs(iso);

  if (!t.isValid()) return iso;

  const diffMin = dayjs().diff(t, 'minute');

  if (diffMin < 1) return 'just now';

  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = dayjs().diff(t, 'hour');

  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = dayjs().diff(t, 'day');

  if (diffDay < 7) return `${diffDay}d ago`;

  
return t.format('DD MMM YYYY');
};

const formatPeriod = (from?: string, to?: string): string => {
  if (!from || !to) return '—';

  const f = dayjs(from);
  const t = dayjs(to);

  if (!f.isValid() || !t.isValid()) return '—';

  
return `${f.format('DD MMM')} – ${t.format('DD MMM YYYY')}`;
};

const initialsOf = (name?: string, surname?: string): string =>
  `${(name?.[0] ?? '').toUpperCase()}${(surname?.[0] ?? '').toUpperCase()}` || '?';

type TabId = 'all' | InquiriesStatus;

const TABS: { id: TabId; labelKey: string }[] = [
  { id: 'all', labelKey: 'common.all' },
  { id: InquiriesStatus.NEW, labelKey: 'common.new' },
  { id: InquiriesStatus.ANSWERED, labelKey: 'common.answered' },
  { id: InquiriesStatus.ARCHIVED, labelKey: 'common.archived' },
];

// Map backend statuses to the handoff's StatusPill variants.
const statusToVariant = (s: InquiriesStatus): string => {
  switch (s) {
    case InquiriesStatus.NEW:
      return 'new';
    case InquiriesStatus.ANSWERED:
      return 'replied';
    case InquiriesStatus.ARCHIVED:
      return 'lost';
    default:
      return 'draft';
  }
};

const Inquiries = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const id = params['*'];

  const { params: queryParams, handleSearch, handlePageChange } = useQueryParams();
  const { search, page, sortBy, sortDirection } = queryParams;

  const { isLoading, inquiries, totalCount, openCount, changeInquiryStatusModalOpen } = useInquiriesStore();
  const [tab, setTab] = useState<TabId>('all');
  const [searchInput, setSearchInput] = useState<string>(search || '');

  useEffect(() => {
    if (!id) return;

    getSelectedInquiry(Number(id));
  }, [id]);

  useEffect(() => {
    const pageNumber = page - PAGE_NUMBER;
    const status = tab === 'all' ? undefined : (tab as InquiriesStatus);

    getInquiries(pageNumber, search, sortBy, sortDirection, status);
  }, [tab, page, search, sortBy, sortDirection]);

  const tabCounts = useMemo(
    () => ({
      all: totalCount,
      [InquiriesStatus.NEW]: openCount,
      [InquiriesStatus.ANSWERED]: undefined,
      [InquiriesStatus.ARCHIVED]: undefined,
    }),
    [totalCount, openCount]
  );

  const openInquiry = (inquiryId: number) => {
    navigate(`/inquiries/${inquiryId}?${searchParams.toString()}`);
  };

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch(searchInput);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <>
      <StatusInquiryModal isOpen={changeInquiryStatusModalOpen} onClose={toggleChangeInquiryStatusModal} />
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
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'flex-start', md: 'flex-end' }}
            justifyContent="space-between"
            gap={2}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography component="h1" sx={{ fontSize: { xs: 20, sm: 22 }, fontWeight: 800, letterSpacing: '-0.01em' }}>
                {t('common.inquiries')}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: bbColors.gray500, mt: 0.5 }}>
                Incoming charter requests from customer site & partners
              </Typography>
            </Box>
            {/* Placeholder actions — wire to export + manual log endpoints later. */}
            <Stack direction="row" gap={1} sx={{ flexShrink: 0 }}>
              <Button
                disabled
                sx={{
                  backgroundColor: bbColors.white,
                  color: bbColors.navy900,
                  border: `1px solid ${bbColors.gray300}`,
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: bbColors.gray75 },
                }}
              >
                Export
              </Button>
              <Button
                disabled
                sx={{
                  backgroundColor: bbColors.yellow500,
                  color: bbColors.yellowText,
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  textTransform: 'none',
                  boxShadow: '0 4px 10px -4px rgba(255,210,74,0.5)',
                  '&.Mui-disabled': { backgroundColor: '#fce8a3', color: bbColors.yellowText, boxShadow: 'none' },
                }}
              >
                + Log inquiry
              </Button>
            </Stack>
          </Stack>

          {/* Tabs — pill group */}
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
            {TABS.map(tb => {
              const active = tb.id === tab;
              const count = tabCounts[tb.id as keyof typeof tabCounts];

              
return (
                <Box
                  key={tb.id}
                  onClick={() => setTab(tb.id)}
                  sx={{
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: active ? bbColors.white : bbColors.gray500,
                    backgroundColor: active ? bbColors.navy900 : 'transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                >
                  {t(tb.labelKey)}
                  {count !== undefined && (
                    <Box
                      component="span"
                      sx={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 999,
                        backgroundColor: active ? bbColors.yellow500 : '#eef3f9',
                        color: active ? bbColors.yellowText : bbColors.navy700,
                        fontWeight: 800,
                      }}
                    >
                      {count}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>

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
              placeholder="Search client, yacht, ID…"
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
              <Box component="table" sx={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
                <Box component="thead">
                  <Box component="tr">
                    {[
                      { label: 'ID', align: 'left' },
                      { label: 'Client', align: 'left' },
                      { label: 'Yacht', align: 'left' },
                      { label: 'Period', align: 'left' },
                      { label: 'Status', align: 'left' },
                      { label: 'Received', align: 'left' },
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
                  {!isLoading && inquiries.length === 0 && (
                    <Box component="tr">
                      <Box component="td" colSpan={7} sx={{ padding: '40px 20px', textAlign: 'center', color: bbColors.gray500, fontSize: 13 }}>
                        No inquiries yet. They'll appear here as customers submit the boat detail form.
                      </Box>
                    </Box>
                  )}
                  {!isLoading &&
                    inquiries.map(iq => {
                      const pill = bbStatusPill(statusToVariant(iq.status));
                      // "Hot" heuristic could live here — for now the row is
                      // always white; the styling hook stays so we can flip
                      // it on when a hot-flag endpoint lands.
                      const rowBg = bbColors.white;

                      
return (
                        <Box
                          component="tr"
                          key={iq.id}
                          onClick={() => openInquiry(iq.id)}
                          sx={{ backgroundColor: rowBg, cursor: 'pointer', '&:hover': { backgroundColor: bbColors.gray75 } }}
                        >
                          <Box component="td" sx={{ ...tdBase, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            INQ-{String(iq.id).padStart(4, '0')}
                          </Box>
                          <Box component="td" sx={tdBase}>
                            <Stack direction="row" alignItems="center" gap={1.25}>
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  background: `linear-gradient(135deg, ${bbColors.navy700}, ${bbColors.navy900})`,
                                  color: '#fff',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 10,
                                  fontWeight: 800,
                                  flexShrink: 0,
                                }}
                              >
                                {initialsOf(iq.name, iq.surname)}
                              </Box>
                              <Box>
                                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: bbColors.navy900 }}>
                                  {[iq.name, iq.surname].filter(Boolean).join(' ') || '—'}
                                </Typography>
                                <Typography sx={{ fontSize: 11, color: bbColors.gray500 }}>
                                  {iq.email}
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>
                          <Box component="td" sx={tdBase}>
                            {iq.yachtName || '—'}
                          </Box>
                          <Box component="td" sx={{ ...tdBase, fontVariantNumeric: 'tabular-nums' }}>
                            {formatPeriod(iq.dateFrom, iq.dateTo)}
                          </Box>
                          <Box component="td" sx={tdBase}>
                            <Box component="span" sx={pill.style}>
                              {t(`common.${iq.status.toLowerCase()}`, pill.label)}
                            </Box>
                          </Box>
                          <Box component="td" sx={{ ...tdBase, color: bbColors.gray500 }}>
                            {formatReceived(iq.createdAt)}
                          </Box>
                          <Box component="td" sx={{ ...tdBase, textAlign: 'right' }}>
                            <Typography
                              component="span"
                              sx={{ color: bbColors.navy700, fontWeight: 700, fontSize: 12 }}
                            >
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

          {/* Pagination */}
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

export default Inquiries;
