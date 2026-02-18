/**
 * Extract dominant colors from an image using Canvas pixel analysis.
 * Returns the top 2 most dominant non-white/non-black colors as hex strings.
 */
export const extractColorsFromImage = (imageUrl: string): Promise<{ primary: string; secondary: string }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }

        // Scale down for performance
        const maxSize = 100;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = Math.floor(img.width * scale);
        canvas.height = Math.floor(img.height * scale);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Count color frequencies using quantized buckets (reduce to 4-bit per channel)
        const colorMap = new Map<string, number>();

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Skip transparent pixels
          if (a < 128) continue;

          // Skip near-white and near-black
          const brightness = (r + g + b) / 3;
          if (brightness > 240 || brightness < 15) continue;

          // Skip very desaturated (grays)
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max - min < 20) continue;

          // Quantize to reduce noise
          const qr = Math.round(r / 16) * 16;
          const qg = Math.round(g / 16) * 16;
          const qb = Math.round(b / 16) * 16;
          const key = `${qr},${qg},${qb}`;

          colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }

        // Sort by frequency
        const sorted = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1]);

        if (sorted.length === 0) {
          resolve({ primary: '#3b82f6', secondary: '#8b5cf6' });
          return;
        }

        const toHex = (key: string) => {
          const [r, g, b] = key.split(',').map(Number);
          return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        };

        const primary = toHex(sorted[0][0]);

        // Find a secondary color that's visually distinct
        let secondary = primary;
        for (let i = 1; i < sorted.length; i++) {
          const candidate = toHex(sorted[i][0]);
          if (colorDistance(primary, candidate) > 80) {
            secondary = candidate;
            break;
          }
        }

        resolve({ primary, secondary });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};

/** Simple Euclidean distance between two hex colors */
function colorDistance(hex1: string, hex2: string): number {
  const parse = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(hex1);
  const [r2, g2, b2] = parse(hex2);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}
