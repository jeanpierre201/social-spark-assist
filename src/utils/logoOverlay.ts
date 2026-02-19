/**
 * Client-side canvas utility to overlay a brand logo on an image.
 * Supports placement positions and watermark (semi-transparent) mode.
 */

export type LogoPlacement =
  | 'none'
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface LogoOverlayOptions {
  /** URL of the base image (AI-generated or uploaded) */
  imageUrl: string;
  /** URL of the brand logo */
  logoUrl: string;
  /** Where to place the logo */
  placement: LogoPlacement;
  /** Whether to apply watermark style (semi-transparent) */
  watermark: boolean;
  /** Logo size as percentage of image width (default: 15) */
  logoSizePercent?: number;
  /** Padding from edges in pixels (default: 20) */
  padding?: number;
}

/**
 * Loads an image from a URL, handling CORS.
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

/**
 * Calculates logo position based on placement option.
 */
const getLogoPosition = (
  canvasWidth: number,
  canvasHeight: number,
  logoWidth: number,
  logoHeight: number,
  placement: LogoPlacement,
  padding: number
): { x: number; y: number } => {
  switch (placement) {
    case 'top-left':
      return { x: padding, y: padding };
    case 'top-center':
      return { x: (canvasWidth - logoWidth) / 2, y: padding };
    case 'top-right':
      return { x: canvasWidth - logoWidth - padding, y: padding };
    case 'bottom-left':
      return { x: padding, y: canvasHeight - logoHeight - padding };
    case 'bottom-center':
      return { x: (canvasWidth - logoWidth) / 2, y: canvasHeight - logoHeight - padding };
    case 'bottom-right':
      return { x: canvasWidth - logoWidth - padding, y: canvasHeight - logoHeight - padding };
    default:
      return { x: padding, y: padding };
  }
};

/**
 * Composites a logo onto an image using HTML Canvas.
 * Returns a Blob of the resulting PNG image.
 */
export const applyLogoOverlay = async (
  options: LogoOverlayOptions
): Promise<Blob> => {
  const {
    imageUrl,
    logoUrl,
    placement,
    watermark,
    logoSizePercent = 15,
    padding = 20,
  } = options;

  // Load both images in parallel
  const [baseImage, logoImage] = await Promise.all([
    loadImage(imageUrl),
    loadImage(logoUrl),
  ]);

  // Create canvas matching base image dimensions
  const canvas = document.createElement('canvas');
  canvas.width = baseImage.naturalWidth;
  canvas.height = baseImage.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // Draw base image
  ctx.drawImage(baseImage, 0, 0);

  // Calculate logo dimensions (maintain aspect ratio)
  const maxLogoWidth = (canvas.width * logoSizePercent) / 100;
  const logoAspect = logoImage.naturalWidth / logoImage.naturalHeight;
  const logoWidth = Math.min(maxLogoWidth, logoImage.naturalWidth);
  const logoHeight = logoWidth / logoAspect;

  // Get position
  const pos = getLogoPosition(
    canvas.width,
    canvas.height,
    logoWidth,
    logoHeight,
    placement,
    padding
  );

  // Apply watermark opacity if enabled
  if (watermark) {
    ctx.globalAlpha = 0.50;
  }

  // Draw logo
  ctx.drawImage(logoImage, pos.x, pos.y, logoWidth, logoHeight);

  // Reset alpha
  ctx.globalAlpha = 1.0;

  // Export as blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to export canvas to blob'));
      },
      'image/png',
      1.0
    );
  });
};
