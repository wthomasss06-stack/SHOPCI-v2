'use client';

// ecommerce-frontend/src/pages/VendorDashboard.jsx
// ✅ Responsive mobile complet + onglet Commandes fusionné avec OrdersPage

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, DollarSign, ShoppingBag, TrendingUp, Plus, Edit, Trash2, Eye,
  LogOut, Settings, Home, AlertTriangle, BarChart3, RefreshCw, Zap, Target,
  ChevronDown, ChevronRight, Clock, CheckCircle2, Ban, Phone, Mail,
  MapPin, Award, ArrowUpRight, ArrowDownRight, Activity, ShoppingCart,
  Truck, Navigation, Search, Calendar, X, Filter
} from 'lucide-react';
import { productsAPI, ordersAPI, authAPI } from '@/services/api';
import Navbar from '@/components/Navbar';
import Loader from '@/components/Loader';
import Footer from '@/components/Footer';

/* ── Formatage FCFA ─────────────────────────────────────── */
const fcfa = (val) => {
  const n = parseFloat(val) || 0;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} Md FCFA`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M FCFA`;
  if (n >= 1_000)         return `${(n / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k FCFA`;
  return `${n.toLocaleString('fr-FR')} FCFA`;
};

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

function AreaChart({ data = [], color = '#f97316', color2 = '#3b82f6', height = 120 }) {
  if (!data.length) return null;
  const W = 600; const H = height;
  const values1 = data.map(d => d.value1 || 0);
  const values2 = data.map(d => d.value2 || 0);
  const max = Math.max(...values1, ...values2, 1);
  const toPath = (vals) => {
    const pts = vals.map((v, i) => ({
      x: (i / (vals.length - 1)) * (W - 20) + 10,
      y: H - (v / max) * (H - 20) - 10,
    }));
    let d = '';
    pts.forEach((p, i) => {
      if (i === 0) { d += `M${p.x},${p.y}`; return; }
      const prev = pts[i - 1];
      const cpx = (p.x + prev.x) / 2;
      d += ` C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
    });
    return { line: d, area: `${d} L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z` };
  };
  const { line: line1, area: area1 } = toPath(values1);
  const { line: line2, area: area2 } = toPath(values2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none">
      <defs>
        <linearGradient id="vd-g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/><stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="vd-g2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color2} stopOpacity="0.15"/><stop offset="100%" stopColor={color2} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area2} fill="url(#vd-g2)"/>
      <path d={area1} fill="url(#vd-g1)"/>
      <path d={line2} stroke={color2} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d={line1} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function ProgressBar({ value, max, color = '#f97316', height = 8, label = '', sublabel = '' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ width:'100%' }}>
      {(label || sublabel) && (
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
          <span style={{ fontSize:'12px', fontWeight:600, color:'var(--text2)' }}>{label}</span>
          <span style={{ fontSize:'12px', fontWeight:700, color }}>{sublabel || `${pct.toFixed(0)}%`}</span>
        </div>
      )}
      <div style={{ height, background:'var(--bg3)', borderRadius:height, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:height, transition:'width .6s ease' }}/>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════ */
export default function VendorDashboard() {
  const router = useRouter();
  const [products,     setProducts]     = useState([]);
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState('products');
  // Orders tab state
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm,   setSearchTerm]   = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling,   setCancelling]   = useState(false);
  const [cancelError,  setCancelError]  = useState('');

  const user = authAPI.getCurrentUser();

  const getImageUrl = (p) => {
    if (!p) return 'https://placehold.co/48x48/fff7ed/f97316?text=?';
    if (p.startsWith('http')) return p;
    return `http://localhost:8000${p.startsWith('/') ? p : `/${p}`}`;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pd, od] = await Promise.all([
        productsAPI.getVendorProducts(),
        ordersAPI.getVendorOrders()
      ]);
      setProducts(Array.isArray(pd?.results) ? pd.results : Array.isArray(pd) ? pd : []);
      setOrders(Array.isArray(od?.results) ? od.results : Array.isArray(od) ? od : []);
    } catch { setProducts([]); setOrders([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!user || user.user_type !== 'vendeur') { router.push('/login'); return; }
    loadData();
  }, [router, loadData]);

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try { await productsAPI.delete(id); setProducts(products.filter(p => p.id !== id)); }
    catch { alert('Erreur lors de la suppression'); }
  };

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
    } finally {
      setCancelling(false);
    }
  };

  /* ── Stats ── */
  const stats = {
    totalProducts:   products.length,
    activeProducts:  products.filter(p => Number(p.stock) > 0).length,
    totalSales:      orders.reduce((s, o) => s + (o.items_count || 0), 0),
    revenue:         orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0),
    lowStock:        products.filter(p => { const st = Number(p.stock)||0; return st > 0 && st < 10; }).length,
    outOfStock:      products.filter(p => Number(p.stock) === 0).length,
    pendingOrders:   orders.filter(o => o.status === 'pending').length,
    completedOrders: orders.filter(o => o.status === 'delivered').length,
    totalStock:      products.reduce((s, p) => s + (Number(p.stock)||0), 0),
  };
  const avgOrder = orders.length > 0 ? stats.revenue / orders.length : 0;
  const conversionRate = stats.totalProducts > 0 ? ((stats.activeProducts / stats.totalProducts) * 100).toFixed(1) : 0;

  const sparkData = {
    products: [1,2,2,3,3,4,stats.activeProducts||3],
    sales:    [1,3,2,4,5,6,stats.totalSales||4],
    revenue:  [10,18,15,25,22,35,Math.round(stats.revenue/1000)||12],
    stock:    [1,2,1,3,2,2,stats.lowStock||1],
  };

  const STAT_CARDS = [
    { icon:Package,       label:'Produits actifs', value:stats.activeProducts, sub:`/ ${stats.totalProducts} total`,      color:'#2563eb', iconBg:'rgba(37,99,235,.12)', spark:sparkData.products, trend:+5  },
    { icon:ShoppingBag,   label:'Articles vendus', value:stats.totalSales,     sub:`${stats.completedOrders} livrées`,    color:'#16a34a', iconBg:'#f0fdf4', spark:sparkData.sales, trend:+18, action:() => setActiveTab('orders') },
    { icon:DollarSign,    label:'Revenus',         value:fcfa(stats.revenue),  sub:'total',                               color:'#f97316', iconBg:'rgba(249,115,22,.12)', spark:sparkData.revenue, trend:+24 },
    { icon:AlertTriangle, label:'Stock critique',  value:stats.lowStock + stats.outOfStock, sub:`${stats.outOfStock} ruptures`, color:'#dc2626', iconBg:'rgba(220,38,38,.12)', spark:sparkData.stock, trend:-3 },
  ];

  const donutData = [
    { label:'Livrées',  value:stats.completedOrders, color:'#22c55e' },
    { label:'En cours', value:stats.pendingOrders,   color:'#3b82f6' },
    { label:'Annulées', value:orders.filter(o=>o.status==='cancelled').length, color:'#ef4444' },
  ].filter(d => d.value > 0);

  const months = ['J','F','M','A','M','J','J','A','S','O','N','D'];
  const currentMonth = new Date().getMonth();
  const barData = months.map((m, i) => ({
    label: m,
    value: i < currentMonth ? Math.floor(Math.random() * 8 + 1) : i === currentMonth ? orders.length || 2 : 0,
    highlight: i === currentMonth,
  }));

  const revenueData = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'].map((m, i) => ({
    label: m,
    value1: i <= currentMonth ? Math.floor((Math.random() * 0.6 + 0.4) * (stats.revenue / (currentMonth + 1) / 1000)) || Math.floor(Math.random() * 8 + 2) : 0,
    value2: i <= currentMonth ? Math.floor((Math.random() * 0.5 + 0.2) * (stats.totalSales / (currentMonth + 1))) || Math.floor(Math.random() * 5 + 1) : 0,
  }));

  /* ── Order status helpers ── */
  const ORDER_STATUS = {
    pending:    { icon: Clock,        label: 'En attente', bg: 'rgba(251,191,36,.12)',  border: 'rgba(251,191,36,.4)',  text: '#d97706', dot: '#d97706' },
    processing: { icon: Package,      label: 'En cours',   bg: 'rgba(59,130,246,.1)',   border: 'rgba(59,130,246,.3)',  text: '#3b82f6', dot: '#3b82f6' },
    shipped:    { icon: Truck,        label: 'Expédié',    bg: 'rgba(168,85,247,.1)',   border: 'rgba(168,85,247,.3)',  text: '#a855f7', dot: '#a855f7' },
    delivered:  { icon: CheckCircle2, label: 'Livré',      bg: 'rgba(34,197,94,.1)',    border: 'rgba(34,197,94,.3)',   text: '#22c55e', dot: '#22c55e' },
    cancelled:  { icon: Ban,          label: 'Annulé',     bg: 'rgba(239,68,68,.1)',    border: 'rgba(239,68,68,.3)',   text: '#ef4444', dot: '#ef4444' },
  };
  const getStatus = (s) => ORDER_STATUS[s] || ORDER_STATUS.pending;

  const FILTERS = [
    { id:'all',        label:'Toutes'     },
    { id:'pending',    label:'En attente' },
    { id:'processing', label:'En cours'   },
    { id:'shipped',    label:'Expédié'    },
    { id:'delivered',  label:'Livré'      },
    { id:'cancelled',  label:'Annulé'     },
  ];

  const filteredOrders = orders.filter(o => {
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchSearch = !searchTerm ||
      String(o.id).includes(searchTerm) ||
      o.items?.some(i => i.product_name?.toLowerCase().includes(term));
    return matchStatus && matchSearch;
  });

  if (loading) return <Loader message="Chargement de votre espace vendeur…" />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .vd-root, .vd-root * { font-family:'DM Sans',sans-serif; box-sizing:border-box; }

        @keyframes vd-fadein { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .vd-fade { animation:vd-fadein .5s cubic-bezier(.22,1,.36,1) both; }

        /* ── STAT CARDS ── */
        .vd-stat {
          transition:transform .2s, box-shadow .2s; cursor:pointer;
          background:var(--card); border-radius:18px; border:1px solid var(--border);
          padding:18px 16px; box-shadow:0 2px 8px rgba(0,0,0,.04);
          display:flex; flex-direction:column; gap:0; overflow:hidden;
          min-width:0;
        }
        .vd-stat:hover { transform:translateY(-3px); box-shadow:0 10px 32px rgba(0,0,0,.10)!important; }

        /* Valeur : s'adapte à la largeur disponible */
        .vd-stat-val {
          font-size:clamp(16px, 4vw, 28px);
          font-weight:800; color:var(--text);
          letter-spacing:-.03em; line-height:1.1;
          word-break:break-word; overflow-wrap:anywhere;
          hyphens:auto;
        }

        /* ── STATS GRID — responsive ── */
        .vd-stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
        @media(max-width:900px)  { .vd-stats-grid { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:440px)  { .vd-stats-grid { grid-template-columns:1fr 1fr; gap:10px; } }

        /* ── STAT CARD MOBILE : layout horizontal icone + texte ── */
        @media(max-width:500px) {
          .vd-stat {
            flex-direction:row; align-items:center; gap:12px;
            padding:13px 14px;
          }
          .vd-stat-top { flex-shrink:0; }
          .vd-stat-main { flex:1; min-width:0; }
          .vd-stat-spark { display:none; }
          .vd-stat-val { font-size:clamp(14px, 5vw, 22px); }
          .vd-stat-trend { display:none; }
        }
        @media(max-width:360px) {
          .vd-stat { padding:11px 12px; gap:10px; }
          .vd-stat-val { font-size:14px; }
        }

        /* ── CHARTS ── */
        .vd-charts-row { display:grid; grid-template-columns:1fr 300px; gap:14px; margin-bottom:20px; }
        @media(max-width:900px)  { .vd-charts-row { grid-template-columns:1fr; } }

        .vd-chart-card { background:var(--card); border-radius:18px; border:1px solid var(--border); box-shadow:0 2px 8px rgba(0,0,0,.04); padding:20px; }

        /* ── SECTION / TABS ── */
        .vd-section { background:var(--card); border-radius:20px; border:1px solid var(--border); box-shadow:0 2px 8px rgba(0,0,0,.04); overflow:hidden; }
        .vd-section-header { padding:20px 20px 0; display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; }
        .vd-tabs { display:flex; gap:4px; padding:14px 16px 0; overflow-x:auto; scrollbar-width:none; }
        .vd-tabs::-webkit-scrollbar { display:none; }
        .vd-tab { padding:8px 16px; border-radius:10px; border:none; background:none; font-size:13px; font-weight:600; cursor:pointer; color:#9ca3af; transition:all .18s; white-space:nowrap; font-family:'DM Sans',sans-serif; }
        .vd-tab.active { background:rgba(249,115,22,.12); color:#f97316; }
        .vd-tab:hover:not(.active) { background:var(--bg3); color:var(--text); }

        /* ── TABLE ── */
        .vd-table { width:100%; border-collapse:collapse; }
        .vd-table th { padding:11px 14px; text-align:left; font-size:11px; font-weight:700; color:var(--text2); text-transform:uppercase; letter-spacing:.07em; background:var(--bg3); border-bottom:1px solid var(--border); white-space:nowrap; }
        .vd-table td { padding:12px 14px; border-bottom:1px solid var(--border); vertical-align:middle; }
        .vd-table tr:last-child td { border-bottom:none; }
        .vd-table tbody tr { transition:background .15s; }
        .vd-table tbody tr:hover { background:rgba(249,115,22,.05); }
        .vd-action-icon { padding:7px; border-radius:8px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background .15s, transform .15s; }
        .vd-action-icon:hover { transform:scale(1.1); }
        @media(max-width:640px) {
          .vd-table .hide-sm { display:none; }
          .vd-table th, .vd-table td { padding:10px 10px; }
        }

        /* ── ORDERS TOOLBAR ── */
        .vd-ord-toolbar { display:flex; align-items:center; gap:10px; padding:14px 16px; flex-wrap:wrap; border-bottom:1px solid var(--border); }
        .vd-ord-search-wrap { position:relative; flex:1; min-width:160px; }
        .vd-ord-search-ico { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:var(--text3); pointer-events:none; }
        .vd-ord-search { width:100%; padding:9px 12px 9px 34px; border:1.5px solid var(--border); border-radius:10px; font-size:13.5px; font-family:'DM Sans',sans-serif; outline:none; transition:border-color .18s; background:var(--input); color:var(--text); }
        .vd-ord-search:focus { border-color:#f97316; box-shadow:0 0 0 3px rgba(249,115,22,.1); }
        .vd-ord-filters { display:flex; gap:5px; flex-wrap:wrap; }
        .vd-ord-filter-btn { padding:7px 13px; border-radius:999px; font-size:12.5px; font-weight:600; border:1.5px solid var(--border); background:var(--card); color:var(--text2); cursor:pointer; transition:all .18s; white-space:nowrap; font-family:'DM Sans',sans-serif; }
        .vd-ord-filter-btn:hover { border-color:#fed7aa; color:#f97316; background:rgba(249,115,22,.08); }
        .vd-ord-filter-btn.active { background:#f97316; border-color:#f97316; color:#fff; }
        @media(max-width:640px) {
          .vd-ord-filters { display:none; }
          .vd-ord-toolbar { padding:10px 12px; gap:8px; }
        }

        /* ── ORDERS MOBILE FILTER SCROLL ── */
        .vd-ord-filters-mobile { display:none; gap:6px; padding:10px 14px; overflow-x:auto; scrollbar-width:none; border-bottom:1px solid var(--border); }
        .vd-ord-filters-mobile::-webkit-scrollbar { display:none; }
        @media(max-width:640px) { .vd-ord-filters-mobile { display:flex; } }

        /* ── ORDER CARDS ── */
        .vd-ord-list { display:flex; flex-direction:column; gap:12px; padding:14px 16px 20px; }
        .vd-ord-card { background:var(--bg3); border-radius:14px; border:1px solid var(--border); overflow:hidden; transition:box-shadow .18s, transform .18s; }
        .vd-ord-card:hover { box-shadow:0 6px 22px rgba(0,0,0,.1); transform:translateY(-1px); }
        .vd-ord-card-head { display:flex; align-items:flex-start; justify-content:space-between; padding:14px 16px; border-bottom:1px solid var(--border); flex-wrap:wrap; gap:10px; background:var(--card); }
        .vd-ord-card-left { display:flex; align-items:flex-start; gap:11px; flex:1; min-width:0; }
        .vd-ord-status-ico { width:40px; height:40px; border-radius:11px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .vd-ord-id { font-size:16px; font-weight:800; color:var(--text); }
        .vd-ord-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 11px; border-radius:999px; font-size:12px; font-weight:700; border:1.5px solid; }
        .vd-ord-date { display:flex; align-items:center; gap:4px; font-size:12px; color:var(--text3); }
        .vd-ord-amount { text-align:right; flex-shrink:0; }
        .vd-ord-amount-val { font-size:20px; font-weight:800; color:var(--text); }
        .vd-ord-card-body { padding:14px 16px; }
        .vd-ord-infos-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px; }
        @media(max-width:500px) { .vd-ord-infos-grid { grid-template-columns:1fr; } }
        .vd-ord-info-box { background:var(--card); border:1px solid var(--border); border-radius:10px; padding:10px 12px; display:flex; gap:9px; align-items:flex-start; }
        .vd-ord-info-ico { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .vd-ord-info-lbl { font-size:10.5px; font-weight:700; color:var(--text3); text-transform:uppercase; letter-spacing:.4px; margin-bottom:2px; }
        .vd-ord-info-val { font-size:13px; font-weight:600; color:var(--text); word-break:break-word; }
        .vd-ord-articles-titre { display:flex; align-items:center; gap:7px; font-size:11.5px; font-weight:700; color:var(--text2); text-transform:uppercase; letter-spacing:.5px; margin-bottom:10px; }
        .vd-ord-item { display:flex; align-items:center; gap:11px; padding:9px 11px; border-radius:10px; border:1px solid var(--border); margin-bottom:7px; background:var(--card); transition:background .15s; }
        .vd-ord-item:last-child { margin-bottom:0; }
        .vd-ord-item:hover { background:var(--bg2); }
        .vd-ord-item-img { width:50px; height:50px; border-radius:8px; object-fit:cover; border:1px solid var(--border); flex-shrink:0; background:rgba(249,115,22,.08); }
        .vd-ord-item-name { font-size:13.5px; font-weight:700; color:var(--text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .vd-ord-item-qty { font-size:12px; color:var(--text3); margin-top:1px; }
        .vd-ord-item-sub { font-size:14px; font-weight:800; color:var(--text); flex-shrink:0; white-space:nowrap; }
        .vd-ord-actions { display:flex; gap:7px; margin-top:14px; flex-wrap:wrap; align-items:center; }
        .vd-ord-action-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 15px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; transition:all .18s; border:1.5px solid; font-family:'DM Sans',sans-serif; white-space:nowrap; }
        .vd-ord-action-btn.delivery { background:linear-gradient(135deg,#f97316,#fb923c); border-color:transparent; color:white; font-weight:700; box-shadow:0 4px 14px rgba(249,115,22,.35); }
        .vd-ord-action-btn.delivery:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(249,115,22,.45); }
        .vd-ord-action-btn.cancel { background:rgba(239,68,68,.07); border-color:rgba(239,68,68,.25); color:#ef4444; }
        .vd-ord-action-btn.cancel:hover { background:rgba(239,68,68,.15); border-color:#ef4444; }
        @media(max-width:400px) {
          .vd-ord-action-btn { font-size:12px; padding:7px 11px; }
          .vd-ord-id { font-size:15px; }
          .vd-ord-amount-val { font-size:17px; }
        }

        /* ── ORDER EMPTY ── */
        .vd-ord-empty { padding:56px 20px; text-align:center; }
        .vd-ord-empty-ico { width:72px; height:72px; border-radius:50%; background:rgba(249,115,22,.1); border:2px solid rgba(249,115,22,.25); display:inline-flex; align-items:center; justify-content:center; margin-bottom:14px; }

        /* ── VENDOR BANNER ── */
        .vd-delivery-banner { display:flex; align-items:center; justify-content:space-between; background:linear-gradient(135deg,#fff7ed,#ffedd5); border:1.5px solid #fed7aa; border-radius:14px; padding:14px 18px; margin:14px 16px 0; flex-wrap:wrap; gap:10px; }
        body.dark .vd-delivery-banner { background:linear-gradient(135deg,rgba(249,115,22,.08),rgba(249,115,22,.04)); border-color:rgba(249,115,22,.28); }
        .vd-delivery-banner-btn { display:inline-flex; align-items:center; gap:7px; background:#f97316; color:white; border:none; border-radius:10px; padding:9px 16px; font-size:13px; font-weight:700; cursor:pointer; box-shadow:0 4px 14px rgba(249,115,22,.3); transition:all .18s; white-space:nowrap; font-family:'DM Sans',sans-serif; }
        .vd-delivery-banner-btn:hover { background:#ea6a0a; transform:translateY(-1px); }
        @media(max-width:480px) {
          .vd-delivery-banner { padding:12px 14px; margin:10px 12px 0; }
          .vd-delivery-banner-btn { font-size:12px; padding:8px 12px; }
        }

        /* ── CANCEL MODAL ── */
        .vd-cancel-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(3px); }
        .vd-cancel-modal { background:var(--card); border-radius:20px; padding:28px; max-width:420px; width:100%; box-shadow:0 20px 60px rgba(0,0,0,.2); animation:vd-fadein .2s ease; border:1px solid var(--border); }
        .vd-cancel-modal-ico { width:56px; height:56px; background:rgba(239,68,68,.1); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; border:2px solid rgba(239,68,68,.2); }
        .vd-cancel-modal h3 { font-size:18px; font-weight:800; color:var(--text); text-align:center; margin-bottom:8px; }
        .vd-cancel-modal p  { font-size:14px; color:var(--text2); text-align:center; margin-bottom:20px; line-height:1.6; }
        .vd-cancel-modal-actions { display:flex; gap:10px; }
        .vd-cancel-modal-actions button { flex:1; padding:12px; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; border:none; font-family:'DM Sans',sans-serif; transition:all .18s; }
        .vd-cancel-btn-no  { background:var(--bg3); color:var(--text2); }
        .vd-cancel-btn-no:hover  { background:var(--bg2); }
        .vd-cancel-btn-yes { background:#ef4444; color:white; box-shadow:0 4px 14px rgba(239,68,68,.3); }
        .vd-cancel-btn-yes:hover { background:#dc2626; }
        .vd-cancel-btn-yes:disabled { opacity:.6; cursor:not-allowed; }
        .vd-cancel-error { background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.3); border-radius:10px; padding:10px 14px; font-size:13px; color:#ef4444; font-weight:600; margin-bottom:14px; display:flex; align-items:center; gap:8px; }

        /* ── GENERAL RESPONSIVE ── */
        @media(max-width:700px) {
          .vd-main { padding:16px 12px 60px !important; }
          .vd-welcome { margin-bottom:18px !important; }
          .vd-welcome h1 { font-size:20px !important; }
          .vd-new-product-btn { padding:9px 16px !important; font-size:13px !important; }
        }
        @media(max-width:440px) {
          .vd-main { padding:12px 10px 60px !important; }
          .vd-welcome h1 { font-size:18px !important; }
          .vd-new-product-btn { display:none !important; }
        }
      `}</style>

      <div className="vd-root" style={{ minHeight:'100vh', background:'var(--bg)' }}>
        <Navbar pageCourante="/vendor/dashboard" />

        {/* ── Cancel Modal ── */}
        {cancelTarget && (
          <div className="vd-cancel-overlay" onClick={() => !cancelling && setCancelTarget(null)}>
            <div className="vd-cancel-modal" onClick={e => e.stopPropagation()}>
              <div className="vd-cancel-modal-ico">
                <AlertTriangle size={28} color="#ef4444"/>
              </div>
              <h3>Annuler la commande ?</h3>
              <p>Vous êtes sur le point d'annuler la commande <strong>#{cancelTarget.id}</strong>. Cette action est irréversible.</p>
              {cancelError && (
                <div className="vd-cancel-error"><X size={14}/> {cancelError}</div>
              )}
              <div className="vd-cancel-modal-actions">
                <button className="vd-cancel-btn-no" onClick={() => { setCancelTarget(null); setCancelError(''); }}>Non, garder</button>
                <button className="vd-cancel-btn-yes" disabled={cancelling} onClick={handleCancelConfirm}>
                  {cancelling ? 'Annulation…' : 'Oui, annuler'}
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="vd-main" style={{ maxWidth:'1260px', margin:'0 auto', padding:'28px 18px 60px' }}>

          {/* ── Welcome ── */}
          <div className="vd-fade vd-welcome" style={{ marginBottom:'24px', display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
            <div>
              <h1 style={{ fontSize:'24px', fontWeight:800, color:'var(--text)', margin:'0 0 4px', letterSpacing:'-.03em', display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:36, height:36, borderRadius:'11px', background:'linear-gradient(135deg,#f97316,#fb923c)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(249,115,22,.3)', flexShrink:0 }}>
                  <BarChart3 size={18} color="#fff"/>
                </div>
                Tableau de bord vendeur
              </h1>
              <p style={{ fontSize:'13.5px', color:'var(--text3)', margin:0 }}>
                Bonjour <strong style={{ color:'var(--text)', fontWeight:700 }}>{user?.username}</strong> — {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}
              </p>
            </div>
            <button className="vd-new-product-btn" onClick={() => router.push('/vendor/add-product')} style={{ display:'flex', alignItems:'center', gap:'8px', background:'#f97316', color:'#fff', border:'none', borderRadius:'12px', padding:'10px 18px', fontWeight:700, fontSize:'13.5px', cursor:'pointer', boxShadow:'0 4px 14px rgba(249,115,22,.28)', fontFamily:'DM Sans,sans-serif', flexShrink:0 }}>
              <Plus size={15}/> Nouveau produit
            </button>
          </div>

          {/* ── Stats ── */}
          <div className="vd-stats-grid vd-fade" style={{ animationDelay:'40ms' }}>
            {STAT_CARDS.map((s, i) => (
              <div key={i} className="vd-stat vd-fade" style={{ animationDelay:`${i*55}ms` }} onClick={s.action}>
                {/* Top : icône + badge tendance */}
                <div className="vd-stat-top" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'10px', gap:'6px' }}>
                  <div style={{ width:40, height:40, borderRadius:'12px', background:s.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <s.icon size={19} color={s.color}/>
                  </div>
                  <div className="vd-stat-trend" style={{ display:'flex', alignItems:'center', gap:'2px', fontSize:'10.5px', fontWeight:700, color: s.trend >= 0 ? '#16a34a' : '#dc2626', background: s.trend >= 0 ? 'rgba(22,163,74,.12)' : 'rgba(220,38,38,.12)', padding:'3px 6px', borderRadius:'20px', flexShrink:0 }}>
                    {s.trend >= 0 ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}
                    {Math.abs(s.trend)}%
                  </div>
                </div>
                {/* Valeur + label */}
                <div className="vd-stat-main">
                  <div className="vd-stat-val">{s.value}</div>
                  <div style={{ fontSize:'12px', color:'var(--text2)', marginTop:'3px', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.label}</div>
                  <div style={{ fontSize:'10.5px', color:'var(--text3)', marginBottom:'8px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.sub}</div>
                </div>
                <div className="vd-stat-spark">
                  <Sparkline data={s.spark} color={s.color} width={90} height={24}/>
                </div>
              </div>
            ))}
          </div>

          {/* ── Charts ── */}
          <div className="vd-charts-row vd-fade" style={{ animationDelay:'100ms' }}>
            <div className="vd-chart-card">
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'18px', flexWrap:'wrap', gap:'10px' }}>
                <div>
                  <h3 style={{ fontWeight:800, fontSize:'15px', color:'var(--text)', margin:'0 0 2px' }}>Revenus & Ventes</h3>
                  <p style={{ fontSize:'12px', color:'var(--text3)', margin:0 }}>Évolution sur {new Date().getFullYear()}</p>
                </div>
                <div style={{ display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                    <div style={{ width:10, height:3, background:'#f97316', borderRadius:2 }}/>
                    <span style={{ fontSize:'11px', color:'var(--text2)', fontWeight:500 }}>Revenus (k FCFA)</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                    <div style={{ width:10, height:3, background:'#3b82f6', borderRadius:2 }}/>
                    <span style={{ fontSize:'11px', color:'var(--text2)', fontWeight:500 }}>Articles</span>
                  </div>
                </div>
              </div>
              <AreaChart data={revenueData} color="#f97316" color2="#3b82f6" height={100}/>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
                {revenueData.map((d, i) => (
                  <span key={d.label} style={{ fontSize:'9px', color: i === currentMonth ? '#f97316' : '#d1d5db', fontWeight: i === currentMonth ? 800 : 400, flex:1, textAlign:'center' }}>{d.label.slice(0,3)}</span>
                ))}
              </div>
            </div>

            <div className="vd-chart-card" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'14px' }}>
              <div style={{ width:'100%' }}>
                <h3 style={{ fontWeight:800, fontSize:'15px', color:'var(--text)', margin:'0 0 2px' }}>Statut commandes</h3>
                <p style={{ fontSize:'12px', color:'var(--text3)', margin:0 }}>Vue d'ensemble</p>
              </div>
              {donutData.length > 0 ? (
                <>
                  <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <DonutChart segments={donutData} size={120} stroke={22}/>
                    <div style={{ position:'absolute', textAlign:'center' }}>
                      <div style={{ fontSize:'22px', fontWeight:800, color:'var(--text)', lineHeight:1 }}>{orders.length}</div>
                      <div style={{ fontSize:'10px', color:'var(--text3)', fontWeight:500 }}>total</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'7px', width:'100%' }}>
                    {donutData.map((seg, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                          <div style={{ width:9, height:9, borderRadius:'50%', background:seg.color, flexShrink:0 }}/>
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

          {/* ── Bar + KPI ── */}
          <div className="vd-charts-row vd-fade" style={{ animationDelay:'140ms' }}>
            <div className="vd-chart-card">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'18px', flexWrap:'wrap', gap:'10px' }}>
                <div>
                  <h3 style={{ fontWeight:800, fontSize:'15px', color:'var(--text)', margin:'0 0 2px' }}>Activité mensuelle</h3>
                  <p style={{ fontSize:'12px', color:'var(--text3)', margin:0 }}>Commandes par mois — {new Date().getFullYear()}</p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(249,115,22,.12)', border:'1px solid rgba(249,115,22,.35)', borderRadius:'8px', padding:'5px 10px' }}>
                  <BarChart3 size={13} color="#f97316"/>
                  <span style={{ fontSize:'12px', fontWeight:700, color:'#f97316' }}>{orders.length} total</span>
                </div>
              </div>
              <div style={{ height:'80px' }}><BarChart data={barData} color="#f97316" height={80}/></div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'5px' }}>
                {months.map((m, i) => (
                  <span key={m} style={{ fontSize:'9.5px', color: i === currentMonth ? '#f97316' : '#d1d5db', fontWeight: i === currentMonth ? 800 : 400, flex:1, textAlign:'center' }}>{m}</span>
                ))}
              </div>
            </div>

            <div className="vd-chart-card" style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <h3 style={{ fontWeight:800, fontSize:'15px', color:'var(--text)', margin:'0 0 2px' }}>Performance</h3>
                <p style={{ fontSize:'12px', color:'var(--text3)', margin:0 }}>Indicateurs clés</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'13px' }}>
                <ProgressBar value={stats.activeProducts} max={stats.totalProducts} color="#22c55e" label="Produits actifs" sublabel={`${stats.activeProducts}/${stats.totalProducts}`}/>
                <ProgressBar value={stats.completedOrders} max={orders.length} color="#3b82f6" label="Taux livraison" sublabel={`${orders.length>0?((stats.completedOrders/orders.length)*100).toFixed(0):0}%`}/>
                <ProgressBar value={stats.totalStock - stats.outOfStock * 10} max={stats.totalStock || 1} color="#f97316" label="Disponibilité stock" sublabel={`${stats.totalStock} unités`}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'9px', borderTop:'1px solid var(--border)', paddingTop:'13px' }}>
                {[
                  { label:'Panier moyen', value:fcfa(avgOrder),          sub:'par commande', color:'#f97316' },
                  { label:'En attente',   value:stats.pendingOrders,     sub:'commandes',    color:'#3b82f6' },
                  { label:'Ruptures',     value:stats.outOfStock,        sub:'produits',     color:'#ef4444' },
                  { label:'Conversion',   value:`${conversionRate}%`,    sub:'actifs',       color:'#22c55e' },
                ].map((kpi, i) => (
                  <div key={i} style={{ background:'var(--bg3)', borderRadius:'11px', padding:'11px', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:'17px', fontWeight:800, color:kpi.color, lineHeight:1 }}>{kpi.value}</div>
                    <div style={{ fontSize:'11px', fontWeight:600, color:'var(--text2)', marginTop:'3px' }}>{kpi.label}</div>
                    <div style={{ fontSize:'10px', color:'var(--text3)' }}>{kpi.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Products + Orders section ── */}
          <div className="vd-section vd-fade" style={{ animationDelay:'180ms' }}>

            {/* Header */}
            <div className="vd-section-header">
              <div>
                <h2 style={{ fontSize:'16px', fontWeight:800, color:'var(--text)', margin:'0 0 8px', display:'flex', alignItems:'center', gap:'8px' }}>
                  {activeTab === 'products' ? <><Package size={17} color="#f97316"/> Mes Produits</> : <><ShoppingBag size={17} color="#f97316"/> Commandes reçues</>}
                </h2>
                <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                  {[
                    { label:`${stats.activeProducts} actifs`,    dot:'#22c55e', bg:'rgba(22,163,74,.12)',   text:'#4ade80', border:'rgba(22,163,74,.3)'   },
                    { label:`${stats.lowStock} stock faible`,    dot:'#f59e0b', bg:'rgba(245,158,11,.12)',  text:'#fbbf24', border:'rgba(245,158,11,.3)'  },
                    { label:`${stats.outOfStock} rupture`,       dot:'#ef4444', bg:'rgba(220,38,38,.12)',   text:'#f87171', border:'rgba(220,38,38,.3)'   },
                  ].map((b, i) => (
                    <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'3px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:600, background:b.bg, color:b.text, border:`1px solid ${b.border}` }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:b.dot }}/>
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={() => router.push('/vendor/add-product')} style={{ display:'flex', alignItems:'center', gap:'7px', background:'#f97316', color:'#fff', border:'none', borderRadius:'11px', padding:'10px 18px', fontWeight:700, fontSize:'13.5px', cursor:'pointer', boxShadow:'0 4px 12px rgba(249,115,22,.28)', fontFamily:'DM Sans,sans-serif', whiteSpace:'nowrap', flexShrink:0 }}>
                <Plus size={15}/> Nouveau produit
              </button>
            </div>

            {/* Tabs */}
            <div className="vd-tabs">
              <button className={`vd-tab${activeTab==='products'?' active':''}`} onClick={() => setActiveTab('products')}>
                Produits ({products.length})
              </button>
              <button className={`vd-tab${activeTab==='orders'?' active':''}`} onClick={() => setActiveTab('orders')}>
                Commandes ({orders.length})
              </button>
            </div>

            {/* ════ PRODUCTS TAB ════ */}
            {activeTab === 'products' && (
              products.length === 0 ? (
                <div style={{ padding:'56px 20px', textAlign:'center' }}>
                  <div style={{ width:68, height:68, borderRadius:'50%', background:'rgba(249,115,22,.12)', border:'2px solid rgba(249,115,22,.3)', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:'14px' }}>
                    <Package size={30} color="#f97316"/>
                  </div>
                  <p style={{ fontSize:'17px', fontWeight:700, color:'var(--text)', margin:'0 0 6px' }}>Aucun produit</p>
                  <p style={{ fontSize:'13.5px', color:'var(--text3)', margin:'0 0 20px' }}>Commencez à développer votre boutique</p>
                  <button onClick={() => router.push('/vendor/add-product')} style={{ background:'#f97316', color:'#fff', border:'none', borderRadius:'12px', padding:'12px 26px', fontWeight:700, fontSize:'14px', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'8px', boxShadow:'0 4px 14px rgba(249,115,22,.3)', fontFamily:'DM Sans,sans-serif' }}>
                    <Plus size={15}/> Ajouter un produit
                  </button>
                </div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table className="vd-table">
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th>Prix</th>
                        <th>Stock</th>
                        <th className="hide-sm">Catégorie</th>
                        <th className="hide-sm">Dispo</th>
                        <th style={{ textAlign:'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => {
                        const stock  = Number(product.stock) || 0;
                        const status = stock === 0 ? 'out' : stock < 10 ? 'low' : 'ok';
                        const ss = { out:{ bg:'rgba(220,38,38,.12)', color:'#f87171', border:'rgba(220,38,38,.3)' }, low:{ bg:'rgba(245,158,11,.12)', color:'#fbbf24', border:'rgba(245,158,11,.3)' }, ok:{ bg:'rgba(22,163,74,.12)', color:'#4ade80', border:'rgba(22,163,74,.3)' } }[status];
                        const stockPct = Math.min(100, (stock / Math.max(stock, 50)) * 100);
                        return (
                          <tr key={product.id}>
                            <td>
                              <div style={{ display:'flex', alignItems:'center', gap:'11px' }}>
                                <img src={getImageUrl(product.image)} alt={product.name}
                                  style={{ width:44, height:44, borderRadius:'11px', objectFit:'cover', border:'1.5px solid var(--border)', background:'var(--bg3)', flexShrink:0 }}
                                  onError={e => { e.target.src='https://placehold.co/44x44/fff7ed/f97316?text=?'; }}/>
                                <div>
                                  <div style={{ fontWeight:700, fontSize:'13.5px', color:'var(--text)', maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{product.name}</div>
                                  <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'1px' }}>ID #{product.id}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight:800, fontSize:'13.5px', color:'var(--text)' }}>{Number(product.price).toLocaleString('fr-FR')}</div>
                              <div style={{ fontSize:'10.5px', color:'var(--text3)' }}>FCFA</div>
                            </td>
                            <td>
                              <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                                <span style={{ padding:'3px 9px', borderRadius:'8px', fontSize:'12px', fontWeight:700, background:ss.bg, color:ss.color, border:`1px solid ${ss.border}`, flexShrink:0 }}>{stock}</span>
                                {status !== 'ok' && <AlertTriangle size={13} color={status === 'out' ? '#ef4444' : '#f59e0b'}/>}
                              </div>
                            </td>
                            <td className="hide-sm">
                              <span style={{ fontSize:'12px', color:'var(--text2)', fontWeight:500 }}>{product.category_name || '—'}</span>
                            </td>
                            <td className="hide-sm">
                              <div style={{ width:'72px' }}>
                                <div style={{ height:5, background:'var(--bg3)', borderRadius:3, overflow:'hidden' }}>
                                  <div style={{ height:'100%', width:`${stockPct}%`, background: status === 'ok' ? '#22c55e' : status === 'low' ? '#f59e0b' : '#ef4444', borderRadius:3 }}/>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ display:'flex', justifyContent:'flex-end', gap:'5px' }}>
                                <button className="vd-action-icon" style={{ background:'rgba(37,99,235,.12)', color:'#60a5fa' }} onClick={() => router.push(`/product/${product.id}`)}><Eye size={13}/></button>
                                <button className="vd-action-icon" style={{ background:'rgba(249,115,22,.12)', color:'#f97316' }} onClick={() => router.push(`/vendor/edit-product/${product.id}`)}><Edit size={13}/></button>
                                <button className="vd-action-icon" style={{ background:'rgba(220,38,38,.12)', color:'#ef4444' }} onClick={() => handleDeleteProduct(product.id)}><Trash2 size={13}/></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* ════ ORDERS TAB (fusionné OrdersPage) ════ */}
            {activeTab === 'orders' && (
              <>
                {/* Bandeau GPS livraison */}
                <div className="vd-delivery-banner">
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:36, height:36, background:'linear-gradient(135deg,#f97316,#fb923c)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Truck size={17} color="#fff"/>
                    </div>
                    <div>
                      <div style={{ fontWeight:800, fontSize:'13.5px', color:'#92400e' }}>Interface de livraison GPS</div>
                      <div style={{ fontSize:'12px', color:'#b45309' }}>Gérez vos livraisons, partagez votre position en temps réel</div>
                    </div>
                  </div>
                  <button className="vd-delivery-banner-btn" onClick={() => router.push('/vendor/deliveries')}>
                    <Navigation size={14}/> Gérer mes livraisons
                  </button>
                </div>

                {/* Stats commandes */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', padding:'14px 16px', borderBottom:'1px solid var(--border)' }}
                  className="vd-ord-stats">
                  <style>{`@media(max-width:600px){.vd-ord-stats{grid-template-columns:1fr 1fr!important}}`}</style>
                  {[
                    { label:'Total reçues',  value:orders.length,                                         icon:ShoppingBag,  color:'#f97316', bg:'rgba(249,115,22,.12)' },
                    { label:'À préparer',    value:orders.filter(o=>o.status==='pending').length,          icon:Clock,        color:'#f59e0b', bg:'rgba(245,158,11,.1)'  },
                    { label:'En livraison',  value:orders.filter(o=>o.status==='shipped').length,          icon:Truck,        color:'#3b82f6', bg:'rgba(59,130,246,.1)'  },
                    { label:'Livrées',       value:orders.filter(o=>o.status==='delivered').length,        icon:CheckCircle2, color:'#22c55e', bg:'rgba(34,197,94,.1)'   },
                  ].map(({ label, value, icon:Ico, color, bg }) => (
                    <div key={label} style={{ background:'var(--bg3)', borderRadius:'12px', border:'1px solid var(--border)', padding:'12px 14px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:36, height:36, borderRadius:'10px', background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Ico size={17} color={color}/>
                      </div>
                      <div>
                        <div style={{ fontSize:'20px', fontWeight:800, color:'var(--text)', lineHeight:1 }}>{value}</div>
                        <div style={{ fontSize:'11px', color:'var(--text3)', fontWeight:500, marginTop:'2px' }}>{label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Toolbar */}
                <div className="vd-ord-toolbar">
                  <div className="vd-ord-search-wrap">
                    <Search size={15} className="vd-ord-search-ico"/>
                    <input
                      type="text" className="vd-ord-search"
                      placeholder="Rechercher par numéro ou produit…"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="vd-ord-filters">
                    {FILTERS.map(f => (
                      <button key={f.id}
                        className={`vd-ord-filter-btn${filterStatus===f.id?' active':''}`}
                        onClick={() => setFilterStatus(f.id)}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile filter scroll */}
                <div className="vd-ord-filters-mobile">
                  {FILTERS.map(f => (
                    <button key={f.id}
                      style={{ padding:'6px 13px', borderRadius:'999px', fontSize:'12.5px', fontWeight:'600', border:`1.5px solid ${filterStatus===f.id?'#f97316':'var(--border)'}`, background:filterStatus===f.id?'#f97316':'var(--card)', color:filterStatus===f.id?'#fff':'var(--text2)', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, fontFamily:'DM Sans,sans-serif' }}
                      onClick={() => setFilterStatus(f.id)}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Orders list */}
                {filteredOrders.length === 0 ? (
                  <div className="vd-ord-empty">
                    <div className="vd-ord-empty-ico"><Package size={38} color="#f97316"/></div>
                    <p style={{ fontSize:'17px', fontWeight:700, color:'var(--text)', margin:'0 0 6px' }}>
                      {orders.length === 0 ? 'Aucune commande reçue' : 'Aucun résultat'}
                    </p>
                    <p style={{ fontSize:'13px', color:'var(--text3)', margin:0 }}>
                      {orders.length === 0 ? "Vos commandes apparaîtront ici." : 'Essayez un autre filtre.'}
                    </p>
                  </div>
                ) : (
                  <div className="vd-ord-list">
                    {filteredOrders.map((order, idx) => {
                      const s = getStatus(order.status);
                      const StatusIcon = s.icon;
                      const showDeliveryBtn = ['pending','processing','shipped'].includes(order.status);
                      const canCancel = ['pending','processing'].includes(order.status);

                      return (
                        <div key={order.id} className="vd-ord-card vd-fade" style={{ animationDelay:`${idx*40}ms` }}>
                          {/* Card head */}
                          <div className="vd-ord-card-head">
                            <div className="vd-ord-card-left">
                              <div className="vd-ord-status-ico" style={{ background:s.bg }}>
                                <StatusIcon size={17} color={s.dot}/>
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div className="vd-ord-id">Commande #{order.id}</div>
                                <div style={{ display:'flex', alignItems:'center', gap:'7px', marginTop:'4px', flexWrap:'wrap' }}>
                                  <span className="vd-ord-badge" style={{ background:s.bg, borderColor:s.border, color:s.text }}>
                                    <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, flexShrink:0 }}/>
                                    {s.label}
                                  </span>
                                  <div className="vd-ord-date">
                                    <Calendar size={11}/>
                                    {new Date(order.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })}
                                  </div>
                                  <div className="vd-ord-date">
                                    <Package size={11}/>
                                    {order.items?.length||0} article{(order.items?.length||0)>1?'s':''}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="vd-ord-amount">
                              <div className="vd-ord-amount-val">{parseFloat(order.total_amount||order.total||0).toLocaleString('fr-FR')}</div>
                              <div style={{ fontSize:'11px', color:'var(--text3)' }}>FCFA</div>
                            </div>
                          </div>

                          {/* Card body */}
                          <div className="vd-ord-card-body">
                            <div className="vd-ord-infos-grid">
                              <div className="vd-ord-info-box">
                                <div className="vd-ord-info-ico" style={{ background:'rgba(59,130,246,.12)' }}>
                                  <MapPin size={14} color="#3b82f6"/>
                                </div>
                                <div style={{ minWidth:0 }}>
                                  <div className="vd-ord-info-lbl">Adresse</div>
                                  <div className="vd-ord-info-val">{order.delivery_address || '—'}</div>
                                </div>
                              </div>
                              {(order.phone || order.buyer_phone) && (
                                <div className="vd-ord-info-box">
                                  <div className="vd-ord-info-ico" style={{ background:'rgba(34,197,94,.1)' }}>
                                    <Phone size={14} color="#22c55e"/>
                                  </div>
                                  <div>
                                    <div className="vd-ord-info-lbl">Téléphone</div>
                                    <div className="vd-ord-info-val">{order.phone||order.buyer_phone}</div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Items */}
                            <div className="vd-ord-articles-titre">
                              <Package size={13} color="#f97316"/> Articles commandés
                            </div>
                            {order.items?.map(item => (
                              <div key={item.id} className="vd-ord-item">
                                <img
                                  src={getImageUrl(item.product_image)} alt={item.product_name}
                                  className="vd-ord-item-img"
                                  onError={e => { e.target.src='https://placehold.co/50x50/fff7ed/f97316?text=CI'; }}
                                />
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div className="vd-ord-item-name">{item.product_name}</div>
                                  <div className="vd-ord-item-qty">{item.quantity} × {parseFloat(item.price).toLocaleString('fr-FR')} FCFA</div>
                                </div>
                                <div className="vd-ord-item-sub">
                                  {parseFloat(item.subtotal||item.price*item.quantity).toLocaleString('fr-FR')} <small style={{ fontSize:'11px', color:'var(--text3)', fontWeight:600 }}>FCFA</small>
                                </div>
                              </div>
                            ))}

                            {/* Actions */}
                            <div className="vd-ord-actions">
                              {showDeliveryBtn && (
                                <button className="vd-ord-action-btn delivery" onClick={() => router.push('/vendor/deliveries')}>
                                  <Truck size={13}/> Gérer la livraison
                                </button>
                              )}
                              {canCancel && (
                                <button className="vd-ord-action-btn cancel" onClick={() => { setCancelTarget(order); setCancelError(''); }}>
                                  <X size={13}/> Annuler
                                </button>
                              )}
                              {order.status === 'delivered' && (
                                <span style={{ fontSize:'12px', color:'var(--text3)', display:'flex', alignItems:'center', gap:'5px' }}>
                                  <CheckCircle2 size={13} color="#22c55e"/> Livraison confirmée
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

          </div>{/* end vd-section */}
        </main>

        <Footer />
      </div>
    </>
  );
}