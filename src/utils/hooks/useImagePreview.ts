import { useEffect, useState } from 'react';

import FileUtils from '@/utils/static/FileUtils';

export const useImagePreview = (file: File | null) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      return;
    }

    if (file.size > 0) {
      const url = URL.createObjectURL(file);

      setPreviewUrl(url);
      setFileSize(FileUtils.calcFileSize(file.size));
      setIsLoading(false);

      // eslint-disable-next-line consistent-return
      return () => URL.revokeObjectURL(url);
    }

    const loadFromAPI = async () => {
      setIsLoading(true);

      const imageId = file.name.match(/yacht-image-(\d+)/)?.[1];

      if (!imageId) {
        setIsLoading(false);

        return;
      }

      try {
        const url = `${import.meta.env.VITE_BOAT_API_URL}/public/image/${imageId}`;
        const response = await fetch(url);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        setPreviewUrl(objectUrl);
        setFileSize(FileUtils.calcFileSize(blob.size));

        // eslint-disable-next-line consistent-return
        return () => URL.revokeObjectURL(objectUrl);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load image:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFromAPI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.name, file?.size]);

  return { previewUrl, fileSize, isLoading };
};
