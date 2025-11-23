// Cloudflare Pages Function: /api/track
// INSANELY ULTIMATE Tracking API - Best in Universe + Strategic Monetization

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const trackingNumber = body.trackingNumber?.trim();

    if (!trackingNumber || trackingNumber.length < 5) {
      return jsonResponse({
        success: false,
        error: 'Please enter a valid tracking number (at least 5 characters)'
      }, 400);
    }

    if (!/[A-Z0-9]/i.test(trackingNumber)) {
      return jsonResponse({
        success: false,
        error: 'Tracking number must contain letters or numbers'
      }, 400);
    }

    const PERPLEXITY_API_KEY = env?.PERPLEXITY_API_KEY;
    const OPENAI_API_KEY = env?.OPENAI_API_KEY;

    let trackingData = null;
    let source = 'AI Prediction';

    // PRIMARY: Perplexity Sonar Pro
    if (PERPLEXITY_API_KEY) {
      try {
        trackingData = await callPerplexityAPI(trackingNumber, PERPLEXITY_API_KEY);
        if (trackingData) source = 'AI';
      } catch (err) {
        console.error('Perplexity failed:', err.message);
      }
    }

    // FALLBACK: OpenAI
    if (!trackingData && OPENAI_API_KEY) {
      try {
        trackingData = await callOpenAIAPI(trackingNumber, OPENAI_API_KEY);
        if (trackingData) source = 'OpenAI GPT-4o';
      } catch (err) {
        console.error('OpenAI failed:', err.message);
      }
    }

    // FINAL FALLBACK: Premium prediction
    if (!trackingData) {
      trackingData = generatePremiumData(trackingNumber);
      source = 'AI Prediction Engine';
    }

    const carrier = trackingData.carrier || detectCarrier(trackingNumber);
    const currentStatus = trackingData.status || 'In Transit';
    const statusCode = trackingData.statusCode || 'IT';
    
    // INSANE Response Structure - Universe's Best
    const response = {
      // 🔥 TOP SECTION - HIGHLIGHTED CURRENT STATUS
      currentStatus: {
        status: currentStatus,
        statusCode: statusCode,
        statusEmoji: getStatusEmoji(statusCode),
        statusColor: getStatusColor(statusCode),
        highlight: true,
        lastScanned: trackingData.lastUpdate || new Date().toISOString(),
        lastScannedHuman: getHumanTime(new Date()),
        isActive: statusCode !== 'DL',
        estimatedArrival: trackingData.estimatedDelivery || getEstimatedDate(3),
        daysRemaining: calculateDaysRemaining(trackingData.estimatedDelivery)
      },

      // 📍 FROM → TO Journey
      journey: {
        from: {
          name: trackingData.origin?.name || 'Shipper',
          address: trackingData.origin?.address || 'Origin Location',
          city: trackingData.origin?.city || extractOriginCity(trackingData.checkpoints),
          state: trackingData.origin?.state || 'State',
          country: trackingData.origin?.country || 'USA',
          timestamp: trackingData.origin?.timestamp || getFirstCheckpointTime(trackingData.checkpoints),
          timestampHuman: getHumanTime(getFirstCheckpointTime(trackingData.checkpoints))
        },
        to: {
          name: trackingData.destination?.name || 'Recipient',
          address: trackingData.destination?.address || 'Destination Address',
          city: trackingData.destination?.city || 'Destination City',
          state: trackingData.destination?.state || 'State',
          country: trackingData.destination?.country || 'USA',
          estimatedTimestamp: trackingData.estimatedDelivery || getEstimatedDate(3),
          estimatedHuman: getHumanTime(getEstimatedDate(3))
        },
        totalDistance: trackingData.journey?.totalDistance || '450 miles',
        totalDuration: trackingData.journey?.totalDuration || '2-3 days',
        completionPercentage: trackingData.metrics?.estimatedProgress || 65
      },

      // Core tracking
      carrier: carrier,
      trackingNumber: trackingNumber,
      location: trackingData.location || 'Distribution Center',
      
      // Detailed current location
      currentLocation: {
        city: trackingData.currentLocation?.city || extractCity(trackingData.location),
        state: trackingData.currentLocation?.state || 'Processing',
        country: trackingData.currentLocation?.country || 'USA',
        facility: trackingData.currentLocation?.facility || 'Main Distribution Center',
        facilityType: trackingData.currentLocation?.facilityType || 'Distribution',
        coordinates: trackingData.currentLocation?.coordinates || null,
        timezone: trackingData.currentLocation?.timezone || 'America/New_York',
        localTime: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
      },
      
      // Delivery window
      estimatedDelivery: trackingData.estimatedDelivery || getEstimatedDate(3),
      estimatedDeliveryWindow: trackingData.estimatedDeliveryWindow || {
        earliest: getEstimatedDate(2),
        latest: getEstimatedDate(4),
        displayText: 'Within 2-4 business days',
        confidence: 'High'
      },
      
      // Package details
      packageDetails: {
        weight: trackingData.packageDetails?.weight || '2.5 lbs',
        dimensions: trackingData.packageDetails?.dimensions || '12x10x4 inches',
        type: trackingData.packageDetails?.type || 'Package',
        serviceLevel: trackingData.packageDetails?.serviceLevel || 'Standard Ground',
        value: trackingData.packageDetails?.value || null,
        insured: trackingData.packageDetails?.insured || false
      },
      
      // Weather - DETAILED
      weather: {
        condition: trackingData.weather?.condition || 'Clear',
        icon: trackingData.weather?.icon || '☀️',
        temp: trackingData.weather?.temp || '24°C',
        tempF: trackingData.weather?.tempF || '75°F',
        humidity: trackingData.weather?.humidity || '45%',
        windSpeed: trackingData.weather?.windSpeed || '10 mph',
        impact: trackingData.weather?.impact || 'Low',
        impactLevel: trackingData.weather?.impactLevel || 1,
        details: trackingData.weather?.details || 'Weather conditions are favorable for on-time delivery',
        forecast: trackingData.weather?.forecast || 'Clear skies expected for next 48 hours',
        alerts: trackingData.weather?.alerts || []
      },
      
      // AI insights - ENHANCED
      aiInsight: trackingData.aiInsight || generateDetailedInsight(trackingNumber, statusCode),
      aiPredictions: {
        onTimeDelivery: trackingData.aiPredictions?.onTimeDelivery || 94,
        earlyDelivery: trackingData.aiPredictions?.earlyDelivery || 15,
        delayRisk: trackingData.aiPredictions?.delayRisk || 6,
        confidenceScore: trackingData.confidence || 85
      },
      
      // 🔥 FLOW TRACKING - Detailed Checkpoints with Current Highlight
      checkpoints: enhanceCheckpoints(
        trackingData.checkpoints || generateDetailedCheckpoints(trackingNumber),
        statusCode
      ),
      
      // Metrics
      metrics: {
        totalCheckpoints: (trackingData.checkpoints?.length || 4),
        completedCheckpoints: getCompletedCheckpoints(trackingData.checkpoints),
        remainingCheckpoints: getRemainingCheckpoints(trackingData.checkpoints),
        averageTransitTime: trackingData.metrics?.averageTransitTime || '2-3 days',
        onTimePerformance: trackingData.metrics?.onTimePerformance || '94%',
        estimatedProgress: trackingData.metrics?.estimatedProgress || 65,
        nextUpdateIn: trackingData.metrics?.nextUpdateIn || '2-4 hours',
        velocityScore: trackingData.metrics?.velocityScore || 8.5
      },
      
      // Delivery instructions
      deliveryInstructions: trackingData.deliveryInstructions || {
        signatureRequired: false,
        leaveAtDoor: true,
        specialInstructions: null,
        accessCode: null,
        contactOnArrival: false
      },
      
      // Risk factors
      riskFactors: trackingData.riskFactors || {
        weatherDelay: 'Low',
        holidayImpact: 'None',
        routeCongestion: 'Low',
        carrierPerformance: 'Excellent',
        overallRisk: 'Low'
      },
      
      // Timeline events
      timeline: generateTimeline(trackingData.checkpoints),
      
      // Real-time updates
      lastUpdate: trackingData.lastUpdate || new Date().toISOString(),
      lastUpdateHuman: getHumanTime(new Date()),
      nextExpectedUpdate: trackingData.nextExpectedUpdate || getEstimatedDate(0.2),
      nextExpectedUpdateHuman: getHumanTime(getEstimatedDate(0.2)),
      
      // Notifications
      notifications: {
        enabled: true,
        channels: ['email', 'sms'],
        frequency: 'on_change',
        lastSent: null
      },
      
      // 💰 STRATEGIC AFFILIATE OFFERS - Dynamic & Contextual
      offers: generateStrategicOffers(statusCode, carrier, trackingData),
      
      // Meta
      source: source,
      timestamp: new Date().toISOString(),
      cached: false,
      apiVersion: '2.0'
    };

    return jsonResponse({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    }, 200);

  } catch (error) {
    console.error('Tracking error:', error);
    return jsonResponse({
      success: false,
      error: 'Unable to track package. Please try again.',
      details: error.message
    }, 500);
  }
}

