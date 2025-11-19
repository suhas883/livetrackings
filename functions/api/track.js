// Cloudflare Pages Function: /functions/api/track.js
// Ultra-simple version that always works

export async function onRequestPost(context) {
  try {
    const { request } = context;
    const body = await request.json();
    const trackingNumber = body.trackingNumber;

    // Always return valid JSON for testing
    const testData = {
      success: true,
      data: {
        carrier: "UPS",
        status: "In Transit",
        location: "Louisville, KY, USA",
        estimatedDelivery: "2025-11-22 18:00",
        confidence: 92,
        transitDays: 3,
        distance: "1245 miles",
        weather: {
          condition: "Clear",
          icon: "☀️",
          impact: "Low",
          delay: "No delays expected"
        },
        checkpoints: [
          {
            date: "2025-11-19T14:30:00Z",
            status: "Package received at facility",
            location: "Louisville, KY",
            description: "Package scanned at UPS facility"
          },
          {
            date: "2025-11-18T09:15:00Z",
            status: "Picked up",
            location: "Los Angeles, CA",
            description: "Package picked up by UPS driver"
          }
        ]
      }
    };

    return new Response(JSON.stringify(testData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    message: 'API is running. Use POST method to track packages.',
    endpoint: '/api/track',
    method: 'POST'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}