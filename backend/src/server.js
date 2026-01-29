import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;
const PROXY_SECRET = process.env.PROXY_SECRET;

const translations = {
  en: {
    challenge: 'HCS-U7 Production Test',
    description: 'Real production system exposed for security testing',
    protection: 'HCS-U7 Cognitive Scoring',
    status: 'online',
    result: 'success',
    message: 'Request processed by HCS-U7',
    data_name_1: 'Public Resource 1',
    data_name_2: 'Public Resource 2',
    data_name_3: 'Public Resource 3',
    data_value: 'accessible'
  },
  fr: {
    challenge: 'Test de Production HCS-U7',
    description: 'Système de production réel exposé pour tests de sécurité',
    protection: 'Scoring Cognitif HCS-U7',
    status: 'en ligne',
    result: 'success',
    message: 'Requête traitée par HCS-U7',
    data_name_1: 'Ressource Publique 1',
    data_name_2: 'Ressource Publique 2',
    data_name_3: 'Ressource Publique 3',
    data_value: 'accessible'
  }
};

function detectLanguage(req) {
  const queryLang = req.query.lang;
  if (queryLang === 'fr' || queryLang === 'en') {
    return queryLang;
  }
  
  const bodyLang = req.body?.lang;
  if (bodyLang === 'fr' || bodyLang === 'en') {
    return bodyLang;
  }
  
  const acceptLang = req.headers['accept-language'] || '';
  if (acceptLang.toLowerCase().includes('fr')) {
    return 'fr';
  }
  
  return 'en';
}

function topologicalProtection(req, res, next) {
  if (!PROXY_SECRET) {
    return next();
  }

  if (req.path === '/health') {
    return next();
  }

  const proxySecret = req.headers['x-proxy-secret'];

  if (proxySecret !== PROXY_SECRET) {
    return res.status(403).json({
      message: 'Direct access not allowed'
    });
  }

  next();
}

app.use(cors());
app.use(express.json());
app.use(topologicalProtection);

const requestLog = [];
const MAX_LOG_SIZE = 1000;

