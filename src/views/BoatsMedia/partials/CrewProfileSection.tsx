import { useRef, useState } from 'react';

import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { Button, Link, Stack, Typography } from '@mui/material';

import { YachtLookupItem, YachtMediaDto, errorMessage, isPdfMagic, pdfFileProblem } from '@/services/yacht-media.api';
import YachtMediaService from '@/services/yacht-media.service';
import { bbColors } from '@/styles/bb';
import { showToast } from '@/valtio/global/global.actions';

import { SectionCard, dangerButtonSx, primaryButtonSx, useConfirm } from './ui';

interface CrewProfileSectionProps {
  yacht: YachtLookupItem;
  label: string;
  /** Public link of the stored PDF (admin media crewProfileUrl), null = none. */
  url: string | null;
  onMedia: (media: YachtMediaDto) => void;
}

const readHead = async (file: File) => new Uint8Array(await file.slice(0, 5).arrayBuffer());

const CrewProfileSection = ({ yacht, label, url, onMedia }: CrewProfileSectionProps) => {
  const [busy, setBusy] = useState(false);
  const [replacedAt, setReplacedAt] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { ask, dialog } = useConfirm();

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const media = await YachtMediaService.uploadCrewProfile(yacht.id, file);

      setReplacedAt(url ? Date.now() : null);
      onMedia(media);
      showToast({ status: 'success', text: url ? 'Crew profile replaced.' : 'Crew profile uploaded.' });
    } catch (error) {
      showToast({ status: 'error', text: errorMessage(error, 'The PDF could not be uploaded.') });
    } finally {
      setBusy(false);
    }
  };

  const onPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    e.target.value = '';

    if (!file) return;

    const problem = pdfFileProblem(file);

    if (problem) {
      showToast({ status: 'warning', text: problem });

      return;
    }

    if (!isPdfMagic(await readHead(file))) {
      showToast({ status: 'warning', text: `${file.name}: not a PDF file (it does not start with %PDF).` });

      return;
    }

    if (url) {
      ask({
        title: 'Replace crew profile',
        text: `Replace the crew profile of ${label} with ${file.name}? The old file is deleted.`,
        confirmText: 'Replace PDF',
        onConfirm: () => upload(file),
      });
    } else {
      upload(file);
    }
  };

  const remove = () =>
    ask({
      title: 'Delete crew profile',
      text: `Delete the crew profile PDF of ${label}? The sites stop showing it.`,
      confirmText: 'Delete PDF',
      onConfirm: async () => {
        setBusy(true);
        try {
          const media = await YachtMediaService.deleteCrewProfile(yacht.id);

          setReplacedAt(null);
          onMedia(media);
          showToast({ status: 'success', text: 'Crew profile deleted.' });
        } catch (error) {
          showToast({ status: 'error', text: errorMessage(error, 'The PDF could not be deleted.') });
        } finally {
          setBusy(false);
        }
      },
    });

  return (
    <SectionCard
      icon={<PictureAsPdfOutlinedIcon />}
      title="Crew profile (PDF)"
      subtitle="PDF only, up to 15 MB · linked from the boat page of all 7 sites"
    >
      {dialog}
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
        {url ? (
          <Link
            // after a replace the link is the same: `v` makes this browser fetch the new file instead of its cached copy
            href={replacedAt ? `${url}${url.includes('?') ? '&' : '?'}v=${replacedAt}` : url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 13, fontWeight: 700 }}
          >
            Open the public PDF <OpenInNewRoundedIcon sx={{ fontSize: 15 }} aria-hidden />
          </Link>
        ) : (
          <Typography sx={{ fontSize: 13, color: bbColors.gray500 }}>No crew profile yet.</Typography>
        )}
        <Stack direction="row" gap={1}>
          <Button variant="contained" disabled={busy} onClick={() => inputRef.current?.click()} sx={primaryButtonSx}>
            {url ? 'Replace PDF' : 'Upload PDF'}
          </Button>
          {url && (
            <Button variant="outlined" disabled={busy} onClick={remove} sx={dangerButtonSx}>
              Delete
            </Button>
          )}
        </Stack>
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={onPicked} />
      </Stack>
      {replacedAt && (
        <Typography sx={{ fontSize: 11, color: bbColors.amber700, mt: 1 }}>
          Replaced. The public link stays the same and is cached for up to 24 h, so some visitors may see the previous
          file until then.
        </Typography>
      )}
    </SectionCard>
  );
};

export default CrewProfileSection;
