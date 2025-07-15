
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Use the standard OPENAI_API_KEY environment variable
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  industry: string;
  goal: string;
  nicheInfo?: string;
  generateVariations?: boolean;
  variationCount?: number;
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
  console.log('Validating input:', body);
  
  if (!body || typeof body !== 'object') {
    console.log('Invalid body type:', typeof body);
    return 'Invalid request body';
  }
  
  if (!body.industry || typeof body.industry !== 'string' || body.industry.trim().length === 0) {
    console.log('Industry validation failed:', body.industry);
    return 'Industry is required';
  }
  
  if (!body.goal || typeof body.goal !== 'string' || body.goal.trim().length === 0) {
    console.log('Goal validation failed:', body.goal);
    return 'Goal is required';
  }
  
  if (body.industry.length > 100) {
    console.log('Industry too long:', body.industry.length);
    return 'Industry must be less than 100 characters';
  }
  
  if (body.goal.length > 200) {
    console.log('Goal too long:', body.goal.length);
    return 'Goal must be less than 200 characters';
  }
  
  if (body.nicheInfo && body.nicheInfo.length > 300) {
    console.log('Niche info too long:', body.nicheInfo.length);
    return 'Niche information must be less than 300 characters';
  }
  
  console.log('Validation passed');
  return null;
};

const sanitizeInput = (text: string): string => {
  return text.trim().replace(/[<>]/g, '');
};

const generateSingleContent = async (industry: string, goal: string, nicheInfo: string, variationPrompt?: string) => {
  const basePrompt = `Create a social media post for the ${industry} industry. 
Goal: ${goal}
${nicheInfo ? `Additional context: ${nicheInfo}` : ''}
${variationPrompt ? `Style variation: ${variationPrompt}` : ''}

Please provide:
1. An engaging caption (max 150 words)
2. 5-8 relevant hashtags

Make the content professional, engaging, and appropriate for social media platforms like Instagram, LinkedIn, and Twitter.`;

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
        { role: 'user', content: basePrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const generatedText = data.choices[0].message.content;

  // Try to parse as JSON first, fallback to text parsing
  let caption = '';
  let hashtags: string[] = [];

  try {
    const parsed = JSON.parse(generatedText);
    caption = parsed.caption || '';
    hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];
  } catch {
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
        industry.toLowerCase().replace(/\s+/g, ''),
        'socialmedia',
        'business',
        'marketing'
      ];
    }
  }

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

  return {
    caption: caption.trim(),
    hashtags: hashtags.slice(0, 8)
  };
};

serve(async (req) => {
  console.log('=== Generate Content Function Called ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Checking OpenAI API key...');
    console.log('OPENAI_API_KEY environment variable exists:', !!openAIApiKey);
    console.log('OPENAI_API_KEY length:', openAIApiKey?.length || 0);
    
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

    const authHeader = req.headers.get('authorization');
    const userId = authHeader ? authHeader.split(' ')[1] : 'anonymous';

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
    console.log('Request body received:', JSON.stringify(body, null, 2));
    console.log('Body type:', typeof body);

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

    const industry = sanitizeInput(body.industry);
    const goal = sanitizeInput(body.goal);
    const nicheInfo = body.nicheInfo ? sanitizeInput(body.nicheInfo) : '';

    console.log('Sanitized inputs:', { industry, goal, nicheInfo });

    // Generate multiple variations if requested
    if (body.generateVariations) {
      const variationCount = Math.min(body.variationCount || 3, 5);
      const variationPrompts = [
        "Write in a professional, authoritative tone",
        "Use a friendly, conversational style with emojis",
        "Focus on storytelling and emotional connection",
        "Emphasize data, statistics, and credibility",
        "Create urgency and call-to-action focused content"
      ];

      const variations = [];
      
      // Generate base version first
      const baseContent = await generateSingleContent(industry, goal, nicheInfo);
      variations.push({ ...baseContent, variation: 'Original' });

      // Generate additional variations
      for (let i = 1; i < variationCount; i++) {
        const variationPrompt = variationPrompts[i - 1];
        const variationContent = await generateSingleContent(industry, goal, nicheInfo, variationPrompt);
        variations.push({ 
          ...variationContent, 
          variation: `Variation ${i}` 
        });
      }

      console.log('Generated variations:', variations.length);

      return new Response(
        JSON.stringify({ variations }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      // Generate single content (existing functionality)
      const content = await generateSingleContent(industry, goal, nicheInfo);
      
      console.log('Final result:', content);

      return new Response(
        JSON.stringify(content),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error) {
    console.error('Error in generate-content function:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Return more specific error information
    let errorMessage = 'Failed to generate content. Please try again.';
    if (error.message.includes('OpenAI API error')) {
      errorMessage = `OpenAI API error: ${error.message}`;
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Network error connecting to OpenAI API. Please try again.';
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage, details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
