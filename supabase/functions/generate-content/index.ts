import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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

    // Parse request body
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.industry || !body.goal || !body.userId) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Industry, Goal, and User ID are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's subscription status
    const { data: subscriber, error: subError } = await supabase
      .from('subscribers')
      .select('subscribed, subscription_tier')
      .eq('user_id', body.userId)
      .maybeSingle();

    if (subError) {
      console.error('Error fetching subscription:', subError);
    }

    const isFreeUser = !subscriber || !subscriber.subscribed;
    const isStarterUser = subscriber?.subscribed && subscriber?.subscription_tier === 'starter';
    const isProUser = subscriber?.subscribed && subscriber?.subscription_tier === 'pro';

    console.log('User subscription status:', { isFreeUser, isStarterUser, isProUser });

    // For free users, check monthly limit and use Lovable AI
    if (isFreeUser) {
      const { data: monthlyUsage, error: usageError } = await supabase
        .rpc('get_monthly_usage_count', { user_uuid: body.userId });

      if (usageError) {
        console.error('Error checking monthly usage:', usageError);
        return new Response(
          JSON.stringify({ error: 'Error checking usage limits' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const currentMonthlyUsage = monthlyUsage || 0;

      if (currentMonthlyUsage >= 1) {
        return new Response(
          JSON.stringify({ 
            error: 'The amount of free calls has been achieved, please wait for the first day of the coming month or upgrade to a Starter plan',
            limitReached: true
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Use Lovable AI for free users
      const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
      if (!lovableApiKey) {
        console.error('Lovable API key not found');
        return new Response(
          JSON.stringify({ error: 'AI service not configured' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const result = await generateWithLovableAI(body, lovableApiKey);
      return new Response(
        JSON.stringify(result),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // For paid users (Starter/Pro), use OpenAI
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

    const result = await generateWithOpenAI(body, openAIApiKey);
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

async function generateWithLovableAI(body: any, apiKey: string) {
  console.log('Using Lovable AI (google/gemini-2.5-flash-lite) for free user');

  const includeEmojis = body.includeEmojis !== false;
  const emojiInstructions = includeEmojis 
    ? "Include relevant emojis to make the content more engaging and visually appealing." 
    : "Do NOT include any emojis in the content.";
  
  const prompt = `Create a social media post for the ${body.industry} industry. 
Goal: ${body.goal}
${body.nicheInfo ? `Additional context: ${body.nicheInfo}` : ''}

Please provide:
1. An engaging caption (max 150 words)
2. 5-8 relevant hashtags

${emojiInstructions}

Make the content professional, engaging, and appropriate for social media platforms like Instagram, LinkedIn, and Twitter.`;

  console.log('Calling Lovable AI...');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        { 
          role: 'system', 
          content: 'You are a professional social media content creator. Generate engaging, authentic content that drives engagement. Format your response as JSON with "caption" and "hashtags" fields. The hashtags field should be an array of strings without the # symbol (we will add them automatically).' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    console.error('Lovable AI error:', response.status, response.statusText);
    const errorText = await response.text();
    console.error('Lovable AI error details:', errorText);
    
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (response.status === 402) {
      throw new Error('AI service credits depleted. Please contact support.');
    }
    
    throw new Error('Failed to generate content with AI service.');
  }

  const data = await response.json();
  console.log('Lovable AI response received');

  return parseAIResponse(data.choices[0].message.content, body);
}

async function generateWithOpenAI(body: any, apiKey: string) {
  console.log('Using OpenAI (gpt-4o-mini) for paid user');


  const includeEmojis = body.includeEmojis !== false;
  const emojiInstructions = includeEmojis 
    ? "Include relevant emojis to make the content more engaging and visually appealing." 
    : "Do NOT include any emojis in the content.";
  
  const prompt = `Create a social media post for the ${body.industry} industry. 
Goal: ${body.goal}
${body.nicheInfo ? `Additional context: ${body.nicheInfo}` : ''}

Please provide:
1. An engaging caption (max 150 words)
2. 5-8 relevant hashtags

${emojiInstructions}

Make the content professional, engaging, and appropriate for social media platforms like Instagram, LinkedIn, and Twitter.`;

  console.log('Calling OpenAI API...');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a professional social media content creator. Generate engaging, authentic content that drives engagement. Format your response as JSON with "caption" and "hashtags" fields. The hashtags field should be an array of strings without the # symbol (we will add them automatically).' 
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
    
    throw new Error('Failed to generate content with OpenAI.');
  }

  const data = await response.json();
  console.log('OpenAI response received');

  return parseAIResponse(data.choices[0].message.content, body);
}

function parseAIResponse(generatedText: string, body: any) {
  console.log('Generated text:', generatedText);

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

  return {
    caption: caption.trim(),
    hashtags: hashtags.slice(0, 8)
  };
}