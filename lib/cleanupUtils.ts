
// Helper to extract secure image paths from HTML content
export function extractImagePaths(htmlContent: string): string[] {
  if (!htmlContent) return [];
  const paths: string[] = [];

  // Create a temporary DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const images = doc.querySelectorAll('img.secure-diary-image');

  images.forEach((img) => {
    const element = img as HTMLImageElement;
    // Look for metadata in data attribute or alt fallback
    const metadataStr = element.getAttribute('data-secure-metadata') || element.getAttribute('alt');
    if (metadataStr) {
      try {
        const metadata = JSON.parse(metadataStr);
        if (metadata && metadata.path) {
          paths.push(metadata.path);
        }
      } catch (e) {
        console.warn('Failed to parse image metadata during cleanup extraction', e);
      }
    }
  });

  return paths;
}

// Returns an array of paths that exist in oldContent but NOT in newContent
export function diffImagePaths(oldContent: string, newContent: string): string[] {
  const oldPaths = new Set(extractImagePaths(oldContent));
  const newPaths = new Set(extractImagePaths(newContent));

  const removedPaths: string[] = [];
  oldPaths.forEach(path => {
    if (!newPaths.has(path)) {
      removedPaths.push(path);
    }
  });

  return removedPaths;
}
