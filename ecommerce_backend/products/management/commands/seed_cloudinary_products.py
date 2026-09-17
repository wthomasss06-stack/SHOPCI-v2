from decimal import Decimal
import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from products.models import Category, Product, ProductImage


class Command(BaseCommand):
    help = 'Seed 3 vendor accounts and 4 products each with up to 3 Cloudinary images per product.'

    def handle(self, *args, **options):
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
                self.stdout.write(self.style.SUCCESS(f"Created vendor: {user.username}"))
            else:
                self.stdout.write(f"Vendor already exists: {user.username}")

        manifest_path = Path(__file__).resolve().parents[4] / ".cloudinary-manifest.json"
        if not manifest_path.exists():
            raise FileNotFoundError(
                "Cloudinary manifest not found at project root. Upload images first with node upload-cloudinary.js"
            )

        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        cloudinary_urls = []
        for item in manifest.values():
            public_id = item.get("publicId")
            if public_id:
                cloudinary_urls.append(f"https://res.cloudinary.com/gks3f2st/image/upload/{public_id}")

        if not cloudinary_urls:
            raise ValueError("No Cloudinary image URLs available in .cloudinary-manifest.json")

        category, _ = Category.objects.get_or_create(
            name="Seed Collection",
            defaults={
                "slug": "seed-collection",
                "description": "Images de démonstration uploadées sur Cloudinary",
            },
        )

        product_templates = [
            {
                "name": "Classic Street Sneaker",
                "description": "Chaussure premium pour usage quotidien et style urbain.",
                "price": Decimal("25000"),
                "old_price": Decimal("32000"),
                "stock": 20,
            },
            {
                "name": "Luxury Leather Watch",
                "description": "Montre élégante aux finitions premium et design minimaliste.",
                "price": Decimal("42000"),
                "old_price": Decimal("57000"),
                "stock": 14,
            },
            {
                "name": "Signature Hoodie",
                "description": "Sweat chaud, confortable et parfait pour un look moderne.",
                "price": Decimal("18000"),
                "old_price": Decimal("25000"),
                "stock": 28,
            },
            {
                "name": "Travel Essential Backpack",
                "description": "Sac pratique avec compartiments organiser et design premium.",
                "price": Decimal("31000"),
                "old_price": Decimal("39000"),
                "stock": 17,
            },
        ]

        url_index = 0
        for vendor_payload in vendors:
            seller = User.objects.get(username=vendor_payload["username"], user_type="vendeur")
            for template in product_templates:
                product_name = f"{seller.username.title()} - {template['name']}"
                product, created = Product.objects.get_or_create(
                    vendor=seller,
                    name=product_name,
                    defaults={
                        "category": category,
                        "description": template["description"],
                        "price": template["price"],
                        "old_price": template["old_price"],
                        "stock": template["stock"],
                        "image": cloudinary_urls[url_index % len(cloudinary_urls)],
                        "is_active": True,
                        "is_featured": (template["name"] == product_templates[0]["name"]),
                    },
                )

                if created:
                    for j in range(0, min(2, len(cloudinary_urls) - 1)):
                        ProductImage.objects.create(
                            product=product,
                            image=cloudinary_urls[(url_index + j + 1) % len(cloudinary_urls)],
                            alt_text=f"{product.name} image {j + 1}",
                        )
                    self.stdout.write(self.style.SUCCESS(f"Created product: {product.name}"))
                else:
                    self.stdout.write(f"Product already exists: {product.name}")

                url_index += 1

        self.stdout.write(self.style.SUCCESS("Seed complete: 3 vendors and the product catalog is in sync with Cloudinary data."))
