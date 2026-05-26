import { ElementType, useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Stack } from '@mui/material';

import FileInput from '@/components/FileInput';
import FormInput, { FormInputProps } from '@/components/Forms/FormInput';
import FilePreview from '@/components/SingleDocumentUpload/FilePreview';
import { acceptedImageTypes, acceptedMimeTypes } from '@/utils/static/FormValidator';

interface SingleDocumentUploadProps {
  title?: string;
  description?: string;
  icon?: ElementType;
  fieldName: string;
  acceptedFileTypes?: string;
  uploadMethod?: (file: File) => Promise<void>;
  deleteMethod?: (fileId: string) => Promise<void>;
  downloadMethod?: (file: File) => void | Promise<void>;
  onUploadProgress?: (progress: number) => void;
  hasDownloadButton?: boolean;
}

const SingleDocumentUpload = ({
  title,
  description,
  icon,
  fieldName,
  acceptedFileTypes = acceptedMimeTypes,
  uploadMethod,
  deleteMethod,
  downloadMethod,
  onUploadProgress,
  hasDownloadButton = false,
}: SingleDocumentUploadProps) => {
  const { watch, setValue } = useFormContext();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileData, setUploadingFileData] = useState<{
    fileName: string;
    progress: number;
    preview?: string;
  } | null>(null);

  const currentFile = watch(fieldName);

  const createImagePreview = useCallback(
    (file: File): Promise<string> =>
      new Promise(resolve => {
        const reader = new FileReader();

        reader.onload = e => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      }),
    []
  );

  const downloadFile = async (file: File) => {
    let downloadUrl: string;
    let shouldRevokeUrl = false;

    if (file.size === 0) {
      const imageIdMatch = file.name.match(/yacht-image-(\d+)/);
      const pdfIdMatch = file.name.match(/yacht-brochure-(\d+)/);

      if (imageIdMatch) {
        const imageId = imageIdMatch[1];

        downloadUrl = `${import.meta.env.VITE_BOAT_API_URL}/public/image/${imageId}`;
      } else if (pdfIdMatch) {
        return;
      } else {
        return;
      }
    } else {
      downloadUrl = URL.createObjectURL(file);
      shouldRevokeUrl = true;
    }

    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = file.name;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (shouldRevokeUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
  };

  const simulateUploadProgress = useCallback(
    (file: File) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;

        setUploadingFileData(prev => (prev ? { ...prev, progress: Math.min(progress, 100) } : null));
        onUploadProgress?.(Math.min(progress, 100));

        if (progress >= 100) {
          clearInterval(interval);
          setValue(fieldName, file);
          setIsUploading(false);
          setUploadingFileData(null);
        }
      }, 150);
    },
    [setValue, fieldName, onUploadProgress]
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);

      const isImage = acceptedImageTypes.includes(file.type);
      const preview = isImage ? await createImagePreview(file) : undefined;

      setUploadingFileData({
        fileName: file.name,
        progress: 0,
        preview,
      });

      try {
        if (uploadMethod) {
          await uploadMethod(file);
          setIsUploading(false);
          setUploadingFileData(null);
        } else {
          simulateUploadProgress(file);
        }
      } catch {
        setIsUploading(false);
        setUploadingFileData(null);
      }
    },
    [uploadMethod, createImagePreview, simulateUploadProgress]
  );

  const handleRemoveFile = useCallback(async () => {
    if (!currentFile) return;

    try {
      if (deleteMethod) {
        let fileId = currentFile.name;

        if (fileId.startsWith('yacht-image-')) {
          fileId = fileId.replace('yacht-image-', '');
        }

        fileId = fileId.replace(/\.[^/.]+$/, '');

        await deleteMethod(fileId);
      }

      setValue(fieldName, null);
    } catch {
      if (!deleteMethod) {
        setValue(fieldName, null);
      }
    }
  }, [currentFile, deleteMethod, setValue, fieldName]);

  const handleUploadCancel = useCallback(() => {
    setIsUploading(false);
    setUploadingFileData(null);
  }, []);

  const shouldShowInput = !currentFile && !isUploading;

  const renderFileInput: FormInputProps['renderInput'] = useCallback(
    () => (
      <FileInput
        onChange={handleFileUpload}
        title={title}
        description={description}
        icon={icon}
        acceptedFileTypes={acceptedFileTypes}
      />
    ),
    [handleFileUpload, title, description, icon, acceptedFileTypes]
  );

  return (
    <Stack spacing={2}>
      {shouldShowInput && <FormInput name={fieldName} renderInput={renderFileInput} />}

      {currentFile && (
        <FilePreview
          item={currentFile}
          onRemove={handleRemoveFile}
          onDownload={
            hasDownloadButton
              ? () => (downloadMethod ? downloadMethod(currentFile) : downloadFile(currentFile))
              : undefined
          }
        />
      )}

      {uploadingFileData && (
        <FilePreview item={uploadingFileData} onRemove={handleRemoveFile} onCancel={handleUploadCancel} />
      )}
    </Stack>
  );
};

export default SingleDocumentUpload;
