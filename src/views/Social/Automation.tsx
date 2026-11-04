/* Objave → Automatizacija: keys for the public posting API (/api/social/v1, header X-Api-Key), so a scheduled Claude task
 * (or any script) can prepare the day's posts. A "drafts only" key can never publish: a person opens the draft in the
 * admin and publishes or schedules it. The full key is shown once, on create. */
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { CardHead, DeskCard, TableCard, TableMessageRow, Th, tdSx } from '@/components/Desk';
import SocialService, { API_URL } from '@/services/social.service';
import { errorMessage } from '@/services/yacht-media.api';
import { bbColors, bbPillStyle } from '@/styles/bb';
import { SocialApiKey, SocialApiKeyCreated } from '@/types/social.type';
import { PLATFORM_RULES } from '@/utils/social/rules';
import { showToast } from '@/valtio/global/global.actions';

import { AccountsState, PlatformBadge, useDateFormat } from './ui';

const codeSx = {
  m: 0,
  p: '12px 14px',
  borderRadius: '10px',
  bgcolor: bbColors.navy900,
  color: '#e6edf5',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: 12,
  lineHeight: 1.55,
  overflowX: 'auto',
  whiteSpace: 'pre',
} as const;

const copy = async (text: string, done: string, failed: string) => {
  try {
    await navigator.clipboard.writeText(text);
    showToast({ status: 'success', text: done });
  } catch {
    showToast({ status: 'error', text: failed });
  }
};

