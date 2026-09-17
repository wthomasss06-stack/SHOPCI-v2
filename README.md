# ShopCI

**ShopCI est une marketplace multi-vendeurs** (modèle catalogue + commandes), pas une boutique mono-marchand classique. Plusieurs vendeurs publient des produits ; les acheteurs parcourent le catalogue, passent commande et suivent la livraison. Le paiement actuel est **cash à la livraison** ; le module paiement en ligne (Clean Architecture) est prévu mais **non implémenté**.

| Critère | ShopCI |
|---|---|
| Type | **Marketplace** (multi-vendor) |
| Rôles | `acheteur` / `vendeur` |
| Auth prod | **Google OAuth** via NextAuth v4 + JWT Django |
| Base de données | PostgreSQL (Neon en prod) |
| Médias | Cloudinary (si `CLOUDINARY_URL`) |
| Frontend | Next.js App Router (`shopci-web/`) |
| Backend | Django REST Framework (`ecommerce_backend/`) |

---

## Structure du dépôt

```
ShopCI/
├── ecommerce_backend/   # API Django REST (users, products, cart, orders)
├── shopci-web/          # Frontend Next.js (App Router)
├── ShopCI_Plan_Execution.md
└── README.md
```

---

## Prérequis

- Python 3.11+
- Node.js 20+
- PostgreSQL 14+ (ou Neon)
- Compte Google Cloud (OAuth) pour l’auth en prod

---

## Installation backend

```powershell
cd ecommerce_backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```

Générer une `SECRET_KEY` :

```powershell
python -c "from secrets import token_urlsafe; print(token_urlsafe(50))"
```

Variables minimales dans `ecommerce_backend/.env` :

```env
SECRET_KEY=<clé_aléatoire>
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
CORS_ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<id_client_google>
LEGACY_PASSWORD_AUTH_ENABLED=True
```

En **production** : `LEGACY_PASSWORD_AUTH_ENABLED=False` (Google uniquement).

Commandes usuelles :

```powershell
python manage.py check
python manage.py migrate
python manage.py test users --keepdb
python manage.py runserver 8000
```

---

## Installation frontend

```powershell
cd shopci-web
npm ci
Copy-Item .env.example .env.local
```

