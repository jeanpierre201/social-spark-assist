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
    console.log('=== Test OpenAI Function Called ===');
    
    // Check all possible OpenAI environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const openaiApi = Deno.env.get('OPENAI_API');
    
    console.log('OPENAI_API_KEY exists:', !!openaiApiKey);
    console.log('OPENAI_API exists:', !!openaiApi);
    
    // List all environment variables that start with OPENAI
    const allEnvVars = Deno.env.toObject();
    const openaiVars = Object.keys(allEnvVars).filter(key => key.startsWith('OPENAI'));
    console.log('All OPENAI environment variables:', openaiVars);
    
    const finalKey = openaiApiKey || openaiApi;
    
    if (!finalKey) {
      console.error('No OpenAI API key found');
      return new Response(
        JSON.stringify({ 
          error: 'No OpenAI API key found',
          availableVars: openaiVars,
          checkedVars: ['OPENAI_API_KEY', 'OPENAI_API']
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('Found OpenAI API key, length:', finalKey.length);
    console.log('API key starts with:', finalKey.substring(0, 7));
    
    // Test a simple OpenAI API call
    console.log('Testing OpenAI API connection...');
    
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${finalKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('OpenAI API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API connection failed',
          status: response.status,
          details: errorText
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const data = await response.json();
    console.log('OpenAI API connection successful');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'OpenAI API key is working correctly',
        modelsCount: data.data?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Test function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Test function failed',
        details: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});