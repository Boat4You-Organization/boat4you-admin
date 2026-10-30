/* eslint-disable @typescript-eslint/no-use-before-define, react/no-unescaped-entities */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';

import FlagIcon from '@/components/FlagIcon';
import Layout from '@/components/Layout';
import EditIcon from '@/components/SvgIcons/Edit';
import TrashIcon from '@/components/SvgIcons/Trash';
import { PAGE_NUMBER, PAGE_SIZE } from '@/config/constants.config';
import { bbCardSx, bbColors, bbFont, bbTagStyles } from '@/styles/bb';
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
              <Typography
                component="h1"
                sx={{ fontSize: { xs: 20, sm: 22 }, fontWeight: 800, letterSpacing: '-0.01em' }}
              >
                {t('common.customBoats', 'Custom boats')}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: bbColors.gray500, mt: 0.5 }}>
                Yachts managed outside partner catalogues
              </Typography>
            </Box>
            <Stack direction="row" gap={1} sx={{ flexShrink: 0 }}>
              <Button onClick={() => toggleCreateCustomYachtModal(true)}>+ New custom boat</Button>
            </Stack>
          </Stack>

          {/* Filter bar */}
          <Stack
            direction="row"
            gap={1}
            sx={{
              ...bbCardSx,
              padding: '10px',
              mb: 1.5,
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
              sx={{ flex: 1, minWidth: 240 }}
            />
          </Stack>

          {/* Card grid */}
          {isLoading && (
            <Box
              sx={{ padding: '28px 20px', textAlign: 'center', color: bbColors.gray500, fontSize: 14, fontWeight: 600 }}
            >
              Loading…
            </Box>
          )}
          {!isLoading && customYachts.length === 0 && (
            <Box
              sx={{
                ...bbCardSx,
                padding: '28px 20px',
                textAlign: 'center',
                color: bbColors.navy900,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              No custom boats yet. Click "+ New custom boat" to add the first one.
            </Box>
          )}
          {!isLoading && customYachts.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  md: 'repeat(3, minmax(0, 1fr))',
                  xl: 'repeat(4, minmax(0, 1fr))',
                },
                gap: 1.5,
              }}
            >
              {customYachts.map((cy, i) => (
                <Stack
                  key={cy.id}
                  data-id={cy.id}
                  onClick={selectCustomYacht}
                  sx={{
                    ...bbCardSx,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'border-color .15s',
                    '&:hover': { borderColor: bbColors.gray450 },
                  }}
                >
                  {/* 4:3 picture area: the list carries no photo, so the v2.2 "no photo" tile (navy gradient + icon). */}
                  <Box
                    sx={{
                      position: 'relative',
                      aspectRatio: '4 / 3',
                      background: `linear-gradient(135deg, ${bbColors.navy700}, ${bbColors.navy900})`,
                      color: bbColors.white,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg
                      width="44"
                      height="44"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M12 3v13M12 4l7 11h-7M12 7 6 15h6" />
                      <path d="M3 18h18l-2 3H5z" />
                    </svg>
                    <Box
                      component="span"
                      sx={{ ...bbTagStyles.base, ...bbTagStyles.hot, position: 'absolute', top: 10, left: 10 }}
                    >
                      EXCLUSIVE
                    </Box>
                  </Box>
                  <Stack sx={{ flex: 1, p: '12px 14px', minWidth: 0 }} gap={0.75}>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: bbColors.navy900 }}>
                      {cy.modelName}
                      <Box component="span" sx={{ color: bbColors.gray500, fontWeight: 500 }}>
                        {' · '}
                        {cy.name}
                      </Box>
                    </Typography>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={0.75}>
                      <Stack direction="row" alignItems="center" gap={0.75} sx={{ minWidth: 0 }}>
                        <FlagIcon countryCode={cy.countryCode} />
                        <Typography sx={{ fontSize: 12, color: bbColors.gray500 }} noWrap>
                          {cy.countryName || '—'}
                        </Typography>
                      </Stack>
                      <Box sx={pillStyle}>
                        <Box component="span" sx={{ color: bbColors.gray500, fontWeight: 600 }}>
                          Low
                        </Box>{' '}
                        <Box component="span" sx={{ fontWeight: 700 }}>
                          €{formatPrice(cy.lowPrice || 0)}
                        </Box>
                      </Box>
                    </Stack>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mt: 'auto', pt: 1, borderTop: `1px solid ${bbColors.gray100}` }}
                    >
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: bbColors.gray500,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Slug: {cy.slug}
                      </Typography>
                      <Stack direction="row" gap={0.5} sx={{ flexShrink: 0 }}>
                        <Tooltip title={t('actions.edit')} arrow>
                          <IconButton
                            size="small"
                            aria-label={t('actions.edit')}
                            onClick={e => handleEditCard(e, i)}
                            sx={{ border: `1px solid ${bbColors.fieldBorder}`, backgroundColor: bbColors.white }}
                          >
                            <EditIcon size={14} fill={bbColors.navy900} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('actions.delete')} arrow>
                          <IconButton
                            size="small"
                            aria-label={t('actions.delete')}
                            onClick={e => handleDeleteCard(e, i)}
                            sx={{
                              border: `1px solid ${bbColors.red200}`,
                              backgroundColor: bbColors.white,
                              '&:hover': { backgroundColor: bbColors.red100 },
                            }}
                          >
                            <TrashIcon size={14} fill={bbColors.red700} />
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
  padding: '0 8px',
  height: 22,
  borderRadius: 999,
  backgroundColor: bbColors.info100,
  color: bbColors.navy700,
  fontSize: 11.5,
  fontWeight: 700,
  whiteSpace: 'nowrap' as const,
};

export default CustomBoats;
