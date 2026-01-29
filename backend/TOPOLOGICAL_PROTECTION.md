# Topological Protection Middleware

## Objectif

Empêcher tout accès direct au backend origin. Le backend doit être accessible uniquement via le proxy Cloudflare HCS-U7.

## Principe

**Protection topologique** = protection au niveau réseau/infrastructure, pas au niveau applicatif.

Le backend:
- ❌ N'implémente AUCUNE logique de sécurité applicative
- ❌ Ne fait AUCUNE authentification utilisateur
- ❌ Ne fait AUCUN rate limiting
- ❌ Ne fait AUCUN scoring ou détection de bots
- ✅ Vérifie uniquement la provenance de la requête (proxy vs direct)

## Implémentation

### Middleware `topologicalProtection`

```javascript
function topologicalProtection(req, res, next) {
  // Si PROXY_SECRET n'est pas défini → mode permissif
  if (!PROXY_SECRET) {
    return next();
  }

  // Health check toujours accessible (monitoring)
  if (req.path === '/health') {
    return next();
  }

  // Vérifier le header X-Proxy-Secret
  const proxySecret = req.headers['x-proxy-secret'];

  // Si absent ou incorrect → bloquer
  if (proxySecret !== PROXY_SECRET) {
    return res.status(403).json({
      message: 'Direct access not allowed'
    });
  }

  // Si valide → laisser passer
  next();
}
```

### Utilisation

```javascript
app.use(cors());
app.use(express.json());
app.use(topologicalProtection); // Avant toute logique applicative
```

## Comportement

### Mode 1: PROXY_SECRET non défini (permissif)

```bash
# .env (ou pas de .env)
PORT=3000
INTERNAL_TOKEN=secret123
# PROXY_SECRET absent

# Résultat: toutes les requêtes passent
curl http://localhost:3000/api/public/info
# → 200 OK (pas de protection)
```

**Cas d'usage:**
- Développement local
- Tests unitaires
- Environnements de staging sans proxy

### Mode 2: PROXY_SECRET défini (protégé)

```bash
# .env
PORT=3000
INTERNAL_TOKEN=secret123
PROXY_SECRET=my-shared-secret-with-proxy

# Résultat: seules les requêtes avec le bon header passent
```

**Requête directe (bloquée):**
```bash
curl http://backend.example.com/api/public/info
# → 403 Forbidden
# { "message": "Direct access not allowed" }
```

**Requête via proxy (autorisée):**
```bash
curl http://backend.example.com/api/public/info \
  -H "X-Proxy-Secret: my-shared-secret-with-proxy"
# → 200 OK
# { "service": "HCS-U7 Challenge", ... }
```

## Configuration du Proxy HCS-U7

Dans le dashboard HCS-U7, configurer le backend origin:

```yaml
Backend Origin:
  URL: https://backend.example.com
  Custom Headers:
    X-Proxy-Secret: my-shared-secret-with-proxy
```

Le proxy ajoutera automatiquement ce header à toutes les requêtes vers le backend.

## Sécurité

### ✅ Ce que le middleware fait

- Vérifie la présence d'un secret partagé
- Bloque les accès directs sans le secret
- Reste totalement opaque (pas de détails exposés)
- Permet le health check pour le monitoring

### ❌ Ce que le middleware NE fait PAS

- Authentifier les utilisateurs
- Vérifier les permissions
- Faire du rate limiting
- Détecter les bots
- Analyser le comportement
- Logger les tentatives d'accès (sauf console interne)

### Opacité

Toutes les requêtes bloquées reçoivent:
- HTTP 403 Forbidden
- Body: `{ "message": "Direct access not allowed" }`
- Aucune information sur la raison
- Aucune différence de timing observable
- Aucun log côté client

## Déploiement

### Render

Le `render.yaml` génère automatiquement `PROXY_SECRET`:

```yaml
envVars:
  - key: PROXY_SECRET
    generateValue: true  # Génère un secret aléatoire
```

Après déploiement:
1. Récupérer la valeur de `PROXY_SECRET` dans Render Dashboard
2. Configurer cette valeur dans HCS-U7 Dashboard (backend origin headers)

### Autres plateformes

```bash
# Générer un secret fort
openssl rand -hex 32

# Configurer dans l'environnement
export PROXY_SECRET=<secret_généré>

# Ou dans .env
echo "PROXY_SECRET=<secret_généré>" >> .env
```

## Tests

### Test mode permissif (sans PROXY_SECRET)

```bash
# Démarrer sans PROXY_SECRET
npm run dev

# Tester
curl http://localhost:3000/api/public/info
# → 200 OK (pas de protection)
```

### Test mode protégé (avec PROXY_SECRET)

```bash
# Démarrer avec PROXY_SECRET
PROXY_SECRET=test123 npm run dev

# Test sans header (bloqué)
curl http://localhost:3000/api/public/info
# → 403 Forbidden

# Test avec mauvais header (bloqué)
curl http://localhost:3000/api/public/info \
  -H "X-Proxy-Secret: wrong"
# → 403 Forbidden

# Test avec bon header (autorisé)
curl http://localhost:3000/api/public/info \
  -H "X-Proxy-Secret: test123"
# → 200 OK
```

### Test health check (toujours accessible)

```bash
# Même en mode protégé, /health reste accessible
PROXY_SECRET=test123 npm run dev

curl http://localhost:3000/health
# → 200 OK (pas de protection sur /health)
```

## Logs de démarrage

Le serveur affiche le mode de protection au démarrage:

**Mode permissif:**
```
🛡️  HCS-U7 Challenge Backend Origin
📡 Server running on port 3000
🔒 Protected by HCS-U7 Proxy
⚠️  This backend has NO internal protection
⚠️  Topological protection: DISABLED (permissive mode)
✅ Ready to receive proxied requests
```

**Mode protégé:**
```
🛡️  HCS-U7 Challenge Backend Origin
📡 Server running on port 3000
🔒 Protected by HCS-U7 Proxy
⚠️  This backend has NO internal protection
🔐 Topological protection: ENABLED
✅ Ready to receive proxied requests
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Visitor                        │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│            HCS-U7 Cloudflare Proxy               │
│  - Ajoute header: X-Proxy-Secret: <secret>      │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│              Backend Origin (Node.js)            │
│                                                   │
│  topologicalProtection middleware:               │
│  1. Vérifie X-Proxy-Secret                      │
│  2. Si valide → next()                          │
│  3. Si invalide → 403                           │
└─────────────────────────────────────────────────┘
```

## Différence avec d'autres protections

| Type | Protection Topologique | Protection Applicative |
|------|------------------------|------------------------|
| **Niveau** | Infrastructure/Réseau | Application/Business |
| **Objectif** | Bloquer accès direct | Authentifier/Autoriser |
| **Vérifie** | Provenance (proxy) | Identité (user) |
| **Logique** | Shared secret | Auth tokens, sessions |
| **Dépendance** | Proxy HCS-U7 | Base de données users |
| **Complexité** | Très simple | Complexe |

## Philosophie

> "Le backend n'a AUCUNE protection interne.  
> Il dépend 100% du proxy HCS-U7 pour la sécurité.  
> La protection topologique garantit simplement que le trafic passe par le proxy."

Cette approche:
- ✅ Prouve que HCS-U7 protège des backends sans défense
- ✅ Évite la duplication de logique de sécurité
- ✅ Reste simple et maintenable
- ✅ Est totalement opaque pour l'attaquant
- ✅ Ne crée pas de faux sentiment de sécurité

Le backend est **logiquement sans défense**, mais **topologiquement protégé**.