const CreateKeyDialog = ({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose(): void;
  onCreated(k: SocialApiKeyCreated): void;
}) => {
  const { t } = useTranslation('social');
  const [name, setName] = useState('');
  const [draftsOnly, setDraftsOnly] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setDraftsOnly(true);
    }
  }, [open]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    setBusy(true);
    try {
      onCreated(await SocialService.createApiKey(name.trim(), draftsOnly));
    } catch (err) {
      showToast({ status: 'error', text: errorMessage(err, t('automation.actionError')) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <Box component="form" onSubmit={submit}>
        <DialogTitle>{t('automation.createTitle')}</DialogTitle>
        <DialogContent>
          <Stack gap={1.5} sx={{ pt: 1 }}>
            <TextField
              size="small"
              label={t('automation.name')}
              placeholder={t('automation.namePlaceholder')}
              value={name}
              onChange={e => setName(e.target.value)}
              required
              inputProps={{ maxLength: 80 }}
            />
            <FormControlLabel
              control={<Checkbox checked={draftsOnly} onChange={e => setDraftsOnly(e.target.checked)} />}
              label={<Typography sx={{ fontSize: 13 }}>{t('automation.draftsOnly')}</Typography>}
            />
            <Typography sx={{ fontSize: 12, color: bbColors.gray500, mt: -1 }}>
              {t('automation.draftsOnlyHint')}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            {t('ui.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={busy || !name.trim()}>
            {busy ? <CircularProgress size={18} /> : t('automation.create')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

const Automation = ({ accounts }: { accounts: AccountsState }) => {
  const { t } = useTranslation('social');
  const fmt = useDateFormat();
  const [keys, setKeys] = useState<SocialApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [created, setCreated] = useState<SocialApiKeyCreated | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setKeys(await SocialService.apiKeys());
      setError(null);
    } catch (e) {
      setError(errorMessage(e, t('automation.loadError')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const revoke = async (k: SocialApiKey) => {
    if (!window.confirm(t('automation.confirmRevoke', { name: k.name }))) return;

    try {
      await SocialService.revokeApiKey(k.id);
      setKeys(list => list.filter(x => x.id !== k.id));
      showToast({ status: 'success', text: t('automation.revoked') });
    } catch (e) {
      showToast({ status: 'error', text: errorMessage(e, t('automation.actionError')) });
    }
  };

  const base = `${API_URL || 'https://api.boat4you.com'}/api/social/v1`;
  const example = `curl -X POST ${base}/posts \\
  -H "X-Api-Key: $B4Y_SOCIAL_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Kornati by catamaran: 89 islands, one week. ⛵",
    "mediaUrls": ["https://api.boat4you.com/public/image/12345?width=1600"],
    "accountIds": [${
      accounts.list
        .slice(0, 3)
        .map(a => a.id)
        .join(', ') || '1, 2, 3'
    }],
    "perPlatform": { "X": { "text": "Kornati by catamaran ⛵ boat4you.com" } },
    "link": "https://www.boat4you.com/en",
    "scheduledAt": "2026-11-04T09:00:00+01:00",
    "note": "daily-claude"
  }'`;

  return (
    <Stack gap={1.5}>
      <Alert severity="info">{t('automation.intro')}</Alert>

      <TableCard
        minWidth={640}
        footer={
          <Stack
            direction="row"
            justifyContent="flex-end"
            sx={{ p: '10px 14px', borderTop: `1px solid ${bbColors.gray100}` }}
          >
            <Button variant="contained" onClick={() => setCreateOpen(true)}>
              {t('automation.newKey')}
            </Button>
          </Stack>
        }
      >
        <thead>
          <tr>
            <Th>{t('automation.name')}</Th>
            <Th>{t('automation.prefix')}</Th>
            <Th>{t('automation.mode')}</Th>
            <Th>{t('automation.created')}</Th>
            <Th>{t('automation.lastUsed')}</Th>
            <Th align="right"> </Th>
          </tr>
        </thead>
        <tbody>
          {loading && keys.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 20, textAlign: 'center' }}>
                <CircularProgress size={22} />
              </td>
            </tr>
          )}
          {error && <TableMessageRow cols={6} tone="error" title={error} />}
          {!loading && !error && keys.length === 0 && <TableMessageRow cols={6} title={t('automation.noKeys')} />}
          {keys.map(k => (
            <tr key={k.id}>
              <Box component="td" sx={{ ...tdSx, fontWeight: 600 }}>
                {k.name}
              </Box>
              <Box component="td" sx={{ ...tdSx, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12.5 }}>
                {k.prefix}…
              </Box>
              <Box component="td" sx={tdSx}>
                <Box component="span" sx={bbPillStyle(k.draftsOnly ? 'info' : 'warning')}>
                  {k.draftsOnly ? t('automation.draftsOnly') : t('automation.full')}
                </Box>
              </Box>
              <Box component="td" sx={tdSx}>
                {fmt.dateTime(k.createdAt)}
              </Box>
              <Box component="td" sx={tdSx}>
                {k.lastUsedAt ? fmt.dateTime(k.lastUsedAt) : t('automation.never')}
              </Box>
              <Box component="td" sx={{ ...tdSx, textAlign: 'right' }}>
                <Button size="small" color="error" variant="text" onClick={() => revoke(k)}>
                  {t('automation.revoke')}
                </Button>
              </Box>
            </tr>
          ))}
        </tbody>
      </TableCard>

      <DeskCard>
        <CardHead title={t('automation.apiTitle')} hint={t('automation.apiHint')} />
        <Stack gap={1.5} sx={{ p: 2 }}>
          <Box component="ul" sx={{ m: 0, pl: '18px', fontSize: 13, lineHeight: 1.7, listStyle: 'disc' }}>
            <li>
              <code>GET {base}/accounts</code> — {t('automation.epAccounts')}
            </li>
            <li>
              <code>POST {base}/media</code> — {t('automation.epMedia')}
            </li>
            <li>
              <code>POST {base}/posts</code> — {t('automation.epPosts')}
            </li>
            <li>
              <code>GET {base}/posts?from=&to=</code> — {t('automation.epList')}
            </li>
          </Box>
          <Box sx={{ position: 'relative' }}>
            <Box component="pre" sx={codeSx}>
              {example}
            </Box>
            <Button
              size="small"
              variant="contained"
              color="secondary"
              startIcon={<ContentCopyRoundedIcon />}
              onClick={() => copy(example, t('automation.copied'), t('automation.copyFailed'))}
              sx={{ position: 'absolute', top: 8, right: 8 }}
            >
              {t('automation.copy')}
            </Button>
          </Box>
          {accounts.list.length > 0 && (
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: bbColors.gray600, mb: 0.75 }}>
                {t('automation.accountIds')}
              </Typography>
              <Stack direction="row" gap={1} flexWrap="wrap">
                {accounts.list.map(a => (
                  <Stack
                    key={a.id}
                    direction="row"
                    alignItems="center"
                    gap={0.75}
                    sx={{
                      border: `1px solid ${bbColors.cardBorder}`,
                      borderRadius: 999,
                      p: '3px 10px 3px 3px',
                      fontSize: 12.5,
                    }}
                  >
                    <PlatformBadge platform={a.platform} size={20} title={PLATFORM_RULES[a.platform].label} />
                    {a.name}
                    <Box component="code" sx={{ color: bbColors.gray500 }}>
                      #{a.id}
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </DeskCard>

      <DeskCard>
        <CardHead title={t('automation.dailyTitle')} />
        <Stack gap={1} sx={{ p: 2 }}>
          <Typography sx={{ fontSize: 13, color: bbColors.gray600 }}>{t('automation.dailyHint')}</Typography>
          <Box component="ol" sx={{ m: 0, pl: '20px', fontSize: 13, lineHeight: 1.7, listStyle: 'decimal' }}>
            <li>{t('automation.daily1')}</li>
            <li>{t('automation.daily2')}</li>
            <li>{t('automation.daily3')}</li>
            <li>{t('automation.daily4')}</li>
          </Box>
        </Stack>
      </DeskCard>

      <CreateKeyDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={k => {
          setCreateOpen(false);
          setCreated(k);
          setKeys(list => [k, ...list]);
        }}
      />
      <Dialog open={!!created} maxWidth="sm" fullWidth>
        <DialogTitle>{t('automation.secretTitle')}</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: bbColors.gray600, mb: 1.5 }}>{t('automation.secretHint')}</Typography>
          <Box component="pre" sx={{ ...codeSx, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {created?.secret}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            startIcon={<ContentCopyRoundedIcon />}
            onClick={() => created && copy(created.secret, t('automation.copied'), t('automation.copyFailed'))}
          >
            {t('automation.copy')}
          </Button>
          <Button variant="contained" onClick={() => setCreated(null)}>
            {t('automation.done')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default Automation;
