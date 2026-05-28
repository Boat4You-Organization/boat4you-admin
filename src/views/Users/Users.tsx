/* eslint-disable @typescript-eslint/no-use-before-define, no-nested-ternary */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';

import Layout from '@/components/Layout';
import { PAGE_NUMBER, PAGE_SIZE } from '@/config/constants.config';
import {
  INVITE_USER_STATUS_LABEL_MAP,
  InviteUserStatus,
  USER_ROLE_NAME_TAB_LABEL_MAP,
  USER_ROLE_NAME_TAB_VALUES,
  USER_STATUS_LABEL_MAP,
  USER_STATUS_VALUES,
  UserRoleName,
  UserStatus,
} from '@/models/user.model';
import { bbColors, bbFont, bbStatusPill } from '@/styles/bb';
import useQueryParams from '@/utils/hooks/useQueryParams';
import {
  getSelectedUser,
  getUsers,
  toggleCreateUserModal,
  toggleDeleteUserModal,
  toggleUpdateUserModal,
} from '@/valtio/users/users.actions';
import { useUsersStore } from '@/valtio/users/users.store';

import CreateUserModal from './partials/CreateUserModal';
import DeleteUserModal from './partials/DeleteUserModal';
import UpdateUserModal from './partials/UpdateUserModal';
import UserModal from './partials/UserModal';
import useUsersView from './useUsersView';

/**
 * Users list — Broker Desk redesign.
 *
 * PageHead + role TabGroup + FilterBar + table card. Columns: User
 * (avatar + name + email) · Role · Phone · Status pill · Action.
 * Segment tags (VIP/LOYAL/RETURNING/LEAD) from the handoff prototype
 * aren't wired yet — backend UserModel doesn't surface a segment field.
 * Drop them in when CRM segments ship.
 */

const statusToVariant = (s: UserStatus): string =>
  s === UserStatus.ACTIVE ? 'active' : 'lost';

const initialsOf = (n?: string, s?: string): string =>
  `${(n?.[0] ?? '').toUpperCase()}${(s?.[0] ?? '').toUpperCase()}` || '?';

