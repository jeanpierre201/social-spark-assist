/**
 * Internal mapping tables for image generation prompt injection.
 * These mappings are used to enrich AI image prompts based on
 * the user's selected Render Style and Aesthetic Direction.
 */

export const RENDER_STYLE_PROMPTS: Record<string, string> = {
  auto: '',
  photorealistic:
    'Highly realistic photography, natural lighting, realistic textures, real-world depth and shadows.',
  'flat-design':
    'Flat vector illustration, simple shapes, no gradients, clean lines, minimal shading.',
  '3d-render':
    'High-quality 3D render, realistic lighting, depth, soft shadows, dimensional objects.',
  illustration:
    'Digital illustration style, artistic, stylized shapes, expressive lines.',
  cinematic:
    'Cinematic lighting, dramatic atmosphere, depth of field, film-like color grading.',
  'abstract-graphic': '',
};

export const AESTHETIC_DIRECTION_PROMPTS: Record<string, string> = {
  auto: '',
  'clean-minimal':
    'Minimal layout, lots of whitespace, simple composition, restrained color usage.',
  'bold-impact':
    'High contrast, strong focal point, visually striking composition.',
  corporate:
    'Balanced layout, professional structure, clean alignment.',
  'corporate-structured':
    'Balanced layout, professional structure, clean alignment.',
  'dark-dramatic':
    'Dark background, strong contrast, moody lighting.',
  'futuristic-tech':
    'Sleek futuristic design, neon accents, tech-inspired geometric elements.',
  'soft-lifestyle':
    'Warm tones, natural light, inviting and authentic mood.',
  'editorial-magazine':
    'Editorial layout, sophisticated typography emphasis, magazine-quality composition.',
  'playful-colorful':
    'Vibrant colors, fun patterns, energetic and playful mood.',
};

/**
 * Build the style portion of an image prompt from the selected
 * render style and aesthetic direction values.
 */
export function buildStylePrompt(
  renderStyle: string | null | undefined,
  aestheticDirection: string | null | undefined,
): string {
  const parts: string[] = [];

  const render = RENDER_STYLE_PROMPTS[renderStyle ?? 'auto'];
  if (render) parts.push(render);

  const aesthetic = AESTHETIC_DIRECTION_PROMPTS[aestheticDirection ?? 'auto'];
  if (aesthetic) parts.push(aesthetic);

  return parts.join(' ');
}
