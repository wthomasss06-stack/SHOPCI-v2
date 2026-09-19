'use client';

// src/components/Navbar.jsx — ShopCI
// ✅ Notifs scrollables + notifs acheteur (photo reçue, livraison, commande)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ShoppingCart, ShoppingBag, Settings, LogOut, Plus,
  Menu, X, Home, Package, BarChart3, Bell,
  Store, Compass, Award, TrendingUp, User,
  Sun, Moon, Camera, Truck, CheckCircle, MapPin
} from 'lucide-react';
import { authAPI, cartAPI, notificationsAPI, ordersAPI } from '@/services/api';
import { getImageUrl } from '@/lib/getImageUrl';

/* ── Logo SVG ─────────────────────────────────────────── */
function LogoShopCI({ size = 30, dark = false }) {
  return (
    <svg viewBox="0 0 140 34" height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="34" height="34" rx="8" fill="#f97316"/>
      <path d="M7 11h3l3.5 10h8.5l3-8H11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="14.5" cy="24.5" r="1.5" fill="white"/>
      <circle cx="21" cy="24.5" r="1.5" fill="white"/>
      <text x="42" y="25" fontFamily="'DM Sans',sans-serif" fontSize="20" fontWeight="800" fill={dark ? '#f5f5f7' : '#1a1a1a'} letterSpacing="-0.5">Shop</text>
      <text x="91" y="25" fontFamily="'DM Sans',sans-serif" fontSize="20" fontWeight="800" fill="#f97316" letterSpacing="-0.5">CI</text>
    </svg>
  );
}

/* ── Helpers notifs acheteur ───────────────────────────── */
const BUYER_NOTIF_KEY = 'shopci_buyer_notifs';

function getBuyerNotifsFromStorage() {
  try { return JSON.parse(localStorage.getItem(BUYER_NOTIF_KEY) || '[]'); } catch { return []; }
}
function saveBuyerNotifsToStorage(notifs) {
  try { localStorage.setItem(BUYER_NOTIF_KEY, JSON.stringify(notifs)); } catch {}
}

function buildBuyerNotifs(orders) {
  const existing = getBuyerNotifsFromStorage();
  const existingIds = new Set(existing.map(n => n.uid));
  const newNotifs = [];

  for (const order of orders) {
    // Notif : photo reçue
    if (order.package_photo || order.package_photo_url) {
      const uid = `photo-${order.id}`;
      if (!existingIds.has(uid)) {
        newNotifs.push({
          uid, orderId: order.id, type: 'photo',
          text: `Photo de votre colis reçue`,
          sub: `Commande #${order.id}`,
          icon: 'camera', color: '#f97316',
          read: false, ts: Date.now(),
        });
      }
    }
    // Notif : livreur en route
    if (order.status === 'shipped') {
      const uid = `shipped-${order.id}`;
      if (!existingIds.has(uid)) {
        newNotifs.push({
          uid, orderId: order.id, type: 'shipped',
          text: `Votre commande est en livraison`,
          sub: `Commande #${order.id} · ${Number(order.total_amount || order.total || 0).toLocaleString('fr-FR')} FCFA`,
          icon: 'truck', color: '#3b82f6',
          read: false, ts: Date.now(),
        });
      }
    }
    // Notif : livreur arrivé
    if (order.delivery_confirmed_by_vendor && order.status !== 'delivered') {
      const uid = `arrival-${order.id}`;
      if (!existingIds.has(uid)) {
        newNotifs.push({
          uid, orderId: order.id, type: 'arrival',
          text: `Le livreur est arrivé !`,
          sub: `Confirmez la réception — Commande #${order.id}`,
          icon: 'mappin', color: '#10b981',
          read: false, ts: Date.now(),
        });
      }
    }
    // Notif : livré
    if (order.status === 'delivered') {
      const uid = `delivered-${order.id}`;
      if (!existingIds.has(uid)) {
        newNotifs.push({
          uid, orderId: order.id, type: 'delivered',
          text: `Commande livrée avec succès 🎉`,
          sub: `Commande #${order.id} · ${Number(order.total_amount || order.total || 0).toLocaleString('fr-FR')} FCFA`,
          icon: 'check', color: '#22c55e',
          read: false, ts: Date.now(),
        });
      }
    }
  }

  const merged = [...newNotifs, ...existing].slice(0, 30);
  saveBuyerNotifsToStorage(merged);
  return merged;
}

