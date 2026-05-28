/* eslint-disable @typescript-eslint/no-use-before-define */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Route, Routes, useParams } from 'react-router-dom';

import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material';

import Layout from '@/components/Layout';
import { PAGE_NUMBER } from '@/config/constants.config';
import {
  AGENCY_PRIMARY_SOURCE_ARRAY,
  AGENCY_PRIMARY_SOURCE_LABEL_MAP,
} from '@/models/agencies.model';
import AgenciesService from '@/services/agencies.service';
import { bbColors, bbFont, bbStatusPill } from '@/styles/bb';
import useQueryParams from '@/utils/hooks/useQueryParams';
import { getAgencies, getSelectedAgency, toggleUpdateAgencyModal } from '@/valtio/agencies/agencies.actions';
import { useAgenciesStore } from '@/valtio/agencies/agencies.store';

import AgencyModal from './partials/AgencyModal';
import UpdateAgencyModal from './partials/UpdateAgencyModal';
import useAgenciesView from './useAgenciesView';

// Agencies list uses a bigger page than the standard admin PAGE_SIZE (20)
// so the broker sees the whole partner fleet in just a couple of pages.
const {AGENCIES_PAGE_SIZE} = AgenciesService;

/**
 * Agencies list — Broker Desk redesign.
 *
 * 3-column card grid per handoff: navy logo tile (yellow initials) +
 * name + country + primary-source pill in header, 2×2 stat grid
 * (Discount / Source / Bypass / Status). Fleet count + bookings YTD +
 * commission range + rating fields from the prototype aren't surfaced
 * by the backend yet — add when those endpoints land.
 */

const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  
return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase() || '?';
};

