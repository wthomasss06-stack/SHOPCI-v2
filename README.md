# ShopCI

ShopCI est une marketplace composee d'une API Django REST et d'une interface Next.js.

## Structure

- `ecommerce_backend/` : API Django REST, authentification JWT, produits et commandes.
- `shopci-web/` : application web Next.js.
- `ecommerce-frontend/` : ancien frontend conserve pour reference.

## Prerequis

- Python 3.11 ou plus recent
- Node.js 20 ou plus recent
- PostgreSQL 14 ou plus recent, ou une base PostgreSQL distante (Neon, par exemple)

## Installation du backend

Depuis PowerShell :

```powershell
cd ecommerce_backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```

Renseigner ensuite `SECRET_KEY`, `DATABASE_URL`, `DEBUG`, `ALLOWED_HOSTS` et `CORS_ALLOWED_ORIGINS` dans `ecommerce_backend/.env`.

Creer une cle Django aleatoire :

```powershell
python -c "from secrets import token_urlsafe; print(token_urlsafe(50))"
```

Commandes Django usuelles, une fois `manage.py` present :

```powershell
python manage.py check
python manage.py migrate
python manage.py runserver 8000
```

## Installation du frontend

```powershell
cd shopci-web
npm ci
Copy-Item .env.example .env.local
```

Pour un lancement local, verifier que `shopci-web/.env.local` contient :

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Lancer l'application :

```powershell
npm run dev
```

Elle sera disponible sur http://localhost:3000.

Validation de production :

```powershell
npm run lint
npm run build
```

## Demarrage des deux serveurs

Ouvrir deux terminaux PowerShell :

Terminal 1 :

```powershell
cd ecommerce_backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver 8000
```

Terminal 2 :

```powershell
cd shopci-web
npm run dev
```

## Etat connu du backend

Le dossier backend actuellement fourni ne contient pas `manage.py`, `wsgi.py`, `asgi.py` ni l'application `cart` referencee par `settings.py` et `urls.py`. Le serveur Django ne peut donc pas demarrer tant que ces elements ne sont pas restaures ou retires de la configuration.

## Git

Les fichiers `.env`, environnements virtuels, dependances installees et artefacts de build sont ignores. Ne jamais commiter de mot de passe, cle API ou URL de base de donnees contenant un secret.
