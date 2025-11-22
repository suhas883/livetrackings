// SMS subscription API endpoint for LiveTrackings
// Handles SMS alert signups

export async function onRequest(context) {
  try {
    // Only allow POST requests
    if (context.request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { phone, trackingNumber } = await context.request.json();

    // Validate phone number (basic validation - accepts various formats)
    const phoneRegex = /^[+]?[0-9]{10,15}$/;
    const cleanPhone = phone ? phone.replace(/[\s()-]/g, '') : '';
    
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      return new Response(JSON.stringify({ error: 'Invalid phone number' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate tracking number
    if (!trackingNumber || trackingNumber.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid tracking number' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Store subscription in KV (you'll need to bind KV namespace in wrangler.toml)
    // For now, we'll just return success
    // In production, you'd store this in Cloudflare KV or a database
    // Example: await context.env.SMS_SUBSCRIPTIONS.put(`${trackingNumber}:${cleanPhone}`, JSON.stringify({
    //   phone: cleanPhone,
    //   trackingNumber,
    //   subscribedAt: new Date().toISOString()
    // }));

    console.log(`SMS subscription: ${cleanPhone} for tracking ${trackingNumber}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully subscribed to SMS alerts'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('SMS subscription error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to subscribe',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}