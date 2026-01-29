/**
 * HCS-U7 Challenge - Landing Page Logic
 * Simple et statique - Pas de framework
 */

const CONFIG = {
  widgetId: 'wgt_741a55a19a933519',
  backendUrl: 'https://api.hcs-u7.org',
  tenantId: 'cmku6oui4000a04jofxudcigo',
  redirectUrl: 'https://perspecta-competences.fr/dashboard',
  appId: 'perspecta_dashboard'
};

console.log('🚀 HCS-U7 Challenge - Initializing...');
console.log('Widget ID:', CONFIG.widgetId);

window.addEventListener('load', () => {
  console.log('✅ Page loaded');
  const loading = document.getElementById('loading');
  if (loading) loading.style.display = 'none';
});

function onHCSSuccess(token, score) {
  console.log('✅ Verification success:', { token, score });
  
  fetch(`${CONFIG.backendUrl}/hcs/verify-and-redirect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      token: token,
      tenantId: CONFIG.tenantId,
      appId: CONFIG.appId
    })
  })
    .then(r => r.json())
    .then(data => {
      if (data && data.redirectUrl) {
        showSuccessMessage(score, data.redirectUrl);
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 2000);
      } else {
        alert('Verification failed');
      }
    })
    .catch(err => {
      console.error('Verification failed:', err);
      alert('Verification failed');
    });
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
