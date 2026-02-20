/**
 * Internal mapping tables for image generation prompt injection.
 * These mappings are used to enrich AI image prompts based on
 * the user's selected Render Style and Aesthetic Direction.
 */

export const RENDER_STYLE_PROMPTS: Record<string, string> = {
  auto: '',
  photorealistic:
    'Highly realistic photography, natural lighting, realistic textures, accurate shadows, real-world depth, authentic camera perspective.',
  'flat-design':
    'Flat vector illustration, simple geometric shapes, solid colors, minimal shading, clean lines, modern 2D graphic style.',
  '3d-render':
    'High-quality 3D render, dimensional objects, realistic lighting and shadows, smooth surfaces, depth and spatial realism.',
  illustration:
    'Digital illustration style, artistic and stylized, expressive shapes and lines, creative composition, slightly abstract realism.',
  cinematic:
    'Cinematic lighting, dramatic atmosphere, strong depth of field, film-like color grading, immersive and storytelling-driven composition.',
  'abstract-graphic':
    'Abstract graphic composition, geometric or fluid shapes, conceptual visual elements, strong use of color and contrast, non-literal representation, modern digital art aesthetic.',
};

export const AESTHETIC_DIRECTION_PROMPTS: Record<string, string> = {
  auto: '',
  'clean-minimal':
    'Minimal layout, generous whitespace, simple composition, limited color palette, refined spacing, clarity-focused design.',
  'bold-impact':
    'High contrast, strong focal point, dynamic composition, powerful visual presence, attention-grabbing layout.',
  corporate:
    'Balanced layout, professional alignment, structured composition, business-friendly aesthetic, clean visual hierarchy.',
  'corporate-structured':
    'Balanced layout, professional alignment, structured composition, business-friendly aesthetic, clean visual hierarchy.',
  'dark-dramatic':
    'Dark background, strong contrast, moody lighting, intense atmosphere, focused and immersive composition.',
  'soft-lifestyle':
    'Warm tones, natural lighting, inviting atmosphere, authentic and relatable visual mood, soft contrast.',
  'futuristic-tech':
    'Sleek modern design, digital aesthetic, subtle glow effects, sharp contrasts, innovative atmosphere, forward-thinking visual identity.',
  'editorial-magazine':
    'Sophisticated layout, balanced typography space, elegant composition, stylish and curated aesthetic, premium publication-inspired design.',
  'playful-colorful':
    'Vibrant color palette, dynamic shapes, energetic composition, friendly and expressive mood, visually lively and engaging design.',
};

/**
 * Optional render-specific enhancements layered on top of aesthetic direction.
 * Applied when a specific render + aesthetic combination benefits from extra detail.
 */
export const RENDER_AESTHETIC_ENHANCEMENTS: Partial<Record<string, Partial<Record<string, string>>>> = {
  '3d-render': {
    'futuristic-tech': 'Add subtle neon accents or holographic details.',
  },
  cinematic: {
    'futuristic-tech': 'Add subtle neon accents or holographic details.',
  },
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

  // Apply optional render+aesthetic enhancement
  const enhancement =
    RENDER_AESTHETIC_ENHANCEMENTS[renderStyle ?? '']?.[aestheticDirection ?? ''];
  if (enhancement) parts.push(enhancement);

  return parts.join(' ');
}
