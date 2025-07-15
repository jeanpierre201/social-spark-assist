import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Generate Content Function Started ===');
    
    // Check OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('OpenAI API key found, length:', openAIApiKey.length);

    // Parse request body
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.industry || !body.goal) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Industry and Goal are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create prompt
    const prompt = `Create a social media post for the ${body.industry} industry. 
Goal: ${body.goal}
${body.nicheInfo ? `Additional context: ${body.nicheInfo}` : ''}

Please provide:
1. An engaging caption (max 150 words)
2. 5-8 relevant hashtags

Make the content professional, engaging, and appropriate for social media platforms like Instagram, LinkedIn, and Twitter.`;

    console.log('Calling OpenAI API...');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional social media content creator. Generate engaging, authentic content that drives engagement. Format your response as JSON with "caption" and "hashtags" fields. The hashtags field should be an array of strings without the # symbol.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('OpenAI API error details:', errorText);
      
      // Parse OpenAI error response
      let errorMessage = 'Failed to generate content. Please try again.';
      let errorType = 'api_error';
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          errorMessage = errorData.error.message || errorMessage;
          errorType = errorData.error.type || 'api_error';
        }
      } catch (parseError) {
        console.log('Could not parse error response, using default message');
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          error_type: errorType,
          status: response.status
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const generatedText = data.choices[0].message.content;
    console.log('Generated text:', generatedText);

    // Try to parse as JSON first, fallback to text parsing
    let caption = '';
    let hashtags: string[] = [];

    try {
      // Clean the text by removing markdown code blocks
      let cleanText = generatedText.trim();
      
      // Remove ```json and ``` markers if present
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('Cleaned text for parsing:', cleanText);
      
      const parsed = JSON.parse(cleanText);
      caption = parsed.caption || '';
      hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];
    } catch (parseError) {
      console.log('JSON parse failed, using text parsing fallback');
      // Fallback: extract caption and hashtags from text
      const lines = generatedText.split('\n').filter(line => line.trim());
      
      const captionLines = lines.filter(line => 
        !line.includes('#') && 
        !line.toLowerCase().includes('hashtag') && 
        line.trim().length > 10
      );
      caption = captionLines.join(' ').substring(0, 300);

      const hashtagMatches = generatedText.match(/#[\w]+/g) || [];
      hashtags = hashtagMatches.map(tag => tag.substring(1)).slice(0, 8);
      
      if (hashtags.length === 0) {
        hashtags = [
          body.industry.toLowerCase().replace(/\s+/g, ''),
          'socialmedia',
          'business',
          'marketing'
        ];
      }
    }

    // Ensure we have content
    if (!caption || caption.trim().length === 0) {
      caption = `Exciting updates in the ${body.industry} industry! ${body.goal}`;
    }

    if (hashtags.length === 0) {
      hashtags = [
        body.industry.toLowerCase().replace(/\s+/g, ''),
        'socialmedia',
        'business'
      ];
    }

    const result = {
      caption: caption.trim(),
      hashtags: hashtags.slice(0, 8)
    };

    console.log('Final result:', result);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-content function:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate content. Please try again.',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});