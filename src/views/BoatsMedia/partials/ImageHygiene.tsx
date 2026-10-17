import { ReactNode, useState } from 'react';

import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined';
import { Box, Button, Checkbox, Chip, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material';

import {
  BlockedImage,
  BlockedImageScan,
  LayoutCandidate,
  LayoutScan,
  MainImageFix,
  MainImageFixResult,
  errorMessage,
} from '@/services/yacht-media.api';
import YachtMediaService, { imageUrl } from '@/services/yacht-media.service';
import { bbColors } from '@/styles/bb';
import { showToast } from '@/valtio/global/global.actions';

import { Column, ResultTable, SectionCard, Stat, primaryButtonSx, secondaryButtonSx, useConfirm } from './ui';

/* Partner-image repairs of V9_91 (owner incident 16.10.2026), SYSTEM_ADMIN only like the backend: every tool runs a
 * dry run first and applies only after a confirm. */

const MAX_LAYOUT_LIMIT = 2000;

const imageLink = (id: number | null) =>
  id == null ? (
    '-'
  ) : (
    <a href={imageUrl(id, 800)} target="_blank" rel="noopener noreferrer">
      #{id}
    </a>
  );

const fixColumns: Column<MainImageFix>[] = [
  { label: 'Boat', render: r => r.yachtId },
  { label: 'Card photo from', render: r => imageLink(r.fromImageId) },
  { label: 'to', render: r => (r.toImageId == null ? 'none left' : imageLink(r.toImageId)) },
];

const blockedColumns: Column<BlockedImage>[] = [
  { label: 'Image', render: r => imageLink(r.imageId) },
  { label: 'Boat', render: r => r.yachtId },
  { label: 'Card photo', render: r => (r.main ? 'yes' : '') },
];

const Panel = ({ title, text, children }: { title: string; text: string; children: ReactNode }) => (
  <Box sx={{ border: `1px solid ${bbColors.gray200}`, borderRadius: '10px', p: { xs: 1.5, sm: 2 }, mb: 1.5 }}>
    <Typography component="h3" sx={{ fontSize: 13.5, fontWeight: 800, color: bbColors.navy900 }}>
      {title}
    </Typography>
    <Typography sx={{ fontSize: 12, color: bbColors.gray500, mt: 0.25, mb: 1.25 }}>{text}</Typography>
    {children}
  </Box>
);

const ResultHead = ({ dryRun }: { dryRun: boolean }) => (
  <Chip
    size="small"
    label={dryRun ? 'DRY RUN - nothing changed' : 'APPLIED'}
    sx={{
      height: 20,
      fontSize: 10.5,
      fontWeight: 800,
      borderRadius: '4px',
      mb: 1,
      backgroundColor: dryRun ? bbColors.amber100 : bbColors.green100,
      color: dryRun ? bbColors.amber700 : bbColors.green600,
    }}
  />
);

const ImageHygiene = () => {
  const { ask, dialog } = useConfirm();
  const [busy, setBusy] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<BlockedImageScan | null>(null);
  const [layoutMains, setLayoutMains] = useState<MainImageFixResult | null>(null);
  const [onlyMain, setOnlyMain] = useState(true);
  const [limit, setLimit] = useState(200);
  const [afterId, setAfterId] = useState(0);
  const [layoutScan, setLayoutScan] = useState<LayoutScan | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const run = async <T,>(key: string, call: () => Promise<T>, onDone: (result: T) => void, failText: string) => {
    setBusy(key);
    try {
      onDone(await call());
    } catch (error) {
      showToast({ status: 'error', text: errorMessage(error, failText) });
    } finally {
      setBusy(null);
    }
  };

  const scanBlocked = () =>
    run('blocked', () => YachtMediaService.detectBlocked(true), setBlocked, 'The placeholder scan failed.');

  const applyBlocked = () =>
    ask({
      title: 'Hide partner placeholders',
      text: `Hide ${blocked?.blocked.length ?? 0} placeholder image(s) and move the card photo of their boats? The backend scans again and hides what it finds now.`,
      confirmText: 'Hide placeholders',
      onConfirm: () =>
        run(
          'blocked',
          () => YachtMediaService.detectBlocked(false),
          result => {
            setBlocked(result);
            showToast({ status: 'success', text: `${result.blocked.length} placeholder(s) hidden.` });
          },
          'Hiding the placeholders failed.'
        ),
    });

  const checkLayoutMains = () =>
    run('mains', () => YachtMediaService.fixLayoutMains(true), setLayoutMains, 'The card-photo check failed.');

  const applyLayoutMains = () =>
    ask({
      title: 'Fix card photos',
      text: `Give ${layoutMains?.fixed.length ?? 0} boat(s) a photo as card photo instead of a layout drawing, a hidden or a missing image?`,
      confirmText: 'Fix card photos',
      onConfirm: () =>
        run(
          'mains',
          () => YachtMediaService.fixLayoutMains(false),
          result => {
            setLayoutMains(result);
            showToast({ status: 'success', text: `${result.fixed.length} card photo(s) fixed.` });
          },
          'Fixing the card photos failed.'
        ),
    });

  const scanLayouts = (from: number) =>
    run(
      'layout',
      () => YachtMediaService.detectLayout({ dryRun: true, onlyMain, afterId: from, limit }),
      result => {
        setAfterId(from);
        setLayoutScan(result);
        setSelected(new Set(result.candidates.map(c => c.imageId)));
      },
      'The layout scan failed.'
    );

  const applyLayouts = () => {
    const imageIds = Array.from(selected);

    ask({
      title: 'Flag layout drawings',
      text: `Flag ${imageIds.length} reviewed image(s) as layout drawings (${onlyMain ? 'main images only' : 'all images'})? Only the ones the detector still flags are changed; card photos move to a photo.`,
      confirmText: 'Flag as layout',
      onConfirm: () =>
        run(
          'layout',
          () => YachtMediaService.detectLayout({ dryRun: false, onlyMain, imageIds }),
          result => {
            setLayoutScan(result);
            setSelected(new Set());
            showToast({
              status: 'success',
              text: `${result.candidates.length} flagged as layout, ${result.skippedImageIds?.length ?? 0} skipped.`,
            });
          },
          'Flagging the layout drawings failed.'
        ),
    });
  };

  const toggle = (id: number) =>
    setSelected(prev => {
      const next = new Set(prev);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });

  const candidates: LayoutCandidate[] = layoutScan?.candidates ?? [];

  return (
    <SectionCard
      icon={<AutoFixHighOutlinedIcon />}
      title="Image hygiene"
      subtitle="Whole catalogue: partner placeholders and layout drawings. Every tool shows a dry run first."
    >
      {dialog}

      <Panel
        title="Partner placeholders"
        text="Stored partner images that are the partner's 'Picture is not shown due to possible legal issues' placeholder (NauSys model pictures)."
      >
        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: blocked ? 1.5 : 0 }}>
          <Button variant="outlined" size="small" disabled={busy !== null} onClick={scanBlocked} sx={secondaryButtonSx}>
            {busy === 'blocked' ? 'Scanning…' : 'Scan (dry run)'}
          </Button>
          {blocked?.dryRun && blocked.blocked.length > 0 && (
            <Button
              variant="contained"
              size="small"
              disabled={busy !== null}
              onClick={applyBlocked}
              sx={primaryButtonSx}
            >
              Hide {blocked.blocked.length}
            </Button>
          )}
        </Stack>
        {blocked && (
          <>
            <ResultHead dryRun={blocked.dryRun} />
            <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 1 }}>
              <Stat label="Scanned" value={blocked.scanned} />
              <Stat label="Hashed" value={blocked.hashed} />
              <Stat label="Missing files" value={blocked.missingFiles} />
              <Stat label="Placeholders" value={blocked.blocked.length} />
            </Stack>
            <ResultTable columns={blockedColumns} rows={blocked.blocked} empty="No placeholder found." />
            {!blocked.dryRun && (
              <Box sx={{ mt: 1 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5 }}>Card photos moved</Typography>
                <ResultTable columns={fixColumns} rows={blocked.mainImagesFixed} empty="No card photo moved." />
              </Box>
            )}
          </>
        )}
      </Panel>

      <Panel
        title="Card photo is a layout, hidden or missing"
        text="Active boats whose card photo (main_image_id) is a layout drawing, a hidden image or no image of the boat get their first photo instead."
      >
        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: layoutMains ? 1.5 : 0 }}>
          <Button
            variant="outlined"
            size="small"
            disabled={busy !== null}
            onClick={checkLayoutMains}
            sx={secondaryButtonSx}
          >
            {busy === 'mains' ? 'Checking…' : 'Check (dry run)'}
          </Button>
          {layoutMains?.dryRun && layoutMains.fixed.length > 0 && (
            <Button
              variant="contained"
              size="small"
              disabled={busy !== null}
              onClick={applyLayoutMains}
              sx={primaryButtonSx}
            >
              Fix {layoutMains.fixed.length}
            </Button>
          )}
        </Stack>
        {layoutMains && (
          <>
            <ResultHead dryRun={layoutMains.dryRun} />
            <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 1 }}>
              <Stat label="Layout mains" value={layoutMains.layoutMainCount} />
              <Stat label="Hidden mains" value={layoutMains.hiddenMainCount ?? 0} />
              <Stat label="Missing mains" value={layoutMains.missingMainCount ?? 0} />
              <Stat label={layoutMains.dryRun ? 'To fix' : 'Fixed'} value={layoutMains.fixed.length} />
            </Stack>
            <ResultTable columns={fixColumns} rows={layoutMains.fixed} empty="Nothing to fix." />
            {layoutMains.withoutPhotoYachtIds.length > 0 && (
              <Typography sx={{ fontSize: 11.5, color: bbColors.gray500, mt: 1 }}>
                Left as they are (no stored photo): boats {layoutMains.withoutPhotoYachtIds.join(', ')}
              </Typography>
            )}
          </>
        )}
      </Panel>

      <Panel
        title="Layout drawings the file name misses"
        text="The visual detector measures one page of images; review the candidates, untick the false positives, then flag the rest. Manual review stays mandatory."
      >
        <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="center" sx={{ mb: 1.5 }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={onlyMain}
                disabled={busy !== null}
                onChange={e => {
                  setOnlyMain(e.target.checked);
                  setLayoutScan(null);
                  setSelected(new Set());
                  setAfterId(0);
                }}
              />
            }
            label={<Typography sx={{ fontSize: 12.5 }}>Main images only</Typography>}
          />
          <TextField
            label="Page size"
            size="small"
            type="number"
            value={limit}
            disabled={busy !== null}
            onChange={e => setLimit(Math.max(1, Math.min(MAX_LAYOUT_LIMIT, Number(e.target.value) || 1)))}
            slotProps={{ htmlInput: { min: 1, max: MAX_LAYOUT_LIMIT } }}
            sx={{ width: 120 }}
          />
          <Button
            variant="outlined"
            size="small"
            disabled={busy !== null}
            onClick={() => scanLayouts(0)}
            sx={secondaryButtonSx}
          >
            {busy === 'layout' ? 'Scanning…' : 'Scan from the start'}
          </Button>
          {layoutScan?.dryRun && layoutScan.nextAfterId != null && (
            <Button
              variant="outlined"
              size="small"
              disabled={busy !== null}
              onClick={() => scanLayouts(layoutScan.nextAfterId ?? 0)}
              sx={secondaryButtonSx}
            >
              Next page (after #{layoutScan.nextAfterId})
            </Button>
          )}
        </Stack>

        {layoutScan && (
          <>
            <ResultHead dryRun={layoutScan.dryRun} />
            <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 1 }}>
              <Stat label="Scanned" value={layoutScan.scanned} />
              <Stat label="Unreadable" value={layoutScan.unreadable} />
              <Stat label="Candidates" value={candidates.length} />
              {layoutScan.dryRun && <Stat label="From id" value={afterId} />}
              {!layoutScan.dryRun && <Stat label="Skipped" value={layoutScan.skippedImageIds?.length ?? 0} />}
            </Stack>

            {layoutScan.dryRun && candidates.length > 0 && (
              <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center" sx={{ mb: 1 }}>
                <Button
                  size="small"
                  onClick={() => setSelected(new Set(candidates.map(c => c.imageId)))}
                  sx={secondaryButtonSx}
                >
                  Select all
                </Button>
                <Button size="small" onClick={() => setSelected(new Set())} sx={secondaryButtonSx}>
                  Select none
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  disabled={busy !== null || selected.size === 0}
                  onClick={applyLayouts}
                  sx={primaryButtonSx}
                >
                  Flag {selected.size} as layout
                </Button>
              </Stack>
            )}

            {candidates.length === 0 ? (
              <Typography sx={{ fontSize: 12.5, color: bbColors.gray500 }}>
                {layoutScan.dryRun ? 'No candidate on this page.' : 'Nothing flagged.'}
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, minmax(0, 1fr))',
                    sm: 'repeat(4, minmax(0, 1fr))',
                    lg: 'repeat(6, minmax(0, 1fr))',
                  },
                  gap: 1,
                }}
              >
                {candidates.map(c => {
                  const checked = selected.has(c.imageId);

                  return (
                    <Box
                      key={c.imageId}
                      sx={{
                        border: `2px solid ${checked && layoutScan.dryRun ? bbColors.navy700 : bbColors.gray200}`,
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: bbColors.white,
                      }}
                    >
                      <Box
                        component="img"
                        src={imageUrl(c.imageId, 200)}
                        alt={`Candidate image ${c.imageId} of boat ${c.yachtId}`}
                        loading="lazy"
                        sx={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'contain' }}
                      />
                      <Stack direction="row" alignItems="center" sx={{ px: 0.5, py: 0.25 }}>
                        {layoutScan.dryRun && (
                          <Checkbox
                            size="small"
                            checked={checked}
                            onChange={() => toggle(c.imageId)}
                            inputProps={{ 'aria-label': `Flag image ${c.imageId} as layout` }}
                            sx={{ p: 0.5 }}
                          />
                        )}
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700 }} noWrap>
                            #{c.imageId} · boat {c.yachtId}
                            {c.main ? ' · main' : ''}
                          </Typography>
                          <Typography sx={{ fontSize: 10.5, color: bbColors.gray500 }} noWrap>
                            score {c.score.toFixed(2)} · {c.width}×{c.height}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  );
                })}
              </Box>
            )}

            {!layoutScan.dryRun && (
              <Box sx={{ mt: 1.25 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5 }}>Card photos moved</Typography>
                <ResultTable columns={fixColumns} rows={layoutScan.mainImagesFixed} empty="No card photo moved." />
                {(layoutScan.skippedImageIds?.length ?? 0) > 0 && (
                  <Typography sx={{ fontSize: 11.5, color: bbColors.gray500, mt: 1 }}>
                    Skipped (no longer candidates, untouched): {layoutScan.skippedImageIds?.join(', ')}
                  </Typography>
                )}
              </Box>
            )}
          </>
        )}
      </Panel>
    </SectionCard>
  );
};

export default ImageHygiene;
