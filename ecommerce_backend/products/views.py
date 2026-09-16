# ecommerce_backend/products/views.py
# VERSION CORRIGÉE - Sans cart__is_active

from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import F, Sum
from django.db import models
from .models import Product, Category, Favorite
from .serializers import (
    ProductSerializer, ProductCreateSerializer, 
    CategorySerializer, FavoriteSerializer
)


class ProductListCreateView(generics.ListCreateAPIView):
    queryset = (
        Product.objects.filter(is_active=True)
        .select_related('vendor', 'category')
        .prefetch_related('images')
    )
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        return ProductCreateSerializer if self.request.method == 'POST' else ProductSerializer

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method == 'POST' else [AllowAny()]

    def perform_create(self, serializer):
        serializer.save(vendor=self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = (
        Product.objects.all()
        .select_related('vendor', 'category')
        .prefetch_related('images')
    )
    serializer_class = ProductSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method in ['PUT', 'PATCH', 'DELETE'] else [AllowAny()]

    def get_serializer_class(self):
        return ProductCreateSerializer if self.request.method in ['PUT', 'PATCH'] else ProductSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.refresh_from_db()
        
        serializer = self.get_serializer(instance)
        data = serializer.data

        # ✅ CORRECTION: Stock réservé SANS cart__is_active
        from cart.models import CartItem
        
        reserved_stock = CartItem.objects.filter(
            product=instance
        ).aggregate(
            total_reserved=models.Sum('quantity')
        )['total_reserved'] or 0
        
        available_stock = max(0, instance.stock - reserved_stock)
        
        data['stock'] = instance.stock
        data['available_stock'] = available_stock
        data['reserved_stock'] = reserved_stock
        
        vendor = instance.vendor
        if vendor:
            data.setdefault('vendor_name', vendor.username)
            data.setdefault('vendor_email', vendor.email)
            data.setdefault('vendor_phone', getattr(vendor, 'phone', None))

            if not data.get('vendor_profile_photo') and getattr(vendor, 'profile_photo', None):
                try:
                    data['vendor_profile_photo'] = request.build_absolute_uri(vendor.profile_photo.url)
                except:
                    data['vendor_profile_photo'] = None

        return Response(data)

    def update(self, request, *args, **kwargs):
        product = self.get_object()

        if product.vendor != request.user:
            return Response(
                {'error': 'Vous ne pouvez modifier que vos propres produits'},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()

        if product.vendor != request.user:
            return Response(
                {'error': 'Vous ne pouvez supprimer que vos propres produits'},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().destroy(request, *args, **kwargs)


class VendorProductsView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'stock', 'created_at', 'name']

    def get_queryset(self):
        return (
            Product.objects.filter(vendor=self.request.user)
            .select_related('category')
            .prefetch_related('images')
            .order_by('-created_at')
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        # ✅ CORRECTION: Stock réservé SANS is_active
        from cart.models import CartItem
        
        for item in data:
            product_id = item['id']
            
            reserved = CartItem.objects.filter(
                product_id=product_id
            ).aggregate(total=Sum('quantity'))['total'] or 0
            
            item['reserved_stock'] = reserved
            item['available_stock'] = max(0, item['stock'] - reserved)
        
        return Response(data)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class FavoriteToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        
        if not product_id:
            return Response(
                {'error': 'product_id requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Produit introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )

        favorite = Favorite.objects.filter(
            user=request.user,
            product=product
        ).first()

        if favorite:
            favorite.delete()
            return Response({
                'message': 'Produit retiré des favoris',
                'is_favorite': False
            })
        else:
            Favorite.objects.create(
                user=request.user,
                product=product
            )
            return Response({
                'message': 'Produit ajouté aux favoris',
                'is_favorite': True
            }, status=status.HTTP_201_CREATED)


class FavoriteListView(generics.ListAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(
            user=self.request.user
        ).select_related('product__vendor', 'product__category')


class FavoriteCheckView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        product_id = request.query_params.get('product_id')
        
        if not product_id:
            return Response({'is_favorite': False})

        is_favorite = Favorite.objects.filter(
            user=request.user,
            product_id=product_id
        ).exists()

        return Response({'is_favorite': is_favorite})