/* Objave → Kanali: every network with the pages / profiles connected to it, and a site × network overview (each of our
 * 7 sites has its own Facebook, Instagram and TikTok; one YouTube serves all). "Spoji" asks which site the channel is
 * for, then the backend for the network's consent URL; the network returns to the backend's callback, which stores
 * the token and sends the browser back here with ?connected=PLATFORM&count=N or ?error=…&platform=PLATFORM. Bluesky
 * takes a handle and an app password instead. One Meta login brings every page we manage: each gets the site its name
 * points to, and the site can be changed per channel. The admin never holds a network token. */
import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { CardHead, DeskCard } from '@/components/Desk';
import SocialService from '@/services/social.service';
import { errorMessage } from '@/services/yacht-media.api';
import { bbColors, bbPillStyle } from '@/styles/bb';
import { SocialAccount, SocialPlatform, SocialPlatformAvailability } from '@/types/social.type';
import { SITE_IDS, siteLabel } from '@/utils/contactCenter/safeLink';
import { CREDENTIAL_PLATFORMS, PLATFORMS, PLATFORM_RULES } from '@/utils/social/rules';
import { showToast } from '@/valtio/global/global.actions';

import { AccountsState, PlatformBadge, useDateFormat } from './ui';

const ACCOUNT_TONE = { CONNECTED: 'success', EXPIRED: 'warning', ERROR: 'danger' } as const;

const isPlatform = (s: string | null): s is SocialPlatform => !!s && (PLATFORMS as string[]).includes(s);

const DAY_MS = 24 * 3600 * 1000;

/** The networks each site has its own channel on; the overview shows these columns first. */
const PER_SITE: SocialPlatform[] = ['FACEBOOK', 'INSTAGRAM', 'TIKTOK'];

/** "" = all sites (shared channel). */
const SiteSelect = ({
  value,
  onChange,
  label,
  size = 'small',
  fullWidth,
}: {
  value: string | null;
  onChange(site: string | null): void;
  label?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}) => {
  const { t } = useTranslation('social');

  return (
    <TextField
      select
      size={size}
      label={label}
      value={value ?? ''}
      onChange={e => onChange(e.target.value || null)}
      SelectProps={{ displayEmpty: true }}
      InputLabelProps={label ? { shrink: true } : undefined}
      fullWidth={fullWidth}
      sx={{ minWidth: 180 }}
    >
      <MenuItem value="">{t('sites.shared')}</MenuItem>
      {SITE_IDS.map(id => (
        <MenuItem key={id} value={id}>
          {siteLabel(id)}
        </MenuItem>
      ))}
    </TextField>
  );
};

/** Before the consent page: which site is this channel for (Bluesky: plus handle and app password). */
const ConnectDialog = ({
  platform,
  onClose,
  onDone,
}: {
  platform: SocialPlatform | null;
  onClose(): void;
  onDone(): void;
}) => {
  const { t } = useTranslation('social');
  const [site, setSite] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSite(platform === 'YOUTUBE' ? null : SITE_IDS[0]);
    setIdentifier('');
    setSecret('');
    setBusy(false);
  }, [platform]);

  if (!platform) return null;

  const credentials = CREDENTIAL_PLATFORMS.includes(platform);
  const {label} = PLATFORM_RULES[platform];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (credentials) {
        if (!identifier.trim() || !secret.trim()) return;

        await SocialService.connectWithCredentials(platform, identifier.trim(), secret.trim(), site);
        showToast({ status: 'success', text: t('channels.connected', { platform: label }) });
        onDone();
      } else {
        const { authorizeUrl } = await SocialService.connect(platform, site);

        if (!/^https:\/\//.test(authorizeUrl)) throw new Error(t('channels.connectStartError'));

        window.location.assign(authorizeUrl);
      }
    } catch (err) {
      showToast({ status: 'error', text: errorMessage(err, t('channels.connectStartError')) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <Box component="form" onSubmit={submit}>
        <DialogTitle>{t('channels.connectFor', { platform: label })}</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <Box>
              <SiteSelect value={site} onChange={setSite} label={t('sites.pick')} fullWidth />
              <Typography sx={{ fontSize: 12, color: bbColors.gray500, mt: 0.75 }}>{t('sites.pickHint')}</Typography>
            </Box>
            {credentials && (
              <>
                <TextField
                  size="small"
                  label={t('channels.identifier')}
                  placeholder="boat4you.bsky.social"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />
                <TextField
                  size="small"
                  type="password"
                  label={t('channels.secret')}
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                  helperText={t('channels.secretHint')}
                  autoComplete="new-password"
                  required
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            {t('ui.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={busy}>
            {busy && <CircularProgress size={18} />}
            {!busy && (credentials ? t('channels.connect') : t('channels.continue', { platform: label }))}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

/** Sites down, networks across: the channel name where one is connected, a dash where not. */
const SiteOverview = ({ accounts }: { accounts: SocialAccount[] }) => {
  const { t } = useTranslation('social');
  const extra = PLATFORMS.filter(p => !PER_SITE.includes(p) && p !== 'YOUTUBE' && accounts.some(a => a.platform === p));
  const columns = [...PER_SITE, ...extra];
  const shared = accounts.filter(a => a.site == null);

  const cell = (list: SocialAccount[]) =>
    list.length === 0 ? (
      <Box component="span" sx={{ color: bbColors.gray450 }}>
        —
      </Box>
    ) : (
      <Stack gap="2px">
        {list.map(a => (
          <Box
            key={a.id}
            component="span"
            sx={{ fontSize: 12.5, color: a.status === 'CONNECTED' ? bbColors.green700 : bbColors.amber800 }}
          >
            ✓ {a.name}
          </Box>
        ))}
      </Stack>
    );

  return (
    <DeskCard>
      <CardHead title={t('channels.overview')} hint={t('channels.overviewHint')} />
      <Box sx={{ overflowX: 'auto' }}>
        <Box component="table" sx={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <Box
                component="th"
                sx={{ textAlign: 'left', p: '8px 16px', fontSize: 12, color: bbColors.tableHeadText }}
              >
                {t('sites.site')}
              </Box>
              {columns.map(p => (
                <Box key={p} component="th" sx={{ textAlign: 'left', p: '8px 12px' }}>
                  <Stack direction="row" alignItems="center" gap={0.75}>
                    <PlatformBadge platform={p} size={20} />
                    <Box component="span" sx={{ fontSize: 12, color: bbColors.tableHeadText }}>
                      {PLATFORM_RULES[p].label}
                    </Box>
                  </Stack>
                </Box>
              ))}
            </tr>
          </thead>
          <tbody>
            {SITE_IDS.map(site => (
              <Box component="tr" key={site} sx={{ borderTop: `1px solid ${bbColors.gray100}` }}>
                <Box component="td" sx={{ p: '8px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {siteLabel(site)}
                </Box>
                {columns.map(p => (
                  <Box component="td" key={p} sx={{ p: '8px 12px', verticalAlign: 'top' }}>
                    {cell(accounts.filter(a => a.site === site && a.platform === p))}
                  </Box>
                ))}
              </Box>
            ))}
            <Box component="tr" sx={{ borderTop: `1px solid ${bbColors.gray100}`, bgcolor: bbColors.gray75 }}>
              <Box component="td" sx={{ p: '8px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {t('sites.shared')}
              </Box>
              <Box component="td" colSpan={columns.length} sx={{ p: '8px 12px' }}>
                {shared.length === 0 ? (
                  <Box component="span" sx={{ color: bbColors.gray450 }}>
                    —
                  </Box>
                ) : (
                  <Stack direction="row" gap={1.5} flexWrap="wrap">
                    {shared.map(a => (
                      <Stack key={a.id} direction="row" alignItems="center" gap={0.5}>
                        <PlatformBadge platform={a.platform} size={18} />
                        <Box component="span" sx={{ fontSize: 12.5 }}>
                          {a.name}
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Box>
            </Box>
          </tbody>
        </Box>
      </Box>
    </DeskCard>
  );
};

const Channels = ({ accounts }: { accounts: AccountsState }) => {
  const { t } = useTranslation('social');
  const fmt = useDateFormat();
  const [search, setSearch] = useSearchParams();
  const [connectFor, setConnectFor] = useState<SocialPlatform | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);
  const [availability, setAvailability] = useState<SocialPlatformAvailability>({});

  useEffect(() => {
    SocialService.platforms()
      .then(setAvailability)
      .catch(() => setAvailability({}));
  }, []);

  // Back from the network's consent screen.
  useEffect(() => {
    const connected = search.get('connected');
    const failed = search.get('error');
    const platform = search.get('platform');

    if (!connected && !failed) return;

    if (isPlatform(connected)) {
      showToast({ status: 'success', text: t('channels.connected', { platform: PLATFORM_RULES[connected].label }) });
      accounts.reload();
    } else if (failed) {
      showToast({
        status: 'error',
        text: t('channels.connectError', {
          platform: isPlatform(platform) ? PLATFORM_RULES[platform].label : '',
          // The network's own words, as plain text (a toast renders text only).
          error: failed.slice(0, 200),
        }),
      });
    }

    setSearch({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per return from the network
  }, []);

  const accountTimeLine = (a: SocialAccount) => {
    if (a.status === 'EXPIRED') return t('channels.expired');

    if (a.tokenExpiresAt) return t('channels.expires', { date: fmt.dateTime(a.tokenExpiresAt) });

    return t('channels.since', { date: fmt.dateTime(a.connectedAt) });
  };

  const changeSite = async (a: SocialAccount, site: string | null) => {
    try {
      await SocialService.setSite(a.id, site);
      showToast({ status: 'success', text: t('channels.siteSaved') });
      accounts.reload();
    } catch (e) {
      showToast({ status: 'error', text: errorMessage(e, t('channels.actionError')) });
    }
  };

  const disconnect = async (a: SocialAccount) => {
    if (!window.confirm(t('channels.confirmDisconnect', { name: a.name }))) return;

    setRemoving(a.id);
    try {
      await SocialService.disconnect(a.id);
      showToast({ status: 'success', text: t('channels.disconnected', { name: a.name }) });
      accounts.reload();
    } catch (e) {
      showToast({ status: 'error', text: errorMessage(e, t('channels.actionError')) });
    } finally {
      setRemoving(null);
    }
  };

  return (
    <Stack gap={1.5}>
      <Alert severity="info">{t('channels.intro')}</Alert>
      {accounts.error && <Alert severity="error">{accounts.error}</Alert>}
      <SiteOverview accounts={accounts.list} />
      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', xl: '1fr 1fr 1fr' } }}>
        {PLATFORMS.map(p => {
          const r = PLATFORM_RULES[p];
          const list = accounts.list.filter(a => a.platform === p);
          const reason = availability[p];

          return (
            <DeskCard key={p} sx={{ display: 'flex', flexDirection: 'column' }}>
              <CardHead
                title={
                  <Stack direction="row" alignItems="center" gap={1} component="span">
                    <PlatformBadge platform={p} size={28} />
                    {r.label}
                  </Stack>
                }
                action={
                  <Button
                    size="small"
                    variant={list.length ? 'outlined' : 'contained'}
                    disabled={!!reason}
                    title={reason ?? undefined}
                    onClick={() => setConnectFor(p)}
                  >
                    {list.length ? t('channels.connectAnother') : t('channels.connect')}
                  </Button>
                }
              />
              <Stack gap={1} sx={{ p: '12px 16px 14px', flex: 1 }}>
                <Typography sx={{ fontSize: 12.5, color: bbColors.gray500 }}>{r.connectHint}</Typography>
                {reason && (
                  <Typography sx={{ fontSize: 12, color: bbColors.amber800 }}>
                    {t('channels.notConfigured')}: {reason}
                  </Typography>
                )}
                {accounts.loading && list.length === 0 && <CircularProgress size={18} />}
                {!accounts.loading && list.length === 0 && (
                  <Typography sx={{ fontSize: 12.5, color: bbColors.gray450 }}>{t('channels.none')}</Typography>
                )}
                {list.map(a => {
                  const expiresSoon =
                    a.tokenExpiresAt && new Date(a.tokenExpiresAt).getTime() - Date.now() < 7 * DAY_MS;

                  return (
                    <Box
                      key={a.id}
                      sx={{ border: `1px solid ${bbColors.cardBorder}`, borderRadius: '10px', p: '8px 10px' }}
                    >
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Avatar src={a.avatarUrl ?? undefined} alt="" sx={{ width: 30, height: 30, fontSize: 13 }}>
                          {a.name.slice(0, 1).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: 13.5, fontWeight: 700 }} noWrap>
                            {a.name}
                          </Typography>
                          {a.handle && (
                            <Typography sx={{ fontSize: 11.5, color: bbColors.gray500 }} noWrap>
                              {a.handle}
                            </Typography>
                          )}
                        </Box>
                        <Box component="span" sx={bbPillStyle(ACCOUNT_TONE[a.status])}>
                          {t(`channels.accountStatus.${a.status}`)}
                        </Box>
                      </Stack>
                      <Box sx={{ mt: 1 }}>
                        <SiteSelect
                          value={a.site}
                          onChange={site => changeSite(a, site)}
                          label={t('sites.site')}
                          fullWidth
                        />
                      </Box>
                      <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 0.75 }} flexWrap="wrap">
                        <Typography
                          sx={{ fontSize: 11.5, color: expiresSoon ? bbColors.amber800 : bbColors.gray500, flex: 1 }}
                        >
                          {accountTimeLine(a)}
                        </Typography>
                        {a.status !== 'CONNECTED' && (
                          <Button size="small" variant="contained" disabled={!!reason} onClick={() => setConnectFor(p)}>
                            {t('channels.reconnect')}
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="text"
                          color="error"
                          disabled={removing === a.id}
                          onClick={() => disconnect(a)}
                        >
                          {t('channels.disconnect')}
                        </Button>
                      </Stack>
                      {a.privateOnly && (
                        <Typography sx={{ fontSize: 11.5, color: bbColors.amber800, mt: 0.5 }}>
                          {t('channels.privateOnly')}
                        </Typography>
                      )}
                      {a.lastError && (
                        <Typography sx={{ fontSize: 11.5, color: bbColors.red700, mt: 0.5, overflowWrap: 'anywhere' }}>
                          {a.lastError}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </DeskCard>
          );
        })}
      </Box>
      <ConnectDialog
        platform={connectFor}
        onClose={() => setConnectFor(null)}
        onDone={() => {
          setConnectFor(null);
          accounts.reload();
        }}
      />
    </Stack>
  );
};

export default Channels;
