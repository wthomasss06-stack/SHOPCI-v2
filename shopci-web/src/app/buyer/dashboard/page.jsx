'use client';

// ecommerce-frontend/src/pages/BuyerDashboard.jsx
// ✅ Section commandes fusionnée avec OrdersPage — cartes complètes + recherche + filtres + annulation

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag, Package, Clock, MapPin, Phone, LogOut, Eye,
  Settings, ShoppingCart, TrendingUp, Award, ChevronDown, ChevronRight,
  CheckCircle2, Ban, Star, MessageCircle, Truck, DollarSign,
  Calendar, Home, RefreshCw, BarChart3, ArrowUpRight, ArrowDownRight,
  Navigation, AlertTriangle, X, Search
} from 'lucide-react';
import { ordersAPI, authAPI } from '@/services/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageLoader from '@/components/Loader';

/* ── Mini Sparkline SVG ────────────────────────────────── */
function Sparkline({ data = [], color = '#f97316', width = 80, height = 32, fill = true }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ flexShrink:0 }}>
      {fill && <path d={areaPath} fill={color} opacity="0.12"/>}
      <path d={linePath} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="3" fill={color}/>
    </svg>
  );
}

/* ── Donut chart SVG ───────────────────────────────────── */
function DonutChart({ segments = [], size = 120, stroke = 22 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg, i) => {
        const len = (seg.value / total) * circ;
        const gap = 3;
        const el = (
          <circle key={i}
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={`${Math.max(0, len - gap)} ${circ - Math.max(0, len - gap)}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ transition:'stroke-dasharray .6s ease' }}
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}

/* ── Bar chart SVG ─────────────────────────────────────── */
function BarChart({ data = [], color = '#f97316', height = 80 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = 100 / data.length;
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ overflow:'visible' }}>
      {data.map((d, i) => {
        const bh = (d.value / max) * (height - 10);
        const x = i * barW + barW * 0.15;
        const w = barW * 0.7;
        return (
          <g key={i}>
            <rect x={x} y={height - bh - 2} width={w} height={bh}
              rx="2" fill={d.highlight ? color : `${color}44`}
              style={{ transition:'height .4s ease', transformOrigin:'bottom' }}/>
          </g>
        );
      })}
    </svg>
  );
}

/* ════════════════════════════════════════════════════════ */
export default function BuyerDashboard() {
  const router = useRouter();
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState('all');
  // ── OrdersPage state ──
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm,   setSearchTerm]   = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling,   setCancelling]   = useState(false);
  const [cancelError,  setCancelError]  = useState('');

  const user = authAPI.getCurrentUser();

  const getImageUrl = (p) => {
    if (!p) return 'https://placehold.co/48x48/fff7ed/f97316?text=?';
    if (p.startsWith('http')) return p;
    const base = (import.meta.env?.VITE_API_URL || 'http://localhost:8000').replace(/\/api$/, '');
    return `${base}${p.startsWith('/') ? p : `/${p}`}`;
  };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ordersAPI.getAll();
      setOrders(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!user || user.user_type !== 'acheteur') { router.push('/login'); return; }
    loadOrders();
  }, [router, loadOrders]);

  /* ── Cancel ── */
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelling(true); setCancelError('');
    try {
      await ordersAPI.updateStatus(cancelTarget.id, { status: 'cancelled' });
      setOrders(prev => prev.map(o => o.id === cancelTarget.id ? { ...o, status: 'cancelled' } : o));
      setCancelTarget(null);
    } catch { setCancelError("Impossible d'annuler. Veuillez réessayer."); }
    finally { setCancelling(false); }
  };

  /* ── Status map ── */
  const STATUS_MAP = {
    pending:    { icon:Clock,        label:'En attente', color:'#d97706', bg:'rgba(251,191,36,.12)',  border:'rgba(251,191,36,.4)',  dot:'#d97706' },
    processing: { icon:Package,      label:'En cours',   color:'#3b82f6', bg:'rgba(59,130,246,.1)',   border:'rgba(59,130,246,.3)',  dot:'#3b82f6' },
    shipped:    { icon:Truck,        label:'Expédié',    color:'#a855f7', bg:'rgba(168,85,247,.1)',   border:'rgba(168,85,247,.3)',  dot:'#a855f7' },
    delivered:  { icon:CheckCircle2, label:'Livré',      color:'#16a34a', bg:'rgba(22,163,74,.12)',   border:'rgba(22,163,74,.3)',   dot:'#22c55e' },
    cancelled:  { icon:Ban,          label:'Annulé',     color:'#dc2626', bg:'rgba(220,38,38,.12)',   border:'rgba(220,38,38,.3)',   dot:'#ef4444' },
  };
  const getStatus = (s) => STATUS_MAP[s] || STATUS_MAP.pending;

  const FILTERS = [
    { id:'all',        label:'Toutes'     },
    { id:'pending',    label:'En attente' },
    { id:'processing', label:'En cours'   },
    { id:'shipped',    label:'Expédié'    },
    { id:'delivered',  label:'Livré'      },
    { id:'cancelled',  label:'Annulé'     },
  ];

  /* ── Stats ── */
  const stats = {
    total:     orders.length,
    done:      orders.filter(o => o.status === 'delivered').length,
    active:    orders.filter(o => ['pending','processing','shipped'].includes(o.status)).length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    spent:     orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0),
  };

  const sparkData = {
    total:  [2,3,2,5,4,6,stats.total||4],
    done:   [1,1,2,3,2,4,stats.done||2],
    active: [0,1,1,2,1,2,stats.active||1],
    spent:  [15,28,20,45,38,55,Math.round(stats.spent/1000)||3],
  };

  const donutData = [
    { label:'Livrées',  value:stats.done,      color:'#22c55e' },
    { label:'En cours', value:stats.active,    color:'#3b82f6' },
    { label:'Annulées', value:stats.cancelled, color:'#ef4444' },
  ].filter(d => d.value > 0);

  const months = ['J','F','M','A','M','J','J','A','S','O','N','D'];
  const currentMonth = new Date().getMonth();
  const barData = months.map((m, i) => ({
    label: m,
    value: i < currentMonth ? Math.floor(Math.random() * 5 + 1) : i === currentMonth ? stats.total || 2 : 0,
    highlight: i === currentMonth,
  }));

  const STAT_CARDS = [
    { icon:ShoppingBag,  label:'Commandes', value:stats.total,  color:'#2563eb', iconBg:'rgba(37,99,235,.12)',   spark:sparkData.total,  trend:+12 },
    { icon:CheckCircle2, label:'Livrées',   value:stats.done,   color:'#16a34a', iconBg:'#f0fdf4',               spark:sparkData.done,   trend:+8  },
    { icon:Clock,        label:'En cours',  value:stats.active, color:'#d97706', iconBg:'rgba(245,158,11,.12)',  spark:sparkData.active, trend:-2  },
    { icon:DollarSign,   label:'Dépensé',   value:`${(stats.spent/1000).toFixed(0)}k`, color:'#f97316', iconBg:'rgba(249,115,22,.12)', spark:sparkData.spent, trend:+22, sub:'FCFA' },
  ];

  /* ── Filtered orders (combiné tab + search + filterStatus) ── */
  const filteredOrders = orders.filter(o => {
    // tab simple (all / pending / delivered / cancelled)
    const matchTab = activeTab === 'all' || o.status === activeTab;
    // filtre status fin-grain depuis la barre de recherche zone
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    // recherche
    const term = searchTerm.toLowerCase();
    const matchSearch = !searchTerm ||
      String(o.id).includes(searchTerm) ||
      o.items?.some(i => i.product_name?.toLowerCase().includes(term));
    return matchTab && matchStatus && matchSearch;
  });

  if (loading) return <PageLoader message="Chargement de votre espace…" />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .bd-root, .bd-root * { font-family:'DM Sans',sans-serif; box-sizing:border-box; }

        @keyframes bd-fadein { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .bd-fade { animation:bd-fadein .5s cubic-bezier(.22,1,.36,1) both; }

        /* ── STAT CARDS ── */
        .bd-stat {
          transition:transform .2s, box-shadow .2s; cursor:pointer;
          background:var(--card); border-radius:18px; border:1px solid var(--border);
          padding:18px 16px; box-shadow:0 2px 8px rgba(0,0,0,.04);
          display:flex; flex-direction:column; gap:0; overflow:hidden;
          min-width:0;
        }
        .bd-stat:hover { transform:translateY(-3px); box-shadow:0 10px 32px rgba(0,0,0,.10)!important; }

        /* Valeur : s'adapte à la largeur disponible */
        .bd-stat-val {
          font-size:clamp(16px, 4vw, 28px);
          font-weight:800; color:var(--text);
          letter-spacing:-.03em; line-height:1.1;
          word-break:break-word; overflow-wrap:anywhere;
          hyphens:auto;
        }

        /* ── CHARTS ── */
        .bd-chart-card { background:var(--card); border-radius:18px; border:1px solid var(--border); box-shadow:0 2px 8px rgba(0,0,0,.04); padding:20px; }
        @media(max-width:1024px) { .bd-charts-row { grid-template-columns:1fr!important; } }

        /* ── STATS GRID ── */
        .bd-stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
        @media(max-width:900px)  { .bd-stats-grid { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:440px)  { .bd-stats-grid { grid-template-columns:1fr 1fr; gap:10px; } }

        /* ── STAT CARD MOBILE : layout horizontal icone + texte ── */
        @media(max-width:500px) {
          .bd-stat {
            flex-direction:row; align-items:center; gap:12px;
            padding:13px 14px;
          }
          .bd-stat-top { flex-shrink:0; }
          .bd-stat-main { flex:1; min-width:0; }
          .bd-stat-spark { display:none; }
          .bd-stat-val { font-size:clamp(14px, 5vw, 22px); }
          .bd-stat-trend { display:none; }
        }
        @media(max-width:360px) {
          .bd-stat { padding:11px 12px; gap:10px; }
          .bd-stat-val { font-size:14px; }
        }

        /* ── SECTION ── */
        .bd-section { background:var(--card); border-radius:20px; border:1px solid var(--border); box-shadow:0 2px 8px rgba(0,0,0,.04); overflow:hidden; }
        .bd-section-header { padding:20px 20px 0; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; }

        /* ── TABS ── */
        .bd-tabs { display:flex; gap:4px; padding:14px 16px 0; overflow-x:auto; scrollbar-width:none; }
        .bd-tabs::-webkit-scrollbar { display:none; }
        .bd-tab { padding:8px 16px; border-radius:10px; border:none; background:none; font-size:13px; font-weight:600; cursor:pointer; color:#9ca3af; transition:all .18s; white-space:nowrap; font-family:'DM Sans',sans-serif; }
        .bd-tab.active { background:rgba(249,115,22,.12); color:#f97316; }
        .bd-tab:hover:not(.active) { background:var(--bg3); color:var(--text); }

        /* ── SEARCH + FILTERS ── */
        .bd-toolbar { display:flex; align-items:center; gap:10px; padding:14px 16px; flex-wrap:wrap; border-bottom:1px solid var(--border); }
        .bd-search-wrap { position:relative; flex:1; min-width:160px; }
        .bd-search-ico { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:var(--text3); pointer-events:none; }
        .bd-search { width:100%; padding:9px 12px 9px 34px; border:1.5px solid var(--border); border-radius:10px; font-size:13.5px; font-family:'DM Sans',sans-serif; outline:none; transition:border-color .18s; background:var(--input,#f3f4f6); color:var(--text); }
        .bd-search:focus { border-color:#f97316; box-shadow:0 0 0 3px rgba(249,115,22,.1); }
        .bd-search::placeholder { color:var(--text3); }
        .bd-filters { display:flex; gap:5px; flex-wrap:wrap; }
        .bd-filter-btn { padding:7px 13px; border-radius:999px; font-size:12.5px; font-weight:600; border:1.5px solid var(--border); background:var(--card); color:var(--text2); cursor:pointer; transition:all .18s; white-space:nowrap; font-family:'DM Sans',sans-serif; }
        .bd-filter-btn:hover { border-color:#fed7aa; color:#f97316; background:rgba(249,115,22,.08); }
        .bd-filter-btn.active { background:#f97316; border-color:#f97316; color:#fff; }
        @media(max-width:640px) {
          .bd-filters { display:none; }
          .bd-toolbar { padding:10px 12px; gap:8px; }
        }

        /* ── MOBILE FILTER SCROLL ── */
        .bd-filters-mobile { display:none; gap:6px; padding:10px 14px; overflow-x:auto; scrollbar-width:none; border-bottom:1px solid var(--border); }
        .bd-filters-mobile::-webkit-scrollbar { display:none; }
        @media(max-width:640px) { .bd-filters-mobile { display:flex; } }

        /* ── ORDER CARDS ── */
        .bd-ord-list { display:flex; flex-direction:column; gap:12px; padding:14px 16px 20px; }
        .bd-ord-card { background:var(--bg3,#fafafa); border-radius:14px; border:1px solid var(--border); overflow:hidden; transition:box-shadow .18s, transform .18s; cursor:pointer; }
        .bd-ord-card:hover { box-shadow:0 6px 22px rgba(0,0,0,.1); transform:translateY(-1px); }
        .bd-ord-card-head { display:flex; align-items:flex-start; justify-content:space-between; padding:14px 16px; border-bottom:1px solid var(--border); flex-wrap:wrap; gap:10px; background:var(--card); }
        .bd-ord-card-left { display:flex; align-items:flex-start; gap:11px; flex:1; min-width:0; }
        .bd-ord-status-ico { width:40px; height:40px; border-radius:11px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .bd-ord-id { font-size:16px; font-weight:800; color:var(--text); }
        .bd-ord-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 11px; border-radius:999px; font-size:12px; font-weight:700; border:1.5px solid; }
        .bd-ord-date { display:flex; align-items:center; gap:4px; font-size:12px; color:var(--text3); }
        .bd-ord-amount { text-align:right; flex-shrink:0; }
        .bd-ord-amount-val { font-size:20px; font-weight:800; color:var(--text); }
        .bd-ord-card-body { padding:14px 16px; }
        .bd-ord-infos-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px; }
        @media(max-width:500px) { .bd-ord-infos-grid { grid-template-columns:1fr; } }
        .bd-ord-info-box { background:var(--card); border:1px solid var(--border); border-radius:10px; padding:10px 12px; display:flex; gap:9px; align-items:flex-start; }
        .bd-ord-info-ico { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .bd-ord-info-lbl { font-size:10.5px; font-weight:700; color:var(--text3); text-transform:uppercase; letter-spacing:.4px; margin-bottom:2px; }
        .bd-ord-info-val { font-size:13px; font-weight:600; color:var(--text); word-break:break-word; }
        .bd-ord-articles-titre { display:flex; align-items:center; gap:7px; font-size:11.5px; font-weight:700; color:var(--text2); text-transform:uppercase; letter-spacing:.5px; margin-bottom:10px; }
        .bd-ord-item { display:flex; align-items:center; gap:11px; padding:9px 11px; border-radius:10px; border:1px solid var(--border); margin-bottom:7px; background:var(--card); transition:background .15s; }
        .bd-ord-item:last-child { margin-bottom:0; }
        .bd-ord-item:hover { background:var(--bg2,#f9fafb); }
        .bd-ord-item-img { width:50px; height:50px; border-radius:8px; object-fit:cover; border:1px solid var(--border); flex-shrink:0; background:rgba(249,115,22,.08); }
        .bd-ord-item-name { font-size:13.5px; font-weight:700; color:var(--text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .bd-ord-item-qty { font-size:12px; color:var(--text3); margin-top:1px; }
        .bd-ord-item-sub { font-size:14px; font-weight:800; color:var(--text); flex-shrink:0; white-space:nowrap; }
        .bd-ord-actions { display:flex; gap:7px; margin-top:14px; flex-wrap:wrap; align-items:center; }
        .bd-ord-action-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 15px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; transition:all .18s; border:1.5px solid; font-family:'DM Sans',sans-serif; white-space:nowrap; }
        .bd-ord-action-btn.tracking { background:linear-gradient(135deg,#3b82f6,#6366f1); border-color:transparent; color:white; font-weight:700; box-shadow:0 4px 14px rgba(59,130,246,.3); }
        .bd-ord-action-btn.tracking:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(59,130,246,.4); }
        .bd-ord-action-btn.cancel { background:rgba(239,68,68,.07); border-color:rgba(239,68,68,.25); color:#ef4444; }
        .bd-ord-action-btn.cancel:hover { background:rgba(239,68,68,.15); border-color:#ef4444; }
        .bd-ord-action-btn.star { background:rgba(245,158,11,.1); border-color:rgba(245,158,11,.3); color:#d97706; }
        .bd-ord-action-btn.star:hover { background:rgba(245,158,11,.18); }
        .bd-ord-action-btn.msg { background:rgba(59,130,246,.08); border-color:rgba(59,130,246,.25); color:#3b82f6; }
        .bd-ord-action-btn.msg:hover { background:rgba(59,130,246,.15); }
        @media(max-width:400px) {
          .bd-ord-action-btn { font-size:12px; padding:7px 11px; }
          .bd-ord-id { font-size:15px; }
          .bd-ord-amount-val { font-size:17px; }
          .bd-ord-card-head { padding:12px 13px; }
          .bd-ord-card-body { padding:12px 13px; }
        }

        /* ── EMPTY ── */
        .bd-ord-empty { padding:56px 20px; text-align:center; }
        .bd-ord-empty-ico { width:72px; height:72px; border-radius:50%; background:rgba(249,115,22,.1); border:2px solid rgba(249,115,22,.25); display:inline-flex; align-items:center; justify-content:center; margin-bottom:14px; }

        /* ── CANCEL MODAL ── */
        .bd-cancel-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(3px); }
        .bd-cancel-modal { background:var(--card); border-radius:20px; padding:28px; max-width:420px; width:100%; box-shadow:0 20px 60px rgba(0,0,0,.25); animation:bd-fadein .2s ease; border:1px solid var(--border); }
        .bd-cancel-modal-ico { width:56px; height:56px; background:rgba(239,68,68,.1); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; border:2px solid rgba(239,68,68,.2); }
        .bd-cancel-modal h3 { font-size:18px; font-weight:800; color:var(--text); text-align:center; margin-bottom:8px; }
        .bd-cancel-modal p  { font-size:14px; color:var(--text2); text-align:center; margin-bottom:20px; line-height:1.6; }
        .bd-cancel-actions { display:flex; gap:10px; }
        .bd-cancel-actions button { flex:1; padding:12px; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; border:none; font-family:'DM Sans',sans-serif; transition:all .18s; }
        .bd-cancel-btn-no  { background:var(--bg3); color:var(--text2); }
        .bd-cancel-btn-no:hover  { background:var(--bg2); }
        .bd-cancel-btn-yes { background:#ef4444; color:white; box-shadow:0 4px 14px rgba(239,68,68,.3); }
        .bd-cancel-btn-yes:hover { background:#dc2626; }
        .bd-cancel-btn-yes:disabled { opacity:.6; cursor:not-allowed; }
        .bd-cancel-error { background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.3); border-radius:10px; padding:10px 14px; font-size:13px; color:#ef4444; font-weight:600; margin-bottom:14px; display:flex; align-items:center; gap:8px; }
      `}</style>

      <div className="bd-root" style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>

        <Navbar pageCourante="/buyer/dashboard" />

        {/* ── Cancel Modal ── */}
        {cancelTarget && (
          <div className="bd-cancel-overlay" onClick={() => !cancelling && setCancelTarget(null)}>
            <div className="bd-cancel-modal" onClick={e => e.stopPropagation()}>
              <div className="bd-cancel-modal-ico">
                <AlertTriangle size={28} color="#ef4444"/>
              </div>
              <h3>Annuler la commande ?</h3>
              <p>Vous êtes sur le point d'annuler la commande <strong>#{cancelTarget.id}</strong>. Cette action est irréversible et le stock sera remis à jour.</p>
              {cancelError && (
                <div className="bd-cancel-error"><X size={14}/> {cancelError}</div>
              )}
              <div className="bd-cancel-actions">
                <button className="bd-cancel-btn-no" onClick={() => { setCancelTarget(null); setCancelError(''); }}>Non, garder</button>
                <button className="bd-cancel-btn-yes" disabled={cancelling} onClick={handleCancelConfirm}>
                  {cancelling ? 'Annulation…' : 'Oui, annuler'}
                </button>
              </div>
            </div>
          </div>
        )}

        <main style={{ maxWidth:'1260px', margin:'0 auto', padding:'32px 20px 60px', flex:1, width:'100%' }}>

          {/* ── Welcome ── */}
          <div className="bd-fade" style={{ marginBottom:'28px', display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
            <div>
              <h1 style={{ fontSize:'26px', fontWeight:800, color:'var(--text)', margin:'0 0 5px', letterSpacing:'-.03em', display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:38, height:38, borderRadius:'12px', background:'linear-gradient(135deg,#f97316,#fb923c)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(249,115,22,.3)' }}>
                  <TrendingUp size={20} color="#fff"/>
                </div>
                Tableau de bord
              </h1>
              <p style={{ fontSize:'14px', color:'var(--text3)', margin:0 }}>
                Bonjour <strong style={{ color:'var(--text)', fontWeight:700 }}>{user?.username}</strong> — {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}
              </p>
            </div>
            <button onClick={() => router.push('/')} style={{ display:'flex', alignItems:'center', gap:'7px', background:'#f97316', color:'#fff', border:'none', borderRadius:'12px', padding:'10px 20px', fontWeight:700, fontSize:'13px', cursor:'pointer', boxShadow:'0 4px 14px rgba(249,115,22,.28)', fontFamily:'DM Sans,sans-serif' }}>
              <ShoppingCart size={15}/> Boutique
            </button>
          </div>

          {/* ── Stats ── */}
          <div className="bd-stats-grid bd-fade" style={{ animationDelay:'40ms' }}>
            {STAT_CARDS.map((s, i) => (
              <div key={i} className="bd-stat bd-fade" style={{ animationDelay:`${i*60}ms` }}>
                <div className="bd-stat-top" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'10px', gap:'6px' }}>
                  <div style={{ width:42, height:42, borderRadius:'12px', background:s.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <s.icon size={20} color={s.color}/>
                  </div>
                  <div className="bd-stat-trend" style={{ display:'flex', alignItems:'center', gap:'2px', fontSize:'10.5px', fontWeight:700, color: s.trend >= 0 ? '#16a34a' : '#dc2626', background: s.trend >= 0 ? 'rgba(22,163,74,.12)' : 'rgba(220,38,38,.12)', padding:'3px 6px', borderRadius:'20px', flexShrink:0 }}>
                    {s.trend >= 0 ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}
                    {Math.abs(s.trend)}%
                  </div>
                </div>
                <div className="bd-stat-main">
                  <div className="bd-stat-val">{s.value}{s.sub && <span style={{ fontSize:'12px', fontWeight:600, color:'var(--text3)', marginLeft:'3px' }}>{s.sub}</span>}</div>
                  <div style={{ fontSize:'12px', color:'var(--text3)', marginTop:'3px', fontWeight:500 }}>{s.label}</div>
                </div>
                <div className="bd-stat-spark" style={{ marginTop:'10px' }}>
                  <Sparkline data={s.spark} color={s.color} width={100} height={28}/>
                </div>
              </div>
            ))}
          </div>

          {/* ── Charts ── */}
          <div className="bd-charts-row bd-fade" style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'16px', marginBottom:'24px', animationDelay:'120ms' }}>
            <div className="bd-chart-card">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
                <div>
                  <h3 style={{ fontWeight:800, fontSize:'15px', color:'var(--text)', margin:'0 0 3px' }}>Activité mensuelle</h3>
                  <p style={{ fontSize:'12px', color:'var(--text3)', margin:0 }}>Commandes par mois — {new Date().getFullYear()}</p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(249,115,22,.12)', border:'1px solid rgba(249,115,22,.35)', borderRadius:'8px', padding:'5px 10px' }}>
                  <BarChart3 size={13} color="#f97316"/>
                  <span style={{ fontSize:'12px', fontWeight:700, color:'#f97316' }}>{stats.total} total</span>
                </div>
              </div>
              <div style={{ height:'100px', display:'flex', alignItems:'flex-end' }}>
                <BarChart data={barData} color="#f97316" height={90}/>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px', padding:'0 2px' }}>
                {months.map((m, i) => (
                  <span key={m} style={{ fontSize:'10px', color: i === currentMonth ? '#f97316' : '#d1d5db', fontWeight: i === currentMonth ? 800 : 400, flex:1, textAlign:'center' }}>{m}</span>
                ))}
              </div>
            </div>

            <div className="bd-chart-card" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' }}>
              <div style={{ width:'100%' }}>
                <h3 style={{ fontWeight:800, fontSize:'15px', color:'var(--text)', margin:'0 0 3px' }}>Statut des commandes</h3>
                <p style={{ fontSize:'12px', color:'var(--text3)', margin:0 }}>Vue d'ensemble</p>
              </div>
              {donutData.length > 0 ? (
                <>
                  <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <DonutChart segments={donutData} size={130} stroke={24}/>
                    <div style={{ position:'absolute', textAlign:'center' }}>
                      <div style={{ fontSize:'24px', fontWeight:800, color:'var(--text)', lineHeight:1 }}>{stats.total}</div>
                      <div style={{ fontSize:'11px', color:'var(--text3)', fontWeight:500 }}>total</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px', width:'100%' }}>
                    {donutData.map((seg, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                          <div style={{ width:10, height:10, borderRadius:'50%', background:seg.color, flexShrink:0 }}/>
                          <span style={{ fontSize:'12px', color:'var(--text2)', fontWeight:500 }}>{seg.label}</span>
                        </div>
                        <span style={{ fontSize:'13px', fontWeight:700, color:'var(--text)' }}>{seg.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text3)', fontSize:'13px' }}>Aucune donnée</div>
              )}
            </div>
          </div>

          {/* ════════════════════════════════════
              SECTION COMMANDES — fusionnée OrdersPage
          ════════════════════════════════════ */}
          <div className="bd-section bd-fade" style={{ animationDelay:'200ms' }}>

            {/* Header */}
            <div className="bd-section-header">
              <h2 style={{ fontSize:'17px', fontWeight:800, color:'var(--text)', margin:0, display:'flex', alignItems:'center', gap:'8px' }}>
                <ShoppingBag size={19} color="#f97316"/> Mes commandes
                <span style={{ fontSize:'12px', fontWeight:600, color:'var(--text3)', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'20px', padding:'2px 9px' }}>{orders.length}</span>
              </h2>
            </div>

            {/* Tabs filtre rapide */}
            <div className="bd-tabs">
              {[
                { key:'all',       label:`Toutes (${orders.length})` },
                { key:'pending',   label:`En attente (${orders.filter(o=>o.status==='pending').length})` },
                { key:'shipped',   label:`Expédiées (${orders.filter(o=>o.status==='shipped').length})` },
                { key:'delivered', label:`Livrées (${stats.done})` },
                { key:'cancelled', label:`Annulées (${stats.cancelled})` },
              ].map(tab => (
                <button key={tab.key}
                  className={`bd-tab${activeTab===tab.key?' active':''}`}
                  onClick={() => { setActiveTab(tab.key); setFilterStatus('all'); setSearchTerm(''); }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Toolbar recherche + filtres fins */}
            <div className="bd-toolbar">
              <div className="bd-search-wrap">
                <Search size={15} className="bd-search-ico"/>
                <input
                  type="text"
                  className="bd-search"
                  placeholder="Rechercher par numéro ou produit…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="bd-filters">
                {FILTERS.map(f => (
                  <button key={f.id}
                    className={`bd-filter-btn${filterStatus===f.id?' active':''}`}
                    onClick={() => setFilterStatus(f.id)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtres mobile scroll */}
            <div className="bd-filters-mobile">
              {FILTERS.map(f => (
                <button key={f.id}
                  style={{ padding:'6px 13px', borderRadius:'999px', fontSize:'12.5px', fontWeight:'600', border:`1.5px solid ${filterStatus===f.id?'#f97316':'var(--border)'}`, background:filterStatus===f.id?'#f97316':'var(--card)', color:filterStatus===f.id?'#fff':'var(--text2)', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, fontFamily:'DM Sans,sans-serif' }}
                  onClick={() => setFilterStatus(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* ── Contenu ── */}
            {orders.length === 0 ? (
              <div className="bd-ord-empty">
                <div className="bd-ord-empty-ico"><ShoppingBag size={38} color="#f97316"/></div>
                <p style={{ fontSize:'17px', fontWeight:700, color:'var(--text)', margin:'0 0 6px' }}>Aucune commande</p>
                <p style={{ fontSize:'13.5px', color:'var(--text3)', margin:'0 0 22px' }}>Découvrez nos produits et commencez vos achats !</p>
                <button onClick={() => router.push('/')} style={{ background:'#f97316', color:'#fff', border:'none', borderRadius:'12px', padding:'12px 26px', fontWeight:700, fontSize:'14px', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'8px', boxShadow:'0 4px 14px rgba(249,115,22,.3)', fontFamily:'DM Sans,sans-serif' }}>
                  <ShoppingCart size={16}/> Parcourir les produits
                </button>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bd-ord-empty">
                <div className="bd-ord-empty-ico"><Package size={38} color="#f97316"/></div>
                <p style={{ fontSize:'17px', fontWeight:700, color:'var(--text)', margin:'0 0 6px' }}>Aucun résultat</p>
                <p style={{ fontSize:'13px', color:'var(--text3)', margin:0 }}>Essayez un autre filtre ou terme de recherche.</p>
              </div>
            ) : (
              <div className="bd-ord-list">
                {filteredOrders.map((order, idx) => {
                  const s          = getStatus(order.status);
                  const StatusIcon = s.icon;
                  const showTracking = ['pending','processing','shipped'].includes(order.status);
                  const canCancel    = ['pending','processing'].includes(order.status);

                  return (
                    <div key={order.id} className="bd-ord-card bd-fade" style={{ animationDelay:`${idx*40}ms` }}>

                      {/* ── En-tête ── */}
                      <div className="bd-ord-card-head">
                        <div className="bd-ord-card-left">
                          <div className="bd-ord-status-ico" style={{ background:s.bg }}>
                            <StatusIcon size={17} color={s.dot}/>
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div className="bd-ord-id">Commande #{order.id}</div>
                            <div style={{ display:'flex', alignItems:'center', gap:'7px', marginTop:'4px', flexWrap:'wrap' }}>
                              <span className="bd-ord-badge" style={{ background:s.bg, borderColor:s.border, color:s.color }}>
                                <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, flexShrink:0 }}/>
                                {s.label}
                              </span>
                              <div className="bd-ord-date">
                                <Calendar size={11}/>
                                {new Date(order.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })}
                              </div>
                              <div className="bd-ord-date">
                                <Package size={11}/>
                                {order.items?.length||0} article{(order.items?.length||0)>1?'s':''}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bd-ord-amount">
                          <div className="bd-ord-amount-val">{parseFloat(order.total_amount||order.total||0).toLocaleString('fr-FR')}</div>
                          <div style={{ fontSize:'11px', color:'var(--text3)' }}>FCFA</div>
                        </div>
                      </div>

                      {/* ── Corps ── */}
                      <div className="bd-ord-card-body">

                        {/* Infos livraison */}
                        <div className="bd-ord-infos-grid">
                          <div className="bd-ord-info-box">
                            <div className="bd-ord-info-ico" style={{ background:'rgba(59,130,246,.12)' }}>
                              <MapPin size={14} color="#3b82f6"/>
                            </div>
                            <div style={{ minWidth:0 }}>
                              <div className="bd-ord-info-lbl">Adresse de livraison</div>
                              <div className="bd-ord-info-val">{order.delivery_address || '—'}</div>
                            </div>
                          </div>
                          {(order.phone || order.buyer_phone) && (
                            <div className="bd-ord-info-box">
                              <div className="bd-ord-info-ico" style={{ background:'rgba(34,197,94,.1)' }}>
                                <Phone size={14} color="#22c55e"/>
                              </div>
                              <div>
                                <div className="bd-ord-info-lbl">Téléphone</div>
                                <div className="bd-ord-info-val">{order.phone||order.buyer_phone}</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Articles */}
                        <div className="bd-ord-articles-titre">
                          <Package size={13} color="#f97316"/> Articles commandés
                        </div>
                        {order.items?.map(item => (
                          <div key={item.id} className="bd-ord-item">
                            <img
                              src={getImageUrl(item.product_image)}
                              alt={item.product_name}
                              className="bd-ord-item-img"
                              onError={e => { e.target.src='https://placehold.co/50x50/fff7ed/f97316?text=CI'; }}
                            />
                            <div style={{ flex:1, minWidth:0 }}>
                              <div className="bd-ord-item-name">{item.product_name}</div>
                              <div className="bd-ord-item-qty">{item.quantity} × {parseFloat(item.price).toLocaleString('fr-FR')} FCFA</div>
                            </div>
                            <div className="bd-ord-item-sub">
                              {parseFloat(item.subtotal||item.price*item.quantity).toLocaleString('fr-FR')}{' '}
                              <small style={{ fontSize:'11px', color:'var(--text3)', fontWeight:600 }}>FCFA</small>
                            </div>
                          </div>
                        ))}

                        {/* ── Actions ── */}
                        <div className="bd-ord-actions">
                          {showTracking && (
                            <button
                              className="bd-ord-action-btn tracking"
                              onClick={e => { e.stopPropagation(); router.push(`/orders/${order.id}/tracking`); }}>
                              <Navigation size={13}/> Suivre ma livraison
                            </button>
                          )}
                          {order.status === 'delivered' && (
                            <>
                              <button
                                className="bd-ord-action-btn star"
                                onClick={e => e.stopPropagation()}>
                                <Star size={13}/> Laisser un avis
                              </button>
                              <button
                                className="bd-ord-action-btn msg"
                                onClick={e => e.stopPropagation()}>
                                <MessageCircle size={13}/> Contacter le vendeur
                              </button>
                            </>
                          )}
                          {canCancel && (
                            <button
                              className="bd-ord-action-btn cancel"
                              onClick={e => { e.stopPropagation(); setCancelTarget(order); setCancelError(''); }}>
                              <X size={13}/> Annuler
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>{/* end bd-section */}

        </main>

        <Footer />
      </div>
    </>
  );
}