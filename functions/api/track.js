export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const trackingNumberRaw = (body.trackingNumber || '').trim();

    if (!trackingNumberRaw || trackingNumberRaw.length < 5) {
      return jsonResponse({ success: false, error: 'Please enter a valid tracking number (at least 5 characters).' }, 400);
    }

    if (!/[A-Z0-9]/i.test(trackingNumberRaw)) {
      return jsonResponse({ success: false, error: 'Tracking number must contain letters or numbers.' }, 400);
    }

    const trackingNumber = trackingNumberRaw.toUpperCase();
    const PERPLEXITY_API_KEY = env.PERPLEXITY_API_KEY;
    const OPENAI_API_KEY = env.OPENAI_API_KEY;

    // Call Perplexity API primary
    let trackingData = null;
    try {
      if (PERPLEXITY_API_KEY) {
        trackingData = await callPerplexityAPI(trackingNumber, PERPLEXITY_API_KEY);
      }
    } catch (e) {
      console.error('Perplexity API error:', e.message);
    }

    // Fallback OpenAI API
    if (!trackingData && OPENAI_API_KEY) {
      try {
        trackingData = await callOpenAIAPI(trackingNumber, OPENAI_API_KEY);
      } catch (e) {
        console.error('OpenAI API error:', e.message);
      }
    }

    // Final fallback
    if (!trackingData) {
      trackingData = generateFallbackData(trackingNumber);
    }

    // Sort checkpoints latest first and highlight latest
    if (trackingData.checkpoints) {
      trackingData.checkpoints = sortAndHighlightLatest(trackingData.checkpoints);
    }

    // Prepare affiliate offers
    const affiliateOffers = [
      {
        id: 'yendo',
        title: '💳 Get 2% Cash Back with Yendo Credit Card',
        url: 'https://bit.ly/yend',
        badge: 'EXCLUSIVE',
        description: 'Build credit with every purchase. Instant approval. No annual fees.'
      },
      {
        id: 'sweepstakes',
        title: '🎁 Enter Sweepstakes - Free $500 Package Protection',
        url: 'https://clck.ru/3QTeyu',
        badge: 'TRENDING',
        description: 'Protect your shipments against loss or damage. Easy signup.'
      }
    ];

    // Compose response
    const response = {
      success: true,
      trackingNumber,
      carrier: trackingData.carrier || detectCarrier(trackingNumber),
      status: trackingData.status || 'In Transit',
      statusCode: trackingData.statusCode || 'IT',
      estimatedDelivery: formatEstimatedDelivery(trackingData.statusCode || 'IT', trackingData.estimatedDelivery),
      currentLocation: trackingData.currentLocation || {},
      checkpoints: trackingData.checkpoints || [],
      affiliateOffers,
      timestamp: new Date().toISOString()
    };

    return jsonResponse(response);
  } catch (err) {
    console.error('Track API error:', err);
    return jsonResponse({ success: false, error: 'Unable to track package at this time.' }, 500);
  }
}

// Helper: sort latest first and mark latest
function sortAndHighlightLatest(checkpoints) {
  if (!checkpoints || checkpoints.length === 0) return [];
  checkpoints.sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp));
  checkpoints[0].latest = true; // highlight the latest checkpoint for UI
  return checkpoints;
}

// Helper: format estimated delivery date or hide for delivered
function formatEstimatedDelivery(statusCode, dateStr) {
  if (statusCode === 'DL' || !dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
}

// Calls Perplexity API to fetch tracking info
async function callPerplexityAPI(trackingNumber, apiKey) {
  const response = await fetch('https://api.perplexity.ai/v1/sonar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar',
      query: `track shipment ${trackingNumber} with detailed events and timestamps in JSON`,
      temperature: 0.3,
      max_citations: 3,
      return_citations: true
    })
  });
  if (!response.ok) throw new Error(`Perplexity API error ${response.status}`);
  const data = await response.json();
  // Extract JSON from AI response safely
  const content = data.answer || '';
  const jsonStart = content.indexOf('{');
  const jsonEnd = content.lastIndexOf('}') + 1;
  if (jsonStart === -1 || jsonEnd === -1) return null;
  return JSON.parse(content.slice(jsonStart, jsonEnd));
}

// Calls OpenAI GPT as fallback
async function callOpenAIAPI(trackingNumber, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Provide detailed shipment tracking data as JSON' },
        { role: 'user', content: `Track shipment number ${trackingNumber} with status, events, locations.` }
      ],
      temperature: 0.3,
      max_tokens: 2500,
      response_format: { type: 'json_object' }
    })
  });
  if (!response.ok) throw new Error(`OpenAI API error ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content ? JSON.parse(data.choices[0].message.content) : null;
}

// Dummy fallback data generator (used if APIs fail)
function generateFallbackData(trackingNumber) {
  const now = new Date();
  return {
    carrier: 'Unknown Carrier',
    status: 'Courier Not Found',
    statusCode: 'NF',
    estimatedDelivery: null,
    currentLocation: { city: 'Unknown', facility: 'Unknown Facility' },
    checkpoints: [
      { date: now.toISOString(), status: 'Courier Not Found', location: 'Unknown Location', description: 'Invalid or unsupported tracking number.', latest: true }
    ]
  };
}

// Carrier detection
function detectCarrier(trackingNumber) {
  if (/^1Z[A-Z0-9]{16}$/.test(trackingNumber)) return 'UPS';
  if (/^[0-9]{12,14}$/.test(trackingNumber)) return 'FedEx';
  if (/^(94|92|93)[0-9]{20}$/.test(trackingNumber)) return 'USPS';
  if (/^[A-Z]{2}[0-9]{9}[A-Z]{2}$/.test(trackingNumber)) return 'DHL';
  if (/^TBA[0-9]{12}$/.test(trackingNumber)) return 'Amazon Logistics';
  if (/^[0-9]{10,12}$/.test(trackingNumber)) return 'Blue Dart';
  return 'Unknown';
}

// Helper for JSON Responses
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