const Users = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParamsQs] = useSearchParams();
  const { params: queryParams, handleSearch, handlePageChange, setParam } = useQueryParams();
  const { search, page, sortBy, sortDirection, userRole: urlUserRole, userStatus: urlUserStatus } = queryParams;

  const [userRole, setUserRole] = useState<string>(urlUserRole || USER_ROLE_NAME_TAB_VALUES[0]);
  const [userStatus, setUserStatus] = useState<string>(urlUserStatus || USER_STATUS_VALUES[0]);
  const [searchInput, setSearchInput] = useState<string>(search || '');

  const { isLoading, selectedUser, users, totalCount, createUserModalOpen, updateUserModalOpen, deleteUserModalOpen } =
    useUsersStore();
  const { closeUserModal } = useUsersView();

  const params = useParams();
  const id = params['*'];

  useEffect(() => {
    if (!id) return;

    getSelectedUser(Number(id));
  }, [id]);

  useEffect(() => {
    const pageNumber = page - PAGE_NUMBER;
    const role = (userRole === USER_ROLE_NAME_TAB_VALUES[0] ? '' : userRole) as UserRoleName;
    const status = (userStatus === USER_STATUS_VALUES[0] ? '' : userStatus) as UserStatus;

    getUsers(pageNumber, search, sortBy, sortDirection, role, status);
  }, [page, search, sortBy, sortDirection, userRole, userStatus]);

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch(searchInput);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <>
      {selectedUser && (
        <Routes>
          <Route
            path=":id"
            element={
              <UserModal
                isOpen={!updateUserModalOpen && !deleteUserModalOpen}
                onClose={closeUserModal}
                onCancel={toggleDeleteUserModal}
                onConfirm={toggleUpdateUserModal}
              />
            }
          />
        </Routes>
      )}
      <CreateUserModal isOpen={createUserModalOpen} onClose={toggleCreateUserModal} />
      <UpdateUserModal isOpen={updateUserModalOpen} onClose={toggleUpdateUserModal} />
      <DeleteUserModal isOpen={deleteUserModalOpen} onClose={toggleDeleteUserModal} />
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
                {t('common.users')}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: bbColors.gray500, mt: 0.5 }}>
                Admins, managers, and customers
              </Typography>
            </Box>
            <Stack direction="row" gap={1} sx={{ flexShrink: 0 }}>
              <Button
                onClick={() => toggleCreateUserModal(true)}
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
                + {t('common.addUser', 'Add user')}
              </Button>
            </Stack>
          </Stack>

          {/* Role tabs */}
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
            {USER_ROLE_NAME_TAB_VALUES.map(v => {
              const active = v === userRole;

              
return (
                <Box
                  key={v}
                  onClick={() => {
                    setUserRole(v);
                    setParam({ userRole: v === USER_ROLE_NAME_TAB_VALUES[0] ? '' : v, page: 1 });
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
                  {t(USER_ROLE_NAME_TAB_LABEL_MAP[v])}
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
              placeholder="Search name, email…"
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
            {/* User-status filter — kept as small segmented chips so the
                broker can flip between Active / Inactive without opening
                a select menu. "All" clears the filter. */}
            <Stack direction="row" gap={0.5}>
              {USER_STATUS_VALUES.map(v => {
                const active = v === userStatus;

                
return (
                  <Box
                    key={v}
                    onClick={() => {
                      setUserStatus(v);
                      setParam({ userStatus: v === USER_STATUS_VALUES[0] ? '' : v, page: 1 });
                    }}
                    sx={{
                      padding: '6px 11px',
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: active ? bbColors.white : bbColors.gray500,
                      backgroundColor: active ? bbColors.navy900 : bbColors.gray75,
                      borderRadius: '6px',
                      border: `1px solid ${bbColors.gray200}`,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}
                  >
                    {v === 'all' ? t('common.all') : t(USER_STATUS_LABEL_MAP[v])}
                  </Box>
                );
              })}
            </Stack>
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
                    {['User', 'Role', 'Phone', 'Status', ''].map((h, i) => (
                      <Box
                        component="th"
                        key={h || `col-${i}`}
                        sx={{
                          fontSize: 10,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: bbColors.gray500,
                          fontWeight: 700,
                          padding: '10px 14px',
                          textAlign: i === 4 ? 'right' : 'left',
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
                      <Box component="td" colSpan={5} sx={{ padding: '40px 20px', textAlign: 'center', color: bbColors.gray500, fontSize: 13 }}>
                        Loading…
                      </Box>
                    </Box>
                  )}
                  {!isLoading && users.length === 0 && (
                    <Box component="tr">
                      <Box component="td" colSpan={5} sx={{ padding: '40px 20px', textAlign: 'center', color: bbColors.gray500, fontSize: 13 }}>
                        No users match the current filters.
                      </Box>
                    </Box>
                  )}
                  {!isLoading &&
                    users.map(u => {
                      const usePill = u.inviteStatus === InviteUserStatus.INVITED;
                      const pillVariant = usePill
                        ? u.inviteStatus === InviteUserStatus.INVITED
                          ? 'pending'
                          : 'active'
                        : statusToVariant(u.userStatus);
                      const pill = bbStatusPill(pillVariant);
                      const statusLabel = usePill
                        ? t(INVITE_USER_STATUS_LABEL_MAP[u.inviteStatus])
                        : t(USER_STATUS_LABEL_MAP[u.userStatus]);
                      const roleLabel = u.roles.length
                        ? t(`common.${u.roles[0].roleName.toLowerCase()}`, u.roles[0].roleName)
                        : '—';

                      
return (
                        <Box
                          component="tr"
                          key={u.id}
                          sx={{ cursor: 'default', '&:hover': { backgroundColor: bbColors.gray75 } }}
                        >
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
                                {initialsOf(u.name, u.surname)}
                              </Box>
                              <Box>
                                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: bbColors.navy900 }}>
                                  {u.name} {u.surname}
                                </Typography>
                                <Typography sx={{ fontSize: 11, color: bbColors.gray500 }}>{u.email}</Typography>
                              </Box>
                            </Stack>
                          </Box>
                          <Box component="td" sx={tdBase}>
                            {roleLabel}
                          </Box>
                          <Box component="td" sx={{ ...tdBase, color: bbColors.gray500, fontVariantNumeric: 'tabular-nums' }}>
                            {u.phoneNumber || '—'}
                          </Box>
                          <Box component="td" sx={tdBase}>
                            <Box component="span" sx={{ ...pill.style }}>
                              {statusLabel}
                            </Box>
                          </Box>
                          <Box component="td" sx={{ ...tdBase, textAlign: 'right' }}>
                            <Typography
                              component="a"
                              sx={{ color: bbColors.navy700, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                              onClick={() => {
                                // Mirror the Agencies / Invoices pattern —
                                // fetch the row detail into the store AND
                                // push the id into the URL so the nested
                                // <Routes path=":id"> renders UserModal on
                                // top of the list. Without navigate() the
                                // store fills but the modal never shows.
                                getSelectedUser(u.id);
                                navigate(`/users/${u.id}?${searchParamsQs.toString()}`);
                              }}
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

export default Users;
