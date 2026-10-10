
/**
 * Compresses and resizes an image file to WebP format with a maximum width.
 * @param file The original image file.
 * @param maxWidth The maximum width in pixels (default: 1200).
 * @param quality The WebP quality between 0 and 1 (default: 0.8).
 * @returns A Promise resolving to the compressed Blob and the new extension.
 */
export const processImage = (
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<{ blob: Blob; extension: string }> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // Create a URL for the file to load it into the Image object
    const objectUrl = URL.createObjectURL(file);
    image.src = objectUrl;

    image.onload = () => {
      // Clean up memory
      URL.revokeObjectURL(objectUrl);

      let width = image.width;
      let height = image.height;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      // Create canvas for drawing
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw image onto canvas
      ctx.drawImage(image, 0, 0, width, height);

      // Export as WebP blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, extension: 'webp' });
          } else {
            reject(new Error('Image compression failed'));
          }
        },
        'image/webp',
        quality
      );
    };

    image.onerror = (error) => {
        URL.revokeObjectURL(objectUrl);
        reject(error);
    };
  });
};
