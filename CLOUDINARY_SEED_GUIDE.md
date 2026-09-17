# Cloudinary + seed vendors — guide de mise en production

## 1) Variables d’environnement

Mettre ces valeurs dans les environnements respectifs :

### Backend Django (Render / .env backend)

```env
SECRET_KEY=CHANGE_ME_IN_PROD
DEBUG=False
ALLOWED_HOSTS=shopci-v2.onrender.com,localhost,127.0.0.1
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require

CLOUDINARY_URL=cloudinary://674331848559466:V8-tl1howLhCFFPDNcdwS4XjB64@gks3f2st
CLOUDINARY_CLOUD_NAME=gks3f2st
CLOUDINARY_API_KEY=674331848559466
CLOUDINARY_API_SECRET=V8-tl1howLhCFFPDNcdwS4XjB64faut
GOOGLE_CLIENT_ID=95472537150-5i64h838n763hvql04njeha8dumsmoen.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=REPLACE_WITH_REAL_SECRET
```

### Frontend Next.js (Vercel / .env frontend)

```env
NEXT_PUBLIC_API_URL=https://shopci-v2.onrender.com/api
NEXTAUTH_URL=https://shopci-v2.vercel.app
NEXTAUTH_SECRET=REPLACE_WITH_STRONG_SECRET
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=gks3f2st
GOOGLE_CLIENT_ID=95472537150-5i64h838n763hvql04njeha8dumsmoen.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=REPLACE_WITH_REAL_SECRET
```

> Important : ne jamais committer les secrets réels dans Git. Les valeurs ci-dessus sont celles du projet en cours ; à conserver uniquement dans Render/Vercel et dans les fichiers `.env` locaux non versionnés.

---

## 2) Upload des images de seed vers Cloudinary

Le projet contient déjà un script d’upload :

- [upload-cloudinary.js](upload-cloudinary.js)
- [.cloudinary-manifest.json](.cloudinary-manifest.json)

### Commande de base

Depuis la racine du projet :

```bash
cd "c:\Users\DOWELL AKA\Desktop\ShopCI"
set CLOUDINARY_CLOUD_NAME=gks3f2st
set CLOUDINARY_API_KEY=674331848559466
set CLOUDINARY_API_SECRET=V8-tl1howLhCFFPDNcdwS4XjB64faut
node upload-cloudinary.js
```

### Si les images source sont dans `ecomm/`

Le script actuel cible `public/images` dans ce repo. Si tes images de seed sont dans `ecomm/`, il faut soit :

1. copier ou lier le dossier `ecomm` vers `public/images`, soit
2. modifier le script pour utiliser `ecomm` comme dossier source.

Exemple de changement minimal dans [upload-cloudinary.js](upload-cloudinary.js) :

```js
const imagesDir = path.join(__dirname, 'ecomm');
```

ou, si tu veux garder le script sans modification :

```bash
mkdir public\images
xcopy /E /I ecomm public\images
node upload-cloudinary.js
```

### Vérification

Le manifeste `/.cloudinary-manifest.json` doit ensuite refléter les images uploadées avec les champs suivants :

```json
{
  "file-name.jpg": {
    "hash": "...",
    "publicId": "akatech/images/file-name",
    "resourceType": "image",
    "updatedAt": "..."
  }
}
```

Les URL publiques Cloudinary correspondantes seront donc du type :

```txt
https://res.cloudinary.com/gks3f2st/image/upload/akatech/images/file-name.jpg
```

---

## 3) Création des 3 comptes vendeur de seed

Exemple de comptes à créer :

- `vendor_alpha` — `vendor_alpha@shopci.com`
- `vendor_beta` — `vendor_beta@shopci.com`
- `vendor_gamma` — `vendor_gamma@shopci.com`

Chaque compte doit être de type `vendeur` et avoir un statut `active`.

### Commande Django pour créer les comptes

```bash
cd ecommerce_backend
python manage.py shell
```

Puis, dans le shell :

```python
from django.contrib.auth import get_user_model
from products.models import Category, Product, ProductImage
from decimal import Decimal
import json
from pathlib import Path

User = get_user_model()

vendors = [
    {"username": "vendor_alpha", "email": "vendor_alpha@shopci.com", "password": "SeedPass123!"},
    {"username": "vendor_beta", "email": "vendor_beta@shopci.com", "password": "SeedPass123!"},
    {"username": "vendor_gamma", "email": "vendor_gamma@shopci.com", "password": "SeedPass123!"},
]

for payload in vendors:
    user, created = User.objects.get_or_create(
        email=payload["email"],
        defaults={
            "username": payload["username"],
            "user_type": "vendeur",
            "account_status": "active",
            "is_active": True,
        },
    )
    if created:
        user.set_password(payload["password"])
        user.save()
    print(f"{user.username}: {'created' if created else 'exists'}")
```

