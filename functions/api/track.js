// Cloudflare Pages Function: /functions/api/track.js
// Real-time package tracking using Perplexity API

export async function onRequestPost(context) {
  try {
    const { request } = context;
    const body = await request.json();
    const trackingNumber = body.trackingNumber;

    if (!trackingNumber) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Tracking number is required'
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

    // Try different models in order of preference for free tier
    const 28
      [
              'sonar-pro',
              'sonar',
    ];

    let trackingData = null;
    let lastError = null;

    // Try each model until one works
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
              content: 'You are a package tracking assistant. Provide accurate, real-time tracking information by searching the web. Return ONLY valid JSON format without any markdown formatting or code blocks.'
            }, {
              role: 'user',
              content: `Track this package: ${trackingNumber}

Search the web for real-time tracking information and return ONLY valid JSON (no markdown, no code blocks, just raw JSON):

{
  "carrier": "exact courier company name (DHL, UPS, FedEx, Blue Dart, Delhivery, etc)",
  "status": "current status (In Transit, Delivered, Out for Delivery, etc)",
  "location": "current location with city and country",
  "estimatedDelivery": "YYYY-MM-DD HH:mm",
  "confidence": 85,
  "transitDays": 3,
  "distance": "1245 miles",
  "weather": {
    "condition": "Clear",
    "icon": "☀️",
    "impact": "Low",
    "delay": "No delays expected"
  },
  "checkpoints": [
    {
      "date": "2025-11-19T14:30:00Z",
      "status": "Package received at facility",
      "location": "Mumbai, India",
      "description": "Package scanned at Mumbai facility"
    }
  ]
}

If tracking number not found, return:
{
  "carrier": "Unknown",
  "status": "Not Found",
  "location": "Unknown",
  "estimatedDelivery": "Unknown",
  "confidence": 0,
  "error": "Tracking number not found or invalid"
}`
            }],
            temperature: 0.2,
            max_tokens: 2000,
            top_p: 0.9
          })
        });

        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          const aiResponse = perplexityData.choices[0].message.content;

          // Parse the AI response
          let cleanResponse = aiResponse.trim();
          cleanResponse = cleanResponse.replace(/^``````\s*$/, '');
          
          const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            trackingData = JSON.parse(jsonMatch[0]);
          } else {
            trackingData = JSON.parse(cleanResponse);
          }
          
          // Success! Break out of loop
          break;
        } else {
          const errorText = await perplexityResponse.text();
          lastError = `Model ${model} failed: ${errorText}`;
          continue; // Try next model
        }
      } catch (modelError) {
        lastError = `Model ${model} error: ${modelError.message}`;
        continue; // Try next model
      }
    }

    // If no model worked, throw the last error
    if (!trackingData) {
      throw new Error(lastError || 'All models failed');
    }

    // Ensure all required fields exist with defaults
    trackingData.carrier = trackingData.carrier || 'Unknown';
    trackingData.status = trackingData.status || 'In Transit';
    trackingData.location = trackingData.location || 'Unknown';
    trackingData.confidence = trackingData.confidence || 85;
    trackingData.transitDays = trackingData.transitDays || 3;
    trackingData.distance = trackingData.distance || 'Unknown';
    
    if (!trackingData.estimatedDelivery || trackingData.estimatedDelivery === 'Unknown') {
      const futureDate = new Date(Date.now() + 3*24*60*60*1000);
      trackingData.estimatedDelivery = futureDate.toISOString().slice(0, 16).replace('T', ' ');
    }
    
    if (!trackingData.weather) {
      trackingData.weather = {
        condition: 'Clear',
        icon: '☀️',
        impact: 'Low',
        delay: 'No delays expected'
      };
    }
    
    if (!trackingData.checkpoints || !Array.isArray(trackingData.checkpoints)) {
      trackingData.checkpoints = [];
    }

    return new Response(JSON.stringify({
      success: true,
      data: trackingData,
      source: 'Perplexity AI',
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
    console.error('Tracking Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to track package',
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