/* ════════════════════════════════════════════════════════ */
export default function Navbar({ nbPanier: nbPanierProp = 0, pageCourante = '', heroOverlay = false }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState(() => authAPI.getCurrentUser());
  const [menuMobile, setMenuMobile] = useState(false);
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [scrollingDown, setScrollingDown] = useState(false);
  const lastScrollY = useRef(0);
  const [cartCount,  setCartCount]  = useState(nbPanierProp);
  const notifRef = useRef(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user && !session?.error) {
      setUser(session.user);
    } else if (status === 'unauthenticated' || session?.error) {
      setUser(null);
    } else {
      setUser(authAPI.getCurrentUser());
    }
  }, [session, status]);

  // ── Notifs vendeur ────────────────────────────────────
  const [vendorNotifs,  setVendorNotifs]  = useState([]);
  const [vendorUnread,  setVendorUnread]  = useState(0);

  // ── Notifs acheteur ───────────────────────────────────
  const [buyerNotifs,   setBuyerNotifs]   = useState(() => getBuyerNotifsFromStorage());
  const [buyerUnread,   setBuyerUnread]   = useState(0);

  const isVendeur = user?.user_type === 'vendeur';
  const notifs    = isVendeur ? vendorNotifs : buyerNotifs;
  const unread    = isVendeur ? vendorUnread : buyerUnread;

  /* ── Dark mode ─────────────────────────────────────────── */
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('shopci-theme') === 'dark'; } catch { return false; }
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (darkMode) {
      root.setAttribute('data-theme', 'dark');
      root.style.setProperty('--bg',     '#111113');
      root.style.setProperty('--bg2',    '#1c1c1e');
      root.style.setProperty('--bg3',    '#2c2c2e');
      root.style.setProperty('--border', '#3a3a3c');
      root.style.setProperty('--text',   '#f5f5f7');
      root.style.setProperty('--text2',  '#aeaeb2');
      root.style.setProperty('--card',   '#1c1c1e');
      body.classList.add('dark'); body.classList.remove('light');
    } else {
      root.setAttribute('data-theme', 'light');
      root.style.setProperty('--bg',     '#fafafa');
      root.style.setProperty('--bg2',    '#ffffff');
      root.style.setProperty('--bg3',    '#f3f4f6');
      root.style.setProperty('--border', '#f0f0f0');
      root.style.setProperty('--text',   '#1a1a1a');
      root.style.setProperty('--text2',  '#6b7280');
      root.style.setProperty('--card',   '#ffffff');
      body.classList.remove('dark'); body.classList.add('light');
    }
    try { localStorage.setItem('shopci-theme', darkMode ? 'dark' : 'light'); } catch {}
  }, [darkMode]);

  /* ── Chargement notifs vendeur ─────────────────────────── */
  const loadVendorNotifs = useCallback(async () => {
    if (!user || !isVendeur || status !== 'authenticated' || session?.error) return;
    try {
      const data = await notificationsAPI.getVendorNotifications();
      setVendorNotifs(data);
      setVendorUnread(notificationsAPI.getUnreadCount(data));
    } catch {}
  }, [user, isVendeur, status, session]);

  /* ── Chargement notifs acheteur ────────────────────────── */
  const loadBuyerNotifs = useCallback(async () => {
    if (!user || isVendeur || status !== 'authenticated' || session?.error) return;
    try {
      const data = await ordersAPI.getAll();
      const orders = Array.isArray(data) ? data : (data.results || []);
      const merged = buildBuyerNotifs(orders);
      setBuyerNotifs(merged);
      setBuyerUnread(merged.filter(n => !n.read).length);
    } catch {}
  }, [user, isVendeur, status, session]);

  useEffect(() => {
    const h = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      setScrollingDown(y > lastScrollY.current && y > 60);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const loadCart = useCallback(async () => {
    if (!user || status !== 'authenticated' || session?.error) return;
    try {
      const c = await cartAPI.getCart();
      setCartCount(c.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0);
    } catch {}
  }, [user, status, session]);

  useEffect(() => {
    if (!user || status !== 'authenticated' || session?.error) return;
    loadCart();
    const id = setInterval(loadCart, 30000);
    return () => clearInterval(id);
  }, [loadCart, user, status, session]);

  useEffect(() => {
    if (!user || !isVendeur || status !== 'authenticated' || session?.error) return;
    loadVendorNotifs();
    const id = setInterval(loadVendorNotifs, 30000);
    return () => clearInterval(id);
  }, [loadVendorNotifs, user, isVendeur, status, session]);

  useEffect(() => {
    if (!user || isVendeur || status !== 'authenticated' || session?.error) return;
    loadBuyerNotifs();
    const id = setInterval(loadBuyerNotifs, 20000); // 20s pour les acheteurs
    return () => clearInterval(id);
  }, [loadBuyerNotifs, user, isVendeur, status, session]);

  const markAllRead = () => {
    if (isVendeur) {
      notificationsAPI.markAllRead(vendorNotifs);
      setVendorUnread(0);
    } else {
      const updated = buyerNotifs.map(n => ({ ...n, read: true }));
      setBuyerNotifs(updated);
      setBuyerUnread(0);
      saveBuyerNotifsToStorage(updated);
    }
  };

  const handleNotifClick = (n) => {
    if (isVendeur) {
      router.push('/orders');
    } else {
      if (['shipped', 'arrival', 'delivered'].includes(n.type)) {
        router.push(`/orders/${n.orderId}/tracking`);
      } else {
        router.push('/orders');
      }
    }
    setNotifOpen(false);
  };

  /* ── Icône notif acheteur ──────────────────────────────── */
  const BuyerNotifIcon = ({ type, color }) => {
    const s = 17;
    if (type === 'camera')   return <Camera size={s} color={color} />;
    if (type === 'truck')    return <Truck size={s} color={color} />;
    if (type === 'mappin')   return <MapPin size={s} color={color} />;
    if (type === 'check')    return <CheckCircle size={s} color={color} />;
    return <Bell size={s} color={color} />;
  };



  const avatarUrl     = user?.profile_photo ? getImageUrl(user.profile_photo) : user?.profile_photo_url || null;
  const deconnexion   = () => { authAPI.logout(); router.push('/login'); };
  const dashboardPath = isVendeur ? '/vendor/dashboard' : '/buyer/dashboard';

  const navLinks = [
    { href:'/',      label:'Accueil',  icon:Home },
    { href:'/shop',  label:'Boutique', icon:Store },
    { href:'/about', label:'À propos', icon:Compass },
  ];

  // Action notif mobile : ouvre la notif dropdown ou navigue
  const handleMobileNotif = () => {
    setNotifOpen(v => {
      const next = !v;
      if (next && unread > 0) markAllRead();
      return next;
    });
  };

  const bottomItems = user
    ? isVendeur
      ? [
          { icon:Home,        label:'Accueil',   path:'/',                   action:() => router.push('/') },
          { icon:ShoppingBag, label:'Commandes', path:'/orders',             action:() => router.push('/orders') },
          { icon:Plus,        label:'Ajouter',   path:'/vendor/add-product', action:() => router.push('/vendor/add-product'), center:true },
          { icon:BarChart3,   label:'Dashboard', path:'/vendor/dashboard',   action:() => router.push('/vendor/dashboard') },
          { icon:Bell,        label:'Notifs',    path:'/__notifs__',          action:handleMobileNotif, badge: unread },        ]
      : [
          { icon:Home,        label:'Accueil',   path:'/',                action:() => router.push('/') },
          { icon:ShoppingBag, label:'Commandes', path:'/orders',          action:() => router.push('/orders') },
          { icon:ShoppingCart,label:'Panier',    path:'/cart',            action:() => router.push('/cart'), center:true, badge:cartCount },
          { icon:Bell,        label:'Notifs',    path:'/__notifs__',       action:handleMobileNotif, badge: unread },
          { icon:User,        label:'Profil',    path:'/profile/edit',    action:() => router.push('/profile/edit') },
        ]
    : [
        { icon:Home,        label:'Accueil',  path:'/',      action:() => router.push('/') },
        { icon:Store,       label:'Boutique', path:'/shop',  action:() => router.push('/shop') },
        { icon:ShoppingCart,label:'Panier',   path:'/cart',  action:() => router.push('/cart'), center:true, badge:cartCount },
        { icon:User,        label:'Commencer',path:'/register', action:() => router.push('/register') },
      ];

  const curPath = pageCourante || (typeof window !== 'undefined' ? window.location.pathname : '');
  const heroTop = heroOverlay && !scrolled;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .nb-root, .nb-root * { font-family:'DM Sans',sans-serif; box-sizing:border-box; }

        @keyframes nb-down  { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes nb-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.18)} }
        @keyframes nb-pop   { from{opacity:0;transform:translateY(16px) scale(.8)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes nb-spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .nb-bar {
          background: transparent !important;
          border-bottom: 1px solid transparent;
          position: sticky; top: 0; z-index: 200;
          transition: box-shadow .25s, border-color .25s, background .3s;
        }
        .nb-bar.scrolled { box-shadow:none; border-color:transparent; }
        .nb-bar.hero-top { background:transparent !important; border-bottom-color:transparent; box-shadow:none; }
        .nb-bar.hero-top .nb-link { color:rgba(255,255,255,.82); }
        .nb-bar.hero-top .nb-link:hover { background:rgba(255,255,255,.1); color:#fff; }
        .nb-bar.hero-top .nb-link.act { background:rgba(249,115,22,.22); color:#fff; }
        .nb-bar.hero-top .nb-ibtn { color:rgba(255,255,255,.85); }
        .nb-bar.hero-top .nb-ibtn:hover { background:rgba(255,255,255,.12); color:#fff; }
        .nb-bar.hero-top .nb-login { border-color:rgba(255,255,255,.35); color:#fff; }
        .nb-bar.hero-top .nb-login:hover { background:rgba(255,255,255,.1); }
        .nb-bar.hero-top .nb-theme-btn.dark-off { background:rgba(255,255,255,.12); border-color:rgba(255,255,255,.25); }
        .nb-bar.hero-top.scrolled { background:transparent !important; border-bottom-color:transparent; }
        .nb-bar.hero-top.scrolled .nb-link { color:var(--text2,#6b7280); }
        .nb-bar.hero-top.scrolled .nb-link.act { color:#f97316; background:rgba(249,115,22,.12); }
        .nb-inner { max-width:1300px; margin:0 auto; padding:0 24px; height:64px; display:flex; align-items:center; position:relative; }

        .nb-logo { background:none; border:none; cursor:pointer; padding:0; display:flex; align-items:center; flex-shrink:0; transition:opacity .2s; }
        .nb-logo:hover { opacity:.82; }

        .nb-links { display:flex; align-items:center; gap:2px; margin-left:28px; }
        .nb-link  { display:flex; align-items:center; gap:6px; padding:7px 13px; border-radius:10px; font-size:14px; font-weight:500; color:var(--text2,#555); text-decoration:none; transition:all .18s; white-space:nowrap; }
        .nb-link:hover { background:var(--bg3,#f9fafb); color:var(--text,#1a1a1a); }
        .nb-link.act   { background:rgba(249,115,22,.12); color:#f97316; font-weight:700; }

        .nb-right  { margin-left:auto; display:flex; align-items:center; gap:4px; }
        .nb-center { position:absolute; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:2px; }

        .nb-ibtn { background:none; border:none; cursor:pointer; color:var(--text2,#6b7280); padding:8px; border-radius:10px; display:flex; align-items:center; justify-content:center; transition:background .15s,color .15s; position:relative; }
        .nb-ibtn:hover  { background:var(--bg3,#f3f4f6); color:var(--text,#1a1a1a); }
        .nb-ibtn.o:hover{ background:rgba(249,115,22,.12); color:#f97316; }

        .nb-badge { position:absolute; top:2px; right:2px; background:#f97316; color:#fff; font-size:8px; font-weight:800; border-radius:999px; min-width:15px; height:15px; display:flex; align-items:center; justify-content:center; border:2px solid var(--bg2,#fff); padding:0 2px; }
        .nb-dot   { position:absolute; top:5px; right:5px; width:7px; height:7px; background:#ef4444; border-radius:50%; border:2px solid var(--bg2,#fff); animation:nb-pulse 2s ease-in-out infinite; }

        .nb-login  { background:none; border:1.5px solid var(--border,#e5e7eb); border-radius:10px; padding:7px 16px; font-size:13px; font-weight:600; cursor:pointer; color:var(--text,#374151); transition:all .2s; font-family:inherit; white-space:nowrap; }
        .nb-login:hover  { border-color:#f97316; color:#f97316; }
        .nb-signup { background:#f97316; border:none; border-radius:10px; padding:8px 18px; font-size:13px; font-weight:700; cursor:pointer; color:#fff; box-shadow:0 3px 12px rgba(249,115,22,.3); transition:background .2s,transform .15s; font-family:inherit; white-space:nowrap; }
        .nb-signup:hover { background:#ea6a0a; transform:translateY(-1px); }

        .nb-avatar { background:none; border:none; cursor:pointer; padding:3px; border-radius:50%; display:flex; align-items:center; transition:transform .18s,box-shadow .18s; }
        .nb-avatar:hover { transform:scale(1.07); box-shadow:0 0 0 3px rgba(249,115,22,.2); }
        .nb-avatar img { width:36px; height:36px; border-radius:50%; object-fit:cover; border:2.5px solid #f97316; display:block; }
        .nb-avatar-ph  { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#f97316,#fb923c); color:#fff; font-weight:800; font-size:15px; display:flex; align-items:center; justify-content:center; border:2.5px solid #f97316; }

        .nb-deco { background:none; border:1.5px solid rgba(239,68,68,.3); border-radius:10px; padding:7px 12px; cursor:pointer; color:#ef4444; display:flex; align-items:center; gap:5px; font-size:12.5px; font-weight:600; font-family:inherit; transition:all .18s; margin-left:4px; white-space:nowrap; }
        .nb-deco:hover { background:rgba(239,68,68,.1); border-color:rgba(239,68,68,.5); }
        .nb-deco-label { display:inline; }

        .nb-theme-btn { background:none; border:1.5px solid var(--border,#e5e7eb); border-radius:999px; width:68px; height:34px; cursor:pointer; display:flex; align-items:center; padding:3px; position:relative; transition:background .3s,border-color .3s; flex-shrink:0; overflow:hidden; }
        .nb-theme-btn.dark-on  { background:#1c1c1e; border-color:#3a3a3c; }
        .nb-theme-btn.dark-off { background:#f3f4f6; border-color:#e5e7eb; }
        .nb-theme-knob { width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:transform .3s cubic-bezier(.34,1.56,.64,1),background .3s; flex-shrink:0; }
        .nb-theme-btn.dark-on  .nb-theme-knob { transform:translateX(34px); background:#f97316; box-shadow:0 2px 8px rgba(249,115,22,.5); }
        .nb-theme-btn.dark-off .nb-theme-knob { transform:translateX(0px);  background:#fff;    box-shadow:0 2px 6px rgba(0,0,0,.15); }
        .nb-theme-icons { position:absolute; inset:0; display:flex; align-items:center; justify-content:space-between; padding:0 7px; pointer-events:none; }
        .nb-theme-btn.dark-off .nb-t-sun  { color:#f59e0b; opacity:1; }
        .nb-theme-btn.dark-off .nb-t-moon { color:#9ca3af; opacity:.4; }
        .nb-theme-btn.dark-on  .nb-t-sun  { color:#9ca3af; opacity:.4; }
        .nb-theme-btn.dark-on  .nb-t-moon { color:#f97316; opacity:1; }

        /* ══ NOTIF DROPDOWN ══════════════════════════════════ */
        .nb-notif-drop {
          position:absolute; right:0; top:calc(100% + 10px);
          width:360px;
          background:var(--card,#fff);
          border:1px solid var(--border,#f0f0f0);
          border-radius:20px;
          box-shadow:0 20px 60px rgba(0,0,0,.13);
          z-index:300;
          /* ✅ scroll */
          display:flex; flex-direction:column;
          max-height:480px;
          overflow:hidden;
          animation:nb-down .22s cubic-bezier(.22,1,.36,1) both;
        }
        .nb-notif-hd {
          padding:14px 18px 12px;
          display:flex; align-items:center; justify-content:space-between;
          border-bottom:1px solid var(--border,#f3f4f6);
          flex-shrink:0; /* ← ne rétrécit pas */
        }
        /* ✅ Zone scrollable */
        .nb-notif-list {
          overflow-y:auto;
          flex:1;
          scrollbar-width:thin;
          scrollbar-color: rgba(249,115,22,.4) transparent;
        }
        .nb-notif-list::-webkit-scrollbar { width:4px; }
        .nb-notif-list::-webkit-scrollbar-track { background:transparent; }
        .nb-notif-list::-webkit-scrollbar-thumb { background:rgba(249,115,22,.4); border-radius:4px; }

        .nb-notif-row  { display:flex; align-items:flex-start; gap:12px; padding:11px 16px; border-bottom:1px solid var(--bg3,#f9fafb); transition:background .15s; cursor:pointer; position:relative; }
        .nb-notif-row:last-child { border-bottom:none; }
        .nb-notif-row:hover { background:var(--bg3,#fafafa); }
        .nb-notif-row.unread { background:rgba(249,115,22,.03); }
        .nb-notif-ico  { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .nb-notif-unread-dot { position:absolute; top:14px; right:14px; width:7px; height:7px; border-radius:50%; background:#f97316; }
        .nb-notif-empty { padding:36px 20px; text-align:center; color:#9ca3af; font-size:13px; }

        /* Pied du dropdown */
        .nb-notif-ft {
          padding:10px 16px;
          border-top:1px solid var(--border,#f3f4f6);
          flex-shrink:0;
          display:flex; gap:8px;
        }

        /* Mobile drawer */
        .nb-drawer { border-top:1px solid var(--border,#f0f0f0); background:var(--bg2,#fff); padding:12px 16px 100px; display:flex; flex-direction:column; gap:2px; animation:nb-down .2s ease both; }
        .nb-mlink  { display:flex; align-items:center; gap:12px; padding:12px 14px; font-size:15px; font-weight:600; color:var(--text,#333); text-decoration:none; border-radius:12px; transition:background .15s,color .15s; }
        .nb-mlink:hover, .nb-mlink.act { background:rgba(249,115,22,.12); color:#f97316; }
        .nb-mlink-ico { width:36px; height:36px; border-radius:10px; background:var(--bg3,#f3f4f6); display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background .15s; }
        .nb-mlink:hover .nb-mlink-ico, .nb-mlink.act .nb-mlink-ico { background:rgba(249,115,22,.2); }
        .nb-mdiv  { height:1px; background:var(--border,#f3f4f6); margin:8px 0; }
        .nb-mauth { display:flex; gap:10px; padding:8px 0 0; }
        .nb-mauth button { flex:1; padding:12px; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
        .nb-mlogout { display:flex; align-items:center; gap:10px; padding:12px 14px; border:none; background:none; cursor:pointer; font-size:14px; font-weight:700; color:#ef4444; border-radius:12px; width:100%; font-family:inherit; transition:background .15s; }
        .nb-mlogout:hover { background:rgba(239,68,68,.1); }
        .nb-mtheme { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-radius:12px; background:var(--bg3,#f9fafb); margin-top:2px; }
        .nb-mtheme-label { display:flex; align-items:center; gap:10px; font-size:14px; font-weight:600; color:var(--text,#1a1a1a); }
        .nb-mtheme-ico { width:36px; height:36px; border-radius:10px; background:var(--bg3,#f3f4f6); display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        /* BOTTOM NAV */
        .nb-bottom { display:none; position:fixed; bottom:16px; left:50%; transform:translateX(-50%); z-index:500; width:calc(100% - 24px); max-width:420px; transition:opacity .35s ease,transform .35s ease; opacity:1; }
        .nb-bottom.hiding { opacity:0; transform:translateX(-50%) translateY(20px); pointer-events:none; }
        .nb-bottom-pill { background:#222224; border-radius:28px; padding:0 2px; height:64px; display:flex; align-items:center; justify-content:space-between; box-shadow:0 16px 48px rgba(0,0,0,.50),0 4px 12px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.06); position:relative; overflow:visible; }
        .nb-bi { flex:1; min-width:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; background:none; border:none; cursor:pointer; padding:6px 2px 5px; border-radius:20px; transition:transform .15s; font-family:inherit; position:relative; }
        .nb-bi:active { transform:scale(.88); }
        .nb-bi-icon { color:#636366; transition:color .2s; display:flex; flex-shrink:0; }
        .nb-bi-icon.act { color:#f5f5f7; }
        .nb-bi-lbl { font-size:9.5px; font-weight:600; color:#636366; transition:color .2s,font-weight .2s; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; line-height:1; }
        .nb-bi-lbl.act { color:#f5f5f7; font-weight:700; }
        .nb-bi-bar { position:absolute; bottom:3px; width:18px; height:3px; border-radius:2px; background:#4ade80; }
        .nb-bc-slot { flex:1.2; min-width:0; display:flex; align-items:center; justify-content:center; position:relative; height:100%; }
        .nb-bc { width:54px; height:54px; border-radius:50%; background:linear-gradient(145deg,#f97316 0%,#fb923c 100%); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; position:absolute; bottom:6px; box-shadow:0 0 0 4px #222224,0 10px 28px rgba(249,115,22,.65),0 4px 10px rgba(0,0,0,.35); transition:transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s; animation:nb-pop .45s cubic-bezier(.22,1,.36,1) both; }
        .nb-bc:hover  { transform:scale(1.08) translateY(-2px); box-shadow:0 0 0 4px #222224,0 16px 40px rgba(249,115,22,.75),0 4px 12px rgba(0,0,0,.35); }
        .nb-bc:active { transform:scale(.9); }
        .nb-bc-badge  { position:absolute; top:-3px; right:-3px; background:#ef4444; color:#fff; font-size:8px; font-weight:800; border-radius:999px; min-width:15px; height:15px; display:flex; align-items:center; justify-content:center; border:2px solid #222224; padding:0 2px; }

        @media(max-width:860px) {
          .nb-links{display:none} .nb-login,.nb-signup{display:none} .nb-center{display:none}
          .nb-bottom{display:block} .nb-deco-label{display:none} .nb-deco{padding:7px 9px}
        }
        @media(max-width:600px) {
          .nb-inner{height:56px;padding:0 14px}
          .nb-bottom{bottom:12px;width:calc(100% - 20px)}
          .nb-bottom-pill{height:60px}
          .nb-bc{width:50px;height:50px;bottom:5px}
          .nb-bi-lbl{font-size:9px}
          .nb-notif-drop{width:calc(100vw - 24px);right:-8px}
        }
        @media(max-width:380px) {
          .nb-bottom{width:calc(100% - 16px)}
          .nb-bottom-pill{height:56px;border-radius:24px}
          .nb-bc{width:46px;height:46px;bottom:5px}
          .nb-bi-lbl{font-size:8.5px}
          .nb-bi{padding:5px 1px 4px}
        }
        /* Dropdown notif mobile — positionné au-dessus de la bottom nav */
        .nb-notif-drop-mobile {
          position:fixed;
          bottom:calc(64px + 20px);
          left:10px;
          right:10px;
          top:auto;
          width:auto;
          max-height:60vh;
          z-index:600;
        }
        @media(max-width:600px){
          .nb-notif-drop-mobile { bottom:calc(60px + 18px); }
        }
        @media(max-width:380px){
          .nb-notif-drop-mobile { bottom:calc(56px + 16px); left:8px; right:8px; }
        }

        /* DARK OVERRIDES */
        body.dark .nb-bar          { background:var(--bg2); border-color:var(--border); }
        body.dark .nb-bar.scrolled { box-shadow:0 4px 24px rgba(0,0,0,.4); }
        body.dark .nb-link         { color:var(--text2); }
        body.dark .nb-link:hover   { background:var(--bg3); color:var(--text); }
        body.dark .nb-link.act     { background:rgba(249,115,22,.15); color:#f97316; }
        body.dark .nb-ibtn         { color:var(--text2); }
        body.dark .nb-ibtn:hover   { background:var(--bg3); color:var(--text); }
        body.dark .nb-ibtn.o:hover { background:rgba(249,115,22,.12); color:#f97316; }
        body.dark .nb-badge        { border-color:var(--bg2); }
        body.dark .nb-dot          { border-color:var(--bg2); }
        body.dark .nb-login        { border-color:var(--border); color:var(--text); }
        body.dark .nb-login:hover  { border-color:#f97316; color:#f97316; }
        body.dark .nb-drawer       { background:var(--bg2); border-color:var(--border); }
        body.dark .nb-mlink        { color:var(--text); }
        body.dark .nb-mlink:hover, body.dark .nb-mlink.act { background:rgba(249,115,22,.12); color:#f97316; }
        body.dark .nb-mlink-ico    { background:var(--bg3); }
        body.dark .nb-mlink:hover .nb-mlink-ico, body.dark .nb-mlink.act .nb-mlink-ico { background:rgba(249,115,22,.2); }
        body.dark .nb-mdiv         { background:var(--border); }
        body.dark .nb-mlogout      { color:#f87171; }
        body.dark .nb-mlogout:hover{ background:rgba(239,68,68,.1); }
        body.dark .nb-mtheme       { background:var(--bg3); }
        body.dark .nb-mtheme-label { color:var(--text); }
        body.dark .nb-mtheme-ico   { background:var(--bg2); }
        body.dark .nb-notif-drop   { background:var(--card); border-color:var(--border); box-shadow:0 20px 60px rgba(0,0,0,.5); }
        body.dark .nb-notif-hd     { border-color:var(--border); }
        body.dark .nb-notif-row    { border-color:var(--border); }
        body.dark .nb-notif-row:hover  { background:var(--bg3); }
        body.dark .nb-notif-row.unread { background:rgba(249,115,22,.05); }
        body.dark .nb-notif-ft     { border-color:var(--border); }
        body.dark .nb-notif-empty  { color:var(--text2); }
        body.dark .nb-deco         { border-color:rgba(239,68,68,.3); color:#f87171; }
        body.dark .nb-deco:hover   { background:rgba(239,68,68,.1); border-color:rgba(239,68,68,.5); }
        body.dark .nb-theme-btn.dark-off { background:var(--bg3); border-color:var(--border); }
      `}</style>

      {/* ══ TOP NAVBAR ══ */}
      <header className={`nb-bar${heroTop ? ' hero-top' : ''}${scrolled ? ' scrolled' : ''}`}>
        <div className="nb-inner">

          <button className="nb-logo" onClick={() => router.push('/')}>
            <LogoShopCI size={30} dark={darkMode || heroTop}/>
          </button>

          {!user && (
            <nav className="nb-links">
              {navLinks.map(({ href, label, icon:Icon }) => (
                <a key={href} href={href} className={`nb-link${pageCourante === href ? ' act' : ''}`}>
                  <Icon size={15}/>{label}
                </a>
              ))}
            </nav>
          )}

          {user && (
            <div className="nb-center">
              <button className="nb-ibtn o" onClick={() => router.push('/cart')} title="Panier">
                <ShoppingCart size={20}/>
                {cartCount > 0 && <span className="nb-badge">{cartCount > 99 ? '99+' : cartCount}</span>}
              </button>
              {isVendeur && (
                <>
                  <button className="nb-ibtn o" onClick={() => router.push('/orders')} title="Commandes reçues">
                    <ShoppingBag size={20}/>
                  </button>
                  <button className="nb-ibtn o" onClick={() => router.push('/vendor/add-product')} title="Ajouter un produit">
                    <Plus size={20}/>
                  </button>
                </>
              )}
              {!isVendeur && (
                <button className="nb-ibtn o" onClick={() => router.push('/orders')} title="Mes commandes">
                  <ShoppingBag size={20}/>
                </button>
              )}
              <button className="nb-ibtn o" onClick={() => router.push('/profile/edit')} title="Paramètres">
                <Settings size={20}/>
              </button>

              {/* ── Cloche notifs (vendeur ET acheteur) ── */}
              <div style={{ position:'relative' }} ref={notifRef}>
                <button className="nb-ibtn o" onClick={() => {
                  const next = !notifOpen;
                  setNotifOpen(next);
                  if (next && unread > 0) markAllRead();
                }} title="Notifications">
                  <Bell size={20}/>
                  {unread > 0 && <span className="nb-badge">{unread > 9 ? '9+' : unread}</span>}
                </button>

                {notifOpen && (
                  <div className="nb-notif-drop">

                    {/* En-tête */}
                    <div className="nb-notif-hd">
                      <span style={{ fontSize:'14px', fontWeight:800, color:'var(--text,#1a1a1a)' }}>
                        {isVendeur ? 'Commandes reçues' : 'Mes notifications'}
                      </span>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        {notifs.length > 0 && (
                          <span style={{ fontSize:'11px', background:'#f97316', color:'#fff', borderRadius:'999px', padding:'2px 8px', fontWeight:700 }}>
                            {notifs.length}
                          </span>
                        )}
                        {unread > 0 && (
                          <button onClick={markAllRead}
                            style={{ background:'none', border:'none', cursor:'pointer', fontSize:'11px', color:'#94a3b8', fontWeight:600, padding:'2px 6px', borderRadius:6, fontFamily:'inherit' }}>
                            Tout lire
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ✅ Liste scrollable */}
                    <div className="nb-notif-list">
                      {notifs.length === 0 ? (
                        <div className="nb-notif-empty">
                          <Bell size={28} color="#e2e8f0" style={{ marginBottom:8, display:'block', margin:'0 auto 8px' }}/>
                          Aucune notification pour l'instant
                        </div>
                      ) : isVendeur ? (
                        // ── Notifs vendeur ──
                        notifs.map(n => (
                          <div key={n.id} className="nb-notif-row" onClick={() => { router.push('/orders'); setNotifOpen(false); }}>
                            <div className="nb-notif-ico" style={{ background:'rgba(249,115,22,.12)' }}>
                              <ShoppingBag size={17} color="#f97316"/>
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text,#1a1a1a)', lineHeight:1.4 }}>
                                Commande #{n.orderId}
                                {n.total && <span style={{ color:'#f97316', marginLeft:6, fontWeight:700 }}>{Number(n.total).toLocaleString('fr-FR')} FCFA</span>}
                              </div>
                              <div style={{ fontSize:'11.5px', color:'#9ca3af', marginTop:'2px' }}>{n.buyer} · {n.sub}</div>
                              <div style={{ fontSize:'11px', marginTop:2, display:'inline-block', padding:'1px 7px', borderRadius:6,
                                background: n.status==='pending' ? 'rgba(249,115,22,.15)' : n.status==='delivered' ? 'rgba(22,163,74,.15)' : 'var(--bg3)',
                                color: n.status==='pending' ? '#f97316' : n.status==='delivered' ? '#4ade80' : 'var(--text2)',
                                fontWeight:700 }}>
                                {n.status==='pending'?'En attente':n.status==='processing'?'Préparation':n.status==='shipped'?'Expédiée':n.status==='delivered'?'Livrée':n.status==='cancelled'?'Annulée':n.status}
                              </div>
                            </div>
                            <div style={{ width:8, height:8, borderRadius:'50%', background:'#f97316', flexShrink:0, marginTop:'4px' }}/>
                          </div>
                        ))
                      ) : (
                        // ── Notifs acheteur ──
                        buyerNotifs.map(n => (
                          <div key={n.uid} className={`nb-notif-row${!n.read ? ' unread' : ''}`}
                            onClick={() => handleNotifClick(n)}>
                            <div className="nb-notif-ico" style={{ background: `${n.color}18` }}>
                              <BuyerNotifIcon type={n.icon} color={n.color}/>
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:'13px', fontWeight: n.read ? 500 : 700, color:'var(--text,#1a1a1a)', lineHeight:1.4 }}>
                                {n.text}
                              </div>
                              <div style={{ fontSize:'11.5px', color:'#9ca3af', marginTop:'2px' }}>{n.sub}</div>
                            </div>
                            {!n.read && <div className="nb-notif-unread-dot"/>}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Pied */}
                    <div className="nb-notif-ft">
                      <button onClick={() => { router.push('/orders'); setNotifOpen(false); }}
                        style={{ flex:1, padding:'8px', borderRadius:'8px', background:'rgba(249,115,22,.12)', border:'1px solid rgba(249,115,22,.3)', color:'#f97316', fontWeight:700, fontSize:'12px', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                        {isVendeur ? 'Voir toutes les commandes' : 'Voir mes commandes'}
                      </button>
                      {!isVendeur && buyerNotifs.length > 0 && (
                        <button onClick={() => {
                          const cleared = [];
                          setBuyerNotifs(cleared);
                          setBuyerUnread(0);
                          saveBuyerNotifsToStorage(cleared);
                        }}
                          style={{ padding:'8px 12px', borderRadius:'8px', background:'var(--bg3,#f3f4f6)', border:'1px solid var(--border,#e2e8f0)', color:'var(--text2,#6b7280)', fontWeight:600, fontSize:'12px', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                          Effacer
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="nb-right">
            <button className={`nb-theme-btn ${darkMode ? 'dark-on' : 'dark-off'}`} onClick={() => setDarkMode(d => !d)} title={darkMode ? 'Mode clair' : 'Mode sombre'} aria-label="Changer de thème">
              <div className="nb-theme-icons">
                <Sun  size={13} className="nb-t-sun"/>
                <Moon size={13} className="nb-t-moon"/>
              </div>
              <div className="nb-theme-knob"/>
            </button>

            {user ? (
              <>
                <button className="nb-avatar" onClick={() => router.push(dashboardPath)} title={isVendeur ? 'Dashboard vendeur' : 'Mon espace client'}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt={user.username} onError={e => e.target.style.display='none'}/>
                    : <div className="nb-avatar-ph">{user.username?.[0]?.toUpperCase()}</div>
                  }
                </button>
                <button className="nb-deco" onClick={deconnexion} title="Déconnexion">
                  <LogOut size={15}/>
                  <span className="nb-deco-label">Déconnexion</span>
                </button>
              </>
            ) : (
              <>
                <button className="nb-ibtn o" onClick={() => router.push('/cart')} title="Panier">
                  <ShoppingCart size={20}/>
                  {cartCount > 0 && <span className="nb-badge">{cartCount > 99 ? '99+' : cartCount}</span>}
                </button>
                <button className="nb-signup" onClick={() => router.push('/register')}>Créer votre compte</button>
              </>
            )}
          </div>
        </div>

        {/* Drawer mobile */}
        {menuMobile && (
          <div className="nb-drawer">
            {navLinks.map(({ href, label, icon:Icon }) => (
              <a key={href} href={href} onClick={() => setMenuMobile(false)} className={`nb-mlink${pageCourante === href ? ' act' : ''}`}>
                <div className="nb-mlink-ico"><Icon size={17} color={pageCourante === href ? '#f97316' : '#6b7280'}/></div>
                {label}
              </a>
            ))}
            {user ? (
              <>
                <div className="nb-mdiv"/>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', background:'var(--bg3,#fafafa)', borderRadius:'12px', marginBottom:'4px' }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', border:'2px solid #f97316' }}/>
                    : <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#f97316,#fb923c)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:15 }}>{user.username?.[0]?.toUpperCase()}</div>
                  }
                  <div style={{ fontWeight:700, fontSize:'14px', color:'var(--text,#1a1a1a)' }}>{user.username}</div>
                </div>
                {isVendeur ? (
                  <>
                    <a href="/vendor/dashboard"    className="nb-mlink" onClick={() => setMenuMobile(false)}><div className="nb-mlink-ico"><BarChart3 size={17} color="#6b7280"/></div>Tableau de bord</a>
                    <a href="/orders"              className="nb-mlink" onClick={() => setMenuMobile(false)}><div className="nb-mlink-ico"><ShoppingBag size={17} color="#6b7280"/></div>Commandes reçues</a>
                    <a href="/vendor/add-product"  className="nb-mlink" onClick={() => setMenuMobile(false)}><div className="nb-mlink-ico"><Plus size={17} color="#6b7280"/></div>Ajouter un produit</a>
                  </>
                ) : (
                  <>
                    <a href="/buyer/dashboard" className="nb-mlink" onClick={() => setMenuMobile(false)}><div className="nb-mlink-ico"><TrendingUp size={17} color="#6b7280"/></div>Mon espace client</a>
                    <a href="/orders"          className="nb-mlink" onClick={() => setMenuMobile(false)}><div className="nb-mlink-ico"><Package size={17} color="#6b7280"/></div>Mes commandes</a>
                    <a href="/cart"            className="nb-mlink" onClick={() => setMenuMobile(false)}>
                      <div className="nb-mlink-ico"><ShoppingCart size={17} color="#6b7280"/></div>
                      Mon panier {cartCount > 0 && <span style={{ marginLeft:'auto', background:'#f97316', color:'#fff', borderRadius:'999px', padding:'1px 7px', fontSize:'11px', fontWeight:800 }}>{cartCount}</span>}
                    </a>
                  </>
                )}
                <a href="/profile/edit" className="nb-mlink" onClick={() => setMenuMobile(false)}><div className="nb-mlink-ico"><Settings size={17} color="#6b7280"/></div>Paramètres</a>
                <div className="nb-mdiv"/>
                <button className="nb-mlogout" onClick={() => { deconnexion(); setMenuMobile(false); }}>
                  <div className="nb-mlink-ico" style={{ background:'rgba(239,68,68,.12)' }}><LogOut size={17} color="#ef4444"/></div>
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <div className="nb-mdiv"/>
                <div className="nb-mauth">
                  <button style={{ border:'none', background:'#f97316', color:'#fff', boxShadow:'0 3px 12px rgba(249,115,22,.3)' }} onClick={() => { router.push('/register'); setMenuMobile(false); }}>Créer votre compte</button>
                </div>
              </>
            )}
            <div className="nb-mdiv"/>
            <div className="nb-mtheme">
              <div className="nb-mtheme-label">
                <div className="nb-mtheme-ico">{darkMode ? <Moon size={17} color="#f97316"/> : <Sun size={17} color="#f59e0b"/>}</div>
                {darkMode ? 'Mode sombre' : 'Mode clair'}
              </div>
              <button className={`nb-theme-btn ${darkMode ? 'dark-on' : 'dark-off'}`} onClick={() => setDarkMode(d => !d)} style={{ marginLeft:'auto' }}>
                <div className="nb-theme-icons"><Sun size={13} className="nb-t-sun"/><Moon size={13} className="nb-t-moon"/></div>
                <div className="nb-theme-knob"/>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ══ BOTTOM NAV MOBILE ══ */}
      <nav className={`nb-bottom${scrollingDown ? ' hiding' : ''}`} aria-label="Navigation mobile">
        {/* Dropdown notif ancré au bottom nav (mobile) */}
        {notifOpen && (
          <div ref={notifRef} className="nb-notif-drop nb-notif-drop-mobile">
            {/* En-tête */}
            <div className="nb-notif-hd">
              <span style={{ fontSize:'14px', fontWeight:800, color:'var(--text,#1a1a1a)' }}>
                {isVendeur ? 'Commandes reçues' : 'Mes notifications'}
              </span>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {notifs.length > 0 && (
                  <span style={{ fontSize:'11px', background:'#f97316', color:'#fff', borderRadius:'999px', padding:'2px 8px', fontWeight:700 }}>
                    {notifs.length}
                  </span>
                )}
                {unread > 0 && (
                  <button onClick={markAllRead}
                    style={{ background:'none', border:'none', cursor:'pointer', fontSize:'11px', color:'#94a3b8', fontWeight:600, padding:'2px 6px', borderRadius:6, fontFamily:'inherit' }}>
                    Tout lire
                  </button>
                )}
                <button onClick={() => setNotifOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 4px', display:'flex', alignItems:'center' }}>
                  <X size={15} color="#9ca3af"/>
                </button>
              </div>
            </div>
            <div className="nb-notif-list">
              {notifs.length === 0 ? (
                <div className="nb-notif-empty">
                  <Bell size={28} color="#e2e8f0" style={{ marginBottom:8, display:'block', margin:'0 auto 8px' }}/>
                  Aucune notification pour l'instant
                </div>
              ) : isVendeur ? (
                notifs.map(n => (
                  <div key={n.id} className="nb-notif-row" onClick={() => { router.push('/orders'); setNotifOpen(false); }}>
                    <div className="nb-notif-ico" style={{ background:'rgba(249,115,22,.12)' }}>
                      <ShoppingBag size={17} color="#f97316"/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text,#1a1a1a)', lineHeight:1.4 }}>
                        Commande #{n.orderId}
                        {n.total && <span style={{ color:'#f97316', marginLeft:6, fontWeight:700 }}>{Number(n.total).toLocaleString('fr-FR')} FCFA</span>}
                      </div>
                      <div style={{ fontSize:'11.5px', color:'#9ca3af', marginTop:'2px' }}>{n.buyer} · {n.sub}</div>
                    </div>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'#f97316', flexShrink:0, marginTop:'4px' }}/>
                  </div>
                ))
              ) : (
                buyerNotifs.map(n => (
                  <div key={n.uid} className={`nb-notif-row${!n.read ? ' unread' : ''}`} onClick={() => handleNotifClick(n)}>
                    <div className="nb-notif-ico" style={{ background:`${n.color}18` }}>
                      <BuyerNotifIcon type={n.icon} color={n.color}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'13px', fontWeight: n.read ? 500 : 700, color:'var(--text,#1a1a1a)', lineHeight:1.4 }}>{n.text}</div>
                      <div style={{ fontSize:'11.5px', color:'#9ca3af', marginTop:'2px' }}>{n.sub}</div>
                    </div>
                    {!n.read && <div className="nb-notif-unread-dot"/>}
                  </div>
                ))
              )}
            </div>
            <div className="nb-notif-ft">
              <button onClick={() => { router.push('/orders'); setNotifOpen(false); }}
                style={{ flex:1, padding:'8px', borderRadius:'8px', background:'rgba(249,115,22,.12)', border:'1px solid rgba(249,115,22,.3)', color:'#f97316', fontWeight:700, fontSize:'12px', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                {isVendeur ? 'Voir toutes les commandes' : 'Voir mes commandes'}
              </button>
              {!isVendeur && buyerNotifs.length > 0 && (
                <button onClick={() => {
                  const cleared = [];
                  setBuyerNotifs(cleared);
                  setBuyerUnread(0);
                  saveBuyerNotifsToStorage(cleared);
                }}
                  style={{ padding:'8px 12px', borderRadius:'8px', background:'var(--bg3,#f3f4f6)', border:'1px solid var(--border,#e2e8f0)', color:'var(--text2,#6b7280)', fontWeight:600, fontSize:'12px', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                  Effacer
                </button>
              )}
            </div>
          </div>
        )}
        <div className="nb-bottom-pill">
          {bottomItems.map((item, i) => {
            const isAct = curPath === item.path;
            if (item.center) {
              return (
                <div key={i} className="nb-bc-slot">
                  <button className="nb-bc" onClick={item.action} aria-label={item.label}>
                    <item.icon size={24} color="#fff" strokeWidth={2.2}/>
                    {item.badge > 0 && <span className="nb-bc-badge">{item.badge > 99 ? '99+' : item.badge}</span>}
                  </button>
                </div>
              );
            }
            return (
              <button key={i} className="nb-bi" onClick={item.action} aria-label={item.label}>
                <div className={`nb-bi-icon${isAct ? ' act' : ''}`}><item.icon size={20} strokeWidth={isAct ? 2.2 : 1.8}/></div>
                <span className={`nb-bi-lbl${isAct ? ' act' : ''}`}>{item.label}</span>
                {isAct && <div className="nb-bi-bar"/>}
                {item.badge > 0 && !item.center && <span style={{ position:'absolute', top:4, right:'50%', transform:'translateX(10px)', background:'#ef4444', color:'#fff', fontSize:'7px', fontWeight:800, borderRadius:'999px', minWidth:'13px', height:'13px', display:'flex', alignItems:'center', justifyContent:'center', border:'1.5px solid #222224', padding:'0 2px', lineHeight:1 }}>{item.badge > 9 ? '9+' : item.badge}</span>}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}