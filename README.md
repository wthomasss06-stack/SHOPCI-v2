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

Le fichier copie une configuration de developpement : renseigner au minimum `SECRET_KEY` et `DATABASE_URL` dans `ecommerce_backend/.env`. Pour la production, passer `DEBUG=False`, definir le domaine dans `ALLOWED_HOSTS` et les origines frontend dans `CORS_ALLOWED_ORIGINS`. Ajouter `CLOUDINARY_URL` pour servir les medias sur un hebergement distant.

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

```

Pour un lancement local, verifier que `shopci-web/.env.local` contient :

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Creer ce fichier depuis l'exemple :

```powershell
Copy-Item .env.example .env.local
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

## Configuration de production

Le backend utilise PostgreSQL via `DATABASE_URL` et accepte Cloudinary via `CLOUDINARY_URL` pour les fichiers media. Le frontend utilise uniquement `NEXT_PUBLIC_API_URL`; cette variable doit pointer vers l'URL publique de l'API, avec le suffixe `/api`.

En production, remplacer les valeurs locales des deux fichiers `.env.example` par les domaines deployes, puis lancer :

```powershell
python manage.py check --deploy
python manage.py collectstatic --noinput
npm run build
```

## Git

Les fichiers `.env`, environnements virtuels, dependances installees et artefacts de build sont ignores. Ne jamais commiter de mot de passe, cle API ou URL de base de donnees contenant un secret.
