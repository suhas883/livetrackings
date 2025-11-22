# LiveTrackings - Production Deployment Setup
## World's First Courier Tracking Using Perplexity API + Route LLM

### Overview
LiveTrackings is a production-ready, AI-powered package tracking platform built with:
- **Frontend**: HTML/CSS/JavaScript (Hosted on Cloudflare Pages)
- **Backend**: Cloudflare Pages Functions (Serverless)
- **Database**: Cloudflare KV (Key-Value Store)
- **AI/LLM**: Perplexity API for real-time tracking intelligence
- **Email Alerts**: SendGrid integration
- **SMS Alerts**: Twilio integration
- **Automation**: n8n workflows

---

## Production Features Deployed

### 1. **Hoax Detection & Validation** ✅
- Validates tracking numbers against known carrier formats (UPS, FedEx, USPS, DHL, Blue Dart, Amazon)
- Blocks invalid/suspicious tracking patterns
- Returns hoax detection flags to frontend

### 2. **Real-Time Tracking API** ✅
- Endpoint: `/api/track` (POST)
- Powered by Perplexity AI for real-time web search
- Fallback to TrackingMore API if Perplexity fails
- Returns:
  - Carrier name
  - Current status
  - Location with country
  - Estimated delivery date/time
  - Weather impact analysis
  - Shipment timeline with timestamps
  - AI confidence score (0-100%)

### 3. **Email Subscription System** ✅
- Endpoint: `/api/subscribe-email` (POST)
- SendGrid integration for confirmation emails
- Cloudflare KV storage (30-day TTL)
- Validates email format and tracking number
- Beautiful HTML email templates

### 4. **SMS Subscription System** (Ready for activation)
- Endpoint: `/api/subscribe-sms` (POST)
- Twilio integration for SMS alerts
- Phone number validation (E.164 format)
- Real-time status notifications

### 5. **AI Context-Aware Chat** (Ready)
- Integrates Perplexity API for intelligent responses
- Passes tracking context to LLM
- Provides delivery predictions and risk analysis

---

## Quick Start - Environment Setup

### Step 1: Create Environment Variables
```bash
cp .env.example .env
```

### Step 2: Configure Required Services

#### Perplexity API
1. Go to https://www.perplexity.ai/api
2. Create an API key
3. Add to `.env`: `PERPLEXITY_API_KEY=your_key_here`

#### SendGrid (Email)
1. Sign up at https://sendgrid.com
2. Create API key
3. Add to `.env`:
   - `SENDGRID_API_KEY=your_key`
   - `SENDGRID_FROM_EMAIL=alerts@yourdomain.com`

#### Twilio (SMS)
1. Sign up at https://www.twilio.com
2. Get credentials
3. Add to `.env`:
   - `TWILIO_ACCOUNT_SID=your_sid`
   - `TWILIO_AUTH_TOKEN=your_token`
   - `TWILIO_PHONE_NUMBER=+1234567890`

#### Cloudflare Pages Functions
1. Deploy to Cloudflare Pages
2. Create KV namespaces:
   - `EMAIL_SUBSCRIPTIONS`
   - `SMS_SUBSCRIPTIONS`
   - `TRACKING_CACHE`
3. Update `wrangler.toml` with namespace IDs

### Step 3: Update wrangler.toml
Replace placeholder KV namespace IDs:
```toml
[[kv_namespaces]]
binding = "EMAIL_SUBSCRIPTIONS"
id = "your_actual_kv_id"
preview_id = "your_preview_kv_id"
```

---

## API Endpoints Reference

### POST /api/track
**Request:**
```json
{
  "trackingNumber": "1Z9999W99999999999"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "carrier": "UPS",
    "status": "Out for Delivery",
    "location": "New York, NY, USA",
    "estimatedDelivery": "2025-11-23 14:30",
    "confidence": 95,
    "weather": {
      "condition": "Clear",
      "icon": "☀️",
      "impact": "Low"
    },
    "checkpoints": [
      {"date": "2025-11-23T08:00:00Z", "status": "Out for Delivery", "location": "Manhattan, NY"}
    ]
  },
  "source": "Perplexity AI Real-Time"
}
```

### POST /api/subscribe-email
**Request:**
```json
{
  "email": "user@example.com",
  "trackingNumber": "1Z9999W99999999999"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email subscription confirmed",
  "expiresIn": "30 days"
}
```

---

## Testing the System

### Test Tracking Numbers
- **UPS**: `1Z9999W99999999999`
- **FedEx**: `123456789012`
- **USPS**: `9400110898825022579493`
- **DHL**: `1234567890`

### Manual Testing
```bash
# Test track API
curl -X POST http://localhost:8787/api/track \
  -H "Content-Type: application/json" \
  -d '{"trackingNumber": "1Z9999W99999999999"}'

# Test email subscription
curl -X POST http://localhost:8787/api/subscribe-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "trackingNumber": "1Z9999W99999999999"}'
```

---

## Deployment Instructions

### Deploy to Cloudflare Pages
```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler deploy
```

### Set Production Secrets
```bash
wrangler secret put PERPLEXITY_API_KEY
wrangler secret put SENDGRID_API_KEY
wrangler secret put TWILIO_ACCOUNT_SID
wrangler secret put TWILIO_AUTH_TOKEN
```

---

## Security Best Practices

✅ **Implemented**:
- Tracking number validation (prevents hoax/spam)
- Email regex validation
- Phone number E.164 format validation
- API rate limiting ready
- CORS headers configured
- Environment variables secured in Cloudflare

⚠️ **Recommendations**:
- Enable Cloudflare DDoS protection
- Set up rate limiting per IP
- Monitor API usage via Analytics
- Regular security audits
- Rotate API keys monthly

---

## Monitoring & Analytics

- **Cloudflare Analytics**: Monitor API traffic in dashboard
- **SendGrid Logs**: Track email delivery rates
- **Twilio Logs**: Monitor SMS delivery
- **KV Metrics**: Check storage usage

---

## Future Enhancements

- [ ] SMS subscription endpoint (SMS handler ready)
- [ ] AI chat response API (LLM integration ready)
- [ ] Database persistence (optional MongoDB/Supabase)
- [ ] Advanced fraud detection
- [ ] Multi-language support
- [ ] Mobile app native integration

---

## Support & Issues

For issues or questions:
1. Check GitHub Issues
2. Review API response codes
3. Check Cloudflare dashboard for function logs
4. Verify environment variables are set correctly

---

## License
Proprietary - LiveTrackings 2024