---

## 4) Seed des produits (3 photos max par produit, 4 produits par vendeur)

### Stratégie recommandée

- 3 comptes vendeurs
- 4 produits par vendeur
- 1 image principale + jusqu’à 2 images complémentaires
- 3 photos max par produit

### Script de seed

Exécuter ceci dans le shell Django :

```python
from django.contrib.auth import get_user_model
from products.models import Category, Product, ProductImage
from decimal import Decimal
import json
from pathlib import Path

User = get_user_model()

cloud_name = "gks3f2st"
manifest_path = Path("..") / ".cloudinary-manifest.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

urls = []
for entry in manifest.values():
    public_id = entry.get("publicId")
    if public_id:
        urls.append(f"https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}")

if not urls:
    raise RuntimeError("Aucune image Cloudinary trouvée dans .cloudinary-manifest.json")

category, _ = Category.objects.get_or_create(
    name="Seed Collection",
    defaults={"slug": "seed-collection", "description": "Produits de seed Cloudinary"},
)

vendors = [
    "vendor_alpha",
    "vendor_beta",
    "vendor_gamma",
]

index = 0
for username in vendors:
    seller = User.objects.get(username=username, user_type="vendeur")
    for n in range(1, 5):
        product_name = f"{seller.username.title()} Product {n}"
        product = Product.objects.create(
            vendor=seller,
            category=category,
            name=product_name,
            description=f"Produit de démonstration n°{n} pour {seller.username}.",
            price=Decimal("25000"),
            old_price=Decimal("32000"),
            stock=20,
            image=urls[index % len(urls)],
            is_active=True,
            is_featured=(n == 1),
        )
        index += 1
        for j in range(min(2, len(urls) - 1)):
            ProductImage.objects.create(
                product=product,
                image=urls[(index + j) % len(urls)],
                alt_text=f"{product_name} photo {j + 1}",
            )
        print(f"Produit créé: {product.name} ({product.image})")
```

### Règle de conformité

- maximum 4 produits par vendeur
- maximum 3 photos par produit
- photos chargées depuis Cloudinary via URL publique
- stockage final en production sans laisser d’images en local dans le repo

---

## 5) Lancer le seed en production

### Étape 1 — migrations

```bash
cd ecommerce_backend
python manage.py migrate
```

### Étape 2 — créer les comptes et les produits

```bash
python manage.py shell
```

Puis exécuter le script de seed ci-dessus.

### Étape 3 — validation rapide

```bash
python manage.py shell
```

```python
from products.models import Product, ProductImage
from users.models import User
print("Vendeurs:", User.objects.filter(user_type="vendeur").count())
print("Produits:", Product.objects.count())
print("Images produits:", ProductImage.objects.count())
```

---

## 6) Vérification du rendu Cloudinary dans l’API

Le backend doit exposer les URLs Cloudinary dans les sérialiseurs produits.

Exemple de test :

```bash
curl "https://shopci-v2.onrender.com/api/products/"
```

Vérifier que les champs `image` et `images` pointent vers des URLs publiques Cloudinary, et non vers des chemins locaux du disque.

---

## 7) Commandes utiles

### Upload des images

```bash
cd "c:\Users\DOWELL AKA\Desktop\ShopCI"
node upload-cloudinary.js
```

### Démarrer le backend local

```powershell
cd ecommerce_backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver 8000
```

### Démarrer le frontend local

```powershell
cd shopci-web
npm run dev
```

### Seed en prod

```bash
cd ecommerce_backend
python manage.py migrate
python manage.py shell
```

---

## 8) Recommandation finale

L’architecture la plus robuste pour ce projet est :

- images source dans `ecomm/` ou `public/images`
- upload vers Cloudinary via script Node
- script de seed Django qui remplit 3 vendeurs + 4 produits chacun
- les produits servent des URLs Cloudinary et non des fichiers locaux
- le frontend affiche uniquement ces URLs via l’API

Cela garantit que les images sont optimisées, servies via CDN, et qu’elles ne pèsent pas dans le dépôt Git ni dans le build Vercel.
