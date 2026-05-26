import Resizer from 'react-image-file-resizer';

export default class FileUtils {
  public static toBase64 = (file?: File) =>
    new Promise<string | ArrayBuffer | null>((resolve, reject) => {
      if (file) {
        const reader = new FileReader();

        reader.onload = (e: ProgressEvent<FileReader>) => {
          const { result } = e.target!;

          if (typeof result === 'string') {
            const base64Data = result.split(',')[1];

            resolve(base64Data);
          } else {
            resolve(result);
          }
        };
        reader.readAsDataURL(file);
        reader.onerror = error => reject(error);
      } else {
        resolve(null);
      }
    });

  public static calcFileSize(size: number) {
    if (size === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(size) / Math.log(k));

    return `${parseFloat((size / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  public static async urlToFile(url: string, filename: string): Promise<File | null> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();

      return new File([blob], filename, { type: blob.type });
    } catch {
      return null;
    }
  }

  public static resizeImageFile = (file: File): Promise<File> =>
    new Promise(resolve => {
      Resizer.imageFileResizer(
        file,
        2400,
        2400,
        'jpeg',
        85,
        0,
        response => {
          resolve(response as File);
        },
        'file'
      );
    });
}
