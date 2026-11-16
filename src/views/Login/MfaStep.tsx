import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Checkbox, FormControlLabel, Stack, TextField, Typography } from '@mui/material';

import MfaService, { MfaLoginResponse, MfaMethod } from '@/services/mfa.service';
import { getPasskeyAssertion, passkeysSupported } from '@/utils/static/webauthn';

interface MfaStepProps {
  mfaToken: string;
  methods: MfaMethod[];
  onSignedIn: (response: MfaLoginResponse) => void;
  onBack: () => void;
}

/**
 * The second step of the admin sign-in (16.11.2026): a passkey (Face ID / Touch ID) first, an authenticator-app code
 * or a one-time recovery code as the way back in. "Remember this device" skips this step for 30 days in this browser.
 */
const MfaStep = ({ mfaToken, methods, onSignedIn, onBack }: MfaStepProps) => {
  const { t } = useTranslation('login');
  const canPasskey = methods.includes('passkey') && passkeysSupported();
  const [mode, setMode] = useState<'totp' | 'recovery'>(methods.includes('totp') ? 'totp' : 'recovery');
  const [code, setCode] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = (response: MfaLoginResponse | null) => {
    setBusy(false);

    if (response?.status === 'OK') {
      onSignedIn(response);

      return;
    }

    setError(t('mfa.failed'));
  };

  const signInWithPasskey = async () => {
    setBusy(true);
    setError(null);

    const options = await MfaService.passkeyOptions(mfaToken);

    if (!options.payload) {
      finish(null);

      return;
    }

    try {
      const assertion = await getPasskeyAssertion(options.payload);

      if (!assertion) {
        setBusy(false);

        return;
      }

      const result = await MfaService.passkeyVerify(mfaToken, options.payload.challengeToken, assertion, remember);

      finish(result.payload);
    } catch {
      // Cancelled in the system sheet, or no passkey for this site on this device.
      setBusy(false);
      setError(t('mfa.passkey-cancelled'));
    }
  };

  const signInWithCode = async () => {
    if (!code.trim()) return;

    setBusy(true);
    setError(null);

    const result = await MfaService.codeVerify(mode, mfaToken, code, remember);

    finish(result.payload);
  };

  return (
    <Stack gap={3} pt={4}>
      <Typography variant="body1">{t('mfa.intro')}</Typography>

      {canPasskey && (
        <Button size="large" fullWidth disabled={busy} onClick={signInWithPasskey}>
          {t('mfa.use-passkey')}
        </Button>
      )}

      {(methods.includes('totp') || methods.includes('recovery')) && (
        <Stack gap={1.5}>
          <TextField
            label={mode === 'totp' ? t('mfa.totp-code') : t('mfa.recovery-code')}
            value={code}
            onChange={event => setCode(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') signInWithCode();
            }}
            autoComplete="one-time-code"
            slotProps={{ htmlInput: { inputMode: mode === 'totp' ? 'numeric' : 'text', maxLength: mode === 'totp' ? 7 : 13 } }}
            fullWidth
          />
          <Button variant="outlined" size="large" fullWidth disabled={busy || !code.trim()} onClick={signInWithCode}>
            {t('mfa.confirm-code')}
          </Button>
          {methods.includes('totp') && methods.includes('recovery') && (
            <Button
              variant="text"
              onClick={() => {
                setMode(mode === 'totp' ? 'recovery' : 'totp');
                setCode('');
              }}
              sx={{ alignSelf: 'flex-start' }}
            >
              {mode === 'totp' ? t('mfa.switch-to-recovery') : t('mfa.switch-to-totp')}
            </Button>
          )}
        </Stack>
      )}

      <FormControlLabel
        control={<Checkbox checked={remember} onChange={event => setRemember(event.target.checked)} />}
        label={t('mfa.remember-device')}
      />

      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}

      <Button variant="text" onClick={onBack} sx={{ alignSelf: 'flex-start' }}>
        {t('back-to-login')}
      </Button>
    </Stack>
  );
};

export default MfaStep;
