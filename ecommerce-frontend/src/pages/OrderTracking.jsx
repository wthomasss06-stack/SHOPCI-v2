'use client';

// ecommerce-frontend/src/pages/OrderTracking.jsx
// 📍 Suivi GPS temps réel — Interface Acheteur — ShopCI
// ✅ Itinéraire OSRM sur vraies routes + recalcul auto à chaque déviation GPS
// ✅ Fix flash carte: drawRoute stable via refs (carte jamais détruite/recréée)
// ✅ Carte agrandie sur mobile

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MapPin, Package, CheckCircle, CheckCircle2, Clock,
  Phone, Camera, Star, Navigation, ArrowLeft,
  User, ShieldCheck, Check, X, RefreshCw, AlertCircle, AlertTriangle, Ban,
  ClipboardList, Truck, PartyPopper
} from 'lucide-react';
import { ordersAPI, authAPI } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Loader from '../components/Loader';


/* ─────────────────────────────────────────────────────────────
   Formateur durée : min → "Xh YY" si ≥ 60 min, sinon "X min"
───────────────────────────────────────────────────────────── */
function formatDuration(min) {
  if (!min && min !== 0) return '—';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

/* ─────────────────────────────────────────────────────────────
   Formateur distance : arrondi 1 décimale + séparateur milliers
───────────────────────────────────────────────────────────── */
function formatDistance(km) {
  if (!km && km !== 0) return '—';
  const n = parseFloat(km);
  return n >= 1000
    ? `${(n / 1000).toFixed(1).replace('.', ',')} × 1000 km`
    : `${n.toFixed(1).replace('.', ',')} km`;
}

/* ── Hook dark mode ── */
function useDark() {
  const [dark, setDark] = React.useState(() => document.body.classList.contains('dark'));
  React.useEffect(() => {
    const obs = new MutationObserver(() => setDark(document.body.classList.contains('dark')));
    obs.observe(document.body, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

const POLL_MS = 8000;

const STEPS = [
  { key: 'pending',    label: 'Commande reçue',    Icon: ClipboardList, color: '#6366f1' },
  { key: 'processing', label: 'Préparation colis', Icon: Package,      color: '#f59e0b' },
  { key: 'shipped',    label: 'En livraison',       Icon: Truck,        color: '#3b82f6' },
  { key: 'delivered',  label: 'Livré',              Icon: CheckCircle2, color: '#10b981' },
];

/* ─────────────────────────────────────────────────────────────
   GÉOCODAGE
───────────────────────────────────────────────────────────── */
async function geocodeAddress(address) {
  if (!address) return null;
  try {
    const q   = encodeURIComponent(`${address}, Côte d'Ivoire`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=ci`,
      { headers: { 'Accept-Language': 'fr', 'User-Agent': 'ShopCI/1.0' } }
    );
    const data = await res.json();
    if (data?.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch (e) { console.warn('Geocode:', e); }
  return [5.3600, -4.0083];
}

/* ─────────────────────────────────────────────────────────────
   OSRM
───────────────────────────────────────────────────────────── */
async function fetchOSRMRoute(from, to) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from[1]},${from[0]};${to[1]},${to[0]}` +
    `?overview=full&geometries=geojson`;
  try {
    const res  = await fetch(url);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes?.[0]) {
      const r = data.routes[0];
      return {
        coords:      r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        durationMin: Math.ceil(r.duration / 60),
        distanceKm:  (r.distance / 1000).toFixed(1),
      };
    }
  } catch (e) { console.warn('OSRM:', e); }
  return null;
}

/* ─────────────────────────────────────────────────────────────
   LIVEMAP — Carte Leaflet avec routage OSRM
   ✅ FIX FLASH: drawRoute stable via refs
      → la carte n'est JAMAIS détruite/recréée lors des updates GPS
───────────────────────────────────────────────────────────── */
function LiveMap({ buyerCoords, vendorCoords, onRouteInfo }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef({});
  const routeRef     = useRef(null);
  const readyRef     = useRef(false);
  const lastKeyRef   = useRef('');

  // ✅ Refs pour les props changeantes — évite de recréer drawRoute
  const buyerCoordsRef  = useRef(buyerCoords);
  const vendorCoordsRef = useRef(vendorCoords);
  const onRouteInfoRef  = useRef(onRouteInfo);

  useEffect(() => { buyerCoordsRef.current  = buyerCoords;  }, [buyerCoords]);
  useEffect(() => { vendorCoordsRef.current = vendorCoords; }, [vendorCoords]);
  useEffect(() => { onRouteInfoRef.current  = onRouteInfo;  }, [onRouteInfo]);

  // ✅ drawRoute stable (deps: []) — lit depuis les refs
  const drawRoute = useCallback(async () => {
    const L   = window.L;
    const map = mapRef.current;
    if (!L || !map || !readyRef.current) return;

    const bc = buyerCoordsRef.current;
    const vc = vendorCoordsRef.current;
    const cb = onRouteInfoRef.current;

    // Marqueur destination 📍
    if (bc) {
      const icon = L.divIcon({
        html: `<div style="width:38px;height:38px;background:linear-gradient(135deg,#f97316,#fb923c);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 16px rgba(249,115,22,.5)"></div>`,
        iconSize: [38, 38], iconAnchor: [19, 38], className: '',
      });
      if (markersRef.current.buyer) markersRef.current.buyer.setLatLng(bc);
      else markersRef.current.buyer = L.marker(bc, { icon })
        .bindPopup('<b style="font-family:DM Sans,sans-serif">Adresse de livraison</b>')
        .addTo(map);
    }

    // Marqueur livreur 🛵
    if (vc) {
      const icon = L.divIcon({
        html: `<div style="width:44px;height:44px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 16px rgba(59,130,246,.5);display:flex;align-items:center;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg></div>`,
        iconSize: [44, 44], iconAnchor: [22, 22], className: '',
      });
      if (markersRef.current.vendor) markersRef.current.vendor.setLatLng(vc);
      else markersRef.current.vendor = L.marker(vc, { icon })
        .bindPopup('<b style="font-family:DM Sans,sans-serif">Livreur en route</b>')
        .addTo(map);
    }

    // Itinéraire OSRM livreur → destination
    if (vc && bc) {
      const key = `${vc[0].toFixed(4)},${vc[1].toFixed(4)}|${bc[0].toFixed(4)},${bc[1].toFixed(4)}`;
      if (key === lastKeyRef.current) return;
      lastKeyRef.current = key;

      if (routeRef.current) { try { map.removeLayer(routeRef.current); } catch (_) {} routeRef.current = null; }

      const route = await fetchOSRMRoute(vc, bc);

      if (route) {
        routeRef.current = L.polyline(route.coords, {
          color: '#2563eb', weight: 5, opacity: 0.88,
          lineJoin: 'round', lineCap: 'round',
        }).addTo(map);
        try { map.fitBounds(routeRef.current.getBounds(), { padding: [52, 52] }); } catch (_) {}
        cb?.({ durationMin: route.durationMin, distanceKm: route.distanceKm });
      } else {
        routeRef.current = L.polyline([vc, bc], {
          color: '#94a3b8', weight: 3, opacity: .5, dashArray: '8,6',
        }).addTo(map);
        try { map.fitBounds([vc, bc], { padding: [52, 52] }); } catch (_) {}
      }
    } else if (bc) {
      try { map.setView(bc, 14); } catch (_) {}
    }
  }, []); // ✅ STABLE — zéro dépendance

  // ✅ initMap stable (deps: [])
  const initMap = useCallback(() => {
    if (!containerRef.current || mapRef.current || !window.L) return;
    const el = containerRef.current;
    if (el.offsetWidth === 0 || el.offsetHeight === 0) return;
    const L = window.L;

    mapRef.current = L.map(el, {
      center: buyerCoordsRef.current || [5.3600, -4.0083],
      zoom: 14, zoomControl: false,
      fadeAnimation: false, zoomAnimation: false, markerZoomAnimation: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    setTimeout(() => {
      if (!mapRef.current) return;
      try { mapRef.current.invalidateSize(); } catch (_) {}
      readyRef.current = true;
      drawRoute();
    }, 150);
  }, [drawRoute]); // ✅ STABLE (drawRoute est stable)

  // Init + inject Leaflet une seule fois
  useEffect(() => {
    let iv = null;
    const tryInit = () => {
      if (window.L) { initMap(); return; }
      iv = setInterval(() => { if (window.L) { clearInterval(iv); iv = null; initMap(); } }, 100);
    };
    if (!document.querySelector('link[href*="leaflet"]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(l);
    }
    if (!document.querySelector('script[src*="leaflet"]')) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      s.onload = tryInit; document.head.appendChild(s);
    } else { tryInit(); }

    return () => {
      if (iv) clearInterval(iv);
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch (_) {}
        mapRef.current = null; markersRef.current = {};
        routeRef.current = null; readyRef.current = false; lastKeyRef.current = '';
      }
    };
  }, [initMap]);

  // ✅ Redessine quand les PROPS changent (sans recréer la carte)
  useEffect(() => {
    if (readyRef.current) drawRoute();
  }, [buyerCoords, vendorCoords, drawRoute]);

  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,.1)', zIndex: 1 }}>
      <div
        ref={containerRef}
        className="livemap-container"
        style={{ height: 'clamp(360px, 52vh, 520px)', background: '#dce9f0' }}
      />
      {!vendorCoords && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(248,250,252,.82)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 900, pointerEvents: 'none' }}>
          <Navigation size={34} color="#d1d5db" style={{ marginBottom: '.7rem' }} />
          <p style={{ margin: 0, color: '#9ca3af', fontWeight: 600, fontSize: '.88rem' }}>GPS du livreur en attente…</p>
          <p style={{ margin: '.3rem 0 0', color: '#d1d5db', fontWeight: 500, fontSize: '.76rem' }}>Disponible dès l'expédition</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────────────────────────── */
export default function OrderTracking() {
  const dark = useDark();
  const { orderId } = useParams();
  const router = useRouter();

  const [order,           setOrder]          = useState(null);
  const [loading,         setLoading]        = useState(true);
  const [vendorCoords,    setVendorCoords]   = useState(null);
  const [buyerCoords,     setBuyerCoords]    = useState(null);
  const [geocoding,       setGeocoding]      = useState(false);
  const [routeInfo,       setRouteInfo]      = useState(null);
  const [packagePhoto,    setPackagePhoto]   = useState(null);
  const [showValidation,  setShowValidation] = useState(false);
  const [rating,          setRating]         = useState(0);
  const [validating,      setValidating]     = useState(false);
  const [refreshing,      setRefreshing]     = useState(false);
  const [lastUpdate,      setLastUpdate]     = useState(new Date());
  const [showCancelModal, setShowCancelModal]= useState(false);
  const [cancelling,      setCancelling]     = useState(false);
  const [cancelError,     setCancelError]    = useState('');

  const pollRef     = useRef(null);
  const geocodedRef = useRef('');

  const geocodeDeliveryAddress = useCallback(async (address) => {
    if (!address || geocodedRef.current === address) return;
    geocodedRef.current = address;
    setGeocoding(true);
    try {
      const c = await geocodeAddress(address);
      if (c) setBuyerCoords(c);
    } finally { setGeocoding(false); }
  }, []);

  const fetchOrder = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const data = await ordersAPI.getById(orderId);
      setOrder(data);
      if (data.vendor_location?.lat && data.vendor_location?.lng)
        setVendorCoords([data.vendor_location.lat, data.vendor_location.lng]);
      if (data.package_photo_url || data.package_photo)
        setPackagePhoto(data.package_photo_url || data.package_photo);
      if (data.delivery_confirmed_by_vendor && data.status !== 'delivered')
        setShowValidation(true);
      if (data.delivery_address) geocodeDeliveryAddress(data.delivery_address);
      setLastUpdate(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [orderId, geocodeDeliveryAddress]);

  useEffect(() => {
    if (!authAPI.isAuthenticated()) { router.push('/login'); return; }
    fetchOrder();
    pollRef.current = setInterval(() => fetchOrder(true), POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchOrder, navigate]);

  const handleConfirmDelivery = async () => {
    setValidating(true);
    try {
      await ordersAPI.confirmDelivery(orderId, { rating });
      setOrder(p => ({ ...p, status: 'delivered' }));
      setShowValidation(false);
      clearInterval(pollRef.current);
    } catch (e) { console.error(e); }
    finally { setValidating(false); }
  };

  const handleCancelOrder = async () => {
    setCancelling(true); setCancelError('');
    try {
      await ordersAPI.updateStatus(orderId, { status: 'cancelled' });
      setOrder(p => ({ ...p, status: 'cancelled' }));
      setShowCancelModal(false); clearInterval(pollRef.current);
    } catch (e) { setCancelError("Impossible d'annuler cette commande."); }
    finally { setCancelling(false); }
  };

  if (loading) return (
    <>
      <Loader message="Chargement du suivi…" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
  if (!order) return (
    <div style={sx.centered}>
      <AlertCircle size={44} color="#ef4444" />
      <p style={{ fontWeight: 700, color: '#1f2937', marginTop: '.8rem', fontFamily: "'DM Sans',sans-serif" }}>Commande introuvable</p>
      <button onClick={() => router.push('/orders')} style={sx.btnOrange}>Mes commandes</button>
    </div>
  );

  const stepIdx     = STEPS.findIndex(s => s.key === order.status);
  const total       = parseFloat(order.total_amount || order.total || 0);
  const canCancel   = ['pending', 'processing'].includes(order.status);
  const isCancelled = order.status === 'cancelled';
  const isShipped   = order.status === 'shipped';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <Navbar />

      {showCancelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(3px)' }}
          onClick={() => !cancelling && setShowCancelModal(false)}>
          <div style={{ background: 'var(--card)', borderRadius: 20, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.2)', animation: 'modalIn .2s ease' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 56, height: 56, background: 'rgba(239,68,68,.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid rgba(239,68,68,.2)' }}>
              <AlertTriangle size={26} color="#ef4444" />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text)', textAlign: 'center', margin: '0 0 8px' }}>Annuler la commande ?</h3>
            <p style={{ fontSize: '14px', color: 'var(--text2)', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.5 }}>
              Commande <strong>#{order.id}</strong> — irréversible, le stock sera remis à jour.
            </p>
            {cancelError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: '13px', color: '#dc2626', fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <X size={14} /> {cancelError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowCancelModal(false); setCancelError(''); }}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', border: 'none', background: 'var(--bg3)', color: 'var(--text2)', fontFamily: "'DM Sans',sans-serif" }}>
                Non, garder
              </button>
              <button onClick={handleCancelOrder} disabled={cancelling}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: cancelling ? 'not-allowed' : 'pointer', border: 'none', background: cancelling ? '#e2e8f0' : '#ef4444', color: 'white', opacity: cancelling ? .7 : 1, fontFamily: "'DM Sans',sans-serif" }}>
                {cancelling ? 'Annulation…' : 'Oui, annuler'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '1rem 0' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem' }}>
            <button onClick={() => router.push('/orders')} style={sx.iconBtn}><ArrowLeft size={18} color="var(--text2)" /></button>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                Suivi commande <span style={{ color: '#f97316' }}>#{order.id}</span>
              </h1>
              <p style={{ margin: 0, fontSize: '.75rem', color: '#94a3b8' }}>Mis à jour à {lastUpdate.toLocaleTimeString('fr-FR')}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
            {canCancel && (
              <button onClick={() => { setShowCancelModal(true); setCancelError(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: '.35rem', background: 'rgba(239,68,68,.07)', border: '1.5px solid rgba(239,68,68,.3)', color: '#ef4444', borderRadius: 10, padding: '.45rem .9rem', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                <X size={13} /> Annuler
              </button>
            )}
            <button onClick={() => fetchOrder(true)} disabled={refreshing} style={sx.refreshBtn}>
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              Rafraîchir
            </button>
          </div>
        </div>
      </div>

      {isCancelled && (
        <div style={{ maxWidth: 960, margin: '1.5rem auto', padding: '0 1rem' }}>
          <div style={{ background: 'linear-gradient(135deg,#fef2f2,#fee2e2)', border: '1.5px solid #fca5a5', borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
            <Ban size={44} color="#ef4444" style={{ marginBottom: '.8rem' }} />
            <h3 style={{ fontWeight: 800, color: '#fca5a5', margin: '0 0 .4rem' }}>Commande annulée</h3>
            <p style={{ color: '#fca5a5', fontSize: '.88rem', margin: '0 0 1.5rem' }}>Cette commande a été annulée. Le stock a été remis à jour.</p>
            <button onClick={() => router.push('/orders')} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '.7rem 1.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '.88rem', fontFamily: "'DM Sans',sans-serif" }}>
              Retour aux commandes
            </button>
          </div>
        </div>
      )}

      {!isCancelled && (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1rem', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

            <div style={sx.card}>
              <div style={sx.cardHead}>
                <Navigation size={17} color="#3b82f6" />
                <span style={sx.cardTitle}>Itinéraire en temps réel</span>
                {isShipped && vendorCoords && (
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s ease infinite' }} />
                    <span style={{ fontSize: '.72rem', color: '#16a34a', fontWeight: 700 }}>EN DIRECT</span>
                  </span>
                )}
                {geocoding && (
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                    <RefreshCw size={12} color="#94a3b8" style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '.72rem', color: '#94a3b8' }}>Localisation…</span>
                  </span>
                )}
              </div>

              <LiveMap
                buyerCoords={buyerCoords}
                vendorCoords={isShipped ? vendorCoords : null}
                onRouteInfo={setRouteInfo}
              />

              <div style={{ display: 'flex', gap: '1rem', marginTop: '.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                  <MapPin size={15} color="#f97316" />
                  <span style={{ fontSize: '.78rem', color: '#64748b', fontWeight: 600 }}>Destination</span>
                </div>
                {isShipped && vendorCoords && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                    <Truck size={15} color="#3b82f6" />
                    <span style={{ fontSize: '.78rem', color: '#64748b', fontWeight: 600 }}>Livreur</span>
                  </div>
                )}
                {isShipped && routeInfo && (
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                    <div style={{ background: 'rgba(59,130,246,.15)', borderRadius: 20, padding: '.28rem .75rem', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                      <Clock size={12} color="#3b82f6" />
                      <span style={{ fontSize: '.78rem', color: '#60a5fa', fontWeight: 700 }}>~{formatDuration(routeInfo.durationMin)}</span>
                    </div>
                    <div style={{ background: 'rgba(22,163,74,.15)', borderRadius: 20, padding: '.28rem .75rem', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                      <MapPin size={12} color="#16a34a" />
                      <span style={{ fontSize: '.78rem', color: '#4ade80', fontWeight: 700 }}>{formatDistance(routeInfo.distanceKm)}</span>
                    </div>
                  </div>
                )}
              </div>

              {order.delivery_address && (
                <div style={{ marginTop: '.7rem', background: 'var(--bg3)', borderRadius: 10, padding: '.6rem .9rem', display: 'flex', alignItems: 'flex-start', gap: '.5rem' }}>
                  <MapPin size={14} color="#f97316" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: '.8rem', color: 'var(--text2)', fontWeight: 600, lineHeight: 1.4 }}>{order.delivery_address}</span>
                </div>
              )}
            </div>

            {packagePhoto && (
              <div style={sx.card}>
                <div style={sx.cardHead}>
                  <Camera size={17} color="#f97316" />
                  <span style={sx.cardTitle}>Photo de votre colis</span>
                  <span style={{ marginLeft: 'auto', background: 'rgba(22,163,74,.15)', color: '#4ade80', fontSize: '.72rem', fontWeight: 700, padding: '2px 9px', borderRadius: 20 }}><Check size={11} style={{ marginRight:3, display:"inline" }} />Vendeur</span>
                </div>
                <img src={packagePhoto} alt="Colis" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 12, border: '2px solid #f1f5f9' }} />
              </div>
            )}

            {showValidation && order.status !== 'delivered' && (
              <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1.5px solid #86efac', borderRadius: 16, padding: '1.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.9rem' }}>
                  <CheckCircle size={20} color="#16a34a" />
                  <span style={{ fontWeight: 800, color: '#4ade80', fontSize: '1rem' }}>Votre colis est arrivé !</span>
                </div>
                <p style={{ color: '#86efac', fontSize: '.86rem', marginBottom: '1.1rem', lineHeight: 1.6 }}>
                  Le livreur a confirmé son arrivée. Avez-vous bien reçu votre commande ?
                </p>
                <div style={{ marginBottom: '1.1rem' }}>
                  <p style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--text2)', marginBottom: '.4rem' }}>Notez votre expérience</p>
                  <div style={{ display: 'flex', gap: '.25rem' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} onClick={() => setRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '.15rem' }}>
                        <Star size={26} fill={s <= rating ? '#f59e0b' : 'none'} color={s <= rating ? '#f59e0b' : '#d1d5db'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '.7rem' }}>
                  <button onClick={handleConfirmDelivery} disabled={validating}
                    style={{ flex: 1, background: '#16a34a', color: 'white', border: 'none', borderRadius: 11, padding: '.85rem', fontWeight: 800, cursor: validating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.45rem', opacity: validating ? .7 : 1, fontSize: '.9rem', fontFamily: "'DM Sans',sans-serif" }}>
                    {validating ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />Validation…</> : <><Check size={15} />Oui, j'ai bien reçu mon colis</>}
                  </button>
                  <button onClick={() => setShowValidation(false)}
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 11, padding: '.85rem 1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.82rem', fontFamily: "'DM Sans',sans-serif" }}>
                    <X size={14} />Problème
                  </button>
                </div>
              </div>
            )}

            {order.status === 'delivered' && (
              <div style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '1.5px solid #93c5fd', borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
                <div style={{ marginBottom: '.6rem', display:'flex', justifyContent:'center' }}><PartyPopper size={52} color="#3b82f6" /></div>
                <h3 style={{ fontWeight: 800, color: '#93c5fd', margin: '0 0 .4rem' }}>Livraison confirmée !</h3>
                <p style={{ color: '#bfdbfe', fontSize: '.88rem', margin: 0 }}>Merci pour votre achat sur ShopCI.</p>
              </div>
            )}

            {canCancel && (
              <div style={{ background: 'var(--card)', borderRadius: 14, padding: '1.1rem', border: '1px solid var(--border)', boxShadow: '0 1px 12px rgba(15,23,42,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--text)' }}>Vous souhaitez annuler ?</div>
                  <div style={{ fontSize: '.75rem', color: '#9ca3af' }}>Possible uniquement avant l'expédition</div>
                </div>
                <button onClick={() => { setShowCancelModal(true); setCancelError(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,.07)', border: '1.5px solid rgba(239,68,68,.3)', color: '#ef4444', borderRadius: 10, padding: '.6rem 1.1rem', fontSize: '.84rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' }}>
                  <X size={14} /> Annuler la commande
                </button>
              </div>
            )}

            <div style={sx.card}>
              <div style={sx.cardHead}>
                <Package size={17} color="#f97316" />
                <span style={sx.cardTitle}>Articles commandés</span>
              </div>
              {(order.items || []).map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '.8rem', alignItems: 'center', padding: '.65rem 0', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ width: 44, height: 44, background: 'rgba(249,115,22,.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Package size={20} color="#f97316" /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '.86rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name}</div>
                    <div style={{ fontSize: '.75rem', color: '#94a3b8' }}>Qté : {item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#f97316', fontSize: '.86rem', flexShrink: 0 }}>
                    {(parseFloat(item.price) * item.quantity).toLocaleString('fr-FR')} F
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '.95rem', color: 'var(--text)', paddingTop: '.85rem', flexWrap: 'wrap', gap: 4 }}>
                <span>Paiement à la livraison</span>
                <span style={{ color: '#f97316' }}>{total.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={sx.card}>
              <div style={{ fontWeight: 700, fontSize: '.92rem', color: 'var(--text)', marginBottom: '1.2rem' }}>Progression</div>
              {STEPS.map((step, i) => {
                const done = i <= stepIdx, active = i === stepIdx;
                return (
                  <div key={step.key} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: done ? step.color : 'var(--bg3)', border: `2px solid ${done ? step.color : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem', flexShrink: 0, boxShadow: active ? `0 0 0 4px ${step.color}22` : 'none', transition: 'all .3s' }}>
                        {done && i < stepIdx ? <Check size={14} color="white" /> : <step.Icon size={15} color={done ? 'white' : '#94a3b8'} />}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div style={{ width: 2, height: 28, background: i < stepIdx ? step.color : '#e2e8f0', transition: 'background .3s', marginTop: 2 }} />
                      )}
                    </div>
                    <div style={{ paddingTop: '.5rem', paddingBottom: i < STEPS.length - 1 ? '.3rem' : 0 }}>
                      <div style={{ fontWeight: active ? 800 : 600, fontSize: '.84rem', color: done ? 'var(--text)' : 'var(--text3)' }}>{step.label}</div>
                      {active && <div style={{ fontSize: '.72rem', color: step.color, fontWeight: 700, marginTop: 2 }}>En cours…</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={sx.card}>
              <div style={{ fontWeight: 700, fontSize: '.92rem', color: 'var(--text)', marginBottom: '1rem' }}>Détails</div>
              {[
                { icon: <MapPin size={14} color="#f97316" />, label: 'Adresse',   val: order.delivery_address },
                { icon: <Phone size={14} color="#3b82f6" />, label: 'Téléphone', val: order.phone || order.buyer_phone },
                { icon: <User size={14} color="#6366f1" />,  label: 'Acheteur',  val: order.buyer_name },
              ].map(({ icon, label, val }) => (
                <div key={label} style={{ display: 'flex', gap: '.65rem', alignItems: 'flex-start', marginBottom: '.85rem' }}>
                  <div style={{ width: 28, height: 28, background: 'var(--bg3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '.7rem', color: '#94a3b8', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: '.83rem', color: 'var(--text)', fontWeight: 600, lineHeight: 1.4, wordBreak: 'break-word' }}>{val || '—'}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1.5px solid #86efac', borderRadius: 14, padding: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', marginBottom: '.7rem' }}>
                <ShieldCheck size={16} color="#16a34a" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.84rem', color: '#4ade80' }}>Paiement à la livraison</div>
                  <div style={{ fontSize: '.73rem', color: '#86efac' }}>Espèces à la réception</div>
                </div>
              </div>
              <div style={{ background: 'var(--bg2)', borderRadius: 10, padding: '.65rem', textAlign: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#4ade80' }}>{total.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes modalIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        .leaflet-container { background: #dce9f0 !important; }
        .leaflet-control-container { z-index: 400 !important; }
        .leaflet-pane { z-index: 200 !important; }
        .leaflet-top, .leaflet-bottom { z-index: 400 !important; }
        .leaflet-popup { z-index: 300 !important; }

        /* ✅ Carte agrandie sur mobile */
        @media(max-width:760px) {
          .livemap-container {
            height: clamp(320px, 56vw, 440px) !important;
          }
        }
      `}</style>

      <Footer />
    </div>
  );
}

const sx = {
  centered:   { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: '.5rem', fontFamily: 'system-ui,sans-serif' },
  spinner:    { width: 52, height: 52, border: '4px solid #e2e8f0', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  btnOrange:  { marginTop: '.8rem', background: '#f97316', color: 'white', border: 'none', padding: '.7rem 1.5rem', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontFamily: "'DM Sans',sans-serif" },
  iconBtn:    { background: 'var(--bg3)', border: 'none', cursor: 'pointer', borderRadius: 10, padding: '.5rem', display: 'flex', alignItems: 'center' },
  refreshBtn: { display: 'flex', alignItems: 'center', gap: '.4rem', background: 'var(--bg3)', border: 'none', cursor: 'pointer', borderRadius: 10, padding: '.5rem 1rem', fontWeight: 600, fontSize: '.82rem', color: 'var(--text2)', fontFamily: "'DM Sans',sans-serif" },
  card:       { background: 'var(--card)', borderRadius: 16, padding: '1.2rem', boxShadow: '0 1px 12px rgba(15,23,42,.06)', border: '1px solid var(--border)' },
  cardHead:   { display: 'flex', alignItems: 'center', gap: '.55rem', marginBottom: '1rem' },
  cardTitle:  { fontWeight: 700, fontSize: '.92rem', color: 'var(--text)' },
};