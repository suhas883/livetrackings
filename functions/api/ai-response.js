// CloudFlare Pages Function: /functions/api/ai-response.js
// AI chat response for package tracking assistant
export async function onRequestPost(context) {
  try {
    const { request } = context;
    const body = await request.json();
    const { message, trackingData } = body;

    if (!message) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Message is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get API key from environment variables
    const PERPLEXITY_API_KEY = context.env.PERPLEXITY_API_KEY;

    if (!PERPLEXITY_API_KEY) {
      throw new Error('Perplexity API key not configured');
    }

    // Try different models
    const models = ['sonar-pro', 'sonar'];
    let aiResponse = null;
    let lastError = null;

    for (const model of models) {
      try {
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [{
              role: 'system',
              content: 'You are a helpful package tracking assistant. Answer user questions about their package delivery based on the tracking data provided.'
            }, {
              role: 'user',
              content: `Tracking Data: ${JSON.stringify(trackingData || {})}\n\nUser Question: ${message}`
            }],
            temperature: 0.7,
            max_tokens: 500,
            top_p: 0.9
          })
        });

        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          aiResponse = perplexityData.choices[0].message.content;
          break;
        } else {
          const errorText = await perplexityResponse.text();
          lastError = `Model ${model} failed: ${errorText}`;
          continue;
        }
      } catch (modelError) {
        lastError = `Model ${model} error: ${modelError.message}`;
        continue;
      }
    }

    if (!aiResponse) {
      throw new Error(lastError || 'All models failed');
    }

    return new Response(JSON.stringify({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('AI Response Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to generate AI response',
      details: error.stack
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Handle OPTIONS for CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