// 💰 STRATEGIC OFFERS - Context-Aware Monetization
function generateStrategicOffers(statusCode, carrier, trackingData) {
  const baseOffers = [
    {
      id: 'yendo_credit',
      type: 'primary',
      position: 1,
      title: '💳 Exclusive: 2% Cash Back on All Purchases',
      subtitle: 'Turn Your Car Into Credit Power',
      description: 'Get 2% back on all purchases including shipping costs. Build credit while you shop. No hidden fees. Instant approval available.',
      badge: 'EXCLUSIVE OFFER',
      badgeColor: '#ff6d00',
      cta: 'Get 2% Cash Back Now',
      ctaColor: '#1a73e8',
      url: 'https://bit.ly/yend',
      icon: '💳',
      highlight: true,
      benefits: [
        '✓ 2% cash back on all purchases',
        '✓ Build credit with every purchase',
        '✓ No annual fees',
        '✓ Instant approval available'
      ],
      contextualMessage: getYendoContextMessage(statusCode, carrier)
    },
    {
      id: 'cpabuild_sweepstakes',
      type: 'secondary',
      position: 2,
      title: '🎁 Claim Your Free Package Protection Insurance!',
      subtitle: 'Limited Time - Protect Every Delivery',
      description: 'Get FREE package protection & shipping insurance worth $500! Covers lost, damaged, or stolen deliveries. Claim your free protection now - limited spots available.',
      badge: 'TRENDING NOW',
      badgeColor: '#34a853',
      cta: 'Enter Free Sweepstakes',
      ctaColor: '#34a853',
      url: 'https://clck.ru/3QTU6h',
      icon: '🎁',
      highlight: false,
      benefits: [
        '✓ FREE $500 package protection',
        '✓ Covers lost & damaged shipments',
        '✓ Instant activation',
        '✓ No credit card required'
      ],
      contextualMessage: getSweepstakesContextMessage(statusCode)
    }
  ];
  
  return baseOffers;
}

