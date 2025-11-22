# LiveTrackings - Production Integration Guide

## Overview
You now have a **complete, production-ready tracking system** with:
- Real Cloudflare Pages Functions API endpoints (`/api/track`, `/api/subscribe-email`, `/api/subscribe-sms`)
- Beautiful detailed tracking display with expandable shipment history  
- Working affiliate links (Yendo Credit Card + Sweepstake)
- AI-powered carrier detection and hoax prevention

---

## Step 1: Wire Up TRACKING-FIX-v2.js to index.html

### Add Script Import
In `index.html`, after the closing `</style>` tag, add:

```html
<script src="TRACKING-FIX-v2.js"></script>
```

### Update Form Handler
Find the `<form>` element with `onsubmit="trackPackage(event)"` and change it to:

```html
<form id="trackingForm" onsubmit="trackPackageReal(event); return false;">
  <input type="text" id="trackingInput" placeholder="Enter tracking number..." required>
  <button type="submit" id="trackBtn">Track Package</button>
</form>
```

---

## Step 2: Expected API Response Format

Your `/api/track` endpoint (in `functions/api/track.js`) must return this JSON structure:

```json
{
  "success": true,
  "data": {
    "carrier": "UPS",
    "status": "Out for Delivery",
    "location": "Local Hub, New York, NY",
    "estimatedDelivery": "Today, 2:30 PM",
    "confidence": 92,
    "checkpoints": [
      {
        "status": "Package Received",
        "location": "Origin Facility",
        "timestamp": "2025-11-23T08:15:00Z"
      },
      {
        "status": "In Transit",
        "location": "Regional Hub",
        "timestamp": "2025-11-23T23:42:00Z"
      },
      {
        "status": "Out for Delivery",
        "location": "Local Hub",
        "timestamp": "2025-11-24T07:45:00Z"
      }
    ]
  }
}
```

---

## Step 3: Test With Real Tracking Numbers

### UPS Test Number
```
1Z999AA10123456784  (or 1Z9999W99999999999)
```

### FedEx Test Numbers
```
123456789012
794692396465
039813852990618
```

### USPS Test Number
```
9400110898825022579493
```

### Blue Dart Test
Use any valid Blue Dart waybill number from your carrier account.

---

## Step 4: Verify API Endpoints

### Tracking Endpoint
**URL:** `POST /api/track`  
**Request Body:** `{"trackingNumber": "1Z999AA10123456784"}`  
**Response:** See Step 2 above

### Email Subscription
**URL:** `POST /api/subscribe-email`  
**Request Body:** `{"email": "user@example.com", "tracking": "1Z999AA10123456784"}`  
**Response:** `{"success": true, "message": "Email confirmed"}`

### SMS Subscription
**URL:** `POST /api/subscribe-sms`  
**Request Body:** `{"phone": "+12025551234", "tracking": "1Z999AA10123456784"}`  
**Response:** `{"success": true, "message": "SMS confirmed"}`

### AI Response
**URL:** `POST /api/ai-response`  
**Request Body:** `{"message": "Where is my package?", "trackingData": {...}}`  
**Response:** `{"response": "Your package is...", "confidence": 0.95}`

---

## Step 5: Modal Features

### What the User Sees

1. **Highlighted Tracking Info** (Gradient Header)
   - Tracking Number
   - Carrier Name
   - Current Status
   - Location
   - Estimated Delivery
   - AI Confidence Score

2. **Expandable Shipment History**
   - "Click More" button to expand/collapse
   - Full timeline with timestamps
   - Event status and location per checkpoint

3. **Working Affiliate Links**
   - **Yendo Credit Card**: Opens https://bit.ly/yend
   - **Sweepstake Entry**: Opens https://smrturl.co/f4074be
   - Both tracked via `trackAffiliateClick(offerId)` function

4. **Close Button**
   - Cleanly closes modal and restores body scroll

---

## Step 6: Environment Variables (Cloudflare)

Ensure these are set in your `.env.production` or Cloudflare dashboard:

```bash
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxx
SHIP24_API_KEY=your_ship24_key
SHIP24_API_BACKUP=your_backup_tracking_api
SENDGRID_API_KEY=your_sendgrid_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## Step 7: Deployment Checklist

- [ ] `TRACKING-FIX-v2.js` committed to repo
- [ ] `index.html` updated with `<script src="TRACKING-FIX-v2.js"></script>`
- [ ] Form `onsubmit` changed to `trackPackageReal(event)`
- [ ] `/api/track` endpoint returns correct JSON format
- [ ] Environment variables set in Cloudflare
- [ ] Test with UPS number `1Z9999W99999999999`
- [ ] Verify "Click More" expands shipment history
- [ ] Click affiliate links and verify they open in new tabs
- [ ] Email/SMS subscription forms hooked up
- [ ] AI chat integrated with `/api/ai-response`

---

## Troubleshooting

### Tracking Returns "Not Found"
- Verify tracking number format matches carrier pattern
- Check `/api/track` endpoint is accessible
- Confirm API keys in `.env.production`
- Check browser console for error messages

### Affiliate Links Not Opening
- Verify `onclick="trackAffiliateClick()"` is present on anchor tags
- Check browser console for `trackAffiliateClick: yendo/sweepstake` logs
- Confirm URLs are correct (bit.ly and smrturl)

### History Section Not Expanding
- Open browser DevTools Console
- Check if `toggleHistoryExpand()` is defined
- Verify `checkpoints` array is populated in API response

### Email/SMS Not Sending
- Verify SendGrid/Twilio credentials in Cloudflare env
- Check `/api/subscribe-email` and `/api/subscribe-sms` endpoints exist
- Review function logs in Cloudflare Workers dashboard

---

## Production Deployment

1. Push all changes to `main` branch on GitHub
2. Cloudflare Pages auto-deploys on commit
3. Verify site loads at https://livetrackings.com/
4. Test tracking with UPS/FedEx/USPS test numbers
5. Monitor Cloudflare Workers logs for API errors
6. Set up alerts for failed tracking requests

---

## Support

For issues or questions:
- Check `TRACKING-FIX-v2.js` for inline comments
- Review `functions/api/*.js` for backend logic
- Test with curl: `curl -X POST https://livetrackings.com/api/track -H 'Content-Type: application/json' -d '{"trackingNumber": "1Z9999W99999999999"}'`
