import React, { ElementType, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Add } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import cx from 'clsx';

import PDFIcon from '@/components/SvgIcons/Uploads/PDF';
import colors from '@/styles/themes/colors';
import FileUtils from '@/utils/static/FileUtils';
import { acceptedImageTypes, acceptedMimeTypes } from '@/utils/static/FormValidator';

import styles from './FileInput.module.scss';

interface FileInputProps {
  isCardInput?: boolean;
  onChange: (file: File) => void;
  title?: string;
  description?: string;
  icon?: ElementType;
  acceptedFileTypes?: string;
  canAddMore?: boolean;
}

const FileInput = ({
  isCardInput = false,
  onChange,
  title,
  description,
  icon: Icon,
  acceptedFileTypes = acceptedMimeTypes,
  canAddMore,
}: FileInputProps) => {
  const [drag, setDrag] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleFileDragEnter = () => setDrag(true);
  const handleFileDragLeave = () => setDrag(false);
  const handleFileDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();

    const { files } = e.dataTransfer;

    setDrag(false);
    setError('');

    if (files) {
      Array.from(files).forEach(async file => {
        if (!acceptedFileTypes.includes(file.type)) {
          setError('One or more files have unsupported type.');

          return;
        }

        const isImage = acceptedImageTypes.includes(file.type);
        const fileToSend = isImage ? await FileUtils.resizeImageFile(file) : file;

        onChange(fileToSend);
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;

    if (files) {
      Array.from(files).forEach(async file => {
        if (!acceptedFileTypes.includes(file.type)) {
          setError('One or more files have unsupported type.');

          return;
        }

        const isImage = acceptedImageTypes.includes(file.type);
        const fileToSend = isImage ? await FileUtils.resizeImageFile(file) : file;

        onChange(fileToSend);
      });
    }
  };

  return (
    <>
      {isCardInput ? (
        <Stack
          direction="column"
          justifyContent="center"
          alignItems="center"
          gap={1}
          sx={{
            height: '189px',
            borderRadius: '4px',
            cursor: !canAddMore ? 'not-allowed' : 'pointer',
            backgroundColor: colors.black100,
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleFileDragEnter}
          onDragLeave={handleFileDragLeave}
          onDragOver={handleFileDragOver}
          onDrop={handleFileDrop}
        >
          <Add fontSize="large" />
          <Typography variant="h4" fontWeight={500} color={colors.black950} textAlign="center">
            {t('common.add-more')}
          </Typography>
        </Stack>
      ) : (
        <Box
          className={cx(styles.container, { [styles.active]: drag })}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleFileDragEnter}
          onDragLeave={handleFileDragLeave}
          onDragOver={handleFileDragOver}
          onDrop={handleFileDrop}
        >
          {drag ? (
            <Stack alignItems="center">
              <Typography variant="h3" fontWeight={700} color={colors.black950}>
                {title || t('common.dragAndDrop')}
              </Typography>
              <Typography variant="body1" color={colors.black950}>
                {description || t('common.browsePhoto')}
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={2} alignItems="center">
              {Icon ? <Icon variant="secondary" size={64} /> : <PDFIcon variant="secondary" size={64} />}
              <Stack alignItems="center">
                <Typography variant="h3" fontWeight={700} color={colors.black950}>
                  {title || t('common.dragAndDrop')}
                </Typography>
                <Typography variant="body1" color={colors.black950}>
                  {description || t('common.browsePhoto')}
                </Typography>
              </Stack>
              <Button variant="contained" size="large">
                {t('common.browse')}
              </Button>
            </Stack>
          )}
        </Box>
      )}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFileTypes}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
      {error && (
        <Typography variant="body1" color={colors.red500} mt={1}>
          {error}
        </Typography>
      )}
    </>
  );
};

export default FileInput;
