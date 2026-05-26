import CloseIcon from '@mui/icons-material/Close';
import { CircularProgress, IconButton, Stack, Typography } from '@mui/material';

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
}

const FilePreview = ({ item, onRemove, onCancel }: FilePreviewProps) => {
  const isFile = item instanceof File;
  const isUploading = !isFile && 'progress' in item;
  const fileName = isFile ? item.name : item.fileName;
  const progress = isUploading ? item.progress : undefined;
  const isCompleted = isFile || progress === 100;
  const isImage = isFile ? acceptedImageTypes.includes(item.type) : false;

  const uploadingPreview = isUploading ? item.preview : undefined;

  const currentFile = isFile ? item : null;
  const { previewUrl, fileSize, isLoading: isLoadingImage } = useImagePreview(currentFile);

  const displaySize = fileSize || (isFile && item.size > 0 ? FileUtils.calcFileSize(item.size) : '');

  return (
    <Stack direction="column" position="relative" className={styles.container}>
      <Stack
        height="100%"
        direction="column"
        alignItems="center"
        justifyContent="center"
        className={styles.itemPreview}
      >
        {(() => {
          if (isLoadingImage) {
            return (
              <Stack alignItems="center" justifyContent="center" height="100%">
                <CircularProgress size={32} />
              </Stack>
            );
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
      {isCompleted && (
        <Stack className={styles.chip}>
          {displaySize && (
            <Typography variant="body3" fontWeight={500} color={colors.black500}>
              {displaySize}
            </Typography>
          )}
        </Stack>
      )}
      {isUploading && progress !== undefined && !isCompleted && (
        <Stack className={styles.progressBarWrapper} direction="column" alignItems="center" justifyContent="center">
          <CircularProgress sx={{ color: colors.white }} />
        </Stack>
      )}
      <Stack position="absolute" top={8} right={8}>
        {isCompleted ? (
          <IconButton
            onClick={e => {
              e.stopPropagation();
              onRemove();
            }}
            size="medium"
            sx={{
              boxShadow: '0px 4px 14px 0px rgb(0 0 0 / 15%)',
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        ) : (
          <IconButton
            size="medium"
            onClick={e => {
              e.stopPropagation();
              onCancel?.();
            }}
            sx={{
              boxShadow: '0px 4px 14px 0px rgb(0 0 0 / 15%)',
            }}
          >
            <Trash />
          </IconButton>
        )}
      </Stack>
    </Stack>
  );
};

export default FilePreview;
