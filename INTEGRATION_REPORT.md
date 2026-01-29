# 📋 Rapport Technique - HCS-U7-Challenge Landing Page

**Date** : 29 janvier 2026  
**Projet** : Landing page de vérification HCS-U7 pour Perspecta Compétences  
**Repo GitHub** : https://github.com/zefparis/hcs-u7-challenge  
**Déploiement Vercel** : https://hcs-u7-challenge.vercel.app (ou domaine custom)

---

## 🎯 Objectif de l'Application

Landing page statique qui :
1. Affiche une interface de vérification de sécurité
2. Charge et affiche le widget HCS-U7 (tests cognitifs anti-bot)
3. Écoute les événements de vérification du widget
4. Redirige l'utilisateur vers l'app Perspecta après vérification réussie

---

## 📁 Architecture du Projet

```
hcs-u7-challenge/
├── frontend/                    # Site statique déployé sur Vercel
│   ├── index.html              # Landing page principale
│   ├── app.js                  # Logique d'intégration widget
│   ├── styles.css              # Styles modernes (gradient violet)
│   ├── vercel.json             # Configuration Vercel
│   ├── success.html            # Page de succès (redirection)
│   ├── 404.html                # Page erreur 404
│   ├── contact.html            # Redirige vers / (désactivé)
│   └── README.md               # Documentation frontend
├── backend/                     # Backend Express (non utilisé pour la landing)
└── README.md                   # Documentation racine
```

---

## 🔧 Configuration Technique

### Frontend (Site Statique)

**Type** : HTML/CSS/JS pur (pas de framework)  
**Hébergement** : Vercel  
**Root Directory** : `frontend/`

### Vercel Configuration (`frontend/vercel.json`)

```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ]
    }
  ]
}
```

**Note** : Utilise `cleanUrls` au lieu de `routes` (legacy) pour éviter les conflits avec `headers`.

---

## 🎨 Interface Utilisateur

### Page Principale (`index.html`)

**Structure** :
1. **Header** : Titre "Vérification de Sécurité" + icône bouclier 🛡️
2. **Widget Container** : Zone blanche (card) pour le widget HCS-U7
3. **Footer** : Section "Pourquoi cette vérification ?" (details/summary)

**Design** :
- Gradient violet/bleu en background (`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`)
- Card blanche centrée avec ombre portée
- Responsive (mobile-friendly)
- Police système moderne (sans-serif)

---

## 🔌 Intégration Widget HCS-U7

### Configuration Widget

**Widget ID** : `wgt_e7cec6afb18df420`  
**URL Widget** : `https://hcs-widget-mvp.vercel.app`  
**Backend HCS** : `https://hcs-u7-backend.onrender.com`  
**Tenant ID** : `cmku6oui4000a04jofxudcigo`  
**App ID** : `perspecta_dashboard`

### Méthode d'Intégration (app.js)

#### 1. Chargement du Script SDK

```html
<script src="https://hcs-widget-mvp.vercel.app/widget/v1/captcha.js?id=wgt_e7cec6afb18df420"></script>
```

#### 2. Création Manuelle de l'Iframe

**Problème identifié** : Le SDK ne s'auto-initialise pas avec `data-widget-id`.

**Solution actuelle** :
```javascript
function checkWidgetLoaded() {
  // Attend 1 seconde (10 tentatives × 100ms)
  // Puis crée manuellement l'iframe
  
  const iframe = document.createElement('iframe');
  iframe.src = `https://hcs-widget-mvp.vercel.app/widget/${CONFIG.widgetId}?theme=light&lang=fr`;
  iframe.style.width = '100%';
  iframe.style.height = '500px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '8px';
  
  container.appendChild(iframe);
}
```

**Paramètres iframe** :
- `theme=light` : Thème clair (compatible avec le design)
- `lang=fr` : Langue française
- Dimensions : 100% largeur, 500px hauteur

#### 3. Écoute des Événements Widget

```javascript
window.addEventListener('message', (event) => {
  // Vérification origine
  if (!event.origin.includes('hcs-widget-mvp.vercel.app')) return;

  const data = event.data;

  if (data.type === 'HCS_VERIFICATION_SUCCESS') {
    handleVerificationSuccess(data.token, data.score);
  }

  if (data.type === 'HCS_VERIFICATION_FAILED') {
    showError(`Vérification échouée. Score: ${data.score}/100`);
  }

  if (data.type === 'HCS_VERIFICATION_REDIRECT') {
    window.location.href = data.redirectUrl;
  }
});
```

**Événements attendus du widget** :
- `HCS_VERIFICATION_SUCCESS` : Vérification réussie (+ token + score)
- `HCS_VERIFICATION_FAILED` : Vérification échouée
- `HCS_VERIFICATION_REDIRECT` : Redirection directe

---

## 🔄 Flow Utilisateur Attendu

```
1. User arrive sur hcs-u7-challenge.vercel.app
   ↓