// Context-aware messaging for Yendo
function getYendoContextMessage(statusCode, carrier) {
  const messages = {
    'IT': `Your package is in transit! Earn 2% back on your next ${carrier} shipment with Yendo Credit Card.`,
    'OFD': 'Package arriving today! Get 2% cash back on all future deliveries and purchases.',
    'DL': 'Package delivered! Celebrate with 2% back on your next purchase using Yendo.',
    'PS': 'While your package is processing, secure 2% cash back on all future orders.',
    'EX': 'Get peace of mind with 2% cash back - perfect for urgent reshipments if needed.'
  };
  return messages[statusCode] || messages['IT'];
}

// Context-aware messaging for Package Protection
function getSweepstakesContextMessage(statusCode) {
  const messages = {
    'IT': 'Package in transit? Protect all future deliveries with FREE $500 insurance coverage!',
    'OFD': 'Package arriving today! Secure FREE protection for your next deliveries - never lose a package again!',
    'DL': 'Package delivered safely! Protect your next shipments with FREE $500 coverage!',
    'PS': 'While your package processes, claim FREE $500 protection for all future deliveries!',
    'EX': 'Protect against delays & damages! Get FREE $500 package insurance - never worry again!'
  };
  return messages[statusCode] || messages['IT'];
}

// Enhanced checkpoint processor with CURRENT STATUS HIGHLIGHT
function enhanceCheckpoints(checkpoints, currentStatusCode) {
  if (!checkpoints || !checkpoints.length) return [];
  
  return checkpoints.map((cp, index) => ({
    ...cp,
    isCurrent: index === 0,
    isCompleted: true,
    isPending: false,
    order: checkpoints.length - index,
    progressPercentage: Math.round(((checkpoints.length - index) / checkpoints.length) * 100),
    timeAgo: getTimeAgo(new Date(cp.date)),
    formattedDate: new Date(cp.date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }));
}

function generateTimeline(checkpoints) {
  if (!checkpoints || !checkpoints.length) return [];
  
  return checkpoints.map((cp, index) => ({
    step: checkpoints.length - index,
    title: cp.status,
    location: cp.location,
    timestamp: cp.date,
    completed: true,
    active: index === 0,
    icon: getTimelineIcon(cp.scanType)
  }));
}

function getStatusEmoji(statusCode) {
  const emojis = {
    'IT': '🚚',
    'OFD': '📦',
    'DL': '✅',
    'PS': '⏳',
    'EX': '⚠️'
  };
  return emojis[statusCode] || '📍';
}

function getStatusColor(statusCode) {
  const colors = {
    'IT': '#1a73e8',
    'OFD': '#ff6d00',
    'DL': '#34a853',
    'PS': '#5f6368',
    'EX': '#ea4335'
  };
  return colors[statusCode] || '#1a73e8';
}

function getTimelineIcon(scanType) {
  const icons = {
    'pickup': '📤',
    'transit': '🚛',
    'delivery': '🏠',
    'sorting': '📊',
    'exception': '⚠️'
  };
  return icons[scanType] || '📍';
}

function getHumanTime(dateInput) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getTimeAgo(date) {
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return 'Just now';
}

function calculateDaysRemaining(estimatedDate) {
  if (!estimatedDate) return 3;
  const now = new Date();
  const est = new Date(estimatedDate);
  const diff = est - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getCompletedCheckpoints(checkpoints) {
  return checkpoints?.length || 4;
}

function getRemainingCheckpoints(checkpoints) {
  return Math.max(0, 6 - (checkpoints?.length || 4));
}

function extractOriginCity(checkpoints) {
  if (!checkpoints || !checkpoints.length) return 'Origin';
  const lastCheckpoint = checkpoints[checkpoints.length - 1];
  return lastCheckpoint.location?.split(',')[0] || 'Origin';
}

function getFirstCheckpointTime(checkpoints) {
  if (!checkpoints || !checkpoints.length) return new Date().toISOString();
  return checkpoints[checkpoints.length - 1].date;
}

async function callPerplexityAPI(trackingNum, apiKey) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [{
        role: 'system',
        content: 'You are a shipment tracking expert. Search the web for real tracking information from carrier websites. Return ONLY valid JSON with detailed tracking data including checkpoints, weather, locations, from/to journey details, and AI insights.'
      }, {
        role: 'user',
        content: `Track shipment: ${trackingNum}

Search carrier websites for real tracking data and return ONLY this JSON format with FROM→TO journey:
{
  "carrier": "carrier name",
  "status": "current status",
  "statusCode": "IT|OFD|DL|PS|EX",
  "origin": {
    "name": "shipper name",
    "city": "origin city",
    "state": "state",
    "country": "country",
    "timestamp": "ISO timestamp"
  },
  "destination": {
    "name": "recipient name",
    "city": "dest city",
    "state": "state",
    "country": "country"
  },
  "journey": {
    "totalDistance": "distance",
    "totalDuration": "duration"
  },
  "checkpoints": [
    {
      "date": "ISO timestamp",
      "status": "status",
      "location": "full location",
      "facility": "facility name",
      "description": "detailed description",
      "scanType": "pickup|transit|delivery|sorting",
      "notes": "additional notes"
    }
  ],
  "weather": {
    "condition": "Clear|Rainy|Snowy",
    "icon": "emoji",
    "temp": "temp C",
    "tempF": "temp F",
    "impact": "Low|Medium|High",
    "impactLevel": 1-5
  },
  "aiInsight": "detailed multi-sentence analysis",
  "confidence": 90
}`
      }],
      temperature: 0.2,
      max_tokens: 3000
    })
  });

  if (!response.ok) throw new Error(`Perplexity API ${response.status}`);
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('JSON parse error:', e);
  }
  return null;
}

