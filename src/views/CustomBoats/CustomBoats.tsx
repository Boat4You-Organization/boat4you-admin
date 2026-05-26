import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';

import FlagIcon from '@/components/FlagIcon';
import Layout from '@/components/Layout';
import EditIcon from '@/components/SvgIcons/Edit';
import TrashIcon from '@/components/SvgIcons/Trash';
import { PAGE_NUMBER, PAGE_SIZE } from '@/config/constants.config';
import { bbColors, bbFont } from '@/styles/bb';
import useQueryParams from '@/utils/hooks/useQueryParams';
import { formatPrice } from '@/utils/static/formatNumber';
import {
  findCustomYacht,
  getCustomYachts,
  toggleCreateCustomYachtModal,
  toggleDeleteCustomYachtModal,
  toggleUpdateCustomYachtModal,
} from '@/valtio/customYachts/customYachts.actions';
import { useCustomYachtsStore } from '@/valtio/customYachts/customYachts.store';

import CreateCustomBoatsModal from './partials/CreateCustomBoatsModal';
import DeleteCustomBoatModal from './partials/DeleteCustomBoatModal';
import UpdateCustomBoatsModal from './partials/UpdateCustomBoatsModal';
import useCustomBoatView from './useCustomBoatView';

/**
 * Custom boats — Broker Desk redesign.
 *
 * Card grid (1-col mobile, 2-col desktop) matching the handoff:
 * each card = navy gradient tile with yellow ⛵ + details on the right
 * (name, country, low-price, Manage link).
 */

const CustomBoats = () => {
  const { t } = useTranslation();
  const { params: queryParams, handleSearch, handlePageChange } = useQueryParams();
  const { search, page, sortBy, sortDirection } = queryParams;

  const [searchInput, setSearchInput] = useState<string>(search || '');

  const {
    isLoading,
    customYachts,
    totalCount,
    createCustomYachtModalOpen,
    updateCustomYachtModalOpen,
    deleteCustomYachtModalOpen,
  } = useCustomYachtsStore();
  const { selectCustomYacht } = useCustomBoatView();

  useEffect(() => {
    const pageNumber = page - PAGE_NUMBER;
    getCustomYachts(pageNumber, search, sortBy, sortDirection);
  }, [page, search, sortBy, sortDirection]);

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch(searchInput);
  };

  // Card-level click opens the customer-site preview (selectCustomYacht).
  // Edit / Delete buttons sit inside the same card, so we stop propagation
  // here — without it, both the card open AND the modal would fire.
  const handleEditCard = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    findCustomYacht(String(index));
    toggleUpdateCustomYachtModal(true);
  };

  const handleDeleteCard = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    findCustomYacht(String(index));
    toggleDeleteCustomYachtModal(true);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <>
      <CreateCustomBoatsModal isOpen={createCustomYachtModalOpen} onClose={toggleCreateCustomYachtModal} />
      <UpdateCustomBoatsModal isOpen={updateCustomYachtModalOpen} onClose={toggleUpdateCustomYachtModal} />
      <DeleteCustomBoatModal isOpen={deleteCustomYachtModalOpen} onClose={toggleDeleteCustomYachtModal} />
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
                {t('common.customBoats', 'Custom boats')}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: bbColors.gray500, mt: 0.5 }}>
                Yachts managed outside partner catalogues
              </Typography>
            </Box>
            <Stack direction="row" gap={1} sx={{ flexShrink: 0 }}>
              <Button
                onClick={() => toggleCreateCustomYachtModal(true)}
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
                  '&:hover': { backgroundColor: '#ffca2e', boxShadow: '0 4px 10px -4px rgba(255,210,74,0.5)' },
                }}
              >
                + New custom boat
              </Button>
            </Stack>
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
              placeholder="Search model, name, country…"
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

          {/* Card grid */}
          {isLoading && (
            <Box sx={{ padding: '40px 20px', textAlign: 'center', color: bbColors.gray500, fontSize: 13 }}>Loading…</Box>
          )}
          {!isLoading && customYachts.length === 0 && (
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
              No custom boats yet. Click "+ New custom boat" to add the first one.
            </Box>
          )}
          {!isLoading && customYachts.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 1.5,
              }}
            >
              {customYachts.map((cy, i) => (
                <Stack
                  key={cy.id}
                  direction="row"
                  data-id={cy.id}
                  onClick={selectCustomYacht}
                  sx={{
                    backgroundColor: bbColors.white,
                    border: `1px solid ${bbColors.gray200}`,
                    borderRadius: '10px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover': { borderColor: bbColors.navy700 },
                  }}
                >
                  {/* Navy gradient tile with yellow boat icon */}
                  <Box
                    sx={{
                      width: 110,
                      flexShrink: 0,
                      background: `linear-gradient(135deg, ${bbColors.navy700}, ${bbColors.navy900})`,
                      color: bbColors.yellow500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 42,
                    }}
                  >
                    ⛵
                  </Box>
                  <Stack sx={{ flex: 1, p: '14px 16px', minWidth: 0 }} gap={0.75}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: bbColors.navy900 }}>
                      {cy.modelName} · {cy.name}
                    </Typography>
                    <Stack direction="row" alignItems="center" gap={0.75} sx={{ color: bbColors.gray500, fontSize: 11 }}>
                      <FlagIcon countryCode={cy.countryCode} />
                      <Typography sx={{ fontSize: 11, color: bbColors.gray500 }}>
                        {cy.countryName || '—'}
                      </Typography>
                    </Stack>
                    <Stack direction="row" gap={0.5} flexWrap="wrap">
                      <Box sx={pillStyle}>
                        <Box component="span" sx={{ color: bbColors.gray500 }}>Low</Box>{' '}
                        <Box component="span" sx={{ fontWeight: 800 }}>
                          €{formatPrice(cy.lowPrice || 0)}
                        </Box>
                      </Box>
                      <Box sx={{ ...pillStyle, backgroundColor: bbColors.amber100, color: '#8a6d00' }}>
                        EXCLUSIVE
                      </Box>
                    </Stack>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mt: 0.5, pt: 1, borderTop: `1px solid ${bbColors.gray100}` }}
                    >
                      <Typography sx={{ fontSize: 11, color: bbColors.gray500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Slug: {cy.slug}
                      </Typography>
                      <Stack direction="row" gap={0.5} sx={{ flexShrink: 0 }}>
                        <Tooltip title={t('actions.edit')} arrow>
                          <IconButton
                            size="small"
                            onClick={e => handleEditCard(e, i)}
                            sx={{
                              color: bbColors.navy700,
                              backgroundColor: bbColors.gray100,
                              padding: '6px',
                              borderRadius: '6px',
                              '&:hover': { backgroundColor: bbColors.gray200 },
                            }}
                          >
                            <EditIcon size={14} fill={bbColors.navy700} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('actions.delete')} arrow>
                          <IconButton
                            size="small"
                            onClick={e => handleDeleteCard(e, i)}
                            sx={{
                              color: bbColors.red600,
                              backgroundColor: bbColors.red100,
                              padding: '6px',
                              borderRadius: '6px',
                              '&:hover': { backgroundColor: '#fbd9d2' },
                            }}
                          >
                            <TrashIcon size={14} fill={bbColors.red600} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Stack>
                </Stack>
              ))}
            </Box>
          )}

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

const pillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  padding: '3px 8px',
  borderRadius: 999,
  backgroundColor: bbColors.gray100,
  fontSize: 10.5,
  fontWeight: 700,
  color: bbColors.navy900,
  letterSpacing: '0.02em',
};

export default CustomBoats;