2. Page affiche "Vérification de Sécurité"
   ↓
3. Spinner "Chargement du widget..." (1 seconde)
   ↓
4. Iframe widget HCS-U7 s'affiche dans la card blanche
   ↓
5. User complète les tests cognitifs dans le widget
   ↓
6. Widget envoie postMessage 'HCS_VERIFICATION_SUCCESS'
   ↓
7. app.js appelle backend /hcs/verify-and-redirect
   ↓
8. Affiche message "✅ Vérification réussie ! Score: XX/100"
   ↓
9. Redirection automatique après 2 secondes
   ↓
10. User arrive sur https://perspecta-competences.fr/dashboard
```

---

## ⚠️ Problème Actuel (29 Jan 2026)

### Symptôme

La card blanche s'affiche mais **reste vide** (pas de contenu widget visible).

### Diagnostic

**Étapes de débogage effectuées** :
1. ✅ Script SDK chargé correctement (`captcha.js`)
2. ✅ Iframe créée manuellement avec bonne URL
3. ✅ Dimensions iframe correctes (500px hauteur)
4. ❌ **Contenu iframe ne s'affiche pas**

### Hypothèses

**Problème côté widget** (à vérifier dans `hcs-widget-mvp`) :

1. **Route `/widget/:widgetId` inexistante ou cassée**
   - L'URL `https://hcs-widget-mvp.vercel.app/widget/wgt_e7cec6afb18df420?theme=light&lang=fr` ne retourne peut-être pas de HTML valide

2. **Problème CORS ou X-Frame-Options**
   - Le widget bloque peut-être l'affichage en iframe
   - Headers `X-Frame-Options: DENY` ou `SAMEORIGIN` mal configurés

3. **Widget non déployé ou erreur 404**
   - La route widget n'existe peut-être pas sur Vercel

4. **Paramètres query string non supportés**
   - `theme=light` et `lang=fr` peuvent causer une erreur côté widget

5. **Widget ID invalide ou non configuré**
   - `wgt_e7cec6afb18df420` n'existe peut-être pas dans la base de données widget

---

## 🔍 Actions de Débogage Recommandées (Côté Widget)

### 1. Vérifier la Route Widget

**Tester manuellement** :
```
https://hcs-widget-mvp.vercel.app/widget/wgt_e7cec6afb18df420?theme=light&lang=fr
```

**Attendu** : Page HTML avec interface widget (tests cognitifs)  
**Si erreur 404** : La route n'existe pas → créer `/widget/[widgetId]/page.tsx`

### 2. Vérifier les Headers CORS

**Dans le widget, s'assurer que** :
```javascript
// next.config.js ou middleware
headers: [
  {
    key: 'X-Frame-Options',
    value: 'ALLOW-FROM https://hcs-u7-challenge.vercel.app'
    // OU supprimer complètement pour autoriser tous les iframes
  }
]
```

### 3. Vérifier les Logs Vercel

**Dans Vercel Dashboard du widget** :
- Aller dans "Deployments" → Dernier déploiement
- Cliquer sur "View Function Logs"
- Chercher les erreurs 404 ou 500 sur `/widget/wgt_e7cec6afb18df420`

### 4. Tester avec Widget ID Hardcodé

**Temporairement dans le widget** :
```typescript
// pages/widget/[widgetId]/page.tsx
export default function WidgetPage() {
  return (
    <div style={{ padding: '20px', background: 'white' }}>
      <h1>Widget HCS-U7 Test</h1>
      <p>Widget ID: wgt_e7cec6afb18df420</p>
      <p>Si vous voyez ce message, la route fonctionne !</p>
    </div>
  );
}
```

### 5. Vérifier la Console Navigateur

**Dans la landing page déployée** :
- Ouvrir DevTools (F12)
- Onglet "Console" : chercher erreurs JavaScript
- Onglet "Network" : vérifier si l'iframe charge bien l'URL widget
- Onglet "Elements" : inspecter l'iframe et voir si elle a du contenu

---

