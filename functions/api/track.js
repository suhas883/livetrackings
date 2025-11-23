import { json } from '@sveltejs/kit';

const AFFILIATE_SERVICES = [
  {
    id: 'yendo-credit-card',
    title: 'Secure Your Shipments with Yendo Credit Card Benefits',
    banner: '📦💳 Protect your packages & earn rewards!',
    link: 'https://bit.ly/yend'
  },
  {
    id: 'courier-sweepstakes',
    title: 'Win Big with Our Courier Sweepstakes!',
    banner: '🎉📦 Enter now for a chance to win prizes!',
    link: 'https://clck.ru/3QTeyu'
  }
];

const CARRIER_PATTERNS = [
  { pattern: /^1Z[A-Z0-9]{16}$/, carrier: 'UPS' },
  { pattern: /^[0-9]{12,14}$/, carrier: 'FedEx' },
  { pattern: /^(94|92|93)[0-9]{20}$/, carrier: 'USPS' },
  { pattern: /^[A-Z]{2}[0-9]{9}[A-Z]{2}$/, carrier: 'DHL' },
  { pattern: /^TBA[0-9]{12}$/, carrier: 'Amazon Logistics' },
  { pattern: /^[0-9]{10,12}$/, carrier: 'Blue Dart' }
];

const STATUS_LABELS = {
  IT: 'In Transit',
  OFD: 'Out For Delivery',
  DL: 'Delivered',
  PS: 'Processing',
  EX: 'Exception',
  NF: 'Courier Not Found' // Custom for errors or unrecognized
};

const LOCATIONS = [
  'Memphis, TN',
  'Louisville, KY',
  'Chicago, IL',
  'Los Angeles, CA',
  'Houston, TX',
  'Phoenix, AZ',
  'Dallas, TX',
  'San Francisco, CA',
  'New York, NY',
  'Miami, FL'
];

function extractCarrier(trackingNumber) {
  for (const { pattern, carrier } of CARRIER_PATTERNS) {
    if (pattern.test(trackingNumber)) return carrier;
  }
  return 'Unknown Carrier';
}

function formatEstimatedDelivery(dateStr, statusCode) {
  if (!dateStr) return null;
  if (statusCode === 'DL') return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return `Est. Delivery: ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}`;
  } catch {
    return null;
  }
}

function sortEventsLatestFirst(events) {
  return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function addLatestHighlight(events) {
  if (events.length === 0) return events;
  events[0].latest = true;
  return events;
}

function enrichLocations(events) {
  return events.map((event, idx) => {
    if (!event.location || event.location.toLowerCase() === 'distribution center') {
      // Random realistic location assignation for demo
      event.location = LOCATIONS[idx % LOCATIONS.length];
    }
    return event;
  });
}

async function callPerplexityAPI(trackingNumber, key) {
  const res = await fetch('https://api.perplexity.ai/v1/sonar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar',
      query: `track shipment ${trackingNumber} with detailed status and timestamps in JSON`,
      max_citations: 3,
      temperature: 0.3,
      return_citations: true
    })
  });
  if (!res.ok) throw new Error('Perplexity API error');
  return res.json();
}

async function callOpenAIAPI(trackingNumber, key) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a shipment tracking assistant. Always respond with valid JSON.' },
        { role: 'user', content: `Track shipment ${trackingNumber} with detailed events and statuses.` }
      ],
      temperature: 0.3
    })
  });
  if (!res.ok) throw new Error('OpenAI API error');
  return res.json();
}

function parseTrackingEvents(text) {
  // Remove markdown code blocks and extract JSON string
  try {
    const jsonText = text.replace(/``````/g, '').trim();
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.events) return parsed.events;
  } catch {
    // fallback - empty array
  }
  return [];
}

function enhanceEvents(events) {
  // Add latest highlight, enrich locations, format statuses
  events = sortEventsLatestFirst(events);
  events = addLatestHighlight(events);
  events = enrichLocations(events);

  for (const event of events) {
    if (event.status === 'In Transit') {
      event.statusLabel = STATUS_LABELS.IT;
    } else if (event.status === 'Out For Delivery') {
      event.statusLabel = STATUS_LABELS.OFD;
    } else if (event.status === 'Delivered') {
      event.statusLabel = `${STATUS_LABELS.DL} to ${event.recipient || 'recipient'}`;
      event.estimatedDelivery = null;
    } else if (event.status === 'Processing') {
      event.statusLabel = STATUS_LABELS.PS;
    } else if (event.status === 'Exception') {
      event.statusLabel = STATUS_LABELS.EX;
    } else {
      event.statusLabel = STATUS_LABELS.NF;
    }
    event.estimatedDeliveryFormatted = formatEstimatedDelivery(event.estimatedDelivery, event.status);
  }
  return events;
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const trackingNumberRaw = (body.trackingNumber || '').trim();

    if (!trackingNumberRaw || trackingNumberRaw.length < 5) {
      return json({ success: false, error: 'Please enter a valid tracking number (at least 5 characters).' }, { status: 400 });
    }

    const trackingNumber = trackingNumberRaw.toUpperCase();

    const carrier = extractCarrier(trackingNumber);
    const PERPLEXITY_API_KEY = env.PERPLEXITY_API_KEY;
    const OPENAI_API_KEY = env.OPENAI_API_KEY;

    let trackingResult = null;

    // Try Perplexity API primary
    try {
      const data = await callPerplexityAPI(trackingNumber, PERPLEXITY_API_KEY);
      trackingResult = parseTrackingEvents(data.answer || '');
    } catch (e) {
      // fallback OpenAI API
      try {
        const data = await callOpenAIAPI(trackingNumber, OPENAI_API_KEY);
        trackingResult = parseTrackingEvents(data.choices?.[0]?.message?.content || '');
      } catch (e2) {
        trackingResult = [];
      }
    }

    // Fallback realistic data if none returned
    if (!trackingResult || trackingResult.length === 0) {
      trackingResult = [{
        timestamp: new Date().toISOString(),
        status: 'Courier Not Found',
        location: 'Unknown',
        description: 'Unable to locate your package with the given tracking number.',
        latest: true,
        statusLabel: STATUS_LABELS.NF
      }];
    }

    let events = enhanceEvents(trackingResult);

    // Enrich AI features
    const now = new Date();
    const lastUpdated = new Date(events[0].timestamp);
    const updatedMinutesAgo = Math.round((now - lastUpdated) / 60000);
    const confidencePct = 94; // example static confidence
    const progressPct = 65; // example static progress
    const nextUpdateTime = new Date(now.getTime() + 30 * 60000); // +30 minutes

    // Compose final payload
    const responsePayload = {
      success: true,
      trackingNumber,
      carrier,
      events,
      affiliateOffers: AFFILIATE_SERVICES,
      aiInsights: {
        updatedMinutesAgo,
        confidence: confidencePct,
        progress: progressPct,
        nextExpectedUpdate: nextUpdateTime.toISOString(),
        weatherImpact: 'Light rain expected near distribution centers',
        riskFactors: ['Traffic congestion in Louisville, KY', 'Minor delays due to weather'],
        statusExplanation: 'Package is currently moving through regional hubs closer to final destination.'
      }
    };

    return json(responsePayload, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return json({ success: false, error: 'Tracking failed, please try again later.' }, { status: 500 });
  }
}
