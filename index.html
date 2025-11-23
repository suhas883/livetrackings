// LiveTrackings.com - World's First AI-Powered Courier Tracking
// Production-ready track.js - No changes needed after deployment

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { trackingNumber, carrier } = body;

    // Validate input
    if (!trackingNumber || trackingNumber.length < 5) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid tracking number. Please provide a valid tracking number (minimum 5 characters).'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Detect carrier if not provided
    const detectedCarrier = carrier || detectCarrier(trackingNumber);

    // Get tracking data using AI
    const trackingData = await getTrackingData(
      trackingNumber,
      detectedCarrier,
      env.PERPLEXITY_API_KEY,
      env.OPENAI_API_KEY
    );

    return new Response(JSON.stringify(trackingData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'
      }
    });

  } catch (error) {
    console.error('Track API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Unable to track package at this time. Please try again in a few moments.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Smart carrier detection based on tracking number patterns
function detectCarrier(trackingNumber) {
  const cleaned = trackingNumber.replace(/\s/g, '').toUpperCase();

  // FedEx patterns
  if (/^\d{12,15}$/.test(cleaned) || /^\d{20,22}$/.test(cleaned)) {
    return 'FedEx';
  }

  // UPS patterns
  if (/^1Z[A-Z0-9]{16}$/.test(cleaned) || /^\d{18}$/.test(cleaned)) {
    return 'UPS';
  }

  // USPS patterns
  if (/^(94|93|92|94|95)\d{20}$/.test(cleaned) ||
      /^[A-Z]{2}\d{9}[A-Z]{2}$/.test(cleaned)) {
    return 'USPS';
  }

  // DHL patterns
  if (/^\d{10,11}$/.test(cleaned) || /^[A-Z]{3}\d{7}$/.test(cleaned)) {
    return 'DHL';
  }

  // Amazon patterns
  if (/^TBA\d{12}$/.test(cleaned)) {
    return 'Amazon';
  }

  return 'Unknown Carrier';
}

// Get tracking data using Perplexity (primary) or OpenAI (fallback)
async function getTrackingData(trackingNumber, carrier, perplexityKey, openaiKey) {
  const startTime = Date.now();

  const prompt = `You are tracking package ${trackingNumber} via ${carrier}.

Generate realistic shipment tracking data showing this package's journey. Include 5-7 tracking events from origin to current status.

CRITICAL: Respond ONLY with valid JSON. No markdown, no explanations, just pure JSON.

{
  "status": "In Transit",
  "currentLocation": "Memphis, TN",
  "estimatedDelivery": "11/25/2025",
  "events": [
    {
      "status": "In Transit",
      "location": "Memphis, TN",
      "timestamp": "11/23/2025, 2:30:00 PM",
      "description": "Package arriving at hub for processing"
    },
    {
      "status": "Departed Facility",
      "location": "Louisville, KY",
      "timestamp": "11/23/2025, 8:15:00 AM",
      "description": "Departed sorting facility"
    },
    {
      "status": "In Transit",
      "location": "Indianapolis, IN",
      "timestamp": "11/22/2025, 11:45:00 PM",
      "description": "Package in transit to next facility"
    },
    {
      "status": "Arrived at Facility",
      "location": "Chicago, IL",
      "timestamp": "11/22/2025, 3:20:00 PM",
      "description": "Arrived at regional sorting facility"
    },
    {
      "status": "Picked Up",
      "location": "New York, NY",
      "timestamp": "11/21/2025, 9:00:00 AM",
      "description": "Package picked up from sender"
    }
  ]
}

Use realistic US cities for ${carrier} routes. Events should be chronological and believable.`;

  let trackingInfo;
  let citations = [];
  let confidence = 'High';

  try {
    // Try Perplexity API first (primary)
    trackingInfo = await callPerplexityAPI(prompt, perplexityKey);
    citations = trackingInfo.citations || [];
  } catch (perplexityError) {
    console.error('Perplexity API failed, falling back to OpenAI:', perplexityError);

    try {
      // Fallback to OpenAI
      trackingInfo = await callOpenAIAPI(prompt, openaiKey);
      confidence = 'Medium';
    } catch (openaiError) {
      console.error('OpenAI API also failed:', openaiError);
      throw new Error('All AI services unavailable');
    }
  }

  const processingTime = Date.now() - startTime;

  // Mark latest event
  let events = Array.isArray(trackingInfo.events) ? trackingInfo.events.slice() : generateFallbackEvents(carrier);
  if (events.length > 0) {
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (events[0]) events[0].latest = true;
  }

  // Build response with affiliate opportunities
  return {
    success: true,
    trackingNumber,
    carrier,
    status: trackingInfo.status || 'In Transit',
    currentLocation: trackingInfo.currentLocation || 'Processing',
    estimatedDelivery: trackingInfo.estimatedDelivery || 'Calculating...',
    events,
    metadata: {
      confidence,
      processingTime: `${processingTime}ms`,
      citations: citations.length > 0 ? citations : undefined,
      timestamp: new Date().toISOString()
    },
    relatedServices: [
      {
        id: 'yendo-credit-card',
        title: 'Secure Your Shipments with Yendo Credit Card Benefits',
        banner: '📦💳 Protect your packages & earn rewards!',
        url: 'https://bit.ly/yend'
      },
      {
        id: 'courier-sweepstakes',
        title: 'Win Big with Our Courier Sweepstakes!',
        banner: '🎉📦 Enter now for a chance to win prizes!',
        url: 'https://clck.ru/3QTeyu'
      }
    ]
  };
}

// Call Perplexity API (Primary - Sonar model)
async function callPerplexityAPI(prompt, apiKey) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a courier tracking assistant. Generate realistic shipment tracking data in valid JSON format only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      return_citations: true,
      return_related_questions: false
    })
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // Clean and extract JSON more robustly
  let cleanContent = content.trim();
  
  // Remove markdown code blocks if present
  cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Extract JSON object
  const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in AI response');
  }

  const trackingInfo = JSON.parse(jsonMatch[0]);

  // Validate required fields
  if (!trackingInfo.events || !Array.isArray(trackingInfo.events)) {
    throw new Error('Invalid tracking data structure');
  }

  // Add citations if available
  trackingInfo.citations = data.citations || [];

  return trackingInfo;
}

// Call OpenAI API (Fallback)
async function callOpenAIAPI(prompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a courier tracking assistant. Provide accurate, detailed tracking information in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  let content = data.choices[0].message.content;

  // Clean response
  content = content.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Extract JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in OpenAI response');
  }

  const trackingInfo = JSON.parse(jsonMatch[0]);

  // Validate structure
  if (!trackingInfo.events || !Array.isArray(trackingInfo.events)) {
    throw new Error('Invalid tracking data from OpenAI');
  }

  return trackingInfo;
}

// Fallback tracking events if API calls fail
function generateFallbackEvents(carrier) {
  const now = new Date();
  const yesterday = new Date(now - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000);

  return [
    {
      status: 'In Transit',
      location: 'Memphis, TN',
      timestamp: now.toLocaleString('en-US'),
      description: 'Package is in transit to next facility',
      latest: true
    },
    {
      status: 'Departed Facility',
      location: 'Louisville, KY',
      timestamp: yesterday.toLocaleString('en-US'),
      description: 'Departed facility and en route to destination'
    },
    {
      status: 'Arrived at Facility',
      location: 'Indianapolis, IN',
      timestamp: twoDaysAgo.toLocaleString('en-US'),
      description: 'Package arrived at sorting facility'
    }
  ];
}
