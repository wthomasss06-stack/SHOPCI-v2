# ecommerce_backend/orders/views.py

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from decimal import Decimal
import math

from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderCreateSerializer
from cart.models import Cart
from products.models import Product


# ─────────────────────────────────────────────────────────────────────────────
# UTILITAIRE
# ─────────────────────────────────────────────────────────────────────────────
def haversine_minutes(lat1, lon1, lat2, lon2, speed_kmh=30):
    """Estime le temps en minutes entre deux coordonnées GPS (vitesse ~30 km/h)"""
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi    = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a  = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    km = R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return max(1, int((km / speed_kmh) * 60))


# ─────────────────────────────────────────────────────────────────────────────
# 1. LISTE & CRÉATION — GET/POST /api/orders/
# ─────────────────────────────────────────────────────────────────────────────
class OrderListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return OrderCreateSerializer if self.request.method == 'POST' else OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'user_type') and user.user_type == 'vendeur':
            return Order.objects.filter(
                items__product__vendor=user
            ).distinct().order_by('-created_at')
        return Order.objects.filter(buyer=user).order_by('-created_at')

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        user = request.user

        try:
            cart = Cart.objects.select_for_update().get(user=user)
        except Cart.DoesNotExist:
            return Response({'error': 'Panier vide ou introuvable'}, status=400)

        if not cart.items.exists():
            return Response({'error': 'Panier vide'}, status=400)

        # Vérification stock
        stock_errors = []
        for cart_item in cart.items.select_related('product'):
            product = Product.objects.select_for_update().get(id=cart_item.product.id)
            if product.stock < cart_item.quantity:
                stock_errors.append({
                    'product':   product.name,
                    'requested': cart_item.quantity,
                    'available': product.stock,
                })
        if stock_errors:
            return Response(
                {'error': 'Stock insuffisant pour certains produits', 'details': stock_errors},
                status=400
            )

        # Créer commande (total initialisé à 0)
        order = Order.objects.create(
            buyer=user,
            status='pending',
            delivery_address=request.data.get('delivery_address', ''),
            phone=request.data.get('phone', getattr(user, 'phone', '')),
            total_amount=Decimal('0'),
        )

        total_amount = Decimal('0')
        for cart_item in cart.items.select_related('product'):
            product = Product.objects.select_for_update().get(id=cart_item.product.id)

            OrderItem.objects.create(
                order=order, product=product,
                quantity=cart_item.quantity, price=product.price,
            )
            product.stock = F('stock') - cart_item.quantity
            product.save(update_fields=['stock'])
            product.refresh_from_db()
            product.sold_count = F('sold_count') + cart_item.quantity
            product.save(update_fields=['sold_count'])

            total_amount += Decimal(str(product.price)) * Decimal(str(cart_item.quantity))

        order.total_amount = total_amount
        order.save(update_fields=['total_amount'])
        cart.items.all().delete()

        serializer = OrderSerializer(order, context={'request': request})
        return Response(
            {'message': 'Commande créée avec succès', 'order': serializer.data},
            status=status.HTTP_201_CREATED
        )


# ─────────────────────────────────────────────────────────────────────────────
# 2. DÉTAIL & MISE À JOUR STATUT — GET/PATCH /api/orders/<pk>/
# ─────────────────────────────────────────────────────────────────────────────
# Qui a le droit de mettre quel statut sur une commande, via CET endpoint.
# 'delivered' n'est volontairement JAMAIS atteignable ici : ça doit passer par
# VendorConfirmArrivalView -> BuyerConfirmDeliveryView, pas par un PATCH libre
# (sinon un acheteur pouvait se marquer "livré" avant réception réelle).
BUYER_ALLOWED_TRANSITIONS  = {'cancelled'}
VENDOR_ALLOWED_TRANSITIONS = {'processing', 'shipped', 'cancelled'}


def allowed_status_transitions(user, order):
    """Ensemble des statuts que `user` peut appliquer à `order` sur cet endpoint."""
    if order.buyer_id == user.id:
        return BUYER_ALLOWED_TRANSITIONS
    if order.items.filter(product__vendor=user).exists():
        return VENDOR_ALLOWED_TRANSITIONS
    return set()