function logRequest(req, metadata) {
  const entry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.headers['x-real-ip'] || req.ip,
    hcsData: req.headers['x-hcs-data'] || null,
    cfData: req.headers['x-cf-data'] || null,
    userAgent: req.headers['user-agent'],
    metadata,
  };
  
  requestLog.unshift(entry);
  if (requestLog.length > MAX_LOG_SIZE) {
    requestLog.pop();
  }
  
  console.log(`[${entry.timestamp}] ${entry.method} ${entry.path} - IP: ${entry.ip}`);
}

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'hcs-u7-challenge-backend',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/public/info', (req, res) => {
  const lang = detectLanguage(req);
  const t = translations[lang];
  
  logRequest(req, { endpoint: 'info', lang });
  
  res.json({
    challenge: t.challenge,
    description: t.description,
    endpoints: [
      '/api/public/info',
      '/api/public/interact',
      '/api/public/data'
    ],
    protection: t.protection,
    status: t.status,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/public/interact', (req, res) => {
  const lang = detectLanguage(req);
  const t = translations[lang];
  
  logRequest(req, { endpoint: 'interact', body: req.body, lang });
  
  const { action } = req.body;
  
  res.json({
    result: t.result,
    message: t.message,
    action: action || 'test',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/public/data', (req, res) => {
  const lang = detectLanguage(req);
  const t = translations[lang];
  
  logRequest(req, { endpoint: 'data', lang });
  
  res.json({
    data: {
      items: [
        { id: 1, name: t.data_name_1, value: t.data_value },
        { id: 2, name: t.data_name_2, value: t.data_value },
        { id: 3, name: t.data_name_3, value: t.data_value }
      ],
      total: 3
    },
    timestamp: new Date().toISOString()
  });
});

// HCS-U7 Configuration
const HCS_CONFIG = {
  widgetId: process.env.HCS_WIDGET_ID || 'wgt_e7cec6afb18df420',
  backendUrl: process.env.HCS_BACKEND_URL || 'https://hcs-u7-backend.onrender.com',
  tenantId: process.env.HCS_TENANT_ID || 'cmku6oui4000a04jofxudcigo',
  minScore: parseInt(process.env.HCS_MIN_SCORE) || 65
};

// Contact messages storage (in-memory for demo, use DB in production)
const contactMessages = [];

// Contact form submission endpoint with HCS-U7 verification
app.post('/api/submit-contact', async (req, res) => {
  const { name, email, subject, message, hcsToken } = req.body;

  logRequest(req, { endpoint: 'submit-contact', email });

  // Validate required fields
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      error: 'Champs obligatoires manquants (nom, email, message)'
    });
  }

  // Validate HCS token presence
  if (!hcsToken) {
    return res.status(400).json({
      success: false,
      error: 'Token de vérification HCS-U7 manquant'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Format d\'email invalide'
    });
  }

  try {
    // Verify HCS-U7 token with backend
    const verifyResponse = await fetch(`${HCS_CONFIG.backendUrl}/api/widgets/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: hcsToken,
        tenantId: HCS_CONFIG.tenantId
      })
    });

    if (!verifyResponse.ok) {
      console.error('HCS-U7 verification failed:', verifyResponse.status);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification HCS-U7'
      });
    }

    const verifyResult = await verifyResponse.json();

    // Check if token is valid and score meets minimum
    if (!verifyResult.valid) {
      return res.status(403).json({
        success: false,
        error: 'Token HCS-U7 invalide ou expiré'
      });
    }

    if (verifyResult.score < HCS_CONFIG.minScore) {
      return res.status(403).json({
        success: false,
        error: `Score anti-bot insuffisant (${verifyResult.score}/${HCS_CONFIG.minScore} requis)`,
        score: verifyResult.score
      });
    }

    // ✅ Human verified - Process the contact message
    const contactEntry = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim(),
      subject: subject?.trim() || 'Sans objet',
      message: message.trim(),
      hcsScore: verifyResult.score,
      createdAt: new Date().toISOString(),
      ip: req.headers['x-real-ip'] || req.ip
    };

    // Store message (in-memory for demo)
    contactMessages.unshift(contactEntry);
    if (contactMessages.length > 100) {
      contactMessages.pop();
    }

    console.log(`✅ Contact message received from ${email} (Score: ${verifyResult.score})`);

    // Return success
    res.json({
      success: true,
      message: 'Message envoyé avec succès',
      score: verifyResult.score,
      id: contactEntry.id
    });

  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors du traitement'
    });
  }
});

// Get contact messages (internal/admin endpoint)
app.get('/api/internal/contacts', (req, res) => {
  const authHeader = req.headers['authorization'];
  
  if (authHeader !== `Bearer ${process.env.INTERNAL_TOKEN || 'hcs-internal-secret'}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json({
    messages: contactMessages,
    total: contactMessages.length
  });
});

app.get('/api/internal/logs', (req, res) => {
  const authHeader = req.headers['authorization'];
  
  if (authHeader !== `Bearer ${process.env.INTERNAL_TOKEN || 'hcs-internal-secret'}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json({
    logs: requestLog.slice(0, 100),
    total: requestLog.length,
  });
});

app.use((req, res) => {
  logRequest(req, { endpoint: 'not-found' });
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`🛡️  HCS-U7 Challenge Backend Origin`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔒 Protected by HCS-U7 Proxy`);
  console.log(`⚠️  This backend has NO internal protection`);
  if (PROXY_SECRET) {
    console.log(`🔐 Topological protection: ENABLED`);
  } else {
    console.log(`⚠️  Topological protection: DISABLED (permissive mode)`);
  }
  console.log(`✅ Ready to receive proxied requests\n`);
});
