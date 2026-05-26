import { ElementType, useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Grid, Stack } from '@mui/material';

import FileInput from '@/components/FileInput';
import FormInput, { FormInputProps } from '@/components/Forms/FormInput';
import { FileUploadProgress } from '@/components/SingleDocumentUpload/FilePreview/FilePreview';
import { acceptedImageTypes, acceptedMimeTypes } from '@/utils/static/FormValidator';

import styles from './DocumentsUpload.module.scss';
import FilePreview from './FilePreview';

interface DocumentsUploadProps {
  title?: string;
  description?: string;
  icon?: ElementType;
  fieldName: string;
  multiple?: boolean;
  acceptedFileTypes?: string;
  onUploadProgress?: (fileName: string, progress: number) => void;
  maxFiles?: number;
  uploadMethod?: (files: File[]) => Promise<boolean | number[]>;
  deleteMethod?: (fileId: string) => Promise<boolean>;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const DocumentsUpload = ({
  title,
  description,
  icon,
  fieldName,
  multiple = false,
  acceptedFileTypes = acceptedMimeTypes,
  onUploadProgress,
  maxFiles = 10,
  uploadMethod,
  deleteMethod,
}: DocumentsUploadProps) => {
  const { watch, setValue } = useFormContext();
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, FileUploadProgress>>(new Map());

  const currentValue = watch(fieldName);
  const existingFiles: File[] = (() => {
    if (multiple) {
      const files = currentValue || [];

      return files.filter((file: File) => file instanceof File);
    }

    return currentValue && currentValue instanceof File ? [currentValue] : [];
  })();

  const createImagePreview = (file: File): Promise<string> =>
    new Promise(resolve => {
      const reader = new FileReader();

      reader.onload = e => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });

  const simulateUpload = useCallback(
    (fileId: string, file: File) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;

        if (progress >= 100) {
          clearInterval(interval);
          setUploadingFiles(prev => {
            const newMap = new Map(prev);

            newMap.delete(fileId);

            return newMap;
          });

          if (multiple) {
            const currentFiles = watch(fieldName) || [];

            setValue(fieldName, [...currentFiles, file]);
          } else {
            setValue(fieldName, file);
          }
        } else {
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(fileId);

            if (existing) {
              newMap.set(fileId, { ...existing, progress: Math.min(progress, 100) });
            }

            return newMap;
          });
          onUploadProgress?.(file.name, Math.min(progress, 100));
        }
      }, 200);
    },
    [setValue, watch, fieldName, multiple, onUploadProgress]
  );

  const handleRealUpload = useCallback(
    async (files: File[]): Promise<boolean | number[]> => {
      if (!uploadMethod) return false;

      try {
        return await uploadMethod(files);
      } catch {
        return false;
      }
    },
    [uploadMethod]
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      const totalFiles = existingFiles.length + uploadingFiles.size;

      if (totalFiles >= maxFiles) return;

      if (!multiple && (existingFiles.length > 0 || uploadingFiles.size > 0)) {
        setUploadingFiles(new Map());
        setValue(fieldName, undefined);
      }

      const fileId = generateId();
      const isImage = acceptedImageTypes.includes(file.type);
      const preview = isImage ? await createImagePreview(file) : undefined;

      setUploadingFiles(prev =>
        new Map(prev).set(fileId, {
          fileName: file.name,
          progress: 0,
          preview,
        })
      );

      if (uploadMethod) {
        try {
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(fileId);

            if (existing) {
              newMap.set(fileId, { ...existing, progress: 50 });
            }

            return newMap;
          });

          const result = await handleRealUpload([file]);

          if (result) {
            setUploadingFiles(prev => {
              const newMap = new Map(prev);

              newMap.delete(fileId);

              return newMap;
            });

            let fileName = file.name;

            if (Array.isArray(result) && result.length > 0) {
              const imageId = result[0];
              const fileExtension = file.name.split('.').pop();

              fileName = `yacht-image-${imageId}.${fileExtension}`;
            } else if (result === true) {
              const timestamp = Date.now();
              const fileExtension = file.name.split('.').pop();

              fileName = `yacht-image-${timestamp}.${fileExtension}`;
            }

            const renamedFile = new File([file], fileName, { type: file.type });

            if (multiple) {
              const currentFiles = watch(fieldName) || [];

              setValue(fieldName, [...currentFiles, renamedFile]);
            } else {
              setValue(fieldName, renamedFile);
            }
          } else {
            setUploadingFiles(prev => {
              const newMap = new Map(prev);

              newMap.delete(fileId);

              return newMap;
            });
          }
        } catch {
          setUploadingFiles(prev => {
            const newMap = new Map(prev);

            newMap.delete(fileId);

            return newMap;
          });
        }
      } else {
        simulateUpload(fileId, file);
      }
    },
    [
      existingFiles.length,
      uploadingFiles.size,
      maxFiles,
      multiple,
      setValue,
      fieldName,
      uploadMethod,
      handleRealUpload,
      simulateUpload,
      watch,
    ]
  );

  const handleRemoveFile = useCallback(
    async (index: number) => {
      const fileToRemove = existingFiles[index];

      if (deleteMethod && fileToRemove) {
        try {
          await deleteMethod(fileToRemove.name);
        } catch {
          return;
        }
      }

      if (multiple) {
        const currentFiles = watch(fieldName) || [];

        setValue(
          fieldName,
          currentFiles.filter((_: File, i: number) => i !== index)
        );
      } else {
        setValue(fieldName, undefined);
      }
    },
    [watch, setValue, fieldName, multiple, deleteMethod, existingFiles]
  );

  const handleUploadCancel = useCallback((fileId: string) => {
    setUploadingFiles(prev => {
      const newMap = new Map(prev);

      newMap.delete(fileId);

      return newMap;
    });
  }, []);

  const hasFiles = existingFiles.length > 0 || uploadingFiles.size > 0;
  const canAddMore = existingFiles.length < maxFiles;

  const renderFileInput: FormInputProps['renderInput'] = () => (
    <FileInput
      onChange={handleFileUpload}
      title={title}
      description={description}
      icon={icon}
      acceptedFileTypes={acceptedFileTypes}
    />
  );

  const renderCardFileInput: FormInputProps['renderInput'] = () => (
    <FileInput
      isCardInput
      onChange={handleFileUpload}
      title={title}
      description={description}
      icon={icon}
      acceptedFileTypes={acceptedFileTypes}
      canAddMore={canAddMore}
    />
  );

  return (
    <Stack spacing={2}>
      {!hasFiles ? (
        <FormInput name={fieldName} renderInput={renderFileInput} />
      ) : (
        <Grid container spacing={2} className={styles.uploadWrapper}>
          {existingFiles.map((file, index) => (
            <Grid key={`${file.name}-${index + 1}`} size={{ xs: 6, md: 4 }}>
              <FilePreview item={file} onRemove={() => handleRemoveFile(index)} />
            </Grid>
          ))}
          {Array.from(uploadingFiles.entries()).map(([fileId, uploadProgress]) => (
            <Grid size={{ xs: 6, md: 4 }} key={`uploading-${fileId}`}>
              <FilePreview
                item={uploadProgress}
                onRemove={() => handleUploadCancel(fileId)}
                onCancel={() => handleUploadCancel(fileId)}
              />
            </Grid>
          ))}
          {canAddMore && (
            <Grid size={{ xs: 6, md: 4 }}>
              <FormInput name={fieldName} renderInput={renderCardFileInput} />
            </Grid>
          )}
        </Grid>
      )}
    </Stack>
  );
};

export default DocumentsUpload;
