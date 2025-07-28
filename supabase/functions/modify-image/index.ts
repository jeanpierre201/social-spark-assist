import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  prompt: string;
  imageUrl: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
}

const validateInput = (body: RequestBody): string | null => {
  if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
    return 'Modification prompt is required';
  }
  
  if (!body.imageUrl || typeof body.imageUrl !== 'string' || body.imageUrl.trim().length === 0) {
    return 'Base image URL is required';
  }
  
  if (body.prompt.length > 1000) {
    return 'Prompt must be less than 1000 characters';
  }
  
  return null;
};

const sanitizeInput = (text: string): string => {
  return text.trim().replace(/[<>]/g, '');
};

// Convert image URL to base64
const imageUrlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64 in chunks to avoid call stack issues
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to process base image');
  }
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

    console.log('Processing image modification request...');

    const body: RequestBody = await req.json();
    console.log('Request body received');

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
    const quality = body.quality || 'standard';

    console.log('Sanitized inputs:', { prompt, size, quality });

    // Convert base image to base64
    console.log('Converting base image to base64...');
    const baseImageB64 = await imageUrlToBase64(body.imageUrl);

    // Create a comprehensive prompt that includes the modification instructions
    const modificationPrompt = `Based on the provided image, make the following modifications: ${prompt}. Keep the overall composition and style similar but apply the requested changes. Maintain high quality and professional appearance.`;

    console.log('Making OpenAI GPT-4 Vision API call for image analysis and generation...');

    // First, analyze the image and get a description
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image and create a detailed description that captures its key elements, style, colors, composition, and overall aesthetic. Then, based on this analysis and the modification request: "${prompt}", create a new detailed prompt for DALL-E that will generate a modified version of this image.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${baseImageB64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      }),
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error(`OpenAI Vision API error: ${visionResponse.status} - ${errorText}`);
      throw new Error(`OpenAI Vision API error: ${visionResponse.status}`);
    }

    const visionData = await visionResponse.json();
    const enhancedPrompt = visionData.choices[0].message.content;

    console.log('Enhanced prompt created, generating new image...');

    // Now generate the modified image using DALL-E
    const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: size,
        quality: quality,
        style: 'natural', // Use natural style for modifications to maintain consistency
        response_format: 'b64_json'
      }),
    });

    if (!dalleResponse.ok) {
      const errorText = await dalleResponse.text();
      console.error(`DALL-E API error: ${dalleResponse.status} - ${errorText}`);
      throw new Error(`DALL-E API error: ${dalleResponse.status}`);
    }

    const dalleData = await dalleResponse.json();
    console.log('Modified image generated successfully');
    
    const imageData = dalleData.data[0];
    const base64Image = imageData.b64_json;
    const revisedPrompt = imageData.revised_prompt;

    return new Response(
      JSON.stringify({ 
        image: `data:image/png;base64,${base64Image}`,
        revisedPrompt: revisedPrompt,
        enhancedPrompt: enhancedPrompt
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in modify-image function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to modify image. Please try again.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});