'use client';

// ecommerce-frontend/src/pages/OrdersPage.jsx
// ✅ Fix : bouton Annuler commande + responsive complet + bugs corrigés

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, ShoppingBag, Clock, Truck,
  MapPin, Phone, Calendar,
  Search, CheckCircle2, Ban,
  Navigation, AlertTriangle, X
} from 'lucide-react';
import { ordersAPI, authAPI } from '@/services/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageLoader from '@/components/Loader';

export default function OrdersPage() {
  const router = useRouter();
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [searchTerm,    setSearchTerm]    = useState('');
  const [cancelTarget,  setCancelTarget]  = useState(null);  // order à annuler
  const [cancelling,    setCancelling]    = useState(false);
  const [cancelError,   setCancelError]   = useState('');

  const user      = authAPI.getCurrentUser();
  const isVendeur = user?.user_type === 'vendeur';

  useEffect(() => {
    if (!authAPI.isAuthenticated()) { router.push('/login'); return; }
    loadOrders();
  }, [router]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = isVendeur
        ? await ordersAPI.getVendorOrders()
        : await ordersAPI.getAll();
      setOrders(data.results || data || []);
    } catch (err) {
      console.error('Erreur chargement commandes:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Annulation commande ───────────────────────────────────────────────────
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError('');
    try {
      await ordersAPI.updateStatus(cancelTarget.id, { status: 'cancelled' });
      setOrders(prev => prev.map(o => o.id === cancelTarget.id ? { ...o, status: 'cancelled' } : o));
      setCancelTarget(null);
    } catch (err) {
      setCancelError("Impossible d'annuler cette commande. Veuillez réessayer.");
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  const STATUS = {
    pending:    { icon: Clock,        label: 'En attente', bg: 'rgba(251,191,36,.12)',  border: 'rgba(251,191,36,.4)', text: '#d97706', dot: '#d97706' },
    processing: { icon: Package,      label: 'En cours',   bg: 'rgba(59,130,246,.1)',   border: 'rgba(59,130,246,.3)', text: '#3b82f6', dot: '#3b82f6' },
    shipped:    { icon: Truck,        label: 'Expédié',    bg: 'rgba(168,85,247,.1)',   border: 'rgba(168,85,247,.3)', text: '#a855f7', dot: '#a855f7' },
    delivered:  { icon: CheckCircle2, label: 'Livré',      bg: 'rgba(34,197,94,.1)',    border: 'rgba(34,197,94,.3)',  text: '#22c55e', dot: '#22c55e' },
    cancelled:  { icon: Ban,          label: 'Annulé',     bg: 'rgba(239,68,68,.1)',    border: 'rgba(239,68,68,.3)',  text: '#ef4444', dot: '#ef4444' },
  };

  const getStatus = (s) => STATUS[s] || STATUS.pending;

  const getImageUrl = (p) => {
    if (!p) return 'https://placehold.co/64x64/fff7ed/f97316?text=CI';
    if (p.startsWith('http')) return p;
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api$/, '');
    return `${base}${p.startsWith('/') ? p : '/' + p}`;
  };

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchSearch = !searchTerm ||
      String(o.id).includes(searchTerm) ||
      o.items?.some(i => i.product_name?.toLowerCase().includes(term));
    return matchStatus && matchSearch;
  });

  const stats = isVendeur
    ? [
        { label: 'Total reçues',  value: orders.length,                                                       icon: ShoppingBag,  color: '#f97316', bg: 'rgba(249,115,22,.12)' },
        { label: 'À préparer',    value: orders.filter(o => o.status === 'pending').length,                   icon: Clock,        color: '#f59e0b', bg: 'rgba(245,158,11,.1)'  },
        { label: 'En livraison',  value: orders.filter(o => o.status === 'shipped').length,                   icon: Truck,        color: '#3b82f6', bg: 'rgba(59,130,246,.1)'  },
        { label: 'Livrées',       value: orders.filter(o => o.status === 'delivered').length,                 icon: CheckCircle2, color: '#22c55e', bg: 'rgba(34,197,94,.1)'   },
      ]
    : [
        { label: 'Total commandes', value: orders.length,                                                              icon: ShoppingBag,  color: '#f97316', bg: 'rgba(249,115,22,.12)' },
        { label: 'En cours',        value: orders.filter(o => ['pending','processing'].includes(o.status)).length,    icon: Clock,        color: '#3b82f6', bg: 'rgba(59,130,246,.1)'  },
        { label: 'Livrées',         value: orders.filter(o => o.status === 'delivered').length,                       icon: CheckCircle2, color: '#22c55e', bg: 'rgba(34,197,94,.1)'   },
        { label: 'Annulées',        value: orders.filter(o => o.status === 'cancelled').length,                       icon: Ban,          color: '#ef4444', bg: 'rgba(239,68,68,.1)'   },
      ];

  const FILTERS = [
    { id: 'all',        label: 'Toutes'     },
    { id: 'pending',    label: 'En attente' },
    { id: 'processing', label: 'En cours'   },
    { id: 'shipped',    label: 'Expédié'    },
    { id: 'delivered',  label: 'Livré'      },
    { id: 'cancelled',  label: 'Annulé'     },
  ];

  if (loading) return <PageLoader message="Chargement des commandes…" />;

  return (
    <div style={{ fontFamily:"'DM Sans','Inter',sans-serif", background:'var(--bg,#fafafa)', minHeight:'100vh', display:'flex', flexDirection:'column', overflowX:'hidden', width:'100%' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        .ord-main { max-width:1280px; margin:32px auto; padding:0 20px; flex:1; width:100%; }

        /* STATS */
        .ord-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:28px; }
        .ord-stat-card { background:var(--card,#fff); border-radius:14px; border:1px solid var(--border,#f0f0f0); padding:18px 20px; display:flex; align-items:center; gap:14px; transition:box-shadow .18s; }
        .ord-stat-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.12); }
        .ord-stat-ico { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ord-stat-val { font-size:24px; font-weight:800; color:var(--text,#1a1a1a); line-height:1; }
        .ord-stat-lbl { font-size:12.5px; color:var(--text2,#9ca3af); font-weight:500; margin-top:2px; }

        /* TOOLBAR */
        .ord-toolbar { display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
        .ord-search-wrap { position:relative; flex:1; min-width:180px; }
        .ord-search-ico { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text2,#9ca3af); pointer-events:none; }
        .ord-search { width:100%; padding:10px 14px 10px 38px; border:1.5px solid var(--border,#e5e7eb); border-radius:10px; font-size:14px; font-family:'DM Sans',sans-serif; outline:none; transition:border-color .18s; background:var(--card,#fff); color:var(--text,#1a1a1a); }
        .ord-search:focus { border-color:#f97316; box-shadow:0 0 0 3px rgba(249,115,22,.1); }
        .ord-filters { display:flex; gap:6px; flex-wrap:wrap; }
        .ord-filter-btn { padding:8px 14px; border-radius:999px; font-size:13px; font-weight:600; border:1.5px solid var(--border,#f0f0f0); background:var(--card,#fff); color:var(--text2,#555); cursor:pointer; transition:all .18s; white-space:nowrap; }
        .ord-filter-btn:hover { border-color:#fed7aa; color:#f97316; background:rgba(249,115,22,.08); }
        .ord-filter-btn.active { background:#f97316; border-color:#f97316; color:#fff; }

        /* EMPTY */
        .ord-empty { background:var(--card,#fff); border-radius:16px; border:1px solid var(--border,#f0f0f0); padding:72px 20px; text-align:center; }
        .ord-empty-ico { width:96px; height:96px; background:rgba(249,115,22,.1); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; border:2px solid rgba(249,115,22,.2); }
        .ord-empty h2 { font-size:22px; font-weight:800; color:var(--text,#1a1a1a); margin-bottom:8px; }
        .ord-empty p  { font-size:14px; color:var(--text2,#9ca3af); margin-bottom:24px; }
        .ord-shop-btn { display:inline-flex; align-items:center; gap:8px; background:#f97316; color:#fff; border:none; border-radius:12px; padding:12px 28px; font-size:14px; font-weight:700; cursor:pointer; box-shadow:0 4px 16px rgba(249,115,22,.35); transition:background .2s,transform .15s; }
        .ord-shop-btn:hover { background:#ea6a0a; transform:translateY(-1px); }

        /* ORDER CARD */
        .ord-list { display:flex; flex-direction:column; gap:16px; margin-bottom:40px; }
        .ord-card { background:var(--card,#fff); border-radius:16px; border:1px solid var(--border,#f0f0f0); overflow:hidden; transition:box-shadow .2s,border-color .2s; }
        .ord-card:hover { box-shadow:0 4px 20px rgba(0,0,0,.15); border-color:var(--border,#e5e7eb); }

        .ord-card-head { display:flex; align-items:flex-start; justify-content:space-between; padding:18px 20px; border-bottom:1px solid var(--border,#f9fafb); flex-wrap:wrap; gap:10px; }
        .ord-card-head-left { display:flex; align-items:flex-start; gap:12px; flex:1; min-width:0; }
        .ord-status-ico { width:40px; height:40px; border-radius:11px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ord-id { font-size:17px; font-weight:800; color:var(--text,#1a1a1a); }
        .ord-badge { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:999px; font-size:12.5px; font-weight:700; border:1.5px solid; }
        .ord-badge-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .ord-date { display:flex; align-items:center; gap:5px; font-size:12.5px; color:var(--text2,#9ca3af); }
        .ord-card-amount { text-align:right; flex-shrink:0; max-width:160px; }
        .ord-amount-val { font-size:clamp(16px, 4.5vw, 22px); font-weight:800; color:var(--text,#1a1a1a); word-break:break-word; overflow-wrap:anywhere; line-height:1.1; }
        .ord-amount-lbl { font-size:12px; color:var(--text2,#9ca3af); }

        .ord-card-body { padding:18px 20px; }
        .ord-infos-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:18px; }
        .ord-info-box { background:var(--bg3,#fafafa); border:1px solid var(--border,#f0f0f0); border-radius:10px; padding:12px 14px; display:flex; gap:10px; align-items:flex-start; }
        .ord-info-ico { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ord-info-lbl { font-size:11px; font-weight:700; color:var(--text2,#9ca3af); text-transform:uppercase; letter-spacing:.4px; margin-bottom:3px; }
        .ord-info-val { font-size:13.5px; font-weight:600; color:var(--text,#1a1a1a); word-break:break-word; }

        .ord-articles-titre { display:flex; align-items:center; gap:8px; font-size:12px; font-weight:700; color:var(--text2,#9ca3af); text-transform:uppercase; letter-spacing:.5px; margin-bottom:12px; }
        .ord-articles-titre svg { color:#f97316; }
        .ord-item { display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:10px; border:1px solid var(--border,#f3f4f6); margin-bottom:8px; transition:background .15s; }
        .ord-item:last-child { margin-bottom:0; }
        .ord-item:hover { background:var(--bg3,#fafafa); }
        .ord-item-img { width:56px; height:56px; border-radius:9px; object-fit:cover; border:1px solid var(--border,#f0f0f0); flex-shrink:0; background:rgba(249,115,22,.08); }
        .ord-item-name { font-size:14px; font-weight:700; color:var(--text,#1a1a1a); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ord-item-qty  { font-size:12.5px; color:var(--text2,#9ca3af); margin-top:2px; }
        .ord-item-sub  { font-size:clamp(12px, 3.5vw, 15px); font-weight:800; color:var(--text,#1a1a1a); flex-shrink:0; max-width:120px; text-align:right; word-break:break-word; overflow-wrap:anywhere; line-height:1.2; }

        /* ACTIONS */
        .ord-card-actions { display:flex; gap:8px; margin-top:16px; flex-wrap:wrap; align-items:center; }
        .ord-action-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; transition:all .18s; border:1.5px solid; font-family:'DM Sans',sans-serif; }
        .ord-action-btn.star   { background:rgba(251,191,36,.1); border-color:rgba(251,191,36,.3); color:#d97706; }
        .ord-action-btn.star:hover   { background:rgba(251,191,36,.2); }
        .ord-action-btn.msg    { background:rgba(59,130,246,.08); border-color:rgba(59,130,246,.25); color:#3b82f6; }
        .ord-action-btn.msg:hover    { background:rgba(59,130,246,.15); }
        .ord-action-btn.tracking { background:linear-gradient(135deg,#3b82f6,#6366f1); border-color:transparent; color:white; font-weight:700; box-shadow:0 4px 14px rgba(59,130,246,.35); }
        .ord-action-btn.tracking:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(59,130,246,.45); }
        .ord-action-btn.delivery-mgmt { background:linear-gradient(135deg,#f97316,#fb923c); border-color:transparent; color:white; font-weight:700; box-shadow:0 4px 14px rgba(249,115,22,.35); }
        .ord-action-btn.delivery-mgmt:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(249,115,22,.45); }

        /* ── BOUTON ANNULATION ── */
        .ord-action-btn.cancel-btn { background:rgba(239,68,68,.07); border-color:rgba(239,68,68,.25); color:#ef4444; }
        .ord-action-btn.cancel-btn:hover { background:rgba(239,68,68,.15); border-color:#ef4444; }

        /* BANDEAU VENDEUR */
        .ord-vendor-banner { display:flex; align-items:center; justify-content:space-between; background:linear-gradient(135deg,#fff7ed,#ffedd5); border:1.5px solid #fed7aa; border-radius:14px; padding:14px 20px; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
        .ord-vendor-banner-left { display:flex; align-items:center; gap:10px; }
        .ord-vendor-banner-btn { display:inline-flex; align-items:center; gap:7px; background:#f97316; color:white; border:none; border-radius:10px; padding:9px 18px; font-size:13.5px; font-weight:700; cursor:pointer; box-shadow:0 4px 14px rgba(249,115,22,.35); transition:all .18s; white-space:nowrap; font-family:'DM Sans',sans-serif; }
        .ord-vendor-banner-btn:hover { background:#ea6a0a; transform:translateY(-1px); }

        /* MODAL ANNULATION */
        .cancel-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(3px); }
        .cancel-modal { background:white; border-radius:20px; padding:28px; max-width:420px; width:100%; box-shadow:0 20px 60px rgba(0,0,0,.2); animation:modalIn .2s ease; }
        @keyframes modalIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        .cancel-modal-ico { width:56px; height:56px; background:rgba(239,68,68,.1); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; border:2px solid rgba(239,68,68,.2); }
        .cancel-modal h3 { font-size:18px; font-weight:800; color:#1a1a1a; text-align:center; margin-bottom:8px; }
        .cancel-modal p  { font-size:14px; color:#6b7280; text-align:center; margin-bottom:20px; line-height:1.5; }
        .cancel-modal-actions { display:flex; gap:10px; }
        .cancel-modal-actions button { flex:1; padding:12px; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; border:none; font-family:'DM Sans',sans-serif; transition:all .18s; }
        .cancel-modal-btn-no  { background:#f1f5f9; color:#475569; }
        .cancel-modal-btn-no:hover  { background:#e2e8f0; }
        .cancel-modal-btn-yes { background:#ef4444; color:white; box-shadow:0 4px 14px rgba(239,68,68,.35); }
        .cancel-modal-btn-yes:hover { background:#dc2626; }
        .cancel-modal-btn-yes:disabled { opacity:.6; cursor:not-allowed; }
        .cancel-error { background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:10px 14px; font-size:13px; color:#dc2626; font-weight:600; margin-bottom:14px; display:flex; align-items:center; gap:8px; }

        /* ══ RESPONSIVE ══ */

        /* Tablette */
        @media (max-width:900px) {
          .ord-stats { grid-template-columns:repeat(2,1fr); }
          .ord-main  { padding:0 16px; margin:20px auto; }
        }

        /* Mobile L */
        @media (max-width:640px) {
          .ord-main { margin:14px auto; padding:0 12px; padding-bottom:40px; }
          .ord-stats { grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:18px; }
          .ord-stat-card { padding:12px 14px; gap:10px; }
          .ord-stat-val { font-size:20px; }
          .ord-stat-ico { width:36px; height:36px; border-radius:10px; }
          .ord-stat-lbl { font-size:11.5px; }
          .ord-infos-grid { grid-template-columns:1fr; gap:8px; }
          .ord-card-head { padding:14px 14px; gap:8px; }
          .ord-card-head-left { flex-wrap:wrap; }
          .ord-card-body { padding:14px 14px; }
          .ord-card-amount { text-align:left; width:100%; max-width:none; }
          .ord-amount-val { font-size:clamp(15px,5vw,20px); }
          .ord-amount-lbl { font-size:11px; }
          .ord-item-img { width:44px; height:44px; }
          .ord-item-name { font-size:13px; }
          .ord-item-qty  { font-size:11.5px; }
          .ord-item-sub  { max-width:100px; font-size:12.5px; }
          .ord-item { padding:8px 10px; gap:10px; }
          .ord-card-actions { gap:6px; margin-top:12px; }
          .ord-action-btn { font-size:12px; padding:7px 12px; }
          .ord-filters { display:none !important; }
          .ord-filters-mobile { display:flex !important; }
          .ord-toolbar { gap:8px; margin-bottom:14px; }
          .ord-vendor-banner { padding:12px 14px; }
          .ord-vendor-banner-left { flex-wrap:nowrap; }
          .ord-vendor-banner-btn { font-size:12px; padding:7px 12px; }
          .ord-id { font-size:14px; }
          .ord-badge { font-size:11.5px; padding:4px 10px; }
          .ord-date { font-size:11.5px; }
          .ord-articles-titre { font-size:11px; }
          .ord-info-lbl { font-size:10px; }
          .ord-info-val { font-size:12.5px; }
          .ord-empty { padding:48px 16px; }
          .ord-empty-ico { width:80px; height:80px; }
          .ord-empty h2 { font-size:18px; }
        }

        /* Mobile S */
        @media (max-width:420px) {
          .ord-main { padding:0 10px; }
          .ord-stats { grid-template-columns:1fr 1fr; gap:8px; }
          .ord-stat-card { padding:10px 12px; gap:8px; }
          .ord-stat-val { font-size:18px; }
          .ord-stat-ico { width:32px; height:32px; }
          .ord-card-body { padding:12px 12px; }
          .ord-card-head { padding:12px 12px; }
          .ord-item { padding:8px 8px; gap:8px; }
          .ord-item-img { width:40px; height:40px; border-radius:7px; }
          .ord-item-sub { max-width:80px; font-size:12px; }
          .ord-action-btn { font-size:11.5px; padding:6px 10px; }
          .ord-id { font-size:13px; }
          .ord-vendor-banner { flex-direction:column; align-items:flex-start; }
          .ord-vendor-banner-btn { width:100%; justify-content:center; }
        }
      `}</style>

      <Navbar pageCourante="/orders" />

      {/* ── Modal de confirmation d'annulation ── */}
      {cancelTarget && (
        <div className="cancel-overlay" onClick={() => !cancelling && setCancelTarget(null)}>
          <div className="cancel-modal" onClick={e => e.stopPropagation()}>
            <div className="cancel-modal-ico">
              <AlertTriangle size={28} style={{ color: '#ef4444' }} />
            </div>
            <h3>Annuler la commande ?</h3>
            <p>
              Vous êtes sur le point d'annuler la commande <strong>#{cancelTarget.id}</strong>.
              Cette action est irréversible et le stock sera remis à jour.
            </p>
            {cancelError && (
              <div className="cancel-error">
                <X size={14} /> {cancelError}
              </div>
            )}
            <div className="cancel-modal-actions">
              <button className="cancel-modal-btn-no" onClick={() => { setCancelTarget(null); setCancelError(''); }}>
                Non, garder
              </button>
              <button className="cancel-modal-btn-yes" disabled={cancelling} onClick={handleCancelConfirm}>
                {cancelling ? 'Annulation…' : 'Oui, annuler'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="ord-main">

        {/* ── Titre ── */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px' }}>
          <div style={{ width:'40px', height:'40px', background:'rgba(249,115,22,.12)', borderRadius:'11px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ShoppingBag size={20} style={{ color:'#f97316' }}/>
          </div>
          <div>
            <h1 style={{ fontSize:'22px', fontWeight:'800', color:'var(--text,#1a1a1a)', letterSpacing:'-.5px', margin:0 }}>
              {isVendeur ? 'Commandes reçues' : 'Mes commandes'}
            </h1>
            <p style={{ fontSize:'13px', color:'var(--text2,#9ca3af)', marginTop:'1px', margin:0 }}>
              {orders.length} commande{orders.length !== 1 ? 's' : ''} au total
            </p>
          </div>
        </div>

        {/* ── Bandeau vendeur ── */}
        {isVendeur && (
          <div className="ord-vendor-banner">
            <div className="ord-vendor-banner-left">
              <div style={{ width:38, height:38, background:'linear-gradient(135deg,#f97316,#fb923c)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}><Truck size={18} color="#fff"/></div>
              <div>
                <div style={{ fontWeight:800, fontSize:'14px', color:'#92400e' }}>Interface de livraison GPS</div>
                <div style={{ fontSize:'12.5px', color:'#b45309' }}>Gérez vos livraisons, partagez votre position et envoyez des photos en temps réel</div>
              </div>
            </div>
            <button className="ord-vendor-banner-btn" onClick={() => router.push('/vendor/deliveries')}>
              <Navigation size={15}/> Gérer mes livraisons
            </button>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="ord-stats">
          {stats.map(({ label, value, icon: Ico, color, bg }) => (
            <div key={label} className="ord-stat-card">
              <div className="ord-stat-ico" style={{ background: bg }}><Ico size={20} style={{ color }}/></div>
              <div>
                <div className="ord-stat-val">{value}</div>
                <div className="ord-stat-lbl">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="ord-toolbar">
          <div className="ord-search-wrap">
            <Search size={16} className="ord-search-ico"/>
            <input
              type="text" className="ord-search"
              placeholder="Rechercher par numéro ou produit…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="ord-filters">
            {FILTERS.map(f => (
              <button key={f.id}
                className={`ord-filter-btn${filterStatus === f.id ? ' active' : ''}`}
                onClick={() => setFilterStatus(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Filtre mobile ── */}
        <div className="ord-filters-mobile" style={{ overflowX:'auto', marginBottom:'16px', paddingBottom:'4px' }}>
          {FILTERS.map(f => (
            <button key={f.id}
              style={{ padding:'7px 14px', borderRadius:'999px', fontSize:'13px', fontWeight:'600', border:`1.5px solid ${filterStatus === f.id ? '#f97316' : '#e5e7eb'}`, background: filterStatus === f.id ? '#f97316' : 'var(--card,#fff)', color: filterStatus === f.id ? '#fff' : '#555', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}
              onClick={() => setFilterStatus(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <style>{`.ord-filters-mobile { display:none; gap:6px; } @media(max-width:640px){ .ord-filters-mobile{ display:flex; } }`}</style>

        {/* ── Empty ── */}
        {filtered.length === 0 ? (
          <div className="ord-empty">
            <div className="ord-empty-ico"><Package size={44} style={{ color:'#f97316' }}/></div>
            <h2>{orders.length === 0 ? 'Aucune commande' : 'Aucun résultat'}</h2>
            <p>{orders.length === 0
              ? isVendeur ? "Vous n'avez pas encore reçu de commande." : "Vous n'avez pas encore passé de commande."
              : 'Essayez un autre filtre ou terme de recherche.'}
            </p>
            {orders.length === 0 && !isVendeur && (
              <button className="ord-shop-btn" onClick={() => router.push('/')}>
                <ShoppingBag size={16}/> Découvrir les produits
              </button>
            )}
          </div>
        ) : (
          <div className="ord-list">
            {filtered.map(order => {
              const s = getStatus(order.status);
              const StatusIcon = s.icon;

              const showTrackingBtn  = !isVendeur && ['pending', 'processing', 'shipped'].includes(order.status);
              const showDeliveryBtn  = isVendeur  && ['pending', 'processing', 'shipped'].includes(order.status);
              // ✅ Acheteur peut annuler si pending ou processing uniquement
              const canCancel = !isVendeur && ['pending', 'processing'].includes(order.status);

              return (
                <div key={order.id} className="ord-card">

                  {/* En-tête */}
                  <div className="ord-card-head">
                    <div className="ord-card-head-left">
                      <div className="ord-status-ico" style={{ background: s.bg }}>
                        <StatusIcon size={18} style={{ color: s.dot }}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div className="ord-id">Commande #{order.id}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'4px', flexWrap:'wrap' }}>
                          <span className="ord-badge" style={{ background: s.bg, borderColor: s.border, color: s.text }}>
                            <span className="ord-badge-dot" style={{ background: s.dot }}/>
                            {s.label}
                          </span>
                          <div className="ord-date">
                            <Calendar size={12}/>
                            {new Date(order.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
                          </div>
                          <div className="ord-date">
                            <Package size={12}/>
                            {order.items?.length || 0} article{(order.items?.length || 0) > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ord-card-amount">
                      <div className="ord-amount-val">{parseFloat(order.total_amount || order.total || 0).toLocaleString('fr-FR')}</div>
                      <div className="ord-amount-lbl">FCFA</div>
                    </div>
                  </div>

                  {/* Corps */}
                  <div className="ord-card-body">

                    {/* Infos livraison */}
                    <div className="ord-infos-grid">
                      <div className="ord-info-box">
                        <div className="ord-info-ico" style={{ background:'rgba(59,130,246,.12)' }}>
                          <MapPin size={16} style={{ color:'#3b82f6' }}/>
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div className="ord-info-lbl">Adresse de livraison</div>
                          <div className="ord-info-val">{order.delivery_address}</div>
                        </div>
                      </div>
                      {(order.phone || order.buyer_phone) && (
                        <div className="ord-info-box">
                          <div className="ord-info-ico" style={{ background:'rgba(34,197,94,.1)' }}>
                            <Phone size={16} style={{ color:'#22c55e' }}/>
                          </div>
                          <div>
                            <div className="ord-info-lbl">Téléphone</div>
                            <div className="ord-info-val">{order.phone || order.buyer_phone}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Articles */}
                    <div className="ord-articles-titre">
                      <Package size={14}/> Articles commandés
                    </div>
                    {order.items?.map(item => (
                      <div key={item.id} className="ord-item">
                        <img
                          src={getImageUrl(item.product_image)} alt={item.product_name}
                          className="ord-item-img"
                          onError={e => { e.target.src='https://placehold.co/56x56/fff7ed/f97316?text=CI'; }}
                        />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div className="ord-item-name">{item.product_name}</div>
                          <div className="ord-item-qty">
                            {item.quantity} × {parseFloat(item.price).toLocaleString('fr-FR')} FCFA
                          </div>
                        </div>
                        <div className="ord-item-sub">
                          {parseFloat(item.subtotal || item.price * item.quantity).toLocaleString('fr-FR')} <small style={{ fontSize:'11px', color:'#9ca3af', fontWeight:600 }}>FCFA</small>
                        </div>
                      </div>
                    ))}

                    {/* ── ACTIONS ── */}
                    <div className="ord-card-actions">

                      {/* ACHETEUR — Suivi GPS */}
                      {showTrackingBtn && (
                        <button
                          className="ord-action-btn tracking"
                          onClick={() => router.push(`/orders/${order.id}/tracking`)}
                        >
                          <Navigation size={14}/>
                          Suivre ma livraison
                        </button>
                      )}

                      {/* VENDEUR — Gestion livraison */}
                      {showDeliveryBtn && (
                        <button
                          className="ord-action-btn delivery-mgmt"
                          onClick={() => router.push('/vendor/deliveries')}
                        >
                          <Truck size={14}/>
                          Gérer la livraison
                        </button>
                      )}

                      {/* ✅ ACHETEUR — Annuler commande (pending ou processing seulement) */}
                      {canCancel && (
                        <button
                          className="ord-action-btn cancel-btn"
                          onClick={() => { setCancelTarget(order); setCancelError(''); }}
                        >
                          <X size={14}/>
                          Annuler
                        </button>
                      )}

                      {/* Vendeur — livraison confirmée */}
                      {isVendeur && order.status === 'delivered' && (
                        <span style={{ fontSize:'12.5px', color:'#9ca3af', display:'flex', alignItems:'center', gap:'5px' }}>
                          <CheckCircle2 size={13} style={{ color:'#22c55e' }}/> Livraison confirmée
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}