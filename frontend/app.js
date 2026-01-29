/**
 * HCS-U7 Challenge - Landing Page Logic
 * Simple et statique - Pas de framework
 */

const CONFIG = {
  widgetId: 'wgt_e7cec6afb18df420',
  backendUrl: 'https://hcs-u7-backend.onrender.com',
  tenantId: 'cmku6oui4000a04jofxudcigo',
  redirectUrl: 'https://perspecta-competences.fr/dashboard',
  appId: 'perspecta_dashboard'
};

console.log('🚀 HCS-U7 Challenge - Initializing...');
console.log('Widget ID:', CONFIG.widgetId);

window.addEventListener('load', () => {
  console.log('✅ Page loaded');
  checkWidgetLoaded();
});

function checkWidgetLoaded() {
  const maxAttempts = 50;
  let attempts = 0;

  const interval = setInterval(() => {
    attempts++;

    // Vérifier si le SDK est chargé
    if (typeof window.HCSWidget !== 'undefined' || attempts >= 10) {
      console.log('✅ Initializing widget manually');
      clearInterval(interval);
      
      // Masquer loading
      const loading = document.getElementById('loading');
      if (loading) loading.style.display = 'none';

      // Créer l'iframe du widget manuellement
      const container = document.getElementById('hcs-captcha');
      if (container) {
        container.style.display = 'block';
        
        // Créer l'iframe
        const iframe = document.createElement('iframe');
        iframe.src = `https://hcs-widget-mvp.vercel.app/widget/${CONFIG.widgetId}?theme=light&lang=fr`;
        iframe.style.width = '100%';
        iframe.style.height = '500px';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '8px';
        
        container.innerHTML = '';
        container.appendChild(iframe);
        
        console.log('✅ Widget iframe created');
      }

      return;
    }

    if (attempts >= maxAttempts) {
      console.error('❌ Widget failed to load after 5 seconds');
      clearInterval(interval);
      showError("Le widget de sécurité n'a pas pu être chargé. Veuillez rafraîchir la page.");
    }
  }, 100);
}

function showError(message) {
  const loading = document.getElementById('loading');
  if (!loading) return;

  loading.innerHTML = `
    <div style="color: #e53e3e; padding: 20px;">
      <h3 style="margin-bottom: 10px;">❌ Erreur</h3>
      <p>${message}</p>
      <button 
        onclick="window.location.reload()" 
        style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;"
      >
        🔄 Rafraîchir
      </button>
    </div>
  `;
}

window.addEventListener('message', (event) => {
  if (!event.origin.includes('hcs-widget-mvp.vercel.app') && !event.origin.includes('localhost')) {
    return;
  }

  const data = event.data;
  console.log('📨 Message received from widget:', data);

  if (data && data.type === 'HCS_VERIFICATION_SUCCESS') {
    console.log('✅ Verification success');
    console.log('Token:', data.token);
    console.log('Score:', data.score);
    handleVerificationSuccess(data.token, data.score);
  }

  if (data && data.type === 'HCS_VERIFICATION_FAILED') {
    console.error('❌ Verification failed:', data);
    showError(`Vérification échouée. Score: ${data.score || 0}/100`);
  }

  if (data && data.type === 'HCS_VERIFICATION_REDIRECT') {
    console.log('🚀 Redirecting to:', data.redirectUrl);
    window.location.href = data.redirectUrl;
  }
});

async function handleVerificationSuccess(token, score) {
  console.log('🔵 Handling verification success...');

  try {
    console.log('🔵 Requesting redirect URL...');

    const response = await fetch(`${CONFIG.backendUrl}/hcs/verify-and-redirect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        tenantId: CONFIG.tenantId,
        appId: CONFIG.appId
      })
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.redirectUrl) {
      throw new Error('No redirect URL received');
    }

    console.log('✅ Redirect URL received:', data.redirectUrl);

    showSuccessMessage(score, data.redirectUrl);

    setTimeout(() => {
      console.log('🚀 Redirecting now...');
      window.location.href = data.redirectUrl;
    }, 2000);
  } catch (error) {
    console.error('❌ Error handling verification:', error);
    console.log('⚠️ Falling back to default redirect');

    showSuccessMessage(score, CONFIG.redirectUrl);

    setTimeout(() => {
      window.location.href = CONFIG.redirectUrl;
    }, 2000);
  }
}

function showSuccessMessage(score, redirectUrl) {
  const container = document.querySelector('.widget-container');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 60px 20px;">
      <div style="width: 100px; height: 100px; background: #48bb78; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 30px;">
        <svg style="width: 60px; height: 60px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>

      <h2 style="font-size: 32px; margin-bottom: 20px; color: #48bb78;">
        ✅ Vérification Réussie !
      </h2>

      <p style="font-size: 20px; color: #666; margin-bottom: 30px;">
        Score de sécurité : ${score}/100
      </p>

      <div style="background: #e6fffa; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
        <p style="color: #047857; font-size: 18px; margin-bottom: 15px;">
          🚀 Redirection vers l'application...
        </p>
        <div class="spinner" style="margin: 0 auto;"></div>
      </div>

      <p style="font-size: 14px; color: #999;">
        Si la redirection ne fonctionne pas,
        <a href="${redirectUrl}" style="color: #667eea; text-decoration: underline;">cliquez ici</a>
      </p>
    </div>
  `;
}

console.log('✅ app.js loaded');
