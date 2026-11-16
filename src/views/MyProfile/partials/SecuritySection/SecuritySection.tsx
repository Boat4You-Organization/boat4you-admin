import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, Divider, Stack, TextField, Typography } from '@mui/material';
import QRCode from 'qrcode';

import MfaService, { MfaStatus } from '@/services/mfa.service';
import { bbCardSx, bbColors } from '@/styles/bb';
import { createPasskey, passkeysSupported } from '@/utils/static/webauthn';
import { showToast } from '@/valtio/global/global.actions';

const formatDate = (value: string | null): string => (value ? new Date(value).toLocaleDateString() : '—');

/**
 * Two-step sign-in settings of the signed-in admin (16.11.2026): passkeys (Face ID / Touch ID), the authenticator app
 * as the fallback, one-time recovery codes and the browsers remembered for 30 days.
 */
const SecuritySection = () => {
  const { t } = useTranslation('login');
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [totpSetup, setTotpSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  const reload = useCallback(async () => setStatus(await MfaService.status()), []);

  useEffect(() => {
    reload();
  }, [reload]);

  const toast = (ok: boolean, text: string) => showToast({ status: ok ? 'success' : 'error', text });

  const addPasskey = async () => {
    setBusy(true);

    try {
      const options = await MfaService.passkeyCreationOptions();
      const payload = options ? await createPasskey(options) : null;
      const ok = !!options && !!payload && (await MfaService.registerPasskey(options.challengeToken, payload, label));

      toast(ok, ok ? t('security.passkey-added') : t('security.failed'));

      if (ok) setLabel('');
    } catch {
      toast(false, t('security.passkey-cancelled'));
    }

    setBusy(false);
    reload();
  };

  const removePasskey = async (id: number) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(t('security.confirm-remove'))) return;

    toast(await MfaService.deletePasskey(id), t('security.removed'));
    reload();
  };

  const startTotp = async () => {
    const setup = await MfaService.totpSetup();

    if (!setup) {
      toast(false, t('security.failed'));

      return;
    }

    setTotpSetup({ secret: setup.secret, qr: await QRCode.toDataURL(setup.otpauthUri, { margin: 1, width: 200 }) });
  };

  const confirmTotp = async () => {
    const ok = await MfaService.totpConfirm(totpCode);

    toast(ok, ok ? t('security.totp-on') : t('security.code-wrong'));

    if (ok) {
      setTotpSetup(null);
      setTotpCode('');
      reload();
    }
  };

  const disableTotp = async () => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(t('security.confirm-remove'))) return;

    toast(await MfaService.totpDisable(), t('security.removed'));
    reload();
  };

  const newCodes = async () => {
    const codes = await MfaService.newRecoveryCodes();

    if (!codes) {
      toast(false, t('security.failed'));

      return;
    }

    setRecoveryCodes(codes);
    reload();
  };

  const forgetDevices = async () => {
    toast(await MfaService.forgetTrustedDevices(), t('security.devices-forgotten'));
  };

  if (!status) return null;

  return (
    <Box sx={{ ...bbCardSx, p: { xs: 2.5, sm: 3.5 }, mt: 3 }}>
      <Stack gap={0.5} mb={2.5}>
        <Typography component="h2" variant="h3">
          {t('security.title')}
        </Typography>
        <Typography variant="body2" color={bbColors.gray600}>
          {status.enrolled ? t('security.status-on') : t('security.status-off')}
        </Typography>
      </Stack>

      <Stack gap={1.5}>
        <Typography component="h3" variant="h4" sx={{ fontSize: 15 }}>
          {t('security.passkeys')}
        </Typography>
        <Typography variant="body2" color={bbColors.gray600}>
          {t('security.passkeys-help')}
        </Typography>
        {status.passkeys.map(passkey => (
          <Stack key={passkey.id} direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <Typography variant="body2">
              {passkey.label || t('security.passkey')} · {t('security.added')} {formatDate(passkey.createdAt)} ·{' '}
              {t('security.last-used')} {formatDate(passkey.lastUsedAt)}
            </Typography>
            <Button variant="text" color="error" onClick={() => removePasskey(passkey.id)}>
              {t('security.remove')}
            </Button>
          </Stack>
        ))}
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
          <TextField
            size="small"
            label={t('security.passkey-label')}
            value={label}
            onChange={event => setLabel(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
          <Button disabled={busy || !passkeysSupported()} onClick={addPasskey}>
            {t('security.add-passkey')}
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Stack gap={1.5}>
        <Typography component="h3" variant="h4" sx={{ fontSize: 15 }}>
          {t('security.totp')}
        </Typography>
        <Typography variant="body2" color={bbColors.gray600}>
          {t('security.totp-help')}
        </Typography>
        {status.totpEnabled && (
          <Stack direction="row" alignItems="center" gap={2}>
            <Typography variant="body2">{t('security.totp-on')}</Typography>
            <Button variant="text" color="error" onClick={disableTotp}>
              {t('security.remove')}
            </Button>
          </Stack>
        )}
        {!status.totpEnabled && totpSetup && (
          <Stack gap={1.5} alignItems="flex-start">
            <img src={totpSetup.qr} width={200} height={200} alt={t('security.totp-qr-alt')} />
            <Typography variant="body2">
              {t('security.totp-key')} <code>{totpSetup.secret}</code>
            </Typography>
            <Stack direction="row" gap={1.5}>
              <TextField
                size="small"
                label={t('mfa.totp-code')}
                value={totpCode}
                onChange={event => setTotpCode(event.target.value)}
                slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 7 } }}
              />
              <Button disabled={!totpCode.trim()} onClick={confirmTotp}>
                {t('mfa.confirm-code')}
              </Button>
            </Stack>
          </Stack>
        )}
        {!status.totpEnabled && !totpSetup && (
          <Button variant="outlined" sx={{ alignSelf: 'flex-start' }} onClick={startTotp}>
            {t('security.totp-set-up')}
          </Button>
        )}
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Stack gap={1.5}>
        <Typography component="h3" variant="h4" sx={{ fontSize: 15 }}>
          {t('security.recovery')}
        </Typography>
        <Typography variant="body2" color={bbColors.gray600}>
          {t('security.recovery-help', { count: status.recoveryCodesLeft })}
        </Typography>
        {recoveryCodes && (
          <Box component="pre" sx={{ m: 0, p: 2, borderRadius: 1, bgcolor: bbColors.gray50, fontSize: 15, lineHeight: 1.7 }}>
            {recoveryCodes.join('\n')}
          </Box>
        )}
        <Button variant="outlined" sx={{ alignSelf: 'flex-start' }} onClick={newCodes}>
          {t('security.recovery-new')}
        </Button>
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Stack gap={1.5}>
        <Typography variant="body2" color={bbColors.gray600}>
          {t('security.devices-help')}
        </Typography>
        <Button variant="text" sx={{ alignSelf: 'flex-start' }} onClick={forgetDevices}>
          {t('security.devices-forget')}
        </Button>
      </Stack>
    </Box>
  );
};

export default SecuritySection;