## 📊 Données de Configuration

### Variables d'Environnement (app.js)

```javascript
const CONFIG = {
  widgetId: 'wgt_e7cec6afb18df420',
  backendUrl: 'https://hcs-u7-backend.onrender.com',
  tenantId: 'cmku6oui4000a04jofxudcigo',
  redirectUrl: 'https://perspecta-competences.fr/dashboard',
  appId: 'perspecta_dashboard'
};
```

### Endpoints Backend Utilisés

**POST** `/hcs/verify-and-redirect`
```json
{
  "token": "jwt_token_from_widget",
  "tenantId": "cmku6oui4000a04jofxudcigo",
  "appId": "perspecta_dashboard"
}
```

**Réponse attendue** :
```json
{
  "success": true,
  "redirectUrl": "https://perspecta-competences.fr/dashboard?hcs_session=xxx"
}
```

---

## 🚀 Déploiement

### GitHub

**Repo** : https://github.com/zefparis/hcs-u7-challenge  
**Branche** : `main`  
**Dernier commit** : `c5b95d3` - "fix: Initialize HCS widget with manual iframe creation"

### Vercel

**Projet** : `hcs-u7-challenge`  
**Framework Preset** : Other (site statique)  
**Root Directory** : `frontend`  
**Build Command** : (aucune, site statique)  
**Output Directory** : (aucune, sert directement `frontend/`)

**Déploiement automatique** : Activé sur push `main`

---

## 📝 Fichiers Clés

### `frontend/index.html` (71 lignes)

Structure HTML de la landing page avec :
- Container widget `<div id="hcs-captcha">`
- Chargement script SDK
- Chargement `app.js`

### `frontend/app.js` (178 lignes)

Logique JavaScript :
- Configuration widget (CONFIG)
- Fonction `checkWidgetLoaded()` : création iframe
- Fonction `handleVerificationSuccess()` : appel backend + redirection
- Fonction `showSuccessMessage()` : affichage message succès
- Event listener `message` : écoute postMessage du widget

### `frontend/styles.css` (179 lignes)

Styles CSS :
- Reset + base styles
- Gradient background
- Card widget (`.widget-container`)
- Spinner loading
- Footer responsive

### `frontend/vercel.json` (13 lignes)

Configuration Vercel :
- `cleanUrls: true`
- Headers sécurité (X-Content-Type-Options, X-Frame-Options)

---

## 🐛 Problèmes Connus

### 1. Widget Vide (Actuel)

**Statut** : 🔴 Bloquant  
**Cause probable** : Route widget inexistante ou erreur côté `hcs-widget-mvp`  
**Action** : Déboguer le projet widget

### 2. Flags Git assume-unchanged (Résolu)

**Statut** : ✅ Résolu  
**Cause** : Ancien repo avec flags `H` bloquant `git status`  
**Solution** : Suppression `.git/` + réinitialisation propre

### 3. Conflit routes/headers Vercel (Résolu)

**Statut** : ✅ Résolu  
**Cause** : Utilisation de `routes` (legacy) avec `headers`  
**Solution** : Remplacement par `cleanUrls`

---

## ✅ Points de Vérification Widget

**Pour que l'intégration fonctionne, le widget doit** :

1. ✅ Avoir une route `/widget/[widgetId]` qui retourne du HTML
2. ✅ Accepter les paramètres `?theme=light&lang=fr`
3. ✅ Autoriser l'affichage en iframe (pas de `X-Frame-Options: DENY`)
4. ✅ Envoyer des `postMessage` vers la page parente :
   - `{ type: 'HCS_VERIFICATION_SUCCESS', token: '...', score: 85 }`
   - `{ type: 'HCS_VERIFICATION_FAILED', score: 45 }`
5. ✅ Avoir le widget ID `wgt_e7cec6afb18df420` configuré en base de données

---

## 📞 Contact & Support

**Développeur** : Benjamin (zefparis)  
**Email Support** : support@perspecta-competences.fr  
**Repo Widget** : https://github.com/zefparis/hcs-widget-mvp (à vérifier)

---

## 🔗 Liens Utiles

- **Landing déployée** : https://hcs-u7-challenge.vercel.app
- **Widget déployé** : https://hcs-widget-mvp.vercel.app
- **Backend HCS** : https://hcs-u7-backend.onrender.com
- **App destination** : https://perspecta-competences.fr/dashboard

---

**Dernière mise à jour** : 29 janvier 2026 12:50 UTC+1
