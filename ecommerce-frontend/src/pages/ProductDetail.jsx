'use client';

// ecommerce-frontend/src/pages/ProductDetail.jsx
// ✅ Thème harmonisé ShopCI — Orange & Blanc — même UX que HomePage

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ShoppingCart, Heart, Plus, Minus, Star, Shield, Truck,
  Mail, Phone, Award, ArrowLeft, Home, AlertCircle,
  ChevronLeft, ChevronRight, ZoomIn, Package, Clock, RefreshCw,
  CheckCircle2, MessageSquare, Tag, Flame
} from 'lucide-react';
import { productsAPI, cartAPI, authAPI } from '../services/api';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Loader from '../components/Loader';

const API_URL = 'http://localhost:8000/api';

const favoritesAPI = {
  checkFavorite: async (productId) => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    try {
      const r = await axios.get(`${API_URL}/products/favorites/check/`, {
        params: { product_id: productId },
        headers: { Authorization: `Bearer ${token}` }
      });
      return r.data.is_favorite;
    } catch { return false; }
  },
  toggleFavorite: async (productId) => {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Non authentifié');
    const r = await axios.post(
      `${API_URL}/products/favorites/toggle/`,
      { product_id: productId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return r.data;
  }
};

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product,        setProduct]        = useState(null);
  const [quantity,       setQuantity]       = useState(1);
  const [selectedImage,  setSelectedImage]  = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [isFavorite,     setIsFavorite]     = useState(false);
  const [cartQuantity,   setCartQuantity]   = useState(0);
  const [availableStock, setAvailableStock] = useState(0);
  const [addingToCart,   setAddingToCart]   = useState(false);
  const [imageZoom,      setImageZoom]      = useState(false);
  const [notification,   setNotification]   = useState(null);

  const showNotif = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadProduct = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productsAPI.getProduct(id);
      setProduct(data || null);
      setAvailableStock(data?.available_stock ?? data?.stock ?? 0);
    } catch { showNotif('Produit introuvable', 'error'); }
    finally { setLoading(false); }
  }, [id]);

  const loadCartQuantity = useCallback(async () => {
    if (!authAPI.isAuthenticated()) return;
    try {
      const cart = await cartAPI.getCart();
      const item = cart.items?.find(i => i.product.id === parseInt(id));
      setCartQuantity(item?.quantity || 0);
    } catch {}
  }, [id]);

  const checkFavorite = useCallback(async () => {
    if (!authAPI.isAuthenticated()) { setIsFavorite(false); return; }
    try { setIsFavorite(await favoritesAPI.checkFavorite(id)); } catch { setIsFavorite(false); }
  }, [id]);

  useEffect(() => {
    loadProduct();
    loadCartQuantity();
    checkFavorite();
  }, [id, checkFavorite, loadCartQuantity, loadProduct]);

  const toggleFavorite = async () => {
    if (!authAPI.isAuthenticated()) { router.push('/login'); return; }
    try {
      const r = await favoritesAPI.toggleFavorite(product.id);
      setIsFavorite(r.is_favorite);
      showNotif(r.is_favorite ? '❤️ Ajouté aux favoris' : 'Retiré des favoris');
    } catch { showNotif('Erreur favoris', 'error'); }
  };

  const addToCart = async () => {
    if (!authAPI.isAuthenticated()) { router.push('/login'); return; }
    if (quantity > availableStock) { showNotif(`Stock insuffisant ! Maximum: ${availableStock}`, 'error'); return; }
    setAddingToCart(true);
    try {
      await cartAPI.addToCart(product.id, quantity);
      await loadProduct();
      await loadCartQuantity();
      setQuantity(1);
      showNotif(`✓ ${quantity} × ${product.name} ajouté au panier !`);
    } catch (err) {
      showNotif(err.response?.data?.error || "Erreur lors de l'ajout", 'error');
      await loadProduct();
    } finally { setAddingToCart(false); }
  };

  const handleQty = (n) => {
    if (n > availableStock) { showNotif(`Maximum: ${availableStock}`, 'error'); setQuantity(Math.max(1, availableStock)); return; }
    setQuantity(Math.max(1, n));
  };

  const getImageUrl = (p) => {
    if (!p) return 'https://placehold.co/600x600/fff7ed/f97316?text=ShopCI';
    if (p.startsWith('http')) return p;
    return `http://localhost:8000${p.startsWith('/') ? p : '/' + p}`;
  };

  /* ── Loader ── */
  if (loading) return <Loader message="Chargement du produit…" />;

  /* ── 404 ── */
  if (!product) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ background:'var(--card)', borderRadius:'20px', border:'1px solid var(--border)', padding:'64px 40px', textAlign:'center', maxWidth:'420px', boxShadow:'0 8px 32px rgba(0,0,0,.08)' }}>
        <div style={{ width:'80px', height:'80px', background:'rgba(220,38,38,.12)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <AlertCircle size={36} style={{ color:'#ef4444' }}/>
        </div>
        <h2 style={{ fontSize:'22px', fontWeight:'800', color:'var(--text)', marginBottom:'8px' }}>Produit introuvable</h2>
        <p style={{ fontSize:'14px', color:'var(--text3)', marginBottom:'24px' }}>L'article que vous recherchez n'est pas disponible.</p>
        <button onClick={() => router.push('/')} style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#f97316', color:'#fff', border:'none', borderRadius:'12px', padding:'12px 28px', fontSize:'14px', fontWeight:'700', cursor:'pointer' }}>
          <Home size={16}/> Retour à l'accueil
        </button>
      </div>
    </div>
  );

  const images = Array.isArray(product.images) && product.images.length > 0
    ? [product.image, ...product.images.filter(i => i?.image).map(i => i.image)]
    : product.image ? [product.image] : [];

  const isOutOfStock = availableStock <= 0;
  const isLowStock   = availableStock > 0 && availableStock <= 5;

  return (
    <div style={{ fontFamily:"'DM Sans','Inter',sans-serif", background:'var(--bg)', minHeight:'100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        /* ── TOAST ── */
        .pd-toast { position:fixed; top:80px; right:20px; z-index:999; padding:14px 18px; border-radius:12px; display:flex; align-items:center; gap:10px; font-size:14px; font-weight:600; box-shadow:0 8px 24px rgba(0,0,0,.14); animation:pd-slide .3s ease-out; max-width:380px; }
        .pd-toast.success { background:rgba(22,163,74,.12); border:1.5px solid rgba(22,163,74,.3); color:#4ade80; }
        .pd-toast.error   { background:rgba(220,38,38,.12); border:1.5px solid rgba(220,38,38,.3); color:#f87171; }
        @keyframes pd-slide { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }

        /* ── MAIN ── */
        .pd-main { max-width:1280px; margin:28px auto; padding:0 20px; }

        /* ── VENDOR CARD ── */
        .pd-vendor-card {
          background:var(--card); border-radius:16px; border:1px solid var(--border);
          padding:16px 20px; margin-bottom:20px;
          display:flex; align-items:center; justify-content:space-between;
          gap:16px; flex-wrap:nowrap;
        }
        .pd-vendor-left { display:flex; align-items:center; gap:12px; flex:1; min-width:0; }
        .pd-vendor-avatar { width:48px; height:48px; border-radius:50%; object-fit:cover; border:2px solid rgba(249,115,22,.3); flex-shrink:0; }
        .pd-vendor-avatar-ini { width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg,#f97316,#fb923c); display:flex; align-items:center; justify-content:center; color:#fff; font-size:20px; font-weight:800; flex-shrink:0; }
        .pd-vendor-badge { display:inline-flex; align-items:center; gap:4px; background:rgba(249,115,22,.12); border:1px solid rgba(249,115,22,.3); color:#f97316; border-radius:999px; padding:2px 8px; font-size:10px; font-weight:700; margin-bottom:3px; }
        .pd-vendor-name { font-size:14px; font-weight:800; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .pd-vendor-email { font-size:12px; color:var(--text3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        /* ── BOUTONS VENDEUR — TOUJOURS SUR UNE LIGNE ── */
        .pd-vendor-actions {
          display:flex;
          flex-direction:row;
          gap:6px;
          flex-wrap:nowrap;
          flex-shrink:0;
        }
        .pd-vendor-btn {
          display:inline-flex; align-items:center; gap:5px;
          padding:8px 12px; border-radius:10px; font-size:12px; font-weight:600;
          cursor:pointer; border:1.5px solid; transition:all .18s; text-decoration:none;
          white-space:nowrap; flex-shrink:0;
        }
        .pd-vendor-btn.mail  { background:rgba(249,115,22,.12); border-color:rgba(249,115,22,.3); color:#f97316; }
        .pd-vendor-btn.mail:hover  { background:rgba(249,115,22,.2); }
        .pd-vendor-btn.wa    { background:rgba(22,163,74,.12); border-color:rgba(22,163,74,.3); color:#4ade80; }
        .pd-vendor-btn.wa:hover    { background:rgba(22,163,74,.2); }
        .pd-vendor-btn.call  { background:rgba(37,99,235,.12); border-color:rgba(37,99,235,.3); color:#60a5fa; }
        .pd-vendor-btn.call:hover  { background:rgba(37,99,235,.2); }

        /* ── GRID ── */
        .pd-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; background:var(--card); border-radius:16px; border:1px solid var(--border); overflow:hidden; }

        /* ── IMAGE COL ── */
        .pd-img-col { padding:32px; border-right:1px solid var(--border); display:flex; flex-direction:column; }
        .pd-img-main-wrap { position:relative; flex:1; display:flex; align-items:center; justify-content:center; margin-bottom:16px; overflow:hidden; border-radius:12px; background:var(--bg3); min-height:320px; }
        .pd-img-main { max-width:100%; max-height:420px; object-fit:contain; transition:transform .3s; cursor:zoom-in; border-radius:8px; }
        .pd-img-main.zoomed { transform:scale(1.4); cursor:zoom-out; }
        .pd-zoom-btn { position:absolute; top:12px; right:12px; background:var(--card); border:1px solid var(--border); border-radius:8px; padding:6px; cursor:pointer; opacity:0; transition:opacity .2s; color:var(--text2); display:flex; align-items:center; }
        .pd-img-main-wrap:hover .pd-zoom-btn { opacity:1; }
        .pd-nav-btn { position:absolute; top:50%; transform:translateY(-50%); background:var(--card); border:1px solid var(--border); border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--text2); transition:all .18s; opacity:0; }
        .pd-img-main-wrap:hover .pd-nav-btn { opacity:1; }
        .pd-nav-btn:hover { background:var(--bg2); border-color:#f97316; color:#f97316; }
        .pd-nav-btn.left  { left:12px; }
        .pd-nav-btn.right { right:12px; }
        .pd-thumbs { display:flex; justify-content:center; gap:8px; flex-wrap:wrap; }
        .pd-thumb { width:64px; height:64px; border-radius:9px; overflow:hidden; border:2px solid transparent; cursor:pointer; transition:all .18s; opacity:.6; }
        .pd-thumb:hover { opacity:.9; }
        .pd-thumb.active { border-color:#f97316; opacity:1; box-shadow:0 0 0 2px rgba(249,115,22,.25); }
        .pd-thumb img { width:100%; height:100%; object-fit:cover; }
        .pd-img-counter { text-align:center; font-size:12px; color:var(--text3); margin-bottom:10px; }

        /* ── DETAIL COL ── */
        .pd-detail-col { padding:32px; display:flex; flex-direction:column; overflow-y:auto; }
        .pd-cat-tag { display:inline-flex; align-items:center; gap:5px; background:rgba(249,115,22,.12); border:1px solid rgba(249,115,22,.3); color:#f97316; border-radius:999px; padding:4px 12px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; margin-bottom:12px; }
        .pd-name { font-size:clamp(20px,2.5vw,28px); font-weight:800; color:var(--text); line-height:1.2; margin-bottom:12px; letter-spacing:-.5px; }
        .pd-stars { display:flex; align-items:center; gap:8px; margin-bottom:16px; }
        .pd-desc { font-size:14px; color:var(--text2); line-height:1.7; margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid var(--border); max-height:120px; overflow-y:auto; }

        /* ── STATUS BADGES ── */
        .pd-badges { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid var(--border); }
        .pd-badge { display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:999px; font-size:12.5px; font-weight:600; border:1.5px solid; }
        .pd-badge.stock-ok     { background:rgba(22,163,74,.12); border-color:rgba(22,163,74,.3); color:#4ade80; }
        .pd-badge.stock-low    { background:rgba(245,158,11,.12); border-color:rgba(245,158,11,.3); color:#fbbf24; }
        .pd-badge.stock-out    { background:rgba(220,38,38,.12); border-color:rgba(220,38,38,.3); color:#f87171; }
        .pd-badge.in-cart      { background:rgba(37,99,235,.12); border-color:rgba(37,99,235,.3); color:#60a5fa; }
        .pd-badge.delivery     { background:rgba(168,85,247,.12); border-color:rgba(168,85,247,.3); color:#c084fc; }

        /* ── ALERTE STOCK FAIBLE ── */
        .pd-low-stock-alert { display:flex; gap:10px; align-items:flex-start; background:rgba(245,158,11,.1); border:1px solid rgba(245,158,11,.3); border-radius:10px; padding:12px 14px; margin-bottom:16px; }
        .pd-low-stock-alert svg { color:#d97706; flex-shrink:0; margin-top:1px; }
        .pd-low-stock-alert p { font-size:13px; color:#fbbf24; }

        /* ── PRIX ── */
        .pd-prix-wrap { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; margin-bottom:20px; }
        .pd-prix { font-size:clamp(26px,3vw,36px); font-weight:800; color:#f97316; letter-spacing:-.5px; }
        .pd-prix-old { font-size:18px; color:var(--text3); text-decoration:line-through; font-weight:500; }
        .pd-promo-badge { background:rgba(220,38,38,.12); border:1px solid rgba(220,38,38,.3); color:#f87171; border-radius:999px; padding:4px 10px; font-size:12px; font-weight:700; }

        /* ── QTY ── */
        .pd-qty-section { margin-bottom:20px; }
        .pd-qty-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
        .pd-qty-label { font-size:13px; font-weight:700; color:var(--text); }
        .pd-qty-max   { font-size:13px; color:#f97316; font-weight:600; }
        .pd-qty-ctrl  { display:flex; align-items:center; gap:12px; }
        .pd-qty-box   { display:flex; align-items:center; border:1.5px solid var(--border); border-radius:10px; overflow:hidden; background:var(--bg3); }
        .pd-qty-btn   { width:40px; height:40px; border:none; background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--text2); transition:all .15s; font-size:16px; }
        .pd-qty-btn:hover:not(:disabled) { background:rgba(249,115,22,.12); color:#f97316; }
        .pd-qty-btn:disabled { opacity:.35; cursor:not-allowed; }
        .pd-qty-val   { width:48px; text-align:center; font-size:16px; font-weight:800; color:var(--text); border:none; background:transparent; outline:none; font-family:'DM Sans',sans-serif; }
        .pd-qty-total { font-size:14px; color:var(--text2); }
        .pd-qty-total span { color:#f97316; font-weight:800; font-size:16px; }

        /* ── BOUTONS PANIER ── */
        .pd-btn-add { flex:1; display:flex; align-items:center; justify-content:center; gap:8px; background:#f97316; color:#fff; border:none; border-radius:12px; padding:14px; font-size:15px; font-weight:700; cursor:pointer; transition:background .2s,transform .15s; box-shadow:0 4px 16px rgba(249,115,22,.3); }
        .pd-btn-add:hover:not(:disabled) { background:#ea6a0a; transform:translateY(-1px); }
        .pd-btn-add:disabled { opacity:.5; cursor:not-allowed; transform:none; }
        .pd-btn-fav { width:52px; height:52px; border-radius:12px; border:1.5px solid var(--border); background:var(--card); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .18s; flex-shrink:0; }
        .pd-btn-fav:hover { border-color:rgba(220,38,38,.3); background:rgba(220,38,38,.1); }
        .pd-btn-fav.active { border-color:rgba(220,38,38,.4); background:rgba(220,38,38,.1); }
        .pd-btn-fav svg { color:var(--text3); transition:color .18s; }
        .pd-btn-fav:hover svg, .pd-btn-fav.active svg { color:#ef4444; }
        .pd-btn-fav.active svg { fill:#ef4444; }

        /* ── GARANTIES ── */
        .pd-garanties { display:flex; flex-direction:column; gap:8px; margin-top:20px; }
        .pd-garantie  { display:flex; align-items:center; gap:12px; background:var(--bg3); border:1px solid var(--border); border-radius:10px; padding:12px 14px; transition:background .15s; }
        .pd-garantie:hover { background:rgba(249,115,22,.1); }
        .pd-garantie-ico { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .pd-garantie-title { font-size:13.5px; font-weight:700; color:var(--text); }
        .pd-garantie-desc  { font-size:12px; color:var(--text3); }

        /* ── RESPONSIVE ── */
        @media (max-width:900px) {
          .pd-grid { grid-template-columns:1fr; }
          .pd-img-col { border-right:none; border-bottom:1px solid var(--border); padding:20px; }
          .pd-detail-col { padding:20px; }
        }

        /* ── MOBILE : vendor card en colonne mais boutons toujours en ligne ── */
        @media (max-width:600px) {
          .pd-vendor-card {
            flex-direction:column;
            align-items:flex-start;
            gap:12px;
          }
          .pd-vendor-left { width:100%; }
          .pd-vendor-actions {
            width:100%;
            flex-direction:row;
            flex-wrap:nowrap;
            gap:6px;
          }
          .pd-vendor-btn {
            flex:1;
            justify-content:center;
            padding:9px 6px;
            font-size:11.5px;
            gap:4px;
          }
        }
      `}</style>

      {/* ── TOAST ── */}
      {notification && (
        <div className={`pd-toast ${notification.type}`}>
          {notification.type === 'success'
            ? <CheckCircle2 size={18}/>
            : <AlertCircle size={18}/>}
          {notification.message}
        </div>
      )}

      {/* ── HEADER ── */}
      <Navbar pageCourante="/shop" />

      <main className="pd-main">

        {/* ── VENDEUR ── */}
        {(product.vendor_email || product.vendor_phone || product.vendor_name) && (
          <div className="pd-vendor-card">
            <div className="pd-vendor-left">
              {product.vendor_profile_photo ? (
                <img src={getImageUrl(product.vendor_profile_photo)} alt={product.vendor_name} className="pd-vendor-avatar"/>
              ) : (
                <div className="pd-vendor-avatar-ini">{(product.vendor_name || 'V')[0].toUpperCase()}</div>
              )}
              <div style={{ minWidth:0 }}>
                <div className="pd-vendor-badge"><Award size={11}/> Vendeur certifié</div>
                <div className="pd-vendor-name">{product.vendor_name || 'Vendeur ShopCI'}</div>
                {product.vendor_email && (
                  <div className="pd-vendor-email">{product.vendor_email}</div>
                )}
              </div>
            </div>
            <div className="pd-vendor-actions">
              {product.vendor_email && (
                <a href={`mailto:${product.vendor_email}`} className="pd-vendor-btn mail">
                  <Mail size={14}/> Email
                </a>
              )}
              {product.vendor_phone && (
                <>
                  <button
                    className="pd-vendor-btn wa"
                    onClick={() => window.open(`https://wa.me/${product.vendor_phone.replace(/[^0-9]/g,'')}`, '_blank')}>
                    <MessageSquare size={14}/> WhatsApp
                  </button>
                  <a href={`tel:${product.vendor_phone}`} className="pd-vendor-btn call">
                    <Phone size={14}/> Appeler
                  </a>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── GRILLE ── */}
        <div className="pd-grid">

          {/* Col images */}
          <div className="pd-img-col">
            <div className="pd-img-main-wrap">
              <img
                src={getImageUrl(images[selectedImage] || product.image)}
                alt={product.name}
                className={`pd-img-main${imageZoom ? ' zoomed' : ''}`}
                onClick={() => setImageZoom(!imageZoom)}
                onError={e => { e.target.src='https://placehold.co/600x600/fff7ed/f97316?text=ShopCI'; }}
              />
              <button className="pd-zoom-btn" onClick={() => setImageZoom(!imageZoom)}>
                <ZoomIn size={18}/>
              </button>
              {images.length > 1 && (
                <>
                  <button className="pd-nav-btn left" onClick={() => setSelectedImage((selectedImage - 1 + images.length) % images.length)}><ChevronLeft size={18}/></button>
                  <button className="pd-nav-btn right" onClick={() => setSelectedImage((selectedImage + 1) % images.length)}><ChevronRight size={18}/></button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <>
                <div className="pd-img-counter">{selectedImage + 1} / {images.length}</div>
                <div className="pd-thumbs">
                  {images.map((img, i) => (
                    <button key={i} className={`pd-thumb${selectedImage === i ? ' active' : ''}`} onClick={() => setSelectedImage(i)}>
                      <img src={getImageUrl(img)} alt={`Vue ${i+1}`} onError={e => { e.target.src='https://placehold.co/64x64/fff7ed/f97316'; }}/>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Col détails */}
          <div className="pd-detail-col">

            <div className="pd-cat-tag"><Tag size={12}/> {product.category_name || 'Produit'}</div>
            <h1 className="pd-name">{product.name}</h1>

            {/* Étoiles */}
            <div className="pd-stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} style={{ color: i < 4 ? '#f59e0b' : 'var(--border)', fill: i < 4 ? '#f59e0b' : 'none' }}/>
              ))}
              <span style={{ fontSize:'13px', color:'var(--text3)' }}>4.8 / 5 — 120 avis</span>
            </div>

            {/* Description */}
            <p className="pd-desc">{product.description}</p>

            {/* Status badges */}
            <div className="pd-badges">
              <span className={`pd-badge ${isOutOfStock ? 'stock-out' : isLowStock ? 'stock-low' : 'stock-ok'}`}>
                <span style={{ width:'7px', height:'7px', borderRadius:'50%', background: isOutOfStock ? '#ef4444' : isLowStock ? '#f59e0b' : '#22c55e', display:'inline-block' }}/>
                {isOutOfStock ? 'Rupture de stock' : `${availableStock} disponible${availableStock > 1 ? 's' : ''}`}
              </span>
              {cartQuantity > 0 && (
                <span className="pd-badge in-cart"><ShoppingCart size={13}/> {cartQuantity} dans le panier</span>
              )}
              {!isOutOfStock && (
                <span className="pd-badge delivery"><Truck size={13}/> Livraison rapide</span>
              )}
            </div>

            {/* Alerte stock faible */}
            {isLowStock && (
              <div className="pd-low-stock-alert">
                <AlertCircle size={16}/>
                <p>⚠️ Stock limité ! Plus que {availableStock} unité{availableStock > 1 ? 's' : ''} disponible{availableStock > 1 ? 's' : ''}. Commandez vite !</p>
              </div>
            )}

            {/* Prix */}
            <div className="pd-prix-wrap">
              <span className="pd-prix">{product.price?.toLocaleString('fr-FR')} FCFA</span>
              {product.old_price && (
                <>
                  <span className="pd-prix-old">{product.old_price?.toLocaleString('fr-FR')} FCFA</span>
                  <span className="pd-promo-badge">-{Math.round(((product.old_price - product.price) / product.old_price) * 100)}%</span>
                </>
              )}
            </div>

            {/* Quantité */}
            {!isOutOfStock && (
              <div className="pd-qty-section">
                <div className="pd-qty-header">
                  <span className="pd-qty-label">Quantité</span>
                  <span className="pd-qty-max">Max : {availableStock}</span>
                </div>
                <div className="pd-qty-ctrl">
                  <div className="pd-qty-box">
                    <button className="pd-qty-btn" onClick={() => handleQty(quantity - 1)} disabled={quantity <= 1}><Minus size={16}/></button>
                    <input type="number" className="pd-qty-val" value={quantity} min={1} max={availableStock}
                      onChange={e => handleQty(parseInt(e.target.value) || 1)}/>
                    <button className="pd-qty-btn" onClick={() => handleQty(quantity + 1)} disabled={quantity >= availableStock}><Plus size={16}/></button>
                  </div>
                  <div className="pd-qty-total">
                    Total : <span>{(product.price * quantity).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons */}
            <div style={{ display:'flex', gap:'10px', marginBottom:'8px' }}>
              <button className="pd-btn-add" onClick={addToCart} disabled={isOutOfStock || addingToCart}>
                {addingToCart
                  ? <><svg viewBox="0 0 24 24" width="18" height="18" style={{ animation:'spin .8s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" strokeDasharray="30 60"/></svg> Ajout…</>
                  : <><ShoppingCart size={18}/> {isOutOfStock ? 'Rupture de stock' : 'Ajouter au panier'}</>
                }
              </button>
              <button className={`pd-btn-fav${isFavorite ? ' active' : ''}`} onClick={toggleFavorite} title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
                <Heart size={22}/>
              </button>
            </div>

            {/* Garanties */}
            <div className="pd-garanties">
              {[
                { ico: <Shield size={18}/>, bg:'rgba(22,163,74,.12)', color:'#4ade80', title:'Garantie constructeur', desc:'Protection 2 ans incluse' },
                { ico: <Truck size={18}/>,  bg:'rgba(37,99,235,.12)', color:'#60a5fa', title:'Livraison express',     desc:'Partout en Côte d\'Ivoire sous 24-48h' },
                { ico: <Award size={18}/>,  bg:'rgba(168,85,247,.12)', color:'#c084fc', title:'Produit certifié',      desc:'100% authentique et vérifié' },
              ].map(({ ico, bg, color, title, desc }) => (
                <div key={title} className="pd-garantie">
                  <div className="pd-garantie-ico" style={{ background: bg }}>
                    {React.cloneElement(ico, { style:{ color } })}
                  </div>
                  <div>
                    <div className="pd-garantie-title">{title}</div>
                    <div className="pd-garantie-desc">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>

      <Footer />
    </div>
  );
}