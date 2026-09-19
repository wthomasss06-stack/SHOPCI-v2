# ShopCI

Marketplace multi-vendeur ivoirienne — acheteurs et vendeurs indépendants, livraison suivie, paiement à la livraison. Type de projet : marketplace (à la Amazon), pas une boutique mono-vendeur.

## Stack

**Backend** — `ecommerce_backend/`
- Django 5.2.1 + Django REST Framework + SimpleJWT
- PostgreSQL (hébergé sur Neon)
- Cloudinary pour les médias (images produits, photos de profil, preuves de livraison)
- Authentification Google (vérification de l'ID token, émission des JWT internes)
- Déployé sur Render (voir `runtime.txt`, `gunicorn` dans `requirements.txt`)

**Frontend** — `shopci-web/`
- Next.js 16 (App Router)
- NextAuth v4 (Google OAuth) — le refresh token ne quitte jamais le serveur, l'access token vit en mémoire côté client, jamais en localStorage
- Tailwind CSS
- PWA installable (manifest, service worker, icônes)
- Déployé sur Vercel

## Démarrage local

### Backend
```bash
cd ecommerce_backend
python -m venv .venv
.venv\Scripts\Activate.ps1   # ou source .venv/bin/activate sous Linux/Mac
pip install -r requirements.txt
cp .env.example .env         # renseigner DATABASE_URL, SECRET_KEY, GOOGLE_CLIENT_ID, CLOUDINARY_*
python manage.py migrate
python manage.py runserver 8000
```

### Frontend
```bash
cd shopci-web
npm install
cp .env.example .env         # renseigner NEXT_PUBLIC_API_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID/SECRET
npm run dev
```

Les deux serveurs doivent tourner en même temps (terminaux séparés) pour que le frontend puisse joindre l'API.

## Fonctionnalités

- Marketplace multi-vendeur : catalogue, panier, commandes, favoris
- Livraison géolocalisée avec preuve photo et confirmation de réception
- Authentification Google uniquement, avec onboarding (nom, photo, type de compte, acceptation des CGU)
- Tableaux de bord acheteur et vendeur séparés
- PWA installable (Chrome/Android et iOS)
- Pages légales : CGU, CGV, confidentialité, mentions légales, aide
- SEO : métadonnées Open Graph par fiche produit, sitemap, robots.txt, llms.txt

## En cours / à venir

- Paiement en ligne (mobile money) — agrégateur pas encore choisi, seul le paiement à la livraison fonctionne aujourd'hui
- Taux de commission et d'abonnement vendeur à fixer
- Mentions légales à compléter (forme juridique, RCCM, directeur de publication)

## Modèle économique

Commission sur chaque vente + abonnement vendeur.

---
Développé par AKATech Studio.