const Agencies = () => {
  const { t } = useTranslation();
  const { params: queryParams, handlePageChange, setParam } = useQueryParams();
  const { search, page, sortBy, sortDirection, country, source } = queryParams;

  const [sourceFilter, setSourceFilter] = useState<string>(source || 'all');
  const [searchInput, setSearchInput] = useState<string>(search || '');
  // Debounced search — same UX as Bookings: typing is immediate on
  // the input, but the actual list fetch waits 350ms so a single query
  // doesn't fire per keystroke. URL stays clean; only explicit filters
  // (country, source, page) go into the URL.
  const [debouncedSearch, setDebouncedSearch] = useState<string>(search || '');

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);

    
return () => window.clearTimeout(id);
  }, [searchInput]);

  const { isLoading, selectedAgency, agencies, totalCount, updateAgencyModalOpen } = useAgenciesStore();
  const { selectAgency, closeAgencyModal } = useAgenciesView();

  const params = useParams();
  const id = params['*'];

  useEffect(() => {
    if (!id) return;

    getSelectedAgency(Number(id));
  }, [id]);

  useEffect(() => {
    const pageNumber = page - PAGE_NUMBER;
    const countryParam = country || '';
    const sourceParam = sourceFilter === 'all' ? '' : sourceFilter;

    getAgencies(pageNumber, debouncedSearch || undefined, sortBy, sortDirection, countryParam, sourceParam);
  }, [country, page, sortBy, sortDirection, sourceFilter, debouncedSearch]);

  const clearSearch = () => setSearchInput('');

  const totalPages = Math.max(1, Math.ceil(totalCount / AGENCIES_PAGE_SIZE));

  return (
    <>
      {selectedAgency && (
        <Routes>
          <Route
            path=":id"
            element={
              <AgencyModal
                isOpen={!updateAgencyModalOpen}
                onClose={closeAgencyModal}
                onConfirm={toggleUpdateAgencyModal}
              />
            }
          />
        </Routes>
      )}
      <UpdateAgencyModal isOpen={updateAgencyModalOpen} onClose={toggleUpdateAgencyModal} />
      <Layout>
        <Box
          sx={{
            backgroundColor: bbColors.gray50,
            minHeight: '100vh',
            fontFamily: bbFont.stack,
            color: bbColors.navy900,
            pt: '74px',
            pb: 10,
            px: { xs: 2, sm: 3 },
            // Layout's <main> is `display: flex; flex-direction: column`
            // so flex-shrink (default 1) compresses this wrapper when its
            // content is taller than the viewport, and the `pb` padding
            // gets eaten. Pinning flex-shrink to 0 preserves the bottom
            // padding so pagination always has breathing room.
            flexShrink: 0,
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
                {t('common.agencies', 'Agencies')}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: bbColors.gray500, mt: 0.5 }}>
                Charter partners supplying our fleet
              </Typography>
            </Box>
          </Stack>

          {/* Source tabs — quick switch between All / MMK / NauSys */}
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
            {['all', ...AGENCY_PRIMARY_SOURCE_ARRAY].map(v => {
              const active = v === sourceFilter;
              const label =
                v === 'all'
                  ? t('common.all')
                  : t(
                      AGENCY_PRIMARY_SOURCE_LABEL_MAP[
                        v as keyof typeof AGENCY_PRIMARY_SOURCE_LABEL_MAP
                      ]
                    );

              
return (
                <Box
                  key={v}
                  onClick={() => {
                    setSourceFilter(v);
                    setParam({ source: v === 'all' ? '' : v, page: 1 });
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
                  {label}
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
              placeholder="Search agency name, country…"
              size="small"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              sx={{
                flex: 1,
                minWidth: 240,
                '& .MuiOutlinedInput-root': {
                  fontSize: 12,
                  borderRadius: '6px',
                  '& fieldset': { borderColor: bbColors.gray300 },
                },
              }}
              slotProps={{
                input: {
                  endAdornment: searchInput ? (
                    <IconButton
                      size="small"
                      onClick={clearSearch}
                      aria-label="Clear search"
                      sx={{ color: bbColors.gray500, p: 0.25 }}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  ) : null,
                },
              }}
            />
          </Stack>

          {/* Card grid */}
          {isLoading && (
            <Box sx={{ padding: '40px 20px', textAlign: 'center', color: bbColors.gray500, fontSize: 13 }}>Loading…</Box>
          )}
          {!isLoading && agencies.length === 0 && (
            <Box
              sx={{
                backgroundColor: bbColors.white,
                border: `1px solid ${bbColors.gray200}`,
                borderRadius: '10px',
                padding: '40px 20px',
                textAlign: 'center',
                color: bbColors.gray500,
                fontSize: 13,
              }}
            >
              No agencies match the current filters.
            </Box>
          )}
          {!isLoading && agencies.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 1.5,
                mb: 4,
              }}
            >
              {agencies.map(a => {
                const statusPill = bbStatusPill(a.active ? 'active' : 'cancelled');

                
return (
                  <Box
                    key={a.id}
                    data-id={a.id}
                    onClick={selectAgency}
                    sx={{
                      backgroundColor: bbColors.white,
                      border: `1px solid ${bbColors.gray200}`,
                      borderRadius: '10px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      '&:hover': { borderColor: bbColors.navy700 },
                    }}
                  >
                    {/* Header — logo + name + status */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      gap={1.25}
                      sx={{ p: '12px 16px', borderBottom: `1px solid ${bbColors.gray100}` }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '8px',
                          background: `linear-gradient(135deg, ${bbColors.navy700}, ${bbColors.navy900})`,
                          color: bbColors.yellow500,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: '-0.02em',
                          flexShrink: 0,
                        }}
                      >
                        {initialsOf(a.name)}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: bbColors.navy900, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {a.name}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: bbColors.gray500 }}>
                          {a.country || '—'} · #{a.id}
                        </Typography>
                      </Box>
                      <Box component="span" sx={statusPill.style}>
                        {a.active ? statusPill.label : t('common.blacklisted')}
                      </Box>
                    </Stack>

                    {/* 2×2 stat grid */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 0,
                        '& > div': {
                          padding: '10px 16px',
                          borderRight: `1px solid ${bbColors.gray100}`,
                          borderBottom: `1px solid ${bbColors.gray100}`,
                        },
                        '& > div:nth-of-type(2n)': { borderRight: 'none' },
                        '& > div:nth-last-of-type(-n+2)': { borderBottom: 'none' },
                      }}
                    >
                      <Box>
                        <Typography sx={statLabel}>Source</Typography>
                        <Typography sx={statValue}>
                          {t(AGENCY_PRIMARY_SOURCE_LABEL_MAP[a.primarySource], a.primarySource)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={statLabel}>Discount</Typography>
                        <Typography sx={statValue}>
                          {a.discount != null ? `${a.discount}%` : '—'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={statLabel}>By-pass</Typography>
                        <Typography sx={statValue}>{a.skipExternalSystem ? t('common.yes') : t('common.no')}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={statLabel}>Contact</Typography>
                        <Typography sx={{ ...statValue, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {a.email || a.phone || '—'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Footer link */}
                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      sx={{ p: '10px 16px', borderTop: `1px solid ${bbColors.gray100}` }}
                    >
                      <Typography
                        component="span"
                        sx={{ color: bbColors.navy700, fontWeight: 700, fontSize: 12 }}
                      >
                        Open profile →
                      </Typography>
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          )}

          {totalCount > AGENCIES_PAGE_SIZE && (
            <Stack direction="row" alignItems="center" justifyContent="center" gap={2} sx={{ mt: 4 }}>
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

const statLabel = {
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: bbColors.gray500,
  fontWeight: 700,
};

const statValue = {
  fontSize: 12.5,
  fontWeight: 700,
  color: bbColors.navy900,
  mt: 0.25,
};

export default Agencies;
