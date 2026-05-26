import { useTranslation } from 'react-i18next';

import { Box, Button, CircularProgress, IconButton, LinearProgress, Stack, Typography } from '@mui/material';
import cx from 'clsx';

import Download from '@/components/SvgIcons/Download';
import Trash from '@/components/SvgIcons/Trash';
import PDFIcon from '@/components/SvgIcons/Uploads/PDF';
import colors from '@/styles/themes/colors';
import { useImagePreview } from '@/utils/hooks/useImagePreview';
import FileUtils from '@/utils/static/FileUtils';
import { acceptedImageTypes } from '@/utils/static/FormValidator';

import styles from './FilePreview.module.scss';

export interface FileUploadProgress {
  fileName: string;
  progress: number;
  preview?: string;
}

interface FilePreviewProps {
  item: File | FileUploadProgress;
  onRemove: () => void;
  onCancel?: () => void;
  onDownload?: () => void;
}

const FilePreview = ({ item, onRemove, onCancel, onDownload }: FilePreviewProps) => {
  const { t } = useTranslation();

  const isFile = item instanceof File;
  const isUploading = !isFile && 'progress' in item;
  const fileName = isFile ? item.name : item.fileName;
  const progress = isUploading ? item.progress : undefined;
  const isCompleted = isFile || progress === 100;
  const isImage = isFile ? acceptedImageTypes.includes(item.type) : false;

  const uploadingPreview = isUploading ? item.preview : undefined;

  const currentFile = isFile ? item : null;
  const { previewUrl, fileSize: loadedFileSize, isLoading: isLoadingImage } = useImagePreview(currentFile);

  const displaySize = loadedFileSize || (isFile && item.size > 0 ? FileUtils.calcFileSize(item.size) : '');

  return (
    <Box className={cx(styles.container, { [styles.completed]: isCompleted })}>
      <Stack direction="row" gap={2} alignItems="center" width="100%">
        <Stack direction="column" alignItems="center" justifyContent="center" className={styles.iconContainer}>
          {(() => {
            if (isLoadingImage) {
              return <CircularProgress size={32} />;
            }

            if (isImage && previewUrl) {
              return <img src={previewUrl} alt={fileName} className={styles.imagePreview} />;
            }

            if (uploadingPreview) {
              return <img src={uploadingPreview} alt={fileName} className={styles.imagePreview} />;
            }

            return <PDFIcon size={32} fill={colors.blue500} />;
          })()}
        </Stack>
        <Stack direction="column" gap={0.5}>
          <Typography
            variant="body1"
            color={colors.black950}
            sx={{
              width: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {fileName}
          </Typography>
          {displaySize && (
            <Typography variant="body3" fontWeight={500} color={colors.black500}>
              {displaySize}
            </Typography>
          )}
        </Stack>
        {isUploading && progress !== undefined && !isCompleted && (
          <Stack direction="column" alignItems="flex-start" spacing={1}>
            <Typography variant="body2" color={colors.black600}>
              {Math.round(progress)}% {t('actions.uploaded')}
            </Typography>
            <Stack direction="row" width="100%">
              <LinearProgress
                variant="determinate"
                value={progress}
                className={styles.progressBar}
                sx={{
                  flex: 1,
                  height: 12,
                  borderRadius: 4,
                  backgroundColor: colors.blue50,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: colors.blue500,
                    borderRadius: 4,
                  },
                }}
              />
            </Stack>
          </Stack>
        )}
        <Stack direction="row" alignItems="center" justifyContent="center" marginLeft="auto">
          {isCompleted ? (
            <Stack direction="row" spacing={2}>
              {onDownload && (
                <IconButton onClick={onDownload}>
                  <Download size={24} />
                </IconButton>
              )}
              <Button
                variant="contained"
                color="error"
                onClick={e => {
                  e.stopPropagation();
                  onRemove();
                }}
                size="medium"
                startIcon={<Trash />}
              >
                {t('actions.delete')}
              </Button>
            </Stack>
          ) : (
            <Button
              variant="contained"
              color="secondary"
              size="medium"
              onClick={e => {
                e.stopPropagation();
                onCancel?.();
              }}
            >
              {t('actions.cancelUpload')}
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default FilePreview;