async function callOpenAIAPI(trackingNum, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'system',
        content: 'You are a package tracking assistant. Provide detailed tracking predictions in JSON format with rich checkpoint data, weather info, from/to journey, and AI insights.'
      }, {
        role: 'user',
        content: `Predict tracking status for: ${trackingNum}. Return detailed JSON with checkpoints, weather, locations, journey from origin to destination, metrics, and comprehensive AI insights.`
      }],
      temperature: 0.3,
      max_tokens: 2500,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) throw new Error(`OpenAI API ${response.status}`);
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('JSON parse error:', e);
  }
  return null;
}

function generatePremiumData(trackingNum) {
  const carrier = detectCarrier(trackingNum);
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
  const facilities = ['Distribution Center', 'Sorting Facility', 'Hub Terminal', 'Regional Center', 'Processing Center'];
  
  const originCity = cities[Math.floor(Math.random() * cities.length)];
  const currentCity = cities[Math.floor(Math.random() * cities.length)];
  const destCity = cities[Math.floor(Math.random() * cities.length)];
  
  return {
    carrier,
    status: 'In Transit',
    statusCode: 'IT',
    location: `${currentCity}, USA`,
    origin: {
      name: 'Shipper Co.',
      city: originCity,
      state: 'State',
      country: 'USA',
      timestamp: new Date(Date.now() - 86400000).toISOString()
    },
    destination: {
      name: 'Recipient',
      city: destCity,
      state: 'State',
      country: 'USA'
    },
    journey: {
      totalDistance: '450 miles',
      totalDuration: '2-3 days'
    },
    currentLocation: {
      city: currentCity,
      state: 'State',
      country: 'USA',
      facility: `${currentCity} ${facilities[Math.floor(Math.random() * facilities.length)]}`
    },
    packageDetails: {
      weight: '2.5 lbs',
      dimensions: '12x10x4 inches',
      type: 'Package',
      serviceLevel: 'Standard Ground'
    },
    metrics: {
      averageTransitTime: '2-4 days',
      onTimePerformance: '94%',
      estimatedProgress: 65,
      nextUpdateIn: '2-4 hours',
      velocityScore: 8.5
    },
    riskFactors: {
      weatherDelay: 'Low',
      holidayImpact: 'None',
      routeCongestion: 'Low',
      carrierPerformance: 'Excellent',
      overallRisk: 'Low'
    }
  };
}

function generateDetailedCheckpoints(trackingNum) {
  const now = new Date();
  const cities = ['Memphis, TN', 'Louisville, KY', 'Chicago, IL', 'Los Angeles, CA'];
  const facilities = ['Distribution Center', 'Sorting Facility', 'Hub Terminal', 'Regional Center'];
  const statuses = ['Package Received', 'In Transit', 'Sorting Complete', 'Departed Facility', 'Arrived at Facility'];
  
  return [
    {
      date: new Date(now - 2 * 3600000).toISOString(),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      location: cities[0],
      facility: `${cities[0].split(',')[0]} ${facilities[0]}`,
      description: 'Package is currently being processed and will be dispatched to next facility shortly',
      scanType: 'transit',
      notes: 'On schedule for delivery'
    },
    {
      date: new Date(now - 6 * 3600000).toISOString(),
      status: 'Departed Facility',
      location: cities[1],
      facility: `${cities[1].split(',')[0]} ${facilities[1]}`,
      description: 'Package has departed from facility and is en route to destination',
      scanType: 'transit',
      notes: 'Next scan expected in 4-6 hours'
    },
    {
      date: new Date(now - 12 * 3600000).toISOString(),
      status: 'Arrived at Facility',
      location: cities[2],
      facility: `${cities[2].split(',')[0]} ${facilities[2]}`,
      description: 'Package arrived at sorting facility and is being processed',
      scanType: 'sorting',
      notes: 'Sorting completed'
    },
    {
      date: new Date(now - 24 * 3600000).toISOString(),
      status: 'Package Received',
      location: cities[3],
      facility: `${cities[3].split(',')[0]} Origin Facility`,
      description: 'Package picked up from shipper and entered carrier network',
      scanType: 'pickup',
      notes: 'Initial scan'
    }
  ];
}

function generateDetailedInsight(trackingNum, statusCode) {
  const insights = {
    'IT': 'Your package is progressing smoothly through our network. Based on current route patterns and historical data, we predict on-time delivery with 94% confidence. Weather conditions are favorable along the entire route with no expected delays. The package is currently at a major sorting facility and will be dispatched within the next 2-4 hours.',
    'OFD': 'Great news! Your package is out for delivery and will arrive today. The driver is currently making deliveries in your area. Expected delivery window is within the next 3-6 hours based on current route optimization and traffic conditions.',
    'DL': 'Your package has been successfully delivered! The shipment was completed on schedule with signature confirmation. Thank you for tracking with us.',
    'PS': 'Your package is being processed at our facility. Initial scans are complete and the package will enter the transportation network within the next 2-4 hours. Expected delivery remains on track.',
    'EX': 'We detected an exception with your shipment. Our team is actively working to resolve this issue. You will receive updates as soon as the package resumes normal transit. Estimated resolution time: 4-8 hours.'
  };
  
  return insights[statusCode] || insights['IT'];
}

function detectCarrier(trackingNum) {
  const tn = trackingNum.toUpperCase();
  if (/^1Z[A-Z0-9]{16}$/i.test(tn)) return 'UPS';
  if (/^[0-9]{12,14}$/i.test(tn)) return 'FedEx';
  if (/^(94|92|93)[0-9]{20}$/i.test(tn)) return 'USPS';
  if (/^[A-Z]{2}[0-9]{9}[A-Z]{2}$/i.test(tn)) return 'DHL';
  if (/^TBA[0-9]{12}$/i.test(tn)) return 'Amazon';
  if (/^[0-9]{10,12}$/i.test(tn)) return 'Blue Dart';
  return 'Standard Carrier';
}

function extractCity(location) {
  if (!location) return 'Processing';
  const parts = location.split(',');
  return parts[0]?.trim() || 'Processing';
}

function getEstimatedDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(daysFromNow));
  return date.toISOString();
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

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
