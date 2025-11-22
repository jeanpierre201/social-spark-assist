
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  prompt: string;
  size?: '1024x1024' | '1536x1024' | '1024x1536';
  quality?: 'high' | 'medium' | 'low';
  output_format?: 'png' | 'jpeg' | 'webp';
}

const validateInput = (body: RequestBody): string | null => {
  if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
    return 'Prompt is required';
  }
  
  if (body.prompt.length > 32000) {
    return 'Prompt must be less than 32,000 characters';
  }
  
  return null;
};

const sanitizeInput = (text: string): string => {
  return text.trim().replace(/[<>]/g, '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if OpenAI API key is configured
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing image generation request...');

    const body: RequestBody = await req.json();
    console.log('Request body:', body);

    // Validate input
    const validationError = validateInput(body);
    if (validationError) {
      console.error('Validation error:', validationError);
      return new Response(
        JSON.stringify({ error: validationError }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Sanitize inputs
    const prompt = sanitizeInput(body.prompt);
    const size = body.size || '1024x1024';
    const quality = body.quality || 'medium';
    const output_format = body.output_format || 'png';

    console.log('Sanitized inputs:', { prompt, size, quality, output_format });

    console.log('Making OpenAI gpt-image-1 API call...');

    // Call OpenAI gpt-image-1 API (more powerful than dall-e-3)
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        n: 1,
        size: size,
        quality: quality,
        output_format: output_format
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');
    
    const imageData = data.data[0];
    const base64Image = imageData.b64_json;

    console.log('Image generated successfully');

    // Determine mime type based on output format
    const mimeType = output_format === 'jpeg' ? 'image/jpeg' : 
                     output_format === 'webp' ? 'image/webp' : 
                     'image/png';

    return new Response(
      JSON.stringify({ 
        image: `data:${mimeType};base64,${base64Image}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-image function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate image. Please try again.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
