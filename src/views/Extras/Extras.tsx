/* eslint-disable @typescript-eslint/no-use-before-define */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';

import Layout from '@/components/Layout';
import { PAGE_NUMBER, PAGE_SIZE } from '@/config/constants.config';
import { bbColors, bbFont } from '@/styles/bb';
import useQueryParams from '@/utils/hooks/useQueryParams';
import { getExtras } from '@/valtio/extras/extras.actions';
import { useExtrasStore } from '@/valtio/extras/extras.store';

/**
 * Extras catalogue — Broker Desk redesign.
 *
 * Backend ExtrasModel is the label-normalisation registry (labelCode +
 * matchKeys), not the yacht-level price/usage data the handoff
 * mockup implies. Columns are accordingly simpler: Label · Match keys
 * · filterOrder. Richer price/usage/trend columns ship with a future
 * `yacht_extras` admin endpoint.
 */

const Extras = () => {
  const { t } = useTranslation();
  const { params: queryParams, handlePageChange, setParam } = useQueryParams();
  const { search, page, sortBy, sortDirection } = queryParams;

  const [searchInput, setSearchInput] = useState<string>(search || '');

  const { isLoading, extras, totalCount } = useExtrasStore();

  useEffect(() => {
    const pageNumber = page - PAGE_NUMBER;

    getExtras(pageNumber, search, sortBy, sortDirection);
  }, [page, search, sortBy, sortDirection]);

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') setParam({ search: searchInput, page: 1 });
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
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
              {t('common.extras', 'Extras')}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: bbColors.gray500, mt: 0.5 }}>
              Canonical extras catalogue — normalises partner-specific names
            </Typography>
          </Box>
        </Stack>

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
            placeholder="Search label code or match keys…"
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
            <Box component="table" sx={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
              <Box component="thead">
                <Box component="tr">
                  {['Label', 'Match keys', 'Order'].map((h, i) => (
                    <Box
                      component="th"
                      key={h}
                      sx={{
                        fontSize: 10,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: bbColors.gray500,
                        fontWeight: 700,
                        padding: '10px 14px',
                        textAlign: i === 2 ? 'right' : 'left',
                        backgroundColor: bbColors.gray75,
                        borderBottom: `1px solid ${bbColors.gray200}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {isLoading && (
                  <Box component="tr">
                    <Box component="td" colSpan={3} sx={{ padding: '40px 20px', textAlign: 'center', color: bbColors.gray500, fontSize: 13 }}>
                      Loading…
                    </Box>
                  </Box>
                )}
                {!isLoading && extras.length === 0 && (
                  <Box component="tr">
                    <Box component="td" colSpan={3} sx={{ padding: '40px 20px', textAlign: 'center', color: bbColors.gray500, fontSize: 13 }}>
                      No extras in the catalogue yet.
                    </Box>
                  </Box>
                )}
                {!isLoading &&
                  extras.map(ex => (
                    <Box component="tr" key={ex.id} sx={{ '&:hover': { backgroundColor: bbColors.gray75 } }}>
                      <Box component="td" sx={{ ...tdBase, fontWeight: 700 }}>
                        {t(`extras.${ex.labelCode}`, ex.labelCode)}
                        <Typography sx={{ fontSize: 11, color: bbColors.gray500, fontWeight: 500, mt: 0.25 }}>
                          {ex.labelCode}
                        </Typography>
                      </Box>
                      <Box component="td" sx={{ ...tdBase, color: bbColors.gray500 }}>
                        {ex.matchKeys || '—'}
                      </Box>
                      <Box component="td" sx={{ ...tdBase, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {ex.filterOrder ?? '—'}
                      </Box>
                    </Box>
                  ))}
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
  );
};

const tdBase = {
  padding: '12px 14px',
  fontSize: 12.5,
  borderBottom: `1px solid ${bbColors.gray100}`,
  color: '#2c3e56',
  whiteSpace: 'nowrap' as const,
};

export default Extras;
