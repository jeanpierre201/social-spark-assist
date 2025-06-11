
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  industry: string;
  goal: string;
  nicheInfo?: string;
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit (5 requests per hour)
    rateLimitStore.set(userId, { count: 1, resetTime: now + 3600000 });
    return true;
  }
  
  if (userLimit.count >= 5) {
    return false;
  }
  
  userLimit.count++;
  return true;
};

const validateInput = (body: RequestBody): string | null => {
  if (!body.industry || typeof body.industry !== 'string' || body.industry.trim().length === 0) {
    return 'Industry is required';
  }
  
  if (!body.goal || typeof body.goal !== 'string' || body.goal.trim().length === 0) {
    return 'Goal is required';
  }
  
  if (body.industry.length > 100) {
    return 'Industry must be less than 100 characters';
  }
  
  if (body.goal.length > 200) {
    return 'Goal must be less than 200 characters';
  }
  
  if (body.nicheInfo && body.nicheInfo.length > 300) {
    return 'Niche information must be less than 300 characters';
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

    console.log('Processing content generation request...');

    // Get user ID from authorization header for rate limiting
    const authHeader = req.headers.get('authorization');
    const userId = authHeader ? authHeader.split(' ')[1] : 'anonymous';

    // Check rate limit
    if (!checkRateLimit(userId)) {
      console.error('Rate limit exceeded for user:', userId);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Try again in an hour.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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
    const industry = sanitizeInput(body.industry);
    const goal = sanitizeInput(body.goal);
    const nicheInfo = body.nicheInfo ? sanitizeInput(body.nicheInfo) : '';

    console.log('Sanitized inputs:', { industry, goal, nicheInfo });

    // Prepare prompt for OpenAI
    const prompt = `Create a social media post for the ${industry} industry. 
Goal: ${goal}
${nicheInfo ? `Additional context: ${nicheInfo}` : ''}

Please provide:
1. An engaging caption (max 150 words)
2. 5-8 relevant hashtags

Make the content professional, engaging, and appropriate for social media platforms like Instagram, LinkedIn, and Twitter.`;

    console.log('Making OpenAI API call...');

    // Call OpenAI API with gpt-4o-mini model
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
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);
    
    const generatedText = data.choices[0].message.content;
    console.log('Generated text:', generatedText);

    // Try to parse as JSON first, fallback to text parsing
    let caption = '';
    let hashtags: string[] = [];

    try {
      const parsed = JSON.parse(generatedText);
      caption = parsed.caption || '';
      hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];
    } catch {
      console.log('JSON parsing failed, using text parsing fallback');
      // Fallback: extract caption and hashtags from text
      const lines = generatedText.split('\n').filter(line => line.trim());
      
      // Find caption (usually first substantial text)
      const captionLines = lines.filter(line => 
        !line.includes('#') && 
        !line.toLowerCase().includes('hashtag') && 
        line.trim().length > 10
      );
      caption = captionLines.join(' ').substring(0, 300);

      // Extract hashtags
      const hashtagMatches = generatedText.match(/#[\w]+/g) || [];
      hashtags = hashtagMatches.map(tag => tag.substring(1)).slice(0, 8);
      
      // If no hashtags found, generate basic ones
      if (hashtags.length === 0) {
        hashtags = [
          industry.toLowerCase().replace(/\s+/g, ''),
          'socialmedia',
          'business',
          'marketing'
        ];
      }
    }

    // Ensure we have valid content
    if (!caption || caption.trim().length === 0) {
      caption = `Exciting updates in the ${industry} industry! ${goal}`;
    }

    if (hashtags.length === 0) {
      hashtags = [
        industry.toLowerCase().replace(/\s+/g, ''),
        'socialmedia',
        'business'
      ];
    }

    console.log('Final result:', { caption, hashtags });

    return new Response(
      JSON.stringify({ 
        caption: caption.trim(), 
        hashtags: hashtags.slice(0, 8) 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-content function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate content. Please try again.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
