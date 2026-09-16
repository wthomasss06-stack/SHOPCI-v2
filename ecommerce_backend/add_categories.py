import os
import sys
import django

# Configuration du chemin
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecommerce_backend.settings')

django.setup()

from products.models import Category

categories = [
    'Électroménager',
    'Smartphones',
    'Ordinateurs & Tablettes',
    'Télévisions & Audio',
    'Vêtements Homme',
    'Vêtements Femme',
    'Chaussures',
    'Accessoires de Mode',
    'Beauté & Parfums',
    'Santé & Bien-être',
    'Sports & Loisirs',
    'Jouets & Enfants',
    'Maison & Décoration',
    'Meubles',
    'Livres & Médias',
    'Alimentation & Boissons',
    'Automobile & Moto',
    'Jardin & Bricolage',
    'Bijoux & Montres',
    'Bagagerie & Voyage'
]

print("🚀 Ajout des catégories...")
print("-" * 50)

for cat_name in categories:
    cat, created = Category.objects.get_or_create(name=cat_name)
    if created:
        print(f"✅ Catégorie '{cat_name}' créée (ID: {cat.id})")
    else:
        print(f"ℹ️  Catégorie '{cat_name}' existe déjà (ID: {cat.id})")

print("-" * 50)
print(f"🎉 Terminé ! Total: {Category.objects.count()} catégories")