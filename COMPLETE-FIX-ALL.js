// COMPLETE FIX ALL - Email Alerts, SMS Alerts, AI Chat, Search UI, Mobile, Hoax Detection, Affiliate Revenue
// Latest tracking display first with expandable history + down arrow + end-to-end info

(function() {
  'use strict';

  // ===== EMAIL ALERTS FIX =====
  function setupEmailAlerts() {
    const emailBtn = document.querySelector('[href*="email"], a:contains("Email alerts"), button:contains("Email alerts")');
    if (!emailBtn) return;

    emailBtn.onclick = (e) => {
      e.preventDefault();
      showEmailModal();
    };
  }

  function showEmailModal() {
    let modal = document.getElementById('emailModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'emailModal';
      modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
          <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <h2 style="margin: 0 0 20px 0; color: #333;">Email Tracking Alerts</h2>
            <p style="color: #666; margin: 0 0 15px 0;">Get real-time email notifications for your package tracking</p>
            <form id="emailForm" style="display: flex; flex-direction: column; gap: 15px;">
              <input type="email" placeholder="Enter your email" required style="padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px;" />
              <button type="submit" style="padding: 12px; background: #ff9800; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Subscribe to Alerts</button>
              <button type="button" onclick="document.getElementById('emailModal').remove()" style="padding: 12px; background: #f0f0f0; color: #333; border: none; border-radius: 8px; cursor: pointer;">Close</button>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      document.getElementById('emailForm').onsubmit = handleEmailSubscribe;
    } else {
      modal.style.display = 'flex';
    }
  }

  async function handleEmailSubscribe(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    try {
      const response = await fetch('/api/subscribe-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (response.ok) {
        alert('Email subscription confirmed!');
        document.getElementById('emailModal').remove();
      }
    } catch (err) {
      console.error('Email subscription error:', err);
      alert('Subscription failed. Try again.');
    }
  }

  // ===== SMS ALERTS FIX =====
  function setupSMSAlerts() {
    const smsBtn = document.querySelector('[href*="sms"], a:contains("SMS alerts"), button:contains("SMS alerts")');
    if (!smsBtn) return;

    smsBtn.onclick = (e) => {
      e.preventDefault();
      showSMSModal();
    };
  }

  function showSMSModal() {
    let modal = document.getElementById('smsModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'smsModal';
      modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
          <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <h2 style="margin: 0 0 20px 0; color: #333;">SMS Tracking Alerts</h2>
            <p style="color: #666; margin: 0 0 15px 0;">Get SMS notifications for real-time package updates</p>
            <form id="smsForm" style="display: flex; flex-direction: column; gap: 15px;">
              <input type="tel" placeholder="+1 (555) 123-4567" pattern="[0-9\-\+\s\(\)]+" required style="padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px;" />
              <button type="submit" style="padding: 12px; background: #ff9800; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Subscribe to SMS</button>
              <button type="button" onclick="document.getElementById('smsModal').remove()" style="padding: 12px; background: #f0f0f0; color: #333; border: none; border-radius: 8px; cursor: pointer;">Close</button>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      document.getElementById('smsForm').onsubmit = handleSMSSubscribe;
    } else {
      modal.style.display = 'flex';
    }
  }

  async function handleSMSSubscribe(e) {
    e.preventDefault();
    const phone = e.target.querySelector('input[type="tel"]').value;
    try {
      const response = await fetch('/api/subscribe-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      if (response.ok) {
        alert('SMS subscription confirmed!');
        document.getElementById('smsModal').remove();
      }
    } catch (err) {
      console.error('SMS subscription error:', err);
      alert('Subscription failed. Try again.');
    }
  }

  // ===== AI CHAT WIDGET FIX =====
  function fixAIChatWidget() {
    let chatBox = document.getElementById('aiChatBox');
    if (!chatBox) {
      chatBox = document.createElement('div');
      chatBox.id = 'aiChatBox';
      chatBox.innerHTML = `
        <div style="position: fixed; bottom: 20px; right: 20px; width: 380px; height: 500px; background: white; border-radius: 12px; box-shadow: 0 5px 40px rgba(0,0,0,0.2); display: none; flex-direction: column; z-index: 999;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 12px 12px 0 0; color: white; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 16px;">AI Tracking Assistant</h3>
            <button onclick="document.getElementById('aiChatBox').style.display='none'" style="background: transparent; border: none; color: white; font-size: 20px; cursor: pointer;">x</button>
          </div>
          <div id="chatMessages" style="flex: 1; overflow-y: auto; padding: 15px; background: #f9f9f9;"></div>
          <form id="chatForm" style="padding: 15px; border-top: 1px solid #ddd; display: flex; gap: 8px;">
            <input type="text" id="chatInput" placeholder="Ask about your package..." style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
            <button type="submit" style="padding: 10px 15px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Send</button>
          </form>
        </div>
      `;
      document.body.appendChild(chatBox);
      document.getElementById('chatForm').onsubmit = handleChatSubmit;
    }
  }

  async function handleChatSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;
    const messagesDiv = document.getElementById('chatMessages');
    const userMsgDiv = document.createElement('div');
    userMsgDiv.style.cssText = 'margin: 10px 0; padding: 10px; background: #667eea; color: white; border-radius: 8px; margin-left: auto; max-width: 80%;';
    userMsgDiv.textContent = message;
    messagesDiv.appendChild(userMsgDiv);
    input.value = '';
    try {
      const response = await fetch('/api/ai-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: message })
      });
      const data = await response.json();
      const aiMsgDiv = document.createElement('div');
      aiMsgDiv.style.cssText = 'margin: 10px 0; padding: 10px; background: #f0f0f0; color: #333; border-radius: 8px; max-width: 80%;';
      aiMsgDiv.textContent = data.response || 'Unable to process';
      messagesDiv.appendChild(aiMsgDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } catch (err) {
      console.error('Chat error:', err);
    }
  }

  // ===== SEARCH BAR UI FIX =====
  function enhanceSearchBar() {
    const searchContainer = document.querySelector('.search-box, .tracking-input-wrapper, form');
    if (!searchContainer) return;
    searchContainer.style.cssText = 'display: flex; align-items: center; gap: 0; background: white; border: 2px solid #ff9800; border-radius: 50px; padding: 8px 16px; box-shadow: 0 4px 15px rgba(255,152,0,0.2); transition: all 0.3s ease;';
    const input = searchContainer.querySelector('input[type="text"]');
    if (input) {
      input.style.cssText = 'flex: 1; border: none; outline: none; padding: 12px 8px; font-size: 16px; background: transparent;';
    }
    const button = searchContainer.querySelector('button');
    if (button) {
      button.style.cssText = 'background: #ff9800; color: white; border: none; padding: 12px 24px; border-radius: 50px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; font-size: 15px;';
    }
  }

  // ===== MOBILE RESPONSIVENESS =====
  function makeResponsive() {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .tracking-input-wrapper, .search-box { flex-direction: column !important; padding: 12px !important; }
        .tracking-input-wrapper input, .search-box input { width: 100% !important; margin-bottom: 10px !important; }
        .tracking-input-wrapper button, .search-box button { width: 100% !important; padding: 14px !important; }
        #trackingModal { max-width: 95vw !important; margin: 20px auto !important; }
        .affiliate-cards { flex-wrap: wrap !important; }
        .tracking-event { font-size: 14px !important; padding: 10px !important; }
      }
      @media (max-width: 480px) {
        h1, h2 { font-size: 20px !important; }
        .feature-card { padding: 15px !important; }
      }
    `;
    document.head.appendChild(style);
  }

  // ===== TRACKING DISPLAY WITH LATEST FIRST + END-TO-END INFO =====
  function enhanceTrackingDisplay() {
    const originalDisplayTracking = window.displayDetailedTracking || (() => {});
    window.displayDetailedTracking = function(data) {
      if (!data || !data.history) return;
      const history = data.history;
      if (history.length > 0) {
        const latestEvent = history[0];
        const modal = document.getElementById('trackingModal');
        if (modal) {
          let timelineHtml = '<div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; margin-bottom: 20px;">';
          timelineHtml += '<div style="display: flex; justify-content: space-between; align-items: start;">';
          timelineHtml += `<div><h3 style="margin: 0 0 5px 0; font-size: 16px;">Latest Status</h3><p style="margin: 0; font-size: 14px; opacity: 0.9;">${latestEvent.status || 'In Transit'}</p></div>`;
          timelineHtml += `<div style="text-align: right;"><p style="margin: 0; font-size: 12px;">${latestEvent.location || 'Processing'}</p><p style="margin: 5px 0 0 0; font-size: 11px; opacity: 0.8;">${latestEvent.timestamp || new Date().toLocaleString()}</p></div>`;
          timelineHtml += '</div></div>';
          
          timelineHtml += '<details style="margin: 15px 0; cursor: pointer;" open>';
          timelineHtml += '<summary style="font-weight: bold; padding: 12px; background: #f5f5f5; border-radius: 8px; user-select: none; display: flex; align-items: center;">';
          timelineHtml += '<span style="margin-right: 10px; font-size: 16px;">&#x25BC;</span>Full Tracking History</summary>';
          
          timelineHtml += '<div style="margin-top: 10px; padding-left: 10px; border-left: 3px solid #ff9800;">';
          for (let i = 0; i < history.length; i++) {
            const event = history[i];
            timelineHtml += `<div style="margin: 15px 0; padding: 12px; background: #f9f9f9; border-radius: 8px;">`;
            timelineHtml += `<div style="font-weight: bold; color: #667eea;">${event.status}</div>`;
            timelineHtml += `<div style="font-size: 12px; color: #666; margin: 5px 0;">Location: ${event.location}</div>`;
            timelineHtml += `<div style="font-size: 11px; color: #999;">${event.timestamp}</div>`;
            timelineHtml += `</div>`;
          }
          timelineHtml += '</div></details>';
          
          const existingTimeline = modal.querySelector('[data-timeline]');
          if (existingTimeline) {
            existingTimeline.innerHTML = timelineHtml;
          } else {
            const timelineDiv = document.createElement('div');
            timelineDiv.setAttribute('data-timeline', 'true');
            timelineDiv.innerHTML = timelineHtml;
            const contentArea = modal.querySelector('.modal-content') || modal.querySelector('.tracking-details');
            if (contentArea) {
              contentArea.insertBefore(timelineDiv, contentArea.firstChild);
            }
          }
        }
      }
    };
  }

  // ===== HOAX DETECTION FIX =====
  function fixHoaxDetection() {
    const originalTrack = window.trackPackage || (() => {});
    window.trackPackage = async function(trackingNumber) {
      if (!trackingNumber || trackingNumber.trim() === '') {
        alert('Please enter a tracking number');
        return;
      }
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber })
      });
      const data = await response.json();
      if (data.hoaxDetected || data.isValid === false) {
        alert('Invalid tracking number - hoax detected. Please enter a valid tracking number.');
        return;
      }
      window.displayDetailedTracking(data);
    };
  }

  // ===== AFFILIATE REVENUE OPTIMIZATION =====
  function optimizeAffiliateRevenue() {
    const affiliateLinks = document.querySelectorAll('a[href*="yendo"], a[href*="getjoy"], a[href*="affiliate"], button:contains("Apply"), button:contains("Get")'); 
    affiliateLinks.forEach(link => {
      if (!link.hasAttribute('data-tracked')) {
        link.setAttribute('data-tracked', 'true');
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        const originalClick = link.onclick;
        link.onclick = function(e) {
          const affiliateId = this.getAttribute('data-affiliate') || 'default';
          fetch('/api/track-affiliate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ affiliateId, timestamp: new Date().toISOString() })
          }).catch(err => console.error('Affiliate tracking error:', err));
          if (originalClick) return originalClick.call(this, e);
        };
      }
    });
  }

  // ===== INITIALIZE ALL FIXES =====
  window.initializeAllFixes = function() {
    setupEmailAlerts();
    setupSMSAlerts();
    fixAIChatWidget();
    enhanceSearchBar();
    makeResponsive();
    enhanceTrackingDisplay();
    fixHoaxDetection();
    optimizeAffiliateRevenue();
    console.log('All fixes initialized successfully!');
  };

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initializeAllFixes);
  } else {
    window.initializeAllFixes();
  }
})();
