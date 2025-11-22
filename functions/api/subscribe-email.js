// Production Email Subscription API - Cloudflare Pages Function
// Integrates with SendGrid or Mailgun for email notifications
// Stores subscriptions in Cloudflare KV for persistence

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

export async function onRequestPost(context) {
  try {
    const { email, trackingNumber } = await context.request.json();

    // Validation: Email
    if (!email || typeof email !== 'string') {
      return errorResponse('Email is required', 400);
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail) || trimmedEmail.length > MAX_EMAIL_LENGTH) {
      return errorResponse('Invalid email address format', 400);
    }

    // Validation: Tracking Number
    if (!trackingNumber || typeof trackingNumber !== 'string' || trackingNumber.trim().length === 0) {
      return errorResponse('Valid tracking number is required', 400);
    }

    const cleanTracking = trackingNumber.trim().toUpperCase();

    // Get environment variables
    const KV_NAMESPACE = context.env.EMAIL_SUBSCRIPTIONS;
    const SENDGRID_API_KEY = context.env.SENDGRID_API_KEY;
    const SENDGRID_FROM_EMAIL = context.env.SENDGRID_FROM_EMAIL || 'alerts@livetrackings.com';

    if (!KV_NAMESPACE) {
      console.error('EMAIL_SUBSCRIPTIONS KV namespace not configured');
      return errorResponse('Service misconfigured', 500);
    }

    // Create subscription key
    const subscriptionKey = `${cleanTracking}:${trimmedEmail}`;
    const subscriptionData = JSON.stringify({
      email: trimmedEmail,
      trackingNumber: cleanTracking,
      subscribedAt: new Date().toISOString(),
      active: true
    });

    // Store in KV (30-day TTL)
    await KV_NAMESPACE.put(subscriptionKey, subscriptionData, {
      expirationTtl: 30 * 24 * 60 * 60
    });

    // Send confirmation email if SendGrid configured
    if (SENDGRID_API_KEY) {
      try {
        await sendConfirmationEmail(
          trimmedEmail,
          cleanTracking,
          SENDGRID_API_KEY,
          SENDGRID_FROM_EMAIL
        );
      } catch (emailError) {
        console.error('SendGrid email failed:', emailError);
        // Don't fail subscription if email sending fails
      }
    }

    return successResponse({
      success: true,
      message: 'Email subscription confirmed',
      email: trimmedEmail,
      trackingNumber: cleanTracking,
      expiresIn: '30 days'
    });

  } catch (error) {
    console.error('Email subscription error:', error);
    return errorResponse(
      'Failed to process subscription',
      500,
      error.message
    );
  }
}

// Send confirmation email via SendGrid
async function sendConfirmationEmail(email, trackingNumber, apiKey, fromEmail) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email }],
        subject: `🚚 Tracking Alerts Enabled for #${trackingNumber}`
      }],
      from: { email: fromEmail, name: 'LiveTrackings' },
      content: [{
        type: 'text/html',
        value: `
          <h2>Tracking Alert Confirmed! 🎉</h2>
          <p>You'll now receive real-time updates for:</p>
          <p><strong>Tracking #: ${trackingNumber}</strong></p>
          <p>We'll notify you when:</p>
          <ul>
            <li>📦 Your package is picked up</li>
            <li>✈️ It leaves the origin facility</li>
            <li>🏙️ It arrives at a distribution center</li>
            <li>🚚 It's out for delivery</li>
            <li>✅ It's successfully delivered</li>
          </ul>
          <p>Best regards,<br/>LiveTrackings Team</p>
        `
      }],
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`SendGrid API failed: ${response.status}`);
  }

  return response.json();
}

// OPTIONS request handler (CORS preflight)
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

// Helper: Success response
function successResponse(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    }
  });
}

// Helper: Error response
function errorResponse(message, status = 500, details = null) {
  const body = {
    success: false,
    error: message
  };
  if (details) body.details = details;

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
