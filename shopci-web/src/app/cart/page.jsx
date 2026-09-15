'use client';

// ecommerce-frontend/src/pages/CartPage.jsx
// ✅ ShopCI — Navbar unifiée — Layout propre & responsive

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowRight, ArrowLeft,
  Package, Truck, ShieldCheck, Tag, ShoppingBag
} from 'lucide-react';
import { cartAPI } from '@/services/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageLoader from '@/components/Loader';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCart(); }, []);

  const loadCart = async () => {
    try { setCart(await cartAPI.getCart()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const updateQuantity = async (itemId, qty) => {
    if (qty < 1) return;
    try { await cartAPI.updateCartItem(itemId, qty); loadCart(); }
    catch { alert('Erreur lors de la mise à jour'); }
  };

  const removeItem = async (itemId) => {
    if (!window.confirm('Retirer cet article du panier ?')) return;
    try { await cartAPI.removeFromCart(itemId); loadCart(); }
    catch { alert('Erreur lors de la suppression'); }
  };

  const clearCart = async () => {
    if (!window.confirm('Vider le panier ?')) return;
    try { await cartAPI.clearCart(); loadCart(); }
    catch { alert('Erreur'); }
  };

  const getImageUrl = (p) => {
    if (!p) return 'https://placehold.co/72x72/fff7ed/f97316?text=ShopCI';
    if (p.startsWith('http')) return p;
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api$/, ''); return `${base}${p.startsWith('/') ? p : '/' + p}`;
  };

  if (loading) return <PageLoader message="Chargement du panier…" />;

  const cartItems = cart?.items || [];
  const subtotal  = cart?.total || 0;
  const shipping  = cartItems.length > 0 ? 2000 : 0;
  const total     = subtotal + shipping;
  const isEmpty   = cartItems.length === 0;

  return (
    <div style={{ fontFamily:"'DM Sans','Inter',sans-serif", background:'var(--bg, #f5f5f5)', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        /* PAGE */
        .c-page { max-width:1080px; margin:32px auto 64px; padding:0 24px; flex:1; }

        /* TITRE */
        .c-title {
          display:flex; align-items:center; gap:10px;
          font-size:22px; font-weight:800; color:var(--text,#1a1a1a);
          letter-spacing:-.5px; margin-bottom:24px;
        }
        .c-title svg { color:#f97316; }
        .c-count { font-size:13px; font-weight:600; color:var(--text2,#9ca3af); margin-left:2px; }

        /* LAYOUT REMPLI */
        .c-layout {
          display:grid; grid-template-columns:1fr 320px;
          gap:20px; align-items:start;
        }

        /* VIDE — pleine largeur centrée */
        .c-empty-wrap {
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          padding:80px 24px 88px;
          background:var(--card,#fff); border-radius:20px;
          border:1.5px solid var(--border,#ebebeb);
          box-shadow:0 2px 12px rgba(0,0,0,.06);
          text-align:center;
        }
        .c-empty-icon {
          width:108px; height:108px; background:rgba(249,115,22,.1);
          border-radius:50%; border:2px solid rgba(249,115,22,.2);
          display:flex; align-items:center; justify-content:center;
          margin-bottom:28px;
        }
        .c-empty-title { font-size:24px; font-weight:800; color:var(--text,#1a1a1a); margin-bottom:10px; }
        .c-empty-sub   { font-size:14px; color:var(--text2,#9ca3af); margin-bottom:32px; line-height:1.6; }
        .c-empty-btn {
          display:inline-flex; align-items:center; gap:9px;
          background:#f97316; color:#fff; border:none;
          border-radius:14px; padding:14px 32px;
          font-size:15px; font-weight:700; cursor:pointer;
          font-family:inherit;
          box-shadow:0 4px 18px rgba(249,115,22,.35);
          transition:background .18s, transform .15s;
        }
        .c-empty-btn:hover { background:#ea6a0a; transform:translateY(-2px); }

        /* ITEMS CARD */
        .c-items-card {
          background:var(--card,#fff); border-radius:18px;
          border:1.5px solid var(--border,#ebebeb); overflow:hidden;
          box-shadow:0 2px 12px rgba(0,0,0,.06);
        }
        .c-items-hd {
          display:flex; align-items:center; justify-content:space-between;
          padding:16px 20px; border-bottom:1.5px solid var(--border,#f5f5f5);
        }
        .c-items-hd-left { display:flex; align-items:center; gap:8px; }
        .c-badge {
          background:#f97316; color:#fff;
          border-radius:999px; padding:2px 10px;
          font-size:11.5px; font-weight:700;
        }
        .c-clear-btn {
          display:flex; align-items:center; gap:6px;
          background:none; border:1.5px solid rgba(239,68,68,.3);
          color:#ef4444; border-radius:8px;
          padding:6px 13px; font-size:12.5px; font-weight:600;
          cursor:pointer; transition:all .18s; font-family:inherit;
        }
        .c-clear-btn:hover { background:rgba(239,68,68,.1); border-color:rgba(239,68,68,.5); }

        /* ITEM ROW */
        .c-item {
          display:flex; align-items:center; gap:14px;
          padding:16px 20px; border-bottom:1.5px solid var(--border,#f9f9f9);
          transition:background .15s;
        }
        .c-item:last-child { border-bottom:none; }
        .c-item:hover { background:var(--bg3,#fffbf7); }
        .c-item-img {
          width:72px; height:72px; border-radius:12px;
          object-fit:cover; border:1.5px solid var(--border,#f0f0f0);
          flex-shrink:0; background:rgba(249,115,22,.08);
        }
        .c-item-info { flex:1; min-width:0; }
        .c-item-cat {
          font-size:10.5px; font-weight:700; color:#f97316;
          text-transform:uppercase; letter-spacing:.5px; margin-bottom:3px;
        }
        .c-item-name {
          font-size:14px; font-weight:700; color:var(--text,#1a1a1a);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:3px;
        }
        .c-item-unit { font-size:12px; color:var(--text2,#9ca3af); font-weight:500; }
        .c-item-right {
          display:flex; flex-direction:column;
          align-items:flex-end; gap:10px; flex-shrink:0;
        }
        .c-item-sub { font-size:17px; font-weight:800; color:var(--text,#1a1a1a); white-space:nowrap; }
        .c-item-sub small { font-size:11px; color:var(--text2,#9ca3af); font-weight:600; margin-left:2px; }
        .c-qty-row { display:flex; align-items:center; gap:8px; }
        .c-qty-ctrl {
          display:flex; align-items:center;
          border:1.5px solid var(--border,#ebebeb); border-radius:10px;
          overflow:hidden; background:var(--bg3,#fafafa);
        }
        .c-qty-btn {
          width:32px; height:32px; border:none; background:none;
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          color:var(--text2,#555); transition:background .15s, color .15s; font-family:inherit;
        }
        .c-qty-btn:hover:not(:disabled) { background:rgba(249,115,22,.1); color:#f97316; }
        .c-qty-btn:disabled { opacity:.35; cursor:not-allowed; }
        .c-qty-val {
          width:34px; text-align:center;
          font-size:14px; font-weight:700; color:var(--text,#1a1a1a);
          border-left:1.5px solid var(--border,#ebebeb); border-right:1.5px solid var(--border,#ebebeb);
          height:32px; display:flex; align-items:center; justify-content:center;
        }
        .c-rm-btn {
          background:none; border:none; color:var(--text2,#d1d5db);
          cursor:pointer; padding:6px; border-radius:8px;
          display:flex; align-items:center; transition:all .18s;
        }
        .c-rm-btn:hover { color:#ef4444; background:rgba(239,68,68,.1); }

        /* RÉSUMÉ */
        .c-summary {
          background:var(--card,#fff); border-radius:18px;
          border:1.5px solid var(--border,#ebebeb); padding:22px;
          position:sticky; top:80px;
          box-shadow:0 2px 12px rgba(0,0,0,.06);
        }
        .c-summary-title {
          font-size:16px; font-weight:800; color:var(--text,#1a1a1a);
          margin-bottom:18px; display:flex; align-items:center; gap:8px;
        }
        .c-summary-title svg { color:#f97316; }
        .c-line {
          display:flex; justify-content:space-between; align-items:center;
          font-size:13.5px; color:var(--text2,#6b7280); padding:9px 0;
          border-bottom:1px solid var(--border,#f5f5f5);
        }
        .c-line:last-of-type { border-bottom:none; }
        .c-line span:last-child { font-weight:600; color:var(--text,#1a1a1a); }
        .c-total-row {
          display:flex; justify-content:space-between; align-items:center;
          padding:14px 0 0; margin-top:6px; border-top:2px solid var(--border,#f0f0f0);
        }
        .c-total-row span:first-child { font-size:15px; font-weight:700; color:var(--text,#1a1a1a); }
        .c-total-row span:last-child  { font-size:22px; font-weight:800; color:#f97316; }
        .c-checkout-btn {
          width:100%; display:flex; align-items:center; justify-content:center; gap:8px;
          background:#f97316; color:#fff; border:none; border-radius:13px;
          padding:14px; font-size:15px; font-weight:700; cursor:pointer;
          margin-top:18px; font-family:inherit;
          box-shadow:0 4px 16px rgba(249,115,22,.35);
          transition:background .18s, transform .15s;
        }
        .c-checkout-btn:hover { background:#ea6a0a; transform:translateY(-1px); }
        .c-continue-btn {
          width:100%; display:flex; align-items:center; justify-content:center; gap:7px;
          background:none; border:1.5px solid var(--border,#ebebeb); color:var(--text2,#555);
          border-radius:13px; padding:11px; font-size:13.5px; font-weight:600;
          cursor:pointer; margin-top:10px; font-family:inherit; transition:all .18s;
        }
        .c-continue-btn:hover { border-color:#f97316; color:#f97316; background:rgba(249,115,22,.08); }

        /* BADGES PAIEMENT */
        .c-pay-box {
          margin-top:18px; border-radius:12px;
          border:1px solid var(--border,#f0f0f0); background:var(--bg3,#fafafa); overflow:hidden;
        }
        .c-pay-title {
          display:flex; align-items:center; gap:6px;
          font-size:11px; font-weight:700; color:var(--text2,#888);
          text-transform:uppercase; letter-spacing:.5px;
          padding:11px 14px 7px;
        }
        .c-pay-title svg { color:#f97316; }
        .c-pay-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; padding:0 12px 12px; }
        .c-pay-logo {
          background:var(--card,#fff); border-radius:8px; height:38px;
          border:1px solid var(--border,#f0f0f0);
          display:flex; align-items:center; justify-content:center; padding:5px;
        }
        .c-pay-logo img { max-height:100%; object-fit:contain; }
        .c-pay-label { font-size:11.5px; font-weight:700; color:var(--text2,#555); }
        .c-delivery-box {
          margin-top:10px; border-radius:12px;
          border:1px solid rgba(34,197,94,.25); background:rgba(34,197,94,.08);
          padding:11px 14px; display:flex; align-items:center; gap:9px;
        }
        .c-delivery-box svg { color:#22c55e; flex-shrink:0; }
        .c-delivery-box span { font-size:12.5px; color:#22c55e; font-weight:500; line-height:1.4; }

        /* ══ RESPONSIVE ══ */

        /* Tablette — résumé passe en bas */
        @media (max-width:860px) {
          .c-layout { grid-template-columns:1fr; }
          .c-summary { position:static; }
        }

        /* Mobile L */
        @media (max-width:560px) {
          .c-page { padding:0 12px; margin:18px auto 48px; }
          .c-title { font-size:19px; margin-bottom:16px; }
          .c-item { gap:10px; padding:12px 14px; }
          .c-item-img { width:58px; height:58px; border-radius:10px; }
          .c-item-name { font-size:13.5px; }
          .c-item-unit { font-size:11.5px; }
          .c-item-right {
            flex-direction:row; align-items:center;
            gap:10px; width:100%; justify-content:space-between;
          }
          .c-item-sub { font-size:15px; }
          .c-items-hd { flex-wrap:wrap; gap:8px; padding:12px 14px; }
          .c-summary { padding:16px 14px; }
          .c-total-row span:last-child { font-size:20px; }
          .c-checkout-btn { padding:13px; font-size:14px; }
          .c-empty-wrap { padding:56px 16px 64px; }
          .c-empty-title { font-size:20px; }
          .c-empty-icon { width:88px; height:88px; }
          .c-empty-btn { padding:12px 24px; font-size:14px; }
        }

        /* Mobile S — items stack verticalement */
        @media (max-width:400px) {
          .c-page { padding:0 10px; margin:12px auto 40px; }
          .c-title { font-size:17px; }
          .c-item { flex-wrap:wrap; padding:12px 12px; gap:10px; }
          .c-item-img { width:52px; height:52px; }
          .c-item-info { flex:1; min-width:0; }
          .c-item-right {
            flex-direction:row; align-items:center;
            gap:8px; width:100%; justify-content:space-between; flex-shrink:unset;
          }
          .c-item-sub { font-size:14px; }
          .c-qty-btn { width:28px; height:28px; }
          .c-qty-val  { width:28px; height:28px; font-size:13px; }
          .c-clear-btn { font-size:11.5px; padding:5px 10px; }
          .c-badge { font-size:11px; padding:2px 8px; }
          .c-summary { padding:14px 12px; }
          .c-summary-title { font-size:14px; }
          .c-checkout-btn { font-size:13px; padding:12px; }
          .c-continue-btn { font-size:12.5px; padding:10px; }
          .c-pay-grid { grid-template-columns:1fr 1fr; gap:6px; }
          .c-empty-wrap { padding:40px 12px 50px; }
          .c-empty-icon { width:72px; height:72px; margin-bottom:20px; }
          .c-empty-title { font-size:18px; }
          .c-empty-sub { font-size:13px; margin-bottom:24px; }
          .c-empty-btn { padding:11px 20px; font-size:13.5px; }
        }
      `}</style>

      {/* NAVBAR */}
      <Navbar pageCourante="/cart" />

      {/* CONTENU */}
      <div className="c-page">

        <div className="c-title">
          <ShoppingCart size={22}/>
          Mon Panier
          {!isEmpty && (
            <span className="c-count">({cartItems.length} article{cartItems.length > 1 ? 's' : ''})</span>
          )}
        </div>

        {/* ── PANIER VIDE ── centré pleine largeur */}
        {isEmpty && (
          <div className="c-empty-wrap">
            <div className="c-empty-icon">
              <ShoppingBag size={48} color="#f97316"/>
            </div>
            <p className="c-empty-title">Votre panier est vide</p>
            <p className="c-empty-sub">
              Ajoutez des produits pour passer<br/>votre première commande.
            </p>
            <button className="c-empty-btn" onClick={() => router.push('/')}>
              <Package size={18}/> Explorer la boutique
            </button>
          </div>
        )}

        {/* ── PANIER REMPLI ── grille 2 colonnes */}
        {!isEmpty && (
          <div className="c-layout">

            {/* Colonne gauche — Articles */}
            <div className="c-items-card">
              <div className="c-items-hd">
                <div className="c-items-hd-left">
                  <ShoppingCart size={17} color="#f97316"/>
                  <span style={{ fontWeight:700, fontSize:'14px', color:'var(--text,#1a1a1a)' }}>Articles</span>
                  <span className="c-badge">{cartItems.length}</span>
                </div>
                <button className="c-clear-btn" onClick={clearCart}>
                  <Trash2 size={13}/> Vider
                </button>
              </div>

              {cartItems.map((item) => (
                <div key={item.id} className="c-item">
                  <img
                    src={getImageUrl(item.product?.image)}
                    alt={item.product?.name || ''}
                    className="c-item-img"
                    onError={e => { e.target.src = 'https://placehold.co/72x72/fff7ed/f97316?text=ShopCI'; }}
                  />
                  <div className="c-item-info">
                    <div className="c-item-cat">{item.product?.category_name || 'Produit'}</div>
                    <div className="c-item-name">{item.product?.name}</div>
                    <div className="c-item-unit">{item.product?.price?.toLocaleString('fr-FR')} FCFA / unité</div>
                    {item.product?.stock !== undefined && (
                      <div style={{ fontSize:'11.5px', color:'var(--text2,#b0b7c3)', marginTop:'2px' }}>
                        {item.product.stock} disponible{item.product.stock > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <div className="c-item-right">
                    <div className="c-item-sub">
                      {item.subtotal?.toLocaleString('fr-FR')} <small>FCFA</small>
                    </div>
                    <div className="c-qty-row">
                      <div className="c-qty-ctrl">
                        <button className="c-qty-btn" disabled={item.quantity <= 1}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                          <Minus size={13}/>
                        </button>
                        <div className="c-qty-val">{item.quantity}</div>
                        <button className="c-qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <Plus size={13}/>
                        </button>
                      </div>
                      <button className="c-rm-btn" onClick={() => removeItem(item.id)} title="Supprimer">
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Colonne droite — Résumé */}
            <div className="c-summary">
              <div className="c-summary-title">
                <Tag size={17}/> Résumé
              </div>

              <div className="c-line">
                <span>Sous-total ({cartItems.length} article{cartItems.length > 1 ? 's' : ''})</span>
                <span>{subtotal.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="c-line">
                <span style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                  <Truck size={12}/> Livraison estimée
                </span>
                <span>{shipping.toLocaleString('fr-FR')} FCFA</span>
              </div>

              <div className="c-total-row">
                <span>Total TTC</span>
                <span>{total.toLocaleString('fr-FR')} FCFA</span>
              </div>

              <button className="c-checkout-btn" onClick={() => router.push('/checkout')}>
                Commander <ArrowRight size={17}/>
              </button>
              <button className="c-continue-btn" onClick={() => router.push('/')}>
                <ShoppingBag size={14}/> Continuer mes achats
              </button>

              <div className="c-pay-box">
                <div className="c-pay-title">
                  <ShieldCheck size={13}/> Paiement sécurisé
                </div>
                <div className="c-pay-grid">
                  {['MTN', 'Orange', 'Wave', 'Moov'].map(label => (
                    <div key={label} className="c-pay-logo">
                      <img
                        src={`/images/payment/${label.toLowerCase()}-logo.png`}
                        alt={label}
                        onError={e => { e.target.style.display='none'; e.target.parentElement.innerHTML=`<span class="c-pay-label">${label}</span>`; }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="c-delivery-box">
                <Truck size={17}/>
                <span>Livraison en 2–5 jours ouvrables partout en Côte d'Ivoire</span>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}