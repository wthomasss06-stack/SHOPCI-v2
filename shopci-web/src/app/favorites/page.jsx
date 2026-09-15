'use client';

// ecommerce-frontend/src/pages/FavoritesPage.jsx

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingCart, Trash2, ArrowLeft, Eye, Home, Package, Star } from 'lucide-react';
import { authAPI, cartAPI } from '@/services/api';

function LogoShopCI({ size = 32 }) {
  return (
    <svg viewBox="0 0 140 34" height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="34" height="34" rx="8" fill="#f97316"/>
      <path d="M7 11h3l3.5 10h8.5l3-8H11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="14.5" cy="24.5" r="1.5" fill="white"/>
      <circle cx="21" cy="24.5" r="1.5" fill="white"/>
      <text x="42" y="25" fontFamily="'DM Sans',sans-serif" fontSize="20" fontWeight="800" fill="#1a1a1a" letterSpacing="-0.5">Shop</text>
      <text x="91" y="25" fontFamily="'DM Sans',sans-serif" fontSize="20" fontWeight="800" fill="#f97316" letterSpacing="-0.5">CI</text>
    </svg>
  );
}

export default function FavoritesPage() {
  const router = useRouter();
  const user = authAPI.getCurrentUser();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFavorites = () => {
    setLoading(true);
    try {
      const saved = localStorage.getItem('favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFavorites(Array.isArray(parsed) ? parsed : []);
      } else { setFavorites([]); }
    } catch { setFavorites([]); }
    finally { setLoading(false); }
  };

  const removeFavorite = (productId) => {
    if (!Array.isArray(favorites)) return;
    const updated = favorites.filter(f => f?.id !== productId);
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  };

  const addToCart = async (product) => {
    if (!authAPI.isAuthenticated()) { router.push('/login'); return; }
    try {
      await cartAPI.add(product?.id, 1);
      alert(`${product?.name || 'Produit'} ajouté au panier !`);
    } catch { alert("Erreur lors de l'ajout au panier"); }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://placehold.co/400x300/fff7ed/f97316?text=ShopCI';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:8000${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
  };

  if (loading) {
    return (
      <div style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa', zIndex:9999 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'18px', background:'#fff', padding:'40px 48px', borderRadius:'20px', boxShadow:'0 8px 40px rgba(0,0,0,0.10)', border:'1px solid #f3f4f6' }}>
          <div style={{ position:'relative', width:'64px', height:'64px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg viewBox="0 0 44 44" width="52" height="52" fill="none">
              <rect width="44" height="44" rx="12" fill="#f97316" style={{ filter:'drop-shadow(0 4px 12px rgba(249,115,22,0.4))' }}/>
              <path d="M10 16h4l4.5 13h11l3.5-10H14" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="19.5" cy="32" r="2" fill="white"/>
              <circle cx="27.5" cy="32" r="2" fill="white"/>
            </svg>
            <div style={{ position:'absolute', inset:'-6px', borderRadius:'50%', border:'3px solid #f97316', animation:'fav-ring 1.4s ease-out infinite' }}/>
          </div>
          <div style={{ fontSize:'26px', fontWeight:'800', letterSpacing:'-0.8px' }}>
            <span style={{ color:'#1a1a1a' }}>Shop</span><span style={{ color:'#f97316' }}>CI</span>
          </div>
          <div style={{ width:'160px', height:'4px', background:'#f3f4f6', borderRadius:'4px', overflow:'hidden' }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg,#f97316,#fb923c,#f97316)', borderRadius:'4px', animation:'fav-progress 1.6s ease-in-out infinite' }}/>
          </div>
          <p style={{ fontSize:'13px', color:'#9ca3af' }}>Chargement de vos favoris…</p>
          <style>{`
            @keyframes fav-ring     { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.8);opacity:0} }
            @keyframes fav-progress { 0%{width:0%;margin-left:0} 50%{width:70%;margin-left:0} 100%{width:0%;margin-left:100%} }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="fav-root">

      {/* ════ NAVBAR ════ */}
      <header className="fav-nav">
        <div className="fav-nav-inner">
          <div className="fav-nav-left">
            <button className="fav-nav-back" onClick={() => router.back()} title="Retour">
              <ArrowLeft size={20}/>
            </button>
            <div onClick={() => router.push('/')} style={{ cursor:'pointer' }}>
              <LogoShopCI size={28}/>
            </div>
            <span className="fav-nav-sep">|</span>
            <div className="fav-nav-page">
              <Heart size={16} style={{ color:'#f97316' }}/>
              <span>Mes Favoris</span>
            </div>
          </div>
          <button className="fav-nav-home" onClick={() => router.push('/')} title="Accueil">
            <Home size={20}/>
          </button>
        </div>
      </header>

      {/* ════ MAIN ════ */}
      <main className="fav-main">
        {/* En-tête section */}
        <div className="fav-section-head">
          <div className="fav-section-head-left">
            <Heart size={22} style={{ color:'#f97316' }}/>
            <h1 className="fav-titre">Mes Favoris</h1>
          </div>
          <span className="fav-count">
            {favorites.length} produit{favorites.length !== 1 ? 's' : ''}
          </span>
        </div>

        {favorites.length === 0 ? (
          <div className="fav-vide">
            <Package size={64} style={{ color:'#d1d5db', marginBottom:'16px' }}/>
            <h2 className="fav-vide-titre">Aucun favori pour l'instant</h2>
            <p className="fav-vide-desc">Ajoutez des produits à vos favoris depuis la boutique</p>
            <button className="fav-btn-explorer" onClick={() => router.push('/')}>
              Parcourir la boutique
            </button>
          </div>
        ) : (
          <div className="fav-grille">
            {favorites.map((product) => (
              <div key={product.id} className="fav-carte">
                {/* Zone image */}
                <div className="fav-img-zone">
                  <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    className="fav-img"
                    onError={(e) => { e.target.src = 'https://placehold.co/400x300/fff7ed/f97316?text=ShopCI'; }}
                  />
                  <span className="fav-badge-cat">{product.category_name || 'Produit'}</span>
                  <button className="fav-remove-btn" onClick={() => removeFavorite(product.id)} title="Retirer des favoris">
                    <Heart size={18} style={{ color:'#ef4444', fill:'#ef4444' }}/>
                  </button>
                  <div className="fav-overlay">
                    <button className="fav-overlay-btn" onClick={() => router.push(`/product/${product.id}`)}>
                      <Eye size={16}/> Voir détails
                    </button>
                  </div>
                </div>

                {/* Infos */}
                <div className="fav-infos">
                  <h3 className="fav-nom">{product.name}</h3>
                  <p className="fav-desc">{product.description}</p>

                  <div className="fav-etoiles">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} style={{ color: i < 4 ? '#f97316' : '#e5e7eb', fill: i < 4 ? '#f97316' : 'transparent' }}/>
                    ))}
                    <span className="fav-avis">4.8</span>
                  </div>

                  <div className="fav-prix-row">
                    <span className="fav-prix">{product.price?.toLocaleString('fr-FR')} <small>FCFA</small></span>
                    {product.stock > 0
                      ? <span className="fav-badge-stock fav-en-stock">En stock</span>
                      : <span className="fav-badge-stock fav-rupture">Rupture</span>
                    }
                  </div>

                  <div className="fav-actions">
                    <button onClick={() => addToCart(product)} disabled={product.stock === 0} className="fav-btn-panier">
                      <ShoppingCart size={15}/> Panier
                    </button>
                    <button onClick={() => removeFavorite(product.id)} className="fav-btn-suppr" title="Supprimer">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .fav-root { min-height:100vh; background:#f9fafb; font-family:'DM Sans',sans-serif; }

        /* NAVBAR */
        .fav-nav { background:#fff; border-bottom:1px solid #f0f0f0; position:sticky; top:0; z-index:100; box-shadow:0 1px 8px rgba(0,0,0,0.06); }
        .fav-nav-inner { max-width:1280px; margin:0 auto; padding:0 20px; height:64px; display:flex; align-items:center; justify-content:space-between; }
        .fav-nav-left { display:flex; align-items:center; gap:12px; }
        .fav-nav-back { background:none; border:none; cursor:pointer; color:#6b7280; display:flex; align-items:center; padding:8px; border-radius:10px; transition:background .15s,color .15s; }
        .fav-nav-back:hover { background:#f3f4f6; color:#f97316; }
        .fav-nav-sep { color:#e5e7eb; font-size:18px; }
        .fav-nav-page { display:flex; align-items:center; gap:6px; font-weight:700; font-size:15px; color:#1a1a1a; }
        .fav-nav-home { background:none; border:none; cursor:pointer; color:#6b7280; display:flex; align-items:center; padding:8px; border-radius:10px; transition:background .15s,color .15s; }
        .fav-nav-home:hover { background:#fff7ed; color:#f97316; }

        /* MAIN */
        .fav-main { max-width:1280px; margin:0 auto; padding:32px 20px 60px; }
        .fav-section-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
        .fav-section-head-left { display:flex; align-items:center; gap:10px; }
        .fav-titre { font-size:22px; font-weight:800; color:#1a1a1a; margin:0; }
        .fav-count { font-size:13px; color:#9ca3af; background:#f3f4f6; padding:4px 12px; border-radius:999px; font-weight:600; }

        /* Vide */
        .fav-vide { background:#fff; border:1px solid #f0f0f0; border-radius:20px; padding:80px 24px; text-align:center; box-shadow:0 2px 12px rgba(0,0,0,0.04); }
        .fav-vide-titre { font-size:20px; font-weight:800; color:#1a1a1a; margin:0 0 8px; }
        .fav-vide-desc { font-size:14px; color:#9ca3af; margin:0 0 24px; }
        .fav-btn-explorer { background:#f97316; color:#fff; border:none; padding:12px 28px; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; transition:background .18s,transform .12s; }
        .fav-btn-explorer:hover { background:#ea6a0a; transform:translateY(-1px); }

        /* Grille */
        .fav-grille { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }

        /* Carte */
        .fav-carte { background:#fff; border:1px solid #f0f0f0; border-radius:16px; overflow:hidden; transition:box-shadow .2s,transform .2s; box-shadow:0 2px 8px rgba(0,0,0,0.05); }
        .fav-carte:hover { box-shadow:0 8px 32px rgba(249,115,22,0.12); transform:translateY(-2px); }

        /* Image */
        .fav-img-zone { position:relative; overflow:hidden; }
        .fav-img { width:100%; height:200px; object-fit:cover; display:block; transition:transform .3s; }
        .fav-carte:hover .fav-img { transform:scale(1.04); }
        .fav-badge-cat { position:absolute; top:10px; left:10px; background:rgba(255,255,255,0.92); color:#f97316; font-size:11px; font-weight:700; padding:3px 10px; border-radius:999px; border:1px solid rgba(249,115,22,0.2); backdrop-filter:blur(4px); }
        .fav-remove-btn { position:absolute; top:10px; right:10px; background:rgba(255,255,255,0.92); border:none; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(4px); transition:background .15s,transform .12s; box-shadow:0 2px 8px rgba(0,0,0,0.10); }
        .fav-remove-btn:hover { background:#fff; transform:scale(1.1); }
        .fav-overlay { position:absolute; inset:0; background:rgba(0,0,0,0); display:flex; align-items:center; justify-content:center; opacity:0; transition:background .2s,opacity .2s; }
        .fav-carte:hover .fav-overlay { background:rgba(0,0,0,0.35); opacity:1; }
        .fav-overlay-btn { display:flex; align-items:center; gap:6px; background:#fff; color:#1a1a1a; border:none; border-radius:10px; padding:8px 16px; font-size:13px; font-weight:700; cursor:pointer; box-shadow:0 4px 16px rgba(0,0,0,0.15); transform:translateY(8px); transition:transform .2s,color .15s; }
        .fav-carte:hover .fav-overlay-btn { transform:translateY(0); }
        .fav-overlay-btn:hover { color:#f97316; }

        /* Infos */
        .fav-infos { padding:14px 16px; }
        .fav-nom { font-size:14px; font-weight:700; color:#1a1a1a; margin:0 0 4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .fav-desc { font-size:12px; color:#9ca3af; margin:0 0 8px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .fav-etoiles { display:flex; align-items:center; gap:2px; margin-bottom:10px; }
        .fav-avis { font-size:12px; color:#9ca3af; margin-left:4px; }
        .fav-prix-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
        .fav-prix { font-size:18px; font-weight:800; color:#f97316; letter-spacing:-0.5px; }
        .fav-prix small { font-size:11px; font-weight:600; color:#fb923c; }
        .fav-badge-stock { font-size:11px; font-weight:700; padding:3px 10px; border-radius:999px; }
        .fav-en-stock { background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; }
        .fav-rupture { background:#fef2f2; color:#dc2626; border:1px solid #fecaca; }
        .fav-actions { display:flex; gap:8px; }
        .fav-btn-panier { flex:1; display:flex; align-items:center; justify-content:center; gap:6px; background:#f97316; color:#fff; border:none; padding:9px 0; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; transition:background .15s,transform .1s; font-family:inherit; }
        .fav-btn-panier:hover:not(:disabled) { background:#ea6a0a; transform:translateY(-1px); }
        .fav-btn-panier:disabled { opacity:0.45; cursor:not-allowed; }
        .fav-btn-suppr { background:#fff5f5; color:#ef4444; border:1px solid #fecaca; width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .15s; flex-shrink:0; }
        .fav-btn-suppr:hover { background:#fee2e2; }

        @media (max-width:1024px) {
          .fav-grille { grid-template-columns:repeat(3,1fr); }
        }
        @media (max-width:768px) {
          .fav-grille { grid-template-columns:repeat(2,1fr); }
          .fav-main { padding:20px 14px 48px; }
          .fav-titre { font-size:18px; }
          .fav-nav-page span { display:none; }
        }
        @media (max-width:480px) {
          .fav-grille { grid-template-columns:1fr; }
          .fav-nav-sep { display:none; }
          .fav-nav-page { display:none; }
          .fav-vide { padding:48px 16px; }
          .fav-section-head { flex-direction:column; align-items:flex-start; gap:6px; }
        }
      `}</style>
    </div>
  );
}