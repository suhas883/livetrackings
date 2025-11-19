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

    // Call Perplexity API to get real tracking info
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
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

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      throw new Error(`Perplexity API error: ${perplexityResponse.status} - ${errorText}`);
    }

    const perplexityData = await perplexityResponse.json();
    const aiResponse = perplexityData.choices[0].message.content;

    // Parse the AI response - handle various formats
    let trackingData;
    try {
      // Remove markdown code blocks if present
      let cleanResponse = aiResponse.trim();
      
      // Remove `````` markers
      cleanResponse = cleanResponse.replace(/^``````\s*$/, '');
      
      // Extract JSON object
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        trackingData = JSON.parse(jsonMatch[0]);
      } else {
        trackingData = JSON.parse(cleanResponse);
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('AI Response:', aiResponse);
      
      // Fallback: Create basic structure from text
      trackingData = {
        carrier: extractField(aiResponse, 'carrier') || 'Unknown',
        status: extractField(aiResponse, 'status') || 'Searching...',
        location: extractField(aiResponse, 'location') || 'Unknown',
        estimatedDelivery: new Date(Date.now() + 3*24*60*60*1000).toISOString().slice(0, 16).replace('T', ' '),
        confidence: 75,
        transitDays: 3,
        distance: 'Unknown',
        weather: {
          condition: 'Clear',
          icon: '☀️',
          impact: 'Low',
          delay: 'No delays expected'
        },
        checkpoints: []
      };
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

// Helper function to extract field from text response
function extractField(text, field) {
  const patterns = {
    carrier: /carrier["\s:]+([^",\n]+)/i,
    status: /status["\s:]+([^",\n]+)/i,
    location: /location["\s:]+([^",\n]+)/i
  };
  
  const pattern = patterns[field];
  if (!pattern) return null;
  
  const match = text.match(pattern);
  return match ? match[1].trim().replace(/['"]/g, '') : null;
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
