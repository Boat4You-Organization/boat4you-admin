import { useEffect, useState } from 'react';

import OndemandVideoOutlinedIcon from '@mui/icons-material/OndemandVideoOutlined';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';

import { YachtLookupItem, errorMessage, parseVideoUrl } from '@/services/yacht-media.api';
import YachtMediaService from '@/services/yacht-media.service';
import { bbColors } from '@/styles/bb';
import { showToast } from '@/valtio/global/global.actions';

import { SectionCard, dangerButtonSx, primaryButtonSx, useConfirm } from './ui';

interface VideoSectionProps {
  yacht: YachtLookupItem;
  label: string;
  /** The boat's current video (public detail videoUrl). */
  videoUrl: string | null;
  onSaved: (videoUrl: string | null) => void;
}

const HINT =
  'YouTube (youtube.com/watch?v=…, youtu.be/…, youtube.com/embed/…) or Vimeo (vimeo.com/…, player.vimeo.com/video/…)';

const VideoSection = ({ yacht, label, videoUrl, onSaved }: VideoSectionProps) => {
  const [value, setValue] = useState(videoUrl ?? '');
  const [saving, setSaving] = useState(false);
  const { ask, dialog } = useConfirm();

  useEffect(() => setValue(videoUrl ?? ''), [videoUrl, yacht.id]);

  const trimmed = value.trim();
  const parsed = trimmed ? parseVideoUrl(trimmed) : null;
  const invalid = trimmed !== '' && parsed === null;
  const unchanged = trimmed === (videoUrl ?? '');
  const preview = parsed ?? (videoUrl ? parseVideoUrl(videoUrl) : null);

  const save = async (next: string | null) => {
    setSaving(true);
    try {
      await YachtMediaService.setVideo(yacht.id, next);
      onSaved(next);
      showToast({ status: 'success', text: next ? 'Video saved.' : 'Video removed.' });
    } catch (error) {
      showToast({ status: 'error', text: errorMessage(error, 'The video could not be saved.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard icon={<OndemandVideoOutlinedIcon />} title="Video" subtitle="Shown on the boat page of all 7 sites">
      {dialog}
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} alignItems={{ xs: 'stretch', sm: 'flex-start' }}>
        <TextField
          label="Video link"
          size="small"
          fullWidth
          value={value}
          onChange={e => setValue(e.target.value)}
          error={invalid}
          helperText={invalid ? `Not a supported link. ${HINT}` : HINT}
          slotProps={{ htmlInput: { inputMode: 'url', spellCheck: false }, formHelperText: { sx: { fontSize: 11 } } }}
        />
        <Stack direction="row" gap={1} sx={{ flexShrink: 0 }}>
          <Button
            variant="contained"
            disabled={saving || !parsed || unchanged}
            onClick={() => save(trimmed)}
            sx={{ ...primaryButtonSx, height: 40 }}
          >
            Save video
          </Button>
          {videoUrl && (
            <Button
              variant="outlined"
              disabled={saving}
              onClick={() =>
                ask({
                  title: 'Remove video',
                  text: `Remove the video from ${label}?`,
                  confirmText: 'Remove video',
                  onConfirm: () => save(null),
                })
              }
              sx={{ ...dangerButtonSx, height: 40 }}
            >
              Remove
            </Button>
          )}
        </Stack>
      </Stack>
      {preview && (
        <Box sx={{ mt: 1.5, maxWidth: 560 }}>
          <Typography sx={{ fontSize: 11, color: bbColors.gray500, mb: 0.5 }}>
            Preview{parsed && !unchanged ? ' (not saved yet)' : ''}
          </Typography>
          <Box
            sx={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: '8px', overflow: 'hidden' }}
          >
            <Box
              component="iframe"
              key={preview.embedUrl}
              src={preview.embedUrl}
              title={`${label} - video`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
            />
          </Box>
        </Box>
      )}
    </SectionCard>
  );
};

export default VideoSection;
