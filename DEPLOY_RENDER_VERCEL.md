# Déploiement Render + Vercel

Guide rapide pour déployer le backend sur Render et le frontend sur Vercel.

## 🎯 Architecture

```
Frontend (Vercel) → HCS-U7 Proxy → HCS-U7 Backend → Backend Origin (Render)
```

## 📦 Backend sur Render

### Étape 1: Préparer le dépôt

Le fichier `backend/render.yaml` est déjà configuré.

### Étape 2: Déployer sur Render

1. Va sur [render.com](https://render.com)
2. Connecte ton compte GitHub
3. Clique sur "New +" → "Blueprint"
4. Sélectionne le dépôt `hcs-u7-challenge`
5. Render détectera automatiquement `backend/render.yaml`
6. Clique sur "Apply"

### Étape 3: Configurer les variables d'environnement

Render générera automatiquement:
- `INTERNAL_TOKEN` (pour les logs internes)
- `PROXY_SECRET` (pour l'authentification proxy)

**Important:** Note le `PROXY_SECRET` généré, tu en auras besoin pour configurer le proxy HCS-U7.

### Étape 4: Récupérer l'URL du backend

Après déploiement, Render te donnera une URL:
```
https://hcs-u7-challenge-backend.onrender.com
```

**⚠️ Important:** Cette URL doit rester privée. Configure le proxy HCS-U7 pour qu'il soit le seul à y accéder.

## 🌐 Frontend sur Vercel

### Étape 1: Préparer le dépôt

Le fichier `frontend/vercel.json` est déjà configuré.

### Étape 2: Déployer sur Vercel

1. Va sur [vercel.com](https://vercel.com)
2. Connecte ton compte GitHub
3. Clique sur "Add New..." → "Project"
4. Importe `hcs-u7-challenge`
5. Configure le projet:
   - **Framework Preset:** Other
   - **Root Directory:** `frontend`
   - **Build Command:** (laisser vide)
   - **Output Directory:** `.`
6. Clique sur "Deploy"

### Étape 3: Configurer le domaine

1. Dans Vercel, va dans "Settings" → "Domains"
2. Ajoute ton domaine: `hcs-u7-challenge.com`
3. Configure les DNS selon les instructions Vercel

## 🔧 Configuration HCS-U7

### Étape 1: Créer le tenant

Dans le dashboard HCS-U7:

1. Crée un nouveau tenant "HCS-U7 Challenge"
2. Ajoute le domaine: `hcs-u7-challenge.com`

### Étape 2: Configurer le backend origin

1. Va dans "Backend Origins"
2. Ajoute:
   - **URL:** `https://hcs-u7-challenge-backend.onrender.com`
   - **Health Check:** `/health`
   - **Headers personnalisés:**
     - `X-Proxy-Secret: <PROXY_SECRET_from_render>`

### Étape 3: Configurer les routes

1. Va dans "Proxy Routes"
2. Ajoute:
   - Pattern: `/api/public/*`
   - Origin: Backend Render
   - Protection: Enabled

### Étape 4: Déployer le proxy

1. Va dans "Proxy" → "Deploy"
2. Sélectionne la route: `hcs-u7-challenge.com/*`
3. Déploie

## ✅ Vérification

### Test Backend (direct - pour vérifier uniquement)

```bash
curl https://hcs-u7-challenge-backend.onrender.com/health
```

Devrait retourner:
```json
{
  "status": "healthy",
  "service": "hcs-u7-challenge-backend"
}
```

### Test Frontend

```bash
curl https://hcs-u7-challenge.com/
```

Devrait retourner le HTML.

### Test API via Proxy

```bash
curl https://hcs-u7-challenge.com/api/public/info
```

Devrait passer par le proxy HCS-U7 puis atteindre le backend Render.

## 🔒 Sécurité

### Backend Render

Le backend vérifie:
- ✅ Header `CF-Connecting-IP` (Cloudflare)
- ✅ Header `X-Proxy-Secret` (shared secret)

Si accès direct sans ces headers → 403 Forbidden

### Frontend Vercel

- ✅ Headers de sécurité configurés (vercel.json)
- ✅ Pas de secrets exposés
- ✅ Fichiers statiques uniquement

## 📊 Monitoring

### Render Dashboard
- Logs backend en temps réel
- Métriques CPU/RAM
- Health checks

### Vercel Dashboard
- Analytics frontend
- Logs de déploiement
- Performance metrics

### HCS-U7 Dashboard
- Requêtes totales
- Allowed/Throttled/Blocked
- Patterns d'attaque

## 🔄 Mises à jour

### Backend

```bash
git add backend/
git commit -m "Update backend"
git push
```

Render redéploiera automatiquement.

### Frontend

```bash
git add frontend/
git commit -m "Update frontend"
git push
```

Vercel redéploiera automatiquement.

## 💰 Coûts

### Render Free Tier
- ✅ 750 heures/mois
- ✅ 512 MB RAM
- ⚠️ Le service s'endort après 15 min d'inactivité
- ⚠️ Redémarre en ~30 secondes à la première requête

### Vercel Free Tier
- ✅ 100 GB bandwidth/mois
- ✅ Déploiements illimités
- ✅ Pas de sleep

## 🚀 Optimisations

### Garder le backend Render éveillé

Option 1: Ping régulier (externe)
```bash
# Cron job toutes les 10 minutes
*/10 * * * * curl https://hcs-u7-challenge-backend.onrender.com/health
```

Option 2: Upgrade vers Render Starter ($7/mois)
- Pas de sleep
- Plus de RAM
- Meilleure performance

## 📝 Notes importantes

1. **Le backend Render doit rester privé** - Seul le proxy HCS-U7 doit y accéder
2. **Garde le `PROXY_SECRET` confidentiel** - Ne le commit jamais dans git
3. **Le frontend Vercel est public** - Normal, c'est l'interface utilisateur
4. **Les logs internes** sont accessibles via `/api/internal/logs` avec le token

## 🆘 Troubleshooting

### Backend ne répond pas
- Vérifie que le service Render est démarré
- Vérifie les logs Render
- Le service a peut-être besoin de 30s pour démarrer (free tier)

### Frontend ne charge pas
- Vérifie le déploiement Vercel
- Vérifie la configuration DNS
- Vérifie les logs Vercel

### API retourne 403
- Vérifie que le proxy HCS-U7 envoie le bon `X-Proxy-Secret`
- Vérifie que le header `CF-Connecting-IP` est présent
- Vérifie les logs backend Render

### Proxy ne route pas
- Vérifie la configuration des routes dans HCS-U7 dashboard
- Vérifie que le domaine est bien configuré
- Vérifie que le proxy est déployé

## 🎯 Checklist de déploiement

- [ ] Backend déployé sur Render
- [ ] `PROXY_SECRET` noté et sécurisé
- [ ] Frontend déployé sur Vercel
- [ ] Domaine configuré sur Vercel
- [ ] Tenant HCS-U7 créé
- [ ] Backend origin configuré dans HCS-U7
- [ ] Routes proxy configurées dans HCS-U7
- [ ] Proxy HCS-U7 déployé
- [ ] Tests de vérification effectués
- [ ] Monitoring configuré

## 🔗 Liens utiles

- **Render Dashboard:** https://dashboard.render.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **HCS-U7 Dashboard:** https://hcs-u7.com/dashboard
- **Dépôt GitHub:** https://github.com/zefparis/hcs-u7-challenge
