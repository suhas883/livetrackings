// Email subscription API endpoint for LiveTrackings
// Handles email alert signups

export async function onRequest(context) {
  try {
    // Only allow POST requests
    if (context.request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { email, trackingNumber } = await context.request.json();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
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
    // Example: await context.env.EMAIL_SUBSCRIPTIONS.put(`${trackingNumber}:${email}`, JSON.stringify({
    //   email,
    //   trackingNumber,
    //   subscribedAt: new Date().toISOString()
    // }));

    console.log(`Email subscription: ${email} for tracking ${trackingNumber}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully subscribed to email alerts'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Email subscription error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to subscribe',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}