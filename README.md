# 💼 FreelanceFlow — Facturation Pro

Application web de gestion de factures et de clients pour freelances. Simple, rapide, et professionnelle.

## 🚀 Lancement en 3 étapes

```bash
# 1. Installer les dépendances (backend)
cd server && npm install

# 2. Installer les dépendances (frontend)
cd ../client && npm install

# 3. Lancer l'app (depuis la racine)
cd .. && npm run dev
```

Puis ouvre **http://localhost:3000** dans ton navigateur.

## 💰 Comment faire de l'argent ?

### Option 1 : Utilisation directe
- Crée tes factures et envoie-les à tes clients
- Génère des PDF professionnels en 1 clic
- Suis tes revenus encaissés vs en attente

### Option 2 : SaaS (revenu récurrent)
1. Héberge l'app sur un VPS (ex: Hostinger ~5€/mois)
2. Ajoute Stripe pour les abonnements (~10€/mois/utilisateur)
3. Vise les freelances, artisans, consultants

## 🛠️ Stack technique
- **Frontend** : React + Vite + Tailwind CSS
- **Backend** : Node.js + Express
- **Base de données** : SQLite (locale, zéro configuration)
- **PDF** : jsPDF + AutoTable

## 📁 Structure
```
freelanceflow/
├── client/          # React app (Vite)
│   └── src/
│       ├── pages/   # Dashboard, Factures, Clients, Settings
│       ├── components/
│       └── utils/   # API calls, PDF generator
└── server/          # Express API
    └── src/
        ├── routes/  # /clients /invoices /settings
        └── db/      # SQLite database
```