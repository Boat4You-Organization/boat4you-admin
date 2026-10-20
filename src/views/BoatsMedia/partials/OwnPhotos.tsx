import { Dispatch, DragEvent, SetStateAction, useRef, useState } from 'react';

import ArchitectureOutlinedIcon from '@mui/icons-material/ArchitectureOutlined';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box, Button, Chip, IconButton, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';

import {
  AdminYachtImage,
  IMAGE_ACCEPT,
  ImagePatch,
  MAX_FILES_PER_REQUEST,
  MediaImage,
  YachtLookupItem,
  YachtMediaDto,
  applyAdminImage,
  canBeMain,
  canDelete,
  errorMessage,
  imageFileProblem,
  moveItem,
} from '@/services/yacht-media.api';
import YachtMediaService, { imageUrl } from '@/services/yacht-media.service';
import { bbColors } from '@/styles/bb';
import FileUtils from '@/utils/static/FileUtils';
import { showToast } from '@/valtio/global/global.actions';

import { SectionCard, secondaryButtonSx, useConfirm } from './ui';

type UploadStatus = 'queued' | 'uploading' | 'done' | 'error' | 'rejected';

interface UploadItem {
  key: string;
  name: string;
  size: number;
  progress: number;
  status: UploadStatus;
  note?: string;
}

interface OwnPhotosProps {
  yacht: YachtLookupItem;
  label: string;
  images: MediaImage[];
  /** Grid changes of this boat (dropped once another boat is selected). */
  setImages: Dispatch<SetStateAction<MediaImage[]>>;
  /** The boat's media as an upload, order change or delete answers it. */
  onMedia: (media: YachtMediaDto) => void;
  /** Re-reads the boat's media (GET /admin/yachts/{id}/media). */
  reload: () => void;
  loading: boolean;
}

const chipSx = { height: 20, fontSize: 10.5, fontWeight: 800, borderRadius: '4px' } as const;

const iconButtonSx = {
  padding: '5px',
  borderRadius: '6px',
  backgroundColor: 'rgba(255,255,255,0.92)',
  color: bbColors.navy900,
  '&:hover': { backgroundColor: bbColors.white },
  '&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.6)' },
} as const;

const statusColor: Record<UploadStatus, string> = {
  queued: bbColors.gray500,
  uploading: bbColors.navy700,
  done: bbColors.green600,
  error: bbColors.red600,
  rejected: bbColors.red600,
};

const statusLabel: Record<UploadStatus, string> = {
  queued: 'Waiting',
  uploading: 'Sending',
  done: 'Stored',
  error: 'Not stored',
  rejected: 'Refused',
};

const isFileDrag = (e: DragEvent) => Array.from(e.dataTransfer.types).includes('Files');

// No readable answer: the network, or nginx refusing a body over its limit (its 413 page carries no CORS header).
const UPLOAD_NO_ANSWER = 'No answer from the API: a network error, or a request larger than the proxy allows.';

