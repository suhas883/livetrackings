export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (url.pathname === '/api/track' && request.method === 'POST') {
    try {
      const body = await request.json();
      const { trackingNumber } = body;

      if (!trackingNumber) {
        return new Response(
          JSON.stringify({ success: false, error: 'Tracking number required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const PERPLEXITY_KEY = context.env.PERPLEXITY_API_KEY;
      const OPENAI_KEY = context.env.OPENAI_API_KEY;

      // PRIMARY: Perplexity Sonar Pro
      if (PERPLEXITY_KEY) {
        try {
          const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${PERPLEXITY_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'sonar-pro',
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert package tracking assistant. Provide clear status, location, delivery window, carrier name, key events, and any delays.'
                },
                {
                  role: 'user',
                  content: `Track: ${trackingNumber}`
                }
              ],
              temperature: 0.2,
              max_tokens: 900
            })
          });

          if (response.ok) {
            const data = await response.json();
            const content = data?.choices?.[0]?.message?.content || '';
            if (content) {
              return new Response(
                JSON.stringify({
                  success: true,
                  trackingNumber,
                  source: 'perplexity',
                  data: content,
                  timestamp: new Date().toISOString()
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }
        } catch (err) {
          console.error('Perplexity error:', err);
        }
      }

      // FALLBACK: OpenAI
      if (OPENAI_KEY) {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: 'You are a package tracking assistant. Provide clear status and delivery info.'
                },
                {
                  role: 'user',
                  content: `Track: ${trackingNumber}`
                }
              ],
              temperature: 0.2,
              max_tokens: 700
            })
          });

          if (response.ok) {
            const data = await response.json();
            const content = data?.choices?.[0]?.message?.content || '';
            if (content) {
              return new Response(
                JSON.stringify({
                  success: true,
                  trackingNumber,
                  source: 'openai',
                  data: content,
                  timestamp: new Date().toISOString()
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }
        } catch (err) {
          console.error('OpenAI error:', err);
        }
      }

      return new Response(
        JSON.stringify({ success: false, error: 'Both APIs unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      console.error('Handler error:', err);
      return new Response(
        JSON.stringify({ success: false, error: 'Server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response('Not Found', { status: 404, headers: corsHeaders });
}
