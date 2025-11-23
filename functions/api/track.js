export async function onRequestPost(context) {
  const { request, env } = context;

  // Helper for JSON response
  function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Format date/time with timezone support
  function formatDateTime(dateStr, timeZone = 'America/New_York') {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
        timeZone
      });
    } catch {
      return dateStr || '';
    }
  }

  // Format estimated delivery date (localized, human-friendly)
  function formatEstimatedDelivery(statusCode, dateStr, timeZone = 'America/New_York') {
    if (statusCode === 'DL' || !dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
        timeZone
      });
    } catch {
      return null;
    }
  }

  // Sort checkpoints with latest first and highlight OFD and latest
  function sortAndHighlightLatest(checkpoints) {
    if (!checkpoints || checkpoints.length === 0) return [];
    checkpoints.sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp));
    checkpoints[0].latest = true; // latest event

    // Highlight Out For Delivery specially
    checkpoints.forEach(cp => {
      cp.isOutForDelivery = cp.status && cp.status.toLowerCase().includes('out for delivery');
    });

    return checkpoints;
  }

  // Carrier detection
  function detectCarrier(trackingNumber) {
    if (/^1Z[A-Z0-9]{16}$/i.test(trackingNumber)) return 'UPS';
    if (/^[0-9]{12,14}$/i.test(trackingNumber)) return 'FedEx';
    if (/^(94|92|93)[0-9]{20}$/i.test(trackingNumber)) return 'USPS';
    if (/^[A-Z]{2}[0-9]{9}[A-Z]{2}$/i.test(trackingNumber)) return 'DHL';
    if (/^TBA[0-9]{12}$/i.test(trackingNumber)) return 'Amazon Logistics';
    if (/^[0-9]{10,12}$/i.test(trackingNumber)) return 'Blue Dart';
    return 'Unknown Carrier';
  }

  // Affiliate offers
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

    let trackingData = null;

    // PRIMARY API CALL: Perplexity
    if (PERPLEXITY_API_KEY) {
      try {
        trackingData = await callPerplexityAPI(trackingNumber, PERPLEXITY_API_KEY);
      } catch (e) {
        console.error('Perplexity API error:', e.message);
      }
    }

    // FALLBACK: OpenAI
    if (!trackingData && OPENAI_API_KEY) {
      try {
        trackingData = await callOpenAIAPI(trackingNumber, OPENAI_API_KEY);
      } catch (e) {
        console.error('OpenAI API error:', e.message);
      }
    }

    // FINAL FALLBACK: Dummy data
    if (!trackingData) {
      trackingData = generateFallbackData(trackingNumber);
    }

    // Sort and highlight
    if (trackingData.checkpoints) {
      trackingData.checkpoints = sortAndHighlightLatest(trackingData.checkpoints);
      // Format dates and timestamps for checkpoints
      trackingData.checkpoints = trackingData.checkpoints.map(cp => ({
        ...cp,
        formattedDate: formatDateTime(cp.date || cp.timestamp),
        formattedStatus: cp.status,
        highlight: cp.latest || cp.isOutForDelivery
      }));
    }

    // Format estimated delivery
    const estDeliveryFormatted = formatEstimatedDelivery(trackingData.statusCode || 'IT', trackingData.estimatedDelivery);

    const response = {
      success: true,
      trackingNumber,
      carrier: trackingData.carrier || detectCarrier(trackingNumber),
      status: trackingData.status || 'In Transit',
      statusCode: trackingData.statusCode || 'IT',
      estimatedDelivery: estDeliveryFormatted,
      currentLocation: trackingData.currentLocation || {},
      checkpoints: trackingData.checkpoints || [],
      affiliateOffers,
      timestamp: new Date().toISOString()
    };

    return jsonResponse(response);
  } catch (error) {
    console.error('API error:', error);
    return jsonResponse({ success: false, error: 'Unable to track package at this time.' }, 500);
  }
}

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
      query: `Track shipment ${trackingNumber} with detailed events and timestamps in JSON format.`,
      temperature: 0.3,
      max_citations: 3,
      return_citations: true
    })
  });
  if (!response.ok) throw new Error(`Perplexity API error: ${response.status}`);
  const data = await response.json();
  const content = data.answer || '';
  const jsonStart = content.indexOf('{');
  const jsonEnd = content.lastIndexOf('}') + 1;
  if (jsonStart === -1 || jsonEnd === -1) return null;
  return JSON.parse(content.slice(jsonStart, jsonEnd));
}

async function callOpenAIAPI(trackingNumber, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Provide package tracking info in valid JSON format' },
        { role: 'user', content: `Track shipment number ${trackingNumber}` }
      ],
      temperature: 0.3,
      max_tokens: 2500,
      response_format: { type: 'json_object' }
    })
  });
  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
  const data = await response.json();
  // The response is a JSON object already from model
  return data.choices?.[0]?.message?.content ? JSON.parse(data.choices[0].message.content) : null;
}

function generateFallbackData(trackingNumber) {
  const now = new Date();
  return {
    carrier: 'Courier Not Found',
    status: 'Courier Not Found',
    statusCode: 'NF',
    estimatedDelivery: null,
    checkpoints: [
      {
        date: now.toISOString(),
        status: 'Courier Not Found',
        location: 'Unknown',
        description: 'No information available for this tracking number.',
        latest: true
      }
    ]
  };
}