const OwnPhotos = ({ yacht, label, images, setImages, onMedia, reload, loading }: OwnPhotosProps) => {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileDragOver, setFileDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { ask, dialog } = useConfirm();

  const ownCount = images.filter(img => img.source === 'OWN').length;
  const hiddenCount = images.filter(img => img.hidden).length;

  const upload = async (files: File[]) => {
    if (files.length === 0 || uploading) return;

    const stamp = Date.now();
    const items: UploadItem[] = files.map((file, i) => {
      const problem = imageFileProblem(file);

      return {
        key: `${stamp}-${i}`,
        name: file.name,
        size: file.size,
        progress: 0,
        status: problem ? 'rejected' : 'queued',
        note: problem ?? undefined,
      };
    });
    const accepted = files.filter((_, i) => items[i].status === 'queued');
    const acceptedKeys = items.filter(item => item.status === 'queued').map(item => item.key);

    setUploads(items);

    if (accepted.length === 0) {
      showToast({ status: 'warning', text: 'No photo to upload: only JPEG, PNG or WebP up to 10 MB.' });

      return;
    }

    setUploading(true);

    const outcome = await YachtMediaService.uploadImages(yacht.id, accepted, (perFile, stored) => {
      setUploads(prev =>
        prev.map(item => {
          const i = acceptedKeys.indexOf(item.key);

          if (i < 0) return item;

          let status: UploadStatus = 'queued';

          if (i < stored) status = 'done';
          else if (perFile[i] > 0) status = 'uploading';

          return { ...item, progress: perFile[i], status };
        })
      );
    });

    setUploads(prev =>
      prev.map(item => {
        const i = acceptedKeys.indexOf(item.key);

        if (i < 0) return item;

        if (i < outcome.uploaded) return { ...item, progress: 1, status: 'done' };

        return { ...item, status: 'error', note: errorMessage(outcome.error, 'Upload failed') };
      })
    );
    setUploading(false);

    if (outcome.media) onMedia(outcome.media);
    else if (outcome.uploaded > 0) reload();

    if (outcome.error) {
      showToast({
        status: 'error',
        text: `${outcome.uploaded} of ${accepted.length} photos stored. ${errorMessage(outcome.error, UPLOAD_NO_ANSWER)}`,
      });
    } else {
      const refused = files.length - accepted.length;

      showToast({
        status: refused > 0 ? 'warning' : 'success',
        text: `${outcome.uploaded} photo${outcome.uploaded === 1 ? '' : 's'} stored${refused > 0 ? `, ${refused} refused` : ''}.`,
      });
    }
  };

  const onFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);

    e.target.value = '';
    upload(files);
  };

  const onDropZoneDrop = (e: DragEvent) => {
    if (!isFileDrag(e)) return;

    e.preventDefault();
    setFileDragOver(false);
    upload(Array.from(e.dataTransfer.files));
  };

  const patch = async (img: MediaImage, body: ImagePatch, done: string) => {
    setBusyId(img.id);
    try {
      const dto: AdminYachtImage = await YachtMediaService.patchImage(img.id, body);

      setImages(prev => applyAdminImage(prev, dto));
      showToast({ status: 'success', text: done });
    } catch (error) {
      showToast({ status: 'error', text: errorMessage(error, 'The image could not be changed.') });
    } finally {
      setBusyId(null);
    }
  };

  const saveOrder = async (next: MediaImage[]) => {
    const previous = images;

    setImages(next.map((img, i) => ({ ...img, position: i })));
    try {
      onMedia(
        await YachtMediaService.reorderImages(
          yacht.id,
          next.map(img => img.id)
        )
      );
      showToast({ status: 'success', text: 'Order saved.' });
    } catch (error) {
      setImages(previous);
      showToast({ status: 'error', text: errorMessage(error, 'The order could not be saved.') });
    }
  };

  const move = (from: number, to: number) => {
    const next = moveItem(images, from, to);

    if (next !== images) saveOrder(next);
  };

  const remove = (img: MediaImage) =>
    ask({
      title: 'Delete photo',
      text: `Delete photo #${img.id} of ${label}? Own photos only (a partner photo is refused - hide it instead); the file is removed for good.`,
      confirmText: 'Delete photo',
      onConfirm: async () => {
        setBusyId(img.id);
        try {
          onMedia(await YachtMediaService.deleteImage(yacht.id, img.id));
          showToast({ status: 'success', text: 'Photo deleted.' });
        } catch (error) {
          // 409 = a partner photo: the next sync would bring it back.
          showToast({
            status: 'error',
            text: errorMessage(error, 'Not deleted. Partner photos cannot be deleted - hide them instead.'),
          });
        } finally {
          setBusyId(null);
        }
      },
    });

  return (
    <SectionCard
      icon={<PhotoLibraryOutlinedIcon />}
      title="Own photos"
      subtitle={
        <>
          {images.length} image{images.length === 1 ? '' : 's'}
          {ownCount > 0 && ` · ${ownCount} own`}
          {hiddenCount > 0 && ` · ${hiddenCount} hidden`} · own photos come first, the partner syncs never touch them
        </>
      }
      actions={
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshRoundedIcon />}
          onClick={() => reload()}
          disabled={loading || uploading}
          sx={secondaryButtonSx}
        >
          Reload
        </Button>
      }
    >
      {dialog}
      <Box
        role="button"
        tabIndex={0}
        aria-label="Upload photos: drop files here or press Enter to choose"
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={e => {
          if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={e => {
          if (!isFileDrag(e)) return;

          e.preventDefault();
          setFileDragOver(true);
        }}
        onDragLeave={() => setFileDragOver(false)}
        onDrop={onDropZoneDrop}
        sx={{
          border: `2px dashed ${fileDragOver ? bbColors.navy700 : bbColors.gray300}`,
          backgroundColor: fileDragOver ? '#eef4ff' : bbColors.gray75,
          borderRadius: '10px',
          p: { xs: 2, sm: 2.5 },
          textAlign: 'center',
          cursor: uploading ? 'progress' : 'pointer',
          outline: 'none',
          '&:focus-visible': { borderColor: bbColors.navy700 },
        }}
      >
        <CloudUploadOutlinedIcon sx={{ color: bbColors.navy700, fontSize: 30 }} aria-hidden />
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: bbColors.navy900 }}>
          {uploading ? 'Uploading…' : 'Drop photos here or click to choose'}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: bbColors.gray500, mt: 0.25 }}>
          JPEG, PNG or WebP, up to 10 MB each · sent {MAX_FILES_PER_REQUEST} at a time · stored after the boat&apos;s
          existing own photos, before the partner&apos;s
        </Typography>
        <input ref={inputRef} type="file" accept={IMAGE_ACCEPT} multiple hidden onChange={onFilesPicked} />
      </Box>

      {uploads.length > 0 && (
        <Box sx={{ mt: 1.5, maxHeight: 240, overflowY: 'auto', pr: 0.5 }} aria-live="polite">
          {uploads.map(item => (
            <Stack key={item.key} direction="row" alignItems="center" gap={1} sx={{ py: 0.5 }}>
              <Typography
                sx={{
                  fontSize: 12,
                  flex: '0 1 40%',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={item.name}
              >
                {item.name}
              </Typography>
              <Typography sx={{ fontSize: 11, color: bbColors.gray500, flexShrink: 0, width: 64 }}>
                {FileUtils.calcFileSize(item.size)}
              </Typography>
              <Box sx={{ flex: 1, minWidth: 40 }}>
                {item.status === 'rejected' || item.status === 'error' ? (
                  <Typography sx={{ fontSize: 11, color: bbColors.red600 }} title={item.note}>
                    {item.note}
                  </Typography>
                ) : (
                  <LinearProgress
                    variant="determinate"
                    value={Math.round(item.progress * 100)}
                    color={item.status === 'done' ? 'success' : 'primary'}
                    aria-label={`${item.name} ${Math.round(item.progress * 100)}%`}
                  />
                )}
              </Box>
              <Typography
                sx={{ fontSize: 11, fontWeight: 700, color: statusColor[item.status], flexShrink: 0, width: 72 }}
              >
                {statusLabel[item.status]}
              </Typography>
            </Stack>
          ))}
        </Box>
      )}

      {images.length === 0 && !loading && (
        <Typography sx={{ fontSize: 12.5, color: bbColors.gray500, mt: 2 }}>
          No image yet.
        </Typography>
      )}

      {images.length > 0 && (
        <Box
          sx={{
            mt: 2,
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              sm: 'repeat(3, minmax(0, 1fr))',
              lg: 'repeat(5, minmax(0, 1fr))',
            },
            gap: 1.25,
          }}
        >
          {images.map((img, index) => {
            const busy = busyId === img.id;

            return (
              <Box
                key={img.id}
                draggable={!busy}
                onDragStart={e => {
                  setDragIndex(index);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', String(img.id));
                }}
                onDragEnd={() => setDragIndex(null)}
                onDragOver={e => {
                  if (dragIndex === null || isFileDrag(e)) return;

                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={e => {
                  if (dragIndex === null || isFileDrag(e)) return;

                  e.preventDefault();
                  move(dragIndex, index);
                  setDragIndex(null);
                }}
                sx={{
                  position: 'relative',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: `2px solid ${img.mainImage ? bbColors.yellow500 : bbColors.gray200}`,
                  backgroundColor: bbColors.gray100,
                  opacity: dragIndex === index || busy ? 0.5 : 1,
                  cursor: 'grab',
                }}
              >
                <Box
                  component="img"
                  src={imageUrl(img.id, 400)}
                  alt={`${label} - photo ${index + 1}`}
                  loading="lazy"
                  draggable={false}
                  sx={{
                    display: 'block',
                    width: '100%',
                    aspectRatio: '4 / 3',
                    objectFit: img.layout ? 'contain' : 'cover',
                    backgroundColor: bbColors.white,
                    filter: img.hidden ? 'grayscale(1)' : undefined,
                    opacity: img.hidden ? 0.55 : 1,
                  }}
                />
                <Stack
                  direction="row"
                  gap={0.5}
                  flexWrap="wrap"
                  sx={{ position: 'absolute', top: 6, left: 6, right: 6 }}
                >
                  {img.mainImage && (
                    <Chip
                      label="MAIN"
                      size="small"
                      sx={{ ...chipSx, backgroundColor: bbColors.yellow500, color: bbColors.yellowText }}
                    />
                  )}
                  {img.source === 'OWN' && (
                    <Chip
                      label="OWN"
                      size="small"
                      sx={{ ...chipSx, backgroundColor: bbColors.green100, color: bbColors.green600 }}
                    />
                  )}
                  {img.source === 'PARTNER' && (
                    <Chip
                      label="PARTNER"
                      size="small"
                      sx={{ ...chipSx, backgroundColor: bbColors.gray100, color: bbColors.navy900 }}
                    />
                  )}
                  {img.layout && (
                    <Chip
                      label="LAYOUT"
                      size="small"
                      sx={{ ...chipSx, backgroundColor: '#e4edff', color: bbColors.navy700 }}
                    />
                  )}
                  {img.hidden && (
                    <Chip
                      label="HIDDEN"
                      size="small"
                      sx={{ ...chipSx, backgroundColor: bbColors.red100, color: bbColors.red600 }}
                    />
                  )}
                </Stack>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    px: 0.75,
                    py: 0.5,
                    backgroundColor: bbColors.white,
                    borderTop: `1px solid ${bbColors.gray200}`,
                  }}
                >
                  <Stack direction="row" alignItems="center" sx={{ color: bbColors.gray500, minWidth: 0 }}>
                    <DragIndicatorIcon sx={{ fontSize: 16 }} aria-hidden />
                    <Typography sx={{ fontSize: 10.5, color: bbColors.gray500 }} noWrap>
                      {index + 1} · #{img.id}
                    </Typography>
                  </Stack>
                  <Stack direction="row" gap={0.25}>
                    <Tooltip title="Move earlier" arrow>
                      <span>
                        <IconButton
                          size="small"
                          aria-label="Move earlier"
                          disabled={index === 0 || busy}
                          onClick={() => move(index, index - 1)}
                          sx={iconButtonSx}
                        >
                          <ChevronLeftRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Move later" arrow>
                      <span>
                        <IconButton
                          size="small"
                          aria-label="Move later"
                          disabled={index === images.length - 1 || busy}
                          onClick={() => move(index, index + 1)}
                          sx={iconButtonSx}
                        >
                          <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Stack>
                <Stack direction="row" gap={0.5} sx={{ position: 'absolute', right: 6, bottom: 40 }}>
                  <Tooltip title={img.mainImage ? 'Main photo' : 'Set as main'} arrow>
                    <span>
                      <IconButton
                        size="small"
                        aria-label="Set as main"
                        disabled={busy || img.mainImage || !canBeMain(img)}
                        onClick={() => patch(img, { main: true }, 'Main photo set.')}
                        sx={iconButtonSx}
                      >
                        {img.mainImage ? (
                          <StarRoundedIcon sx={{ fontSize: 17, color: '#d9a400' }} />
                        ) : (
                          <StarBorderRoundedIcon sx={{ fontSize: 17 }} />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={img.layout ? 'Layout drawing - mark as photo' : 'Mark as layout drawing'} arrow>
                    <span>
                      <IconButton
                        size="small"
                        aria-label="Toggle layout"
                        aria-pressed={img.layout}
                        disabled={busy}
                        onClick={() =>
                          patch(img, { layout: !img.layout }, img.layout ? 'Marked as photo.' : 'Marked as layout.')
                        }
                        sx={{ ...iconButtonSx, color: img.layout ? bbColors.navy700 : bbColors.navy900 }}
                      >
                        <ArchitectureOutlinedIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={img.hidden ? 'Hidden - show again' : 'Hide from the sites'} arrow>
                    <span>
                      <IconButton
                        size="small"
                        aria-label="Toggle hidden"
                        aria-pressed={img.hidden}
                        disabled={busy}
                        onClick={() => patch(img, { hidden: !img.hidden }, img.hidden ? 'Shown again.' : 'Hidden.')}
                        sx={{ ...iconButtonSx, color: img.hidden ? bbColors.red600 : bbColors.navy900 }}
                      >
                        {img.hidden ? (
                          <VisibilityOffOutlinedIcon sx={{ fontSize: 17 }} />
                        ) : (
                          <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                  {canDelete(img) && (
                    <Tooltip title="Delete own photo" arrow>
                      <span>
                        <IconButton
                          size="small"
                          aria-label="Delete own photo"
                          disabled={busy}
                          onClick={() => remove(img)}
                          sx={{ ...iconButtonSx, color: bbColors.red600 }}
                        >
                          <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}
      <Typography sx={{ fontSize: 11, color: bbColors.gray500, mt: 1.25 }}>
        Drag a card (or use the arrows) to change the order; it is saved at once. Hidden images stay listed here (grey)
        so they can be shown again; the sites never show them.
      </Typography>
    </SectionCard>
  );
};

export default OwnPhotos;