`shopci-web/.env.local` (minimum) :

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<secret_nextauth>
GOOGLE_CLIENT_ID=<id_client_google>
GOOGLE_CLIENT_SECRET=<secret_google>
```

```powershell
npm run dev        # http://localhost:3000
npm run lint
npm run build
```

---

## URLs de production (référence)

| Service | URL |
|---|---|
| Frontend | https://shopci-v2.vercel.app |
| API | https://shopci-v2.onrender.com/api |

---

## Ce qui est livré (état actuel)

- Migration Next.js + catalogue marketplace catalog-first
- Google OAuth + onboarding (identité, photo, type de compte, CGU)
- Session 30 jours (NextAuth cookie + miroir profil localStorage, sans JWT en localStorage)
- Délai 1 jour après suspension / suppression (journal JSON `logs/account_status_log.json`)
- Durcissement API : `IsAuthenticated` par défaut, `IsVendor` pour créer des produits, uploads validés (MIME/taille), auth legacy désactivable, JWT refuse comptes suspendus/supprimés, GPS borné
- Healthcheck : `GET /api/health/`
- Rate limiting auth, transitions commande par rôle, retrait email/téléphone vendeur du catalogue public
- PWA, pages légales, SEO (`robots.txt`, `sitemap.xml`, `llms.txt`)
- Cloudinary + seed produits vendeurs
- Tests users : 13 tests (`python manage.py test users --keepdb`)

---

## Reste à faire (d’après `ShopCI_Plan_Execution.md` + analyse code)

### Produit & business (plan)

| Priorité | Tâche | Statut |
|---|---|---|
| Haute | Vérifier variables Vercel + Render (Google, CORS, URLs) | À faire |
| Haute | Test flux prod : Google → onboarding → catalogue → commande | À faire |
| Haute | **Module paiement** (agrégateur, Clean Architecture ADR-05) | Non démarré |
| Moyenne | Fixer taux **commission + abonnement vendeur** (ADR-01) | Non chiffré |
| Moyenne | **CGV / conditions vendeurs** | Manquant |
| Moyenne | Politique retours chiffrée (si différente du Help) | À trancher |
| Basse | Compléter mentions légales `[À COMPLÉTER PAR LE CLIENT]` | Partiel |

### Technique restant

| Priorité | Tâche | Statut |
|---|---|---|
| Moyenne | Tests IDOR commandes (`orders/tests.py`) | À faire |
| Moyenne | Notifications (email/push) — TODOs `orders/views.py` | À faire |
| Basse | Monitoring Sentry, backups Neon | À faire |
| Basse | Journal comptes centralisé (Render multi-instance) | À faire |
| Basse | Idempotency checkout | À faire |

---

## Sécurité (audit — état après durcissement)

> Ne remplace pas un pentest.

### Corrigé récemment ✅

- Permission API par défaut : `IsAuthenticated` ; catalogue public en `AllowAny` explicite
- POST produit : permission `IsVendor`
- Auth legacy : `LEGACY_PASSWORD_AUTH_ENABLED` (False en prod → 403 `legacy_auth_disabled`)
- Uploads : `ecommerce_backend/upload_validators.py` (profil, produits, photo colis)
- Comptes suspendus/supprimés : `ActiveUserJWTAuthentication` + garde onboarding
- GPS : bornes -90/90 et -180/180

### Points d’attention restants ⏳

- Journal comptes JSON local (`logs/`) — fragile multi-instance ; prévoir Postgres ou service logs
- Secret d’exemple dans l’historique du plan — ne jamais réutiliser en prod
- Pentest / revue OWASP avant grosse mise en prod paiement

### Déjà mitigé (avant durcissement)

- Secrets via `.env` (pas en dur dans `settings.py`)
- CORS restreint par origine
- Rate limiting auth / Google / reset
- JWT access 30 min + refresh 30 j + blacklist rotation
- Transitions statut commande cloisonnées (`allowed_status_transitions`)
- IDOR produits : update/delete vérifie `product.vendor == request.user`
- IDOR commandes : queryset filtré buyer/vendor
- Headers sécurité prod si `DEBUG=False` (HSTS, SSL redirect, cookies secure)
- Email/téléphone vendeur retirés du serializer public produits

---

## Robustesse backend (manques non évoqués dans le plan)

| Domaine | Manque | Recommandation |
|---|---|---|
| Permissions | Permission DRF par défaut trop permissive | `IsAuthenticated` global + permissions objet |
| Rôles | Pas de couche `IsVendor` / `IsBuyer` | Permissions custom réutilisables |
| Uploads | Constante morte | Validator Django réutilisable (MIME + taille) |
| Transactions | Commande OK avec `select_for_update` | Étendre aux annulations concurrentes + tests charge |
| Observabilité | Logging console seulement | Sentry + endpoint health + métriques Render |
| Données | Pas de soft-delete produits/commandes unifié | Politique rétention + export RGPD |
| API | Pas de versioning | Préfixer `/api/v1/` avant grosse évolution |
| Tests | ~8 tests users | Couvrir orders IDOR, product POST acheteur, uploads |
| Email | Console backend par défaut | SMTP prod pour reset/notifications commande |
| Paiement | Absent | Module isolé (ADR-05) avec webhooks signés |

---

## Démarrage local (2 terminaux)

**Terminal 1 — API**

```powershell
cd ecommerce_backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver 8000
```

**Terminal 2 — Web**

```powershell
cd shopci-web
npm run dev
```

---

## Déploiement

```powershell
# Backend
python manage.py check --deploy
python manage.py collectstatic --noinput

# Frontend
npm run build
```

Ne **jamais** commiter `.env`, clés API, mots de passe ou URL de base contenant des secrets. Le dossier `logs/` (journal comptes) est ignoré par git.

---

## Marketplace vs e-commerce mono-boutique

ShopCI est une **marketplace** (plusieurs vendeurs). Pour passer à une **boutique unique**, voir la section dédiée dans [`ShopCI_Plan_Execution.md`](ShopCI_Plan_Execution.md) (vendeur système, simplification rôles, frontend, migration données).

---

## Documentation complémentaire

- Plan détaillé, ADR et checklist prod : [`ShopCI_Plan_Execution.md`](ShopCI_Plan_Execution.md)
