# ecommerce_backend/cart/views.py
# VERSION CORRIGÉE - Sans is_active

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Sum
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer, AddToCartSerializer
from products.models import Product


class CartView(APIView):
    """
    Récupère le panier de l'utilisateur
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # ✅ CORRECTION: Enlever is_active
        cart, created = Cart.objects.get_or_create(
            user=request.user
        )
        
        # Nettoyer les items avec stock insuffisant
        for item in cart.items.all():
            product = item.product
            product.refresh_from_db()
            
            if product.stock <= 0:
                item.delete()
                continue
            
            if item.quantity > product.stock:
                item.quantity = product.stock
                item.save()
        
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class AddToCartView(APIView):
    """
    Ajoute un produit au panier avec validation stock stricte
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        product_id = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']
        
        # Verrouiller le produit
        try:
            product = Product.objects.select_for_update().get(
                id=product_id,
                is_active=True
            )
        except Product.DoesNotExist:
            return Response(
                {'error': 'Produit introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # ✅ CORRECTION: Calculer stock réservé SANS is_active
        reserved_in_all_carts = CartItem.objects.filter(
            product=product
        ).aggregate(total=Sum('quantity'))['total'] or 0
        
        available_stock = product.stock - reserved_in_all_carts
        
        # ✅ CORRECTION: Enlever is_active
        cart, _ = Cart.objects.get_or_create(
            user=request.user
        )
        
        cart_item = CartItem.objects.filter(
            cart=cart,
            product=product
        ).first()
        
        if cart_item:
            new_quantity = cart_item.quantity + quantity
            
            if new_quantity > available_stock:
                return Response({
                    'error': f'Stock insuffisant ! Seulement {available_stock} unité(s) disponible(s).',
                    'available_stock': available_stock,
                    'current_in_cart': cart_item.quantity,
                    'requested': quantity
                }, status=status.HTTP_400_BAD_REQUEST)
            
            cart_item.quantity = new_quantity
            cart_item.save()
        else:
            if quantity > available_stock:
                return Response({
                    'error': f'Stock insuffisant ! Seulement {available_stock} unité(s) disponible(s).',
                    'available_stock': available_stock
                }, status=status.HTTP_400_BAD_REQUEST)
            
            cart_item = CartItem.objects.create(
                cart=cart,
                product=product,
                quantity=quantity
            )
        
        cart_serializer = CartSerializer(cart)
        return Response(
            {
                'message': 'Produit ajouté au panier',
                'cart': cart_serializer.data
            },
            status=status.HTTP_200_OK
        )


class CartItemUpdateView(generics.UpdateAPIView):
    """
    Met à jour la quantité avec validation stock
    """
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(cart__user=self.request.user)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        quantity = request.data.get('quantity')
        
        if quantity is None:
            return Response(
                {'error': 'La quantité est requise'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        quantity = int(quantity)
        
        if quantity <= 0:
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        
        product = Product.objects.select_for_update().get(id=instance.product.id)
        
        # ✅ CORRECTION: Stock réservé SANS is_active
        reserved_in_other_carts = CartItem.objects.filter(
            product=product
        ).exclude(
            id=instance.id
        ).aggregate(total=Sum('quantity'))['total'] or 0
        
        available_stock = product.stock - reserved_in_other_carts
        
        if quantity > available_stock:
            return Response({
                'error': f'Stock insuffisant ! Seulement {available_stock} unité(s) disponible(s).',
                'available_stock': available_stock
            }, status=status.HTTP_400_BAD_REQUEST)
        
        instance.quantity = quantity
        instance.save()
        
        serializer = CartSerializer(instance.cart)
        return Response(serializer.data)


class CartItemDeleteView(generics.DestroyAPIView):
    """Supprime un item du panier"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(cart__user=self.request.user)


class ClearCartView(APIView):
    """Vide le panier"""
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        try:
            cart = Cart.objects.get(user=request.user)
            cart.items.all().delete()
            return Response({'message': 'Panier vidé avec succès'})
        except Cart.DoesNotExist:
            return Response({'message': 'Panier déjà vide'})