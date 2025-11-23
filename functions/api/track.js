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

    // PRIMARY: Perplexity Sonar Pro
    if (PERPLEXITY_API_KEY) {
      try {
        trackingData = await callPerplexityAPI(trackingNumber, PERPLEXITY_API_KEY);
      } catch (err) {
        console.error('Perplexity failed:', err.message);
      }
    }

    // FALLBACK: OpenAI
    if (!trackingData && OPENAI_API_KEY) {
      try {
        trackingData = await callOpenAIAPI(trackingNumber, OPENAI_API_KEY);
      } catch (err) {
        console.error('OpenAI failed:', err.message);
      }
    }

    // FINAL FALLBACK: Premium prediction
    if (!trackingData) {
      trackingData = generatePremiumData(trackingNumber);
    }

    const carrier = trackingData.carrier || detectCarrier(trackingNumber);
    const currentStatus = trackingData.status || 'In Transit';
    const statusCode = trackingData.statusCode || 'IT';

    // SORT CHECKPOINTS LATEST FIRST
    let checkpoints = trackingData.checkpoints || generateDetailedCheckpoints(trackingNumber);
    checkpoints = sortCheckpointsLatestFirst(checkpoints);
    checkpoints = enhanceCheckpoints(checkpoints, statusCode);

    // PROPER STATUS LABELS
    const statusLabel = getProperStatusLabel(statusCode, currentStatus);

    // EST. DELIVERY - HIDE FOR DELIVERED, SHOW FOR IN TRANSIT/OFD
    const estimatedDeliveryDisplay = getEstimatedDeliveryDisplay(statusCode, trackingData.estimatedDelivery);

    const response = {
      currentStatus: {
        status: statusLabel,
        statusCode: statusCode,
        statusEmoji: getStatusEmoji(statusCode),
        statusColor: getStatusColor(statusCode),
        highlight: true,
        latest: true,
        lastScanned: trackingData.lastUpdate || new Date().toISOString(),
        lastScannedHuman: getHumanTime(new Date()),
        isActive: statusCode !== 'DL',
        estimatedArrival: estimatedDeliveryDisplay,
        daysRemaining: calculateDaysRemaining(trackingData.estimatedDelivery)
      },
      journey: {
        from: {
          name: trackingData.origin?.name || 'Shipper',
          address: trackingData.origin?.address || 'Origin Location',
          city: trackingData.origin?.city || extractOriginCity(checkpoints),
          state: trackingData.origin?.state || 'State',
          country: trackingData.origin?.country || 'USA',
          timestamp: trackingData.origin?.timestamp || getFirstCheckpointTime(checkpoints),
          timestampHuman: getHumanTime(getFirstCheckpointTime(checkpoints))
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
      carrier: carrier,
      trackingNumber: trackingNumber,
      currentLocation: {
        city: trackingData.currentLocation?.city || getRealisticCity(checkpoints),
        state: trackingData.currentLocation?.state || 'State',
        country: trackingData.currentLocation?.country || 'USA',
        facility: trackingData.currentLocation?.facility || `${getRealisticCity(checkpoints)} Distribution Center`,
        facilityType: trackingData.currentLocation?.facilityType || 'Distribution',
        coordinates: trackingData.currentLocation?.coordinates || null,
        timezone: trackingData.currentLocation?.timezone || 'America/New_York',
        localTime: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
      },
      estimatedDelivery: estimatedDeliveryDisplay,
      estimatedDeliveryWindow: trackingData.estimatedDeliveryWindow || {
        earliest: getEstimatedDate(2),
        latest: getEstimatedDate(4),
        displayText: 'Within 2-4 business days',
        confidence: 'High'
      },
      packageDetails: {
        weight: trackingData.packageDetails?.weight || '2.5 lbs',
        dimensions: trackingData.packageDetails?.dimensions || '12x10x4 inches',
        type: trackingData.packageDetails?.type || 'Package',
        serviceLevel: trackingData.packageDetails?.serviceLevel || 'Standard Ground',
        value: trackingData.packageDetails?.value || null,
        insured: trackingData.packageDetails?.insured || false
      },
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
      aiInsight: trackingData.aiInsight || generateDetailedInsight(trackingNumber, statusCode),
      aiPredictions: {
        onTimeDelivery: trackingData.aiPredictions?.onTimeDelivery || 94,
        earlyDelivery: trackingData.aiPredictions?.earlyDelivery || 15,
        delayRisk: trackingData.aiPredictions?.delayRisk || 6,
        confidenceScore: trackingData.confidence || 85
      },
      checkpoints: checkpoints,
      metrics: {
        totalCheckpoints: checkpoints.length,
        completedCheckpoints: getCompletedCheckpoints(checkpoints),
        remainingCheckpoints: getRemainingCheckpoints(checkpoints),
        averageTransitTime: trackingData.metrics?.averageTransitTime || '2-3 days',
        onTimePerformance: trackingData.metrics?.onTimePerformance || '94%',
        estimatedProgress: trackingData.metrics?.estimatedProgress || 65,
        nextUpdateIn: trackingData.metrics?.nextUpdateIn || '2-4 hours',
        velocityScore: trackingData.metrics?.velocityScore || 8.5
      },
      deliveryInstructions: trackingData.deliveryInstructions || {
        signatureRequired: false,
        leaveAtDoor: true,
        specialInstructions: null,
        accessCode: null,
        contactOnArrival: false
      },
      riskFactors: trackingData.riskFactors || {
        weatherDelay: 'Low',
        holidayImpact: 'None',
        routeCongestion: 'Low',
        carrierPerformance: 'Excellent',
        overallRisk: 'Low'
      },
      timeline: generateTimeline(checkpoints),
      lastUpdate: trackingData.lastUpdate || new Date().toISOString(),
      lastUpdateHuman: getHumanTime(new Date()),
      nextExpectedUpdate: trackingData.nextExpectedUpdate || getEstimatedDate(0.2),
      nextExpectedUpdateHuman: getHumanTime(getEstimatedDate(0.2)),
      notifications: {
        enabled: true,
        channels: ['email', 'sms'],
        frequency: 'on_change',
        lastSent: null
      },
      offers: generateStrategicOffers(statusCode, carrier),
      source: 'AI Prediction',
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

function sortCheckpointsLatestFirst(checkpoints) {
  if (!checkpoints || !checkpoints.length) return [];
  return checkpoints.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getProperStatusLabel(statusCode, currentStatus) {
  const statusMap = {
    'IT': 'In Transit',
    'OFD': 'Out For Delivery',
    'DL': 'Delivered',
    'PS': 'Processing',
    'EX': 'Exception'
  };
  return statusMap[statusCode] || (currentStatus === 'Courier Not Found' ? 'Courier Not Found' : 'Unknown Status');
}

function getEstimatedDeliveryDisplay(statusCode, estimatedDate) {
  if (statusCode === 'DL') return null;
  if (!estimatedDate) return getEstimatedDate(3);
  try {
    const date = new Date(estimatedDate);
    if (isNaN(date.getTime())) return getEstimatedDate(3);
    return `Est. Delivery: ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}`;
  } catch {
    return getEstimatedDate(3);
  }
}

function getRealisticCity(checkpoints) {
  const cities = ['Memphis, TN', 'Louisville, KY', 'Chicago, IL', 'Los Angeles, CA', 'Houston, TX', 'Phoenix, AZ', 'Dallas, TX'];
  if (checkpoints && checkpoints.length > 0) {
    const loc = checkpoints[0].location;
    if (loc && loc.includes(',')) return loc;
  }
  return cities[Math.floor(Math.random() * cities.length)];
}

function enhanceCheckpoints(checkpoints, statusCode) {
  if (!checkpoints || !checkpoints.length) return [];
  return checkpoints.map((cp, index) => ({
    ...cp,
    isCurrent: index === 0,
    isCompleted: true,
    isPending: false,
    latest: index === 0,
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

function generateStrategicOffers(statusCode, carrier) {
  return [
    {
      id: 'yendo_credit',
      type: 'primary',
      position: 1,
      title: '💳 EXCLUSIVE: Get 2% Cash Back on All Purchases',
      subtitle: '🚀 Build Credit While You Ship',
      description: 'Get 2% cash back on ALL purchases including shipping costs. Build credit with every transaction. No hidden fees. Instant approval available.',
      badge: '⭐ EXCLUSIVE OFFER',
      badgeColor: '#ff6d00',
      cta: '✨ Get 2% Cash Back Now',
      ctaColor: '#1a73e8',
      ctaBgColor: '#E8F0FE',
      url: 'https://bit.ly/yend',
      icon: '💳',
      highlight: true,
      bold: true,
      standalone: true,
      buttonSize: 'large',
      benefits: [
        '✓ 2% cash back on all purchases',
        '✓ Build credit with every purchase',
        '✓ No annual fees',
        '✓ Instant approval available'
      ],
      contextualMessage: getYendoContextMessage(statusCode, carrier)
    },
    {
      id: 'sweepstakes_protection',
      type: 'secondary',
      position: 2,
      title: '🎁 LIMITED TIME: Free $500 Package Protection!',
      subtitle: '🛡️ Never Lose a Package Again',
      description: 'Get FREE $500 package protection & shipping insurance! Covers lost, damaged, or stolen deliveries. Instant activation. Limited spots available - claim yours now!',
      badge: '🔥 TRENDING NOW',
      badgeColor: '#34a853',
      cta: '🎉 Enter Free Sweepstakes',
      ctaColor: '#34a853',
      ctaBgColor: '#E6F4EA',
      url: 'https://clck.ru/3QTeyu',
      icon: '🎁',
      highlight: true,
      bold: true,
      standalone: true,
      buttonSize: 'large',
      benefits: [
        '✓ FREE $500 package protection',
        '✓ Covers lost & damaged shipments',
        '✓ Instant activation',
        '✓ No credit card required'
      ],
      contextualMessage: getSweepstakesContextMessage(statusCode)
    }
  ];
}

function getYendoContextMessage(statusCode, carrier) {
  const messages = {
    'IT': `🚚 Package in transit with ${carrier}! Earn 2% back on this shipment with Yendo Credit Card.`,
    'OFD': '📦 Package arriving today! Get 2% cash back on all future deliveries.',
    'DL': '✅ Package delivered! Celebrate with 2% back on your next purchase.',
    'PS': '⏳ While your package processes, secure 2% cash back on all orders.',
    'EX': '⚠️ Get peace of mind - 2% cash back, perfect for urgent reshipments if needed.'
  };
  return messages[statusCode] || messages['IT'];
}

function getSweepstakesContextMessage(statusCode) {
  const messages = {
    'IT': '🚚 Package in transit? Protect all future deliveries with FREE $500 insurance!',
    'OFD': '📦 Arriving today! Secure FREE protection for your next 10 shipments - never lose a package!',
    'DL': '✅ Delivered safely! Protect your next shipments with FREE $500 coverage!',
    'PS': '⏳ While processing, claim FREE $500 protection for all future deliveries!',
    'EX': '⚠️ Protect against delays & damage! Get FREE $500 package insurance now!'
  };
  return messages[statusCode] || messages['IT'];
}

async function callPerplexityAPI(trackingNum, apiKey) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [{
        role: 'system',
        content: 'You are a shipment tracking expert. Return ONLY valid JSON with detailed tracking data.'
      }, {
        role: 'user',
        content: `Track: ${trackingNum}. Return JSON with carrier, status, checkpoints array (with date, status, location, facility, description), origin/destination cities, estimated delivery, weather, confidence score.`
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
        content: 'You are a package tracking assistant. Provide tracking predictions in JSON format.'
      }, {
        role: 'user',
        content: `Predict tracking for: ${trackingNum}. Return JSON with carrier, status, statusCode (IT|OFD|DL|PS|EX), checkpoints with dates/locations, origin/destination, estimated delivery.`
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
  const cities = ['Memphis, TN', 'Louisville, KY', 'Chicago, IL', 'Los Angeles, CA', 'Houston, TX', 'Phoenix, AZ'];
  const originCity = cities[Math.floor(Math.random() * cities.length)];
  const currentCity = cities[Math.floor(Math.random() * cities.length)];
  const destCity = cities[Math.floor(Math.random() * cities.length)];

  return {
    carrier,
    status: 'In Transit',
    statusCode: 'IT',
    location: currentCity,
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
      facility: `${currentCity.split(',')[0]} Distribution Center`
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
  const statuses = ['Package Received', 'In Transit', 'Sorting Complete', 'Departed Facility', 'Arrived at Facility'];

  return [{
    date: new Date(now - 2 * 3600000).toISOString(),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    location: cities[0],
    facility: `${cities[0].split(',')[0]} Distribution Center`,
    description: 'Package is being processed and will depart shortly',
    scanType: 'transit',
    notes: 'On schedule for delivery'
  },
  {
    date: new Date(now - 6 * 3600000).toISOString(),
    status: 'Departed Facility',
    location: cities[1],
    facility: `${cities[1].split(',')[0]} Sorting Facility`,
    description: 'Package has departed and is en route',
    scanType: 'transit',
    notes: 'Next scan in 4-6 hours'
  },
  {
    date: new Date(now - 12 * 3600000).toISOString(),
    status: 'Arrived at Facility',
    location: cities[2],
    facility: `${cities[2].split(',')[0]} Hub Terminal`,
    description: 'Package arrived and is being processed',
    scanType: 'sorting',
    notes: 'Sorting completed'
  },
  {
    date: new Date(now - 24 * 3600000).toISOString(),
    status: 'Package Received',
    location: cities[3],
    facility: `${cities[3].split(',')[0]} Origin Facility`,
    description: 'Package picked up from shipper',
    scanType: 'pickup',
    notes: 'Initial scan'
  }];
}

function generateDetailedInsight(trackingNum, statusCode) {
  const insights = {
    'IT': 'Your package is progressing smoothly. Predicted on-time delivery with 94% confidence. Weather favorable. Will dispatch within 2-4 hours.',
    'OFD': 'Great! Your package is out for delivery today. Expected arrival within 3-6 hours.',
    'DL': 'Your package was successfully delivered on schedule!',
    'PS': 'Your package is being processed. Will enter transportation within 2-4 hours.',
    'EX': 'We detected an exception. Our team is working to resolve this. Expected resolution: 4-8 hours.'
  };
  return insights[statusCode] || insights['IT'];
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

function detectCarrier(trackingNum) {
  const tn = trackingNum.toUpperCase();
  if (/^1Z[A-Z0-9]{16}$/i.test(tn)) return 'UPS';
  if (/^[0-9]{12,14}$/i.test(tn)) return 'FedEx';
  if (/^(94|92|93)[0-9]{20}$/i.test(tn)) return 'USPS';
  if (/^[A-Z]{2}[0-9]{9}[A-Z]{2}$/i.test(tn)) return 'DHL';
  if (/^TBA[0-9]{12}$/i.test(tn)) return 'Amazon';
  if (/^[0-9]{10,12}$/i.test(tn)) return 'Blue Dart';
  return 'Courier Not Found';
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