class OrderDetailView(generics.RetrieveUpdateAPIView):
    serializer_class   = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'user_type') and user.user_type == 'vendeur':
            return Order.objects.filter(items__product__vendor=user).distinct()
        return Order.objects.filter(buyer=user)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        order      = self.get_object()
        new_status = request.data.get('status')

        if not new_status:
            return Response({'error': 'Le statut est requis'}, status=400)

        valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Statut invalide. Choix : {", ".join(valid_statuses)}'},
                status=400
            )

        if new_status not in allowed_status_transitions(request.user, order):
            return Response(
                {'error': "Vous n'êtes pas autorisé à appliquer ce statut à cette commande."},
                status=403
            )

        # Annulation → remettre le stock
        if new_status == 'cancelled' and order.status != 'cancelled':
            for item in order.items.select_related('product'):
                if item.product:
                    product = Product.objects.select_for_update().get(id=item.product.id)
                    product.stock      = F('stock') + item.quantity
                    product.sold_count = F('sold_count') - item.quantity
                    product.save(update_fields=['stock', 'sold_count'])

        order.status = new_status
        order.save()
        return Response(OrderSerializer(order, context={'request': request}).data)


# ─────────────────────────────────────────────────────────────────────────────
# 3. COMMANDES VENDEUR — GET /api/orders/vendor/
# ─────────────────────────────────────────────────────────────────────────────
class VendorOrdersView(generics.ListAPIView):
    serializer_class   = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, 'user_type') or user.user_type != 'vendeur':
            return Order.objects.none()
        return Order.objects.filter(
            items__product__vendor=user
        ).distinct().order_by('-created_at')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


# ─────────────────────────────────────────────────────────────────────────────
# 4. POSITION GPS LIVREUR — PATCH /api/orders/<pk>/location/
# ─────────────────────────────────────────────────────────────────────────────
class VendorLocationUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk, items__product__vendor=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Commande introuvable'}, status=404)

        lat = request.data.get('lat')
        lng = request.data.get('lng')
        if lat is None or lng is None:
            return Response({'error': 'lat et lng sont requis'}, status=400)

        order.vendor_lat              = float(lat)
        order.vendor_lng              = float(lng)
        order.vendor_location_updated = timezone.now()
        order.save(update_fields=['vendor_lat', 'vendor_lng', 'vendor_location_updated'])

        return Response({'ok': True, 'vendor_location': order.vendor_location})


# ─────────────────────────────────────────────────────────────────────────────
# 5. PHOTO DU COLIS — PATCH /api/orders/<pk>/package-photo/
# ─────────────────────────────────────────────────────────────────────────────
class PackagePhotoView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk, items__product__vendor=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Commande introuvable'}, status=404)

        photo = request.FILES.get('package_photo')
        if not photo:
            return Response({'error': 'Aucune photo fournie'}, status=400)

        order.package_photo = photo
        order.save(update_fields=['package_photo'])

        return Response({
            'ok': True,
            'package_photo_url': request.build_absolute_uri(order.package_photo.url)
        })


# ─────────────────────────────────────────────────────────────────────────────
# 6. VENDEUR CONFIRME ARRIVÉE — POST /api/orders/<pk>/vendor-confirm-arrival/
# ─────────────────────────────────────────────────────────────────────────────
class VendorConfirmArrivalView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk, items__product__vendor=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Commande introuvable'}, status=404)

        order.delivery_confirmed_by_vendor = True
        order.save(update_fields=['delivery_confirmed_by_vendor'])

        # TODO : envoyer notification push / e-mail à l'acheteur
        return Response({'ok': True, 'message': 'Acheteur notifié'})


# ─────────────────────────────────────────────────────────────────────────────
# 7. ACHETEUR CONFIRME RÉCEPTION — POST /api/orders/<pk>/buyer-confirm-delivery/
# ─────────────────────────────────────────────────────────────────────────────
class BuyerConfirmDeliveryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk, buyer=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Commande introuvable'}, status=404)

        if order.status == 'delivered':
            return Response({'error': 'Commande déjà livrée'}, status=400)

        rating = request.data.get('rating')
        if rating:
            try:
                r = int(rating)
                if 1 <= r <= 5:
                    order.delivery_rating = r
            except (ValueError, TypeError):
                pass

        order.mark_as_delivered()
        return Response({'ok': True, 'status': 'delivered'})