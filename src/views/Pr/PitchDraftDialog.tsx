/* PR → Pitchevi: a new draft written by hand (Claude sessions write theirs through the PR API). Saving never sends:
 * the draft appears in the list with its send decision, and "Pošalji" stays a separate, confirmed step. */
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Autocomplete,
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
} from '@mui/material';

import PrService from '@/services/pr.service';
import { PrContact, PrPitch, PrPitchTemplate, PrStudy } from '@/types/pr.type';
import { showToast } from '@/valtio/global/global.actions';

import { textAreaSx, usePrError } from './ui';

/** FOLLOW_UP is made from a sent pitch, never here. */
const TEMPLATES: PrPitchTemplate[] = ['DATA_PITCH', 'BLOG_ARTICLE', 'NEWSJACK', 'CONSENT_REQUEST'];

const contactLabel = (c: PrContact) =>
  `${c.name ? `${c.name} <${c.email}>` : c.email}${c.outletName ? ` · ${c.outletName}` : ''}`;

const PitchDraftDialog = ({
  open,
  studies,
  studyId,
  onClose,
  onCreated,
}: {
  open: boolean;
  studies: PrStudy[];
  /** The list's study filter, as the default. */
  studyId: number | null;
  onClose(): void;
  onCreated(p: PrPitch): void;
}) => {
  const { t } = useTranslation('pr');
  const prError = usePrError();
  const [study, setStudy] = useState('');
  const [template, setTemplate] = useState<PrPitchTemplate>('DATA_PITCH');
  const [contact, setContact] = useState<PrContact | null>(null);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<PrContact[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setStudy(studyId != null ? String(studyId) : '');
      setTemplate('DATA_PITCH');
      setContact(null);
      setSubject('');
      setBody('');
    }
  }, [open, studyId]);

  useEffect(() => {
    if (!open) return undefined;

    let live = true;
    const id = window.setTimeout(async () => {
      try {
        const page = await PrService.contacts({ q: search.trim(), size: 20 });

        if (live) setOptions(page.content);
      } catch {
        if (live) setOptions([]);
      }
    }, 300);

    return () => {
      live = false;
      window.clearTimeout(id);
    };
  }, [open, search]);

  const valid = !!contact && !!subject.trim() && !!body.trim();

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    if (!valid || busy || !contact) return;

    setBusy(true);
    try {
      const p = await PrService.createPitch({
        studyId: study ? Number(study) : null,
        contactId: contact.id,
        template,
        subject: subject.trim(),
        body,
      });

      showToast({ status: 'success', text: t('pitches.draftCreated') });
      onCreated(p);
    } catch (x) {
      showToast({ status: 'error', text: prError(x) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="md" fullWidth>
      <Box component="form" onSubmit={submit}>
        <DialogTitle>{t('pitches.newDraft')}</DialogTitle>
        <DialogContent>
          <Stack gap={1.5} sx={{ pt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
              <TextField
                select
                size="small"
                fullWidth
                label={t('pitches.study')}
                value={study}
                onChange={e => setStudy(e.target.value)}
                SelectProps={{ displayEmpty: true }}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="">{t('pitches.noStudy')}</MenuItem>
                {studies.map(s => (
                  <MenuItem key={s.id} value={String(s.id)}>
                    #{s.number} {s.title}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                fullWidth
                label={t('pitches.template')}
                value={template}
                onChange={e => setTemplate(e.target.value as PrPitchTemplate)}
              >
                {TEMPLATES.map(tp => (
                  <MenuItem key={tp} value={tp}>
                    {t(`template.${tp}`)}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Autocomplete
              size="small"
              options={options}
              value={contact}
              onChange={(_, v) => setContact(v)}
              onInputChange={(_, v, reason) => reason === 'input' && setSearch(v)}
              getOptionLabel={contactLabel}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              filterOptions={x => x}
              noOptionsText={t('pitches.noContacts')}
              renderInput={params => <TextField {...params} required label={t('pitches.contact')} />}
            />
            <TextField
              size="small"
              required
              label={t('pitches.subject')}
              value={subject}
              onChange={e => setSubject(e.target.value)}
              inputProps={{ maxLength: 300 }}
            />
            <Box
              component="textarea"
              aria-label={t('pitches.body')}
              placeholder={t('pitches.body')}
              value={body}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
              sx={{ ...textAreaSx, minHeight: 240 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose} disabled={busy}>
            {t('ui.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={busy || !valid}>
            {busy ? <CircularProgress size={18} /> : t('pitches.saveDraft')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default PitchDraftDialog;
