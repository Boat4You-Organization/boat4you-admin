/* Objave → Kanali: every network with the pages / profiles connected to it. "Spoji" asks the backend for the network's
 * consent URL and goes there; the network returns to the backend's callback, which stores the token and sends the
 * browser back here with ?connected=PLATFORM&count=N or ?error=…&platform=PLATFORM. Bluesky takes a handle and an app
 * password instead. The admin never holds a network token. */
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
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { CardHead, DeskCard } from '@/components/Desk';
import SocialService from '@/services/social.service';
import { errorMessage } from '@/services/yacht-media.api';
import { bbColors, bbPillStyle } from '@/styles/bb';
import { SocialAccount, SocialPlatform } from '@/types/social.type';
import { CREDENTIAL_PLATFORMS, PLATFORMS, PLATFORM_RULES } from '@/utils/social/rules';
import { showToast } from '@/valtio/global/global.actions';

import { AccountsState, PlatformBadge, useDateFormat } from './ui';

const ACCOUNT_TONE = { CONNECTED: 'success', EXPIRED: 'warning', ERROR: 'danger' } as const;

const isPlatform = (s: string | null): s is SocialPlatform => !!s && (PLATFORMS as string[]).includes(s);

const DAY_MS = 24 * 3600 * 1000;

const CredentialsDialog = ({
  platform,
  onClose,
  onDone,
}: {
  platform: SocialPlatform | null;
  onClose(): void;
  onDone(): void;
}) => {
  const { t } = useTranslation('social');
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setIdentifier('');
    setSecret('');
  }, [platform]);

  if (!platform) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    if (!identifier.trim() || !secret.trim()) return;

    setBusy(true);
    try {
      await SocialService.connectWithCredentials(platform, identifier.trim(), secret.trim());
      showToast({ status: 'success', text: t('channels.connected', { platform: PLATFORM_RULES[platform].label }) });
      onDone();
    } catch (err) {
      showToast({ status: 'error', text: errorMessage(err, t('channels.actionError')) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <Box component="form" onSubmit={submit}>
        <DialogTitle>{t('channels.credentialsTitle', { platform: PLATFORM_RULES[platform].label })}</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            {t('ui.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={busy}>
            {busy ? <CircularProgress size={18} /> : t('channels.connect')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

const Channels = ({ accounts }: { accounts: AccountsState }) => {
  const { t } = useTranslation('social');
  const fmt = useDateFormat();
  const [search, setSearch] = useSearchParams();
  const [connecting, setConnecting] = useState<SocialPlatform | null>(null);
  const [credentialsFor, setCredentialsFor] = useState<SocialPlatform | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);

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

  const connect = async (platform: SocialPlatform) => {
    if (CREDENTIAL_PLATFORMS.includes(platform)) {
      setCredentialsFor(platform);

      return;
    }

    setConnecting(platform);
    try {
      const { authorizeUrl } = await SocialService.connect(platform);

      if (!/^https:\/\//.test(authorizeUrl)) throw new Error(t('channels.connectStartError'));

      window.location.assign(authorizeUrl);
    } catch (e) {
      showToast({ status: 'error', text: errorMessage(e, t('channels.connectStartError')) });
      setConnecting(null);
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
      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', xl: '1fr 1fr 1fr' } }}>
        {PLATFORMS.map(p => {
          const r = PLATFORM_RULES[p];
          const list = accounts.list.filter(a => a.platform === p);

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
                    disabled={connecting !== null}
                    onClick={() => connect(p)}
                  >
                    {connecting === p && <CircularProgress size={16} />}
                    {connecting !== p && (list.length ? t('channels.connectAnother') : t('channels.connect'))}
                  </Button>
                }
              />
              <Stack gap={1} sx={{ p: '12px 16px 14px', flex: 1 }}>
                <Typography sx={{ fontSize: 12.5, color: bbColors.gray500 }}>{r.connectHint}</Typography>
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
                      <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 0.75 }} flexWrap="wrap">
                        <Typography
                          sx={{ fontSize: 11.5, color: expiresSoon ? bbColors.amber800 : bbColors.gray500, flex: 1 }}
                        >
                          {accountTimeLine(a)}
                        </Typography>
                        {a.status !== 'CONNECTED' && (
                          <Button size="small" variant="contained" onClick={() => connect(p)}>
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
      <CredentialsDialog
        platform={credentialsFor}
        onClose={() => setCredentialsFor(null)}
        onDone={() => {
          setCredentialsFor(null);
          accounts.reload();
        }}
      />
    </Stack>
  );
};

export default Channels;
