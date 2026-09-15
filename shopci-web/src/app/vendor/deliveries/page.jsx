'use client';

// ecommerce-frontend/src/pages/VendorDelivery.jsx
// 🛵 Gestion Livraison GPS — Interface Vendeur — ShopCI
// ✅ MiniMap avec itinéraire OSRM vendeur → destination + recalcul auto
// ✅ Fix mobile: évite double toggle (Pointer events) + anti double tap
// ✅ Fix flash carte: initMap stable (refs pour vendorCoords/deliveryAddress)
// ✅ Carte agrandie sur mobile

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, MapPin, Camera, Navigation,
  Truck, CheckCircle, Upload,
  RefreshCw, ChevronRight, ChevronDown, User, X, Play, Square, ArrowLeft, Clock
} from 'lucide-react';
import { ordersAPI, authAPI } from '@/services/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Loader from '@/components/Loader';

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
   Formateur distance : arrondi 1 décimale propre
───────────────────────────────────────────────────────────── */
function formatDistance(km) {
  if (!km && km !== 0) return '—';
  const n = parseFloat(km);
  return `${n.toFixed(1).replace('.', ',')} km`;
}

/* ─────────────────────────────────────────────────────────────
   Hook dark mode
───────────────────────────────────────────────────────────── */
function useDark() {
  const [dark, setDark] = React.useState(false); // pas de `document` côté serveur Next.js
  React.useEffect(() => {
    setDark(document.body.classList.contains('dark'));
    const obs = new MutationObserver(() => setDark(document.body.classList.contains('dark')));
    obs.observe(document.body, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

const POLL_MS = 15000;
const GPS_SEND_MS = 10000;

const DEFAULT_ABIDJAN = [5.3600, -4.0083];

const STATUS_META = {
  pending:    { bg: '#fef3c7', text: '#d97706', border: '#fcd34d', label: 'En attente'   },
  processing: { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa', label: 'Préparation'  },
  shipped:    { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', label: 'En livraison' },
  delivered:  { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', label: 'Livré'        },
  cancelled:  { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'Annulé'       },
};

const NEXT_ACTION = {
  pending:    { label: 'Commencer la préparation', nextStatus: 'processing', color: '#f59e0b' },
  processing: { label: 'Expédier',                 nextStatus: 'shipped',    color: '#3b82f6' },
};

/* ─────────────────────────────────────────────────────────────
   Caches (évite refetch inutile)
───────────────────────────────────────────────────────────── */
const geocodeCache = new Map();
const osrmCache = new Map();

/* ─────────────────────────────────────────────────────────────
   Permissions
───────────────────────────────────────────────────────────── */
async function getGeolocationPermissionState() {
  try {
    if (!navigator.permissions?.query) return 'unknown';
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state;
  } catch {
    return 'unknown';
  }
}

/* ─────────────────────────────────────────────────────────────
   GÉOCODAGE
───────────────────────────────────────────────────────────── */
async function geocodeAddress(address) {
  if (!address) return null;

  const key = address.trim().toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key);

  try {
    const q = encodeURIComponent(`${address}, Côte d'Ivoire`);
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=ci`;

    const res = await fetch(url, {
      headers: { 'Accept-Language': 'fr' },
    });

    const data = await res.json();
    if (data?.length > 0) {
      const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      geocodeCache.set(key, coords);
      return coords;
    }
  } catch (e) {
    console.warn('Geocode error:', e);
  }

  geocodeCache.set(key, DEFAULT_ABIDJAN);
  return DEFAULT_ABIDJAN;
}

/* ─────────────────────────────────────────────────────────────
   OSRM
───────────────────────────────────────────────────────────── */
async function fetchOSRMRoute(from, to) {
  if (!from || !to) return null;

  const key =
    `${from[0].toFixed(4)},${from[1].toFixed(4)}|${to[0].toFixed(4)},${to[1].toFixed(4)}`;

  if (osrmCache.has(key)) return osrmCache.get(key);

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from[1]},${from[0]};${to[1]},${to[0]}` +
    `?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.code === 'Ok' && data.routes?.[0]) {
      const r = data.routes[0];
      const route = {
        coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        durationMin: Math.ceil(r.duration / 60),
        distanceKm: (r.distance / 1000).toFixed(1),
      };
      osrmCache.set(key, route);
      return route;
    }
  } catch (e) {
    console.warn('OSRM error:', e);
  }

  osrmCache.set(key, null);
  return null;
}

/* ─────────────────────────────────────────────────────────────
   Leaflet loader (inject 1 fois)
───────────────────────────────────────────────────────────── */
let leafletPromise = null;

function loadLeafletOnce() {
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve) => {
    if (window.L) return resolve(true);

    if (!document.querySelector('link[href*="leaflet"]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(l);
    }

    if (!document.querySelector('script[src*="leaflet"]')) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      s.onload = () => resolve(true);
      document.head.appendChild(s);
    } else {
      const iv = setInterval(() => {
        if (window.L) {
          clearInterval(iv);
          resolve(true);
        }
      }, 80);
    }
  });

  return leafletPromise;
}

/* ─────────────────────────────────────────────────────────────
   MINIMAP VENDEUR
   ✅ FIX FLASH: initMap/drawRoute stables via refs
      → la carte n'est JAMAIS détruite/recréée lors des updates GPS
───────────────────────────────────────────────────────────── */
function MiniMap({ vendorCoords, deliveryAddress, onRouteInfo }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const markerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const routeRef = useRef(null);

  const readyRef = useRef(false);
  const lastKeyRef = useRef('');
  const destCoordsRef = useRef(null);
  const lastAddrRef = useRef('');

  // ✅ Refs pour les props changeantes — évite de recréer drawRoute/initMap
  const vendorCoordsRef = useRef(vendorCoords);
  const deliveryAddressRef = useRef(deliveryAddress);
  const onRouteInfoRef = useRef(onRouteInfo);

  useEffect(() => { vendorCoordsRef.current = vendorCoords; }, [vendorCoords]);
  useEffect(() => { deliveryAddressRef.current = deliveryAddress; }, [deliveryAddress]);
  useEffect(() => { onRouteInfoRef.current = onRouteInfo; }, [onRouteInfo]);

  // ✅ drawRoute stable (deps: []) — lit depuis les refs
  const drawRoute = useCallback(async () => {
    const L = window.L;
    const map = instanceRef.current;
    if (!L || !map || !readyRef.current) return;

    const vc = vendorCoordsRef.current;
    const da = deliveryAddressRef.current;
    const cb = onRouteInfoRef.current;

    // Vendor marker
    if (vc) {
      const icon = L.divIcon({
        html: `<div style="width:40px;height:40px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 12px rgba(59,130,246,.5)">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18.5" cy="17.5" r="3.5"/>
            <circle cx="5.5" cy="17.5" r="3.5"/>
            <circle cx="15" cy="5" r="1"/>
            <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
          </svg>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        className: '',
      });

      if (markerRef.current) markerRef.current.setLatLng(vc);
      else {
        markerRef.current = L.marker(vc, { icon })
          .bindPopup('<b style="font-family:DM Sans,sans-serif">Ma position</b>')
          .addTo(map);
      }
    }

    // Geocode destination si adresse changée
    if (da && da !== lastAddrRef.current) {
      lastAddrRef.current = da;
      destCoordsRef.current = await geocodeAddress(da);
    }

    const destCoords = destCoordsRef.current;

    // Destination marker
    if (destCoords) {
      const icon = L.divIcon({
        html: `<div style="width:34px;height:34px;background:linear-gradient(135deg,#f97316,#fb923c);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(249,115,22,.5)"></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        className: '',
      });

      if (destMarkerRef.current) destMarkerRef.current.setLatLng(destCoords);
      else {
        destMarkerRef.current = L.marker(destCoords, { icon })
          .bindPopup('<b style="font-family:DM Sans,sans-serif">Destination</b>')
          .addTo(map);
      }
    }

    // Route
    if (vc && destCoords) {
      const key =
        `${vc[0].toFixed(4)},${vc[1].toFixed(4)}|${destCoords[0].toFixed(4)},${destCoords[1].toFixed(4)}`;

      if (key === lastKeyRef.current) return;
      lastKeyRef.current = key;

      if (routeRef.current) {
        try { map.removeLayer(routeRef.current); } catch (_) {}
        routeRef.current = null;
      }

      const route = await fetchOSRMRoute(vc, destCoords);

      if (route) {
        routeRef.current = L.polyline(route.coords, {
          color: '#2563eb',
          weight: 4,
          opacity: 0.85,
          lineJoin: 'round',
          lineCap: 'round',
        }).addTo(map);

        try { map.fitBounds(routeRef.current.getBounds(), { padding: [32, 32] }); } catch (_) {}
        cb?.({ durationMin: route.durationMin, distanceKm: route.distanceKm });
      } else {
        routeRef.current = L.polyline([vc, destCoords], {
          color: '#94a3b8',
          weight: 3,
          opacity: 0.5,
          dashArray: '8,6',
        }).addTo(map);

        try { map.fitBounds([vc, destCoords], { padding: [32, 32] }); } catch (_) {}
        cb?.(null);
      }
    } else if (vc) {
      try { map.setView(vc, 15); } catch (_) {}
    }
  }, []); // ✅ STABLE — zéro dépendance

  // ✅ initMap stable (dépend de drawRoute qui est stable)
  const initMap = useCallback(async () => {
    if (!mapRef.current || instanceRef.current) return;

    await loadLeafletOnce();
    if (!window.L) return;

    const el = mapRef.current;
    if (el.offsetWidth === 0 || el.offsetHeight === 0) return;

    const L = window.L;

    instanceRef.current = L.map(el, {
      center: vendorCoordsRef.current || DEFAULT_ABIDJAN,
      zoom: 14,
      zoomControl: false,
      fadeAnimation: false,
      zoomAnimation: false,
      markerZoomAnimation: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(instanceRef.current);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(instanceRef.current);

    setTimeout(() => {
      if (!instanceRef.current) return;
      try { instanceRef.current.invalidateSize(); } catch (_) {}
      readyRef.current = true;
      drawRoute();
    }, 160);
  }, [drawRoute]); // ✅ STABLE (drawRoute est stable)

  // Init une seule fois
  useEffect(() => {
    initMap();
    return () => {
      if (instanceRef.current) {
        try { instanceRef.current.remove(); } catch (_) {}
        instanceRef.current = null;
      }
      markerRef.current = null;
      destMarkerRef.current = null;
      routeRef.current = null;
      readyRef.current = false;
      lastKeyRef.current = '';
      destCoordsRef.current = null;
      lastAddrRef.current = '';
    };
  }, [initMap]);

  // ✅ Redessine la route quand les PROPS changent (sans recréer la carte)
  useEffect(() => {
    if (readyRef.current) drawRoute();
  }, [vendorCoords, deliveryAddress, drawRoute]);

  return (
    <div
      ref={mapRef}
      className="minimap-container"
      style={{
        height: 'clamp(340px, 48vh, 480px)',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#dce9f0',
        position: 'relative',
        zIndex: 1
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   CARD COMMANDE
───────────────────────────────────────────────────────────── */
function OrderCard({ order, onSelect, isActive }) {
  const m = STATUS_META[order.status] || STATUS_META.pending;
  return (
    <div
      onClick={() => onSelect(order)}
      style={{
        background: 'var(--card)',
        borderRadius: 14,
        padding: '.9rem 1.1rem',
        border: `2px solid ${isActive ? '#3b82f6' : '#f1f5f9'}`,
        cursor: 'pointer',
        marginBottom: '.7rem',
        boxShadow: isActive ? '0 6px 20px rgba(59,130,246,.12)' : '0 1px 8px rgba(15,23,42,.05)',
        transition: 'all .18s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.5rem' }}>
        <span style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--text)' }}>#{order.id}</span>
        <span style={{ background: m.bg, color: m.text, border: `1px solid ${m.border}`, borderRadius: 20, fontSize: '.7rem', fontWeight: 700, padding: '2px 9px', flexShrink: 0, marginLeft: 8 }}>
          {m.label}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '.45rem', alignItems: 'center', marginBottom: '.3rem' }}>
        <User size={12} color="#94a3b8" />
        <span style={{ fontSize: '.8rem', color: 'var(--text2)', fontWeight: 600 }}>{order.buyer_name}</span>
      </div>

      <div style={{ display: 'flex', gap: '.45rem', alignItems: 'flex-start', marginBottom: '.5rem' }}>
        <MapPin size={12} color="#94a3b8" style={{ flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: '.75rem', color: 'var(--text2)', lineHeight: 1.4 }}>
          {order.delivery_address}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '.82rem', fontWeight: 800, color: '#f97316' }}>
          {parseFloat(order.total_amount || order.total || 0).toLocaleString('fr-FR')} FCFA
        </span>
        <ChevronRight size={15} color={isActive ? '#3b82f6' : '#cbd5e1'} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DETAIL PANEL
───────────────────────────────────────────────────────────── */
function DetailPanel({
  selected,
  vendorCoords,
  routeInfo,
  setRouteInfo,
  gpsActive,
  onToggleGPS,
  actionLoading,
  updateStatus,
  confirmArrival,
  photoPreview,
  photoFile,
  photoSent,
  uploading,
  setPhotoFile,
  setPhotoPreview,
  setPhotoSent,
  sendPhoto,
  fileRef
}) {
  if (!selected) return (
    <div style={{ background: 'var(--card)', borderRadius: 16, padding: '5rem 2rem', textAlign: 'center', boxShadow: '0 1px 12px rgba(15,23,42,.06)', border: '1px solid var(--border)' }}>
      <Truck size={52} color="#e2e8f0" style={{ marginBottom: '1rem' }} />
      <p style={{ fontWeight: 700, color: '#94a3b8', fontSize: '1rem', margin: '0 0 .3rem' }}>Sélectionnez une commande</p>
      <p style={{ color: '#cbd5e1', fontSize: '.83rem', margin: 0 }}>pour gérer sa livraison</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Infos commande */}
      <div style={sx.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>Commande #{selected.id}</h2>
            <p style={{ margin: '.2rem 0 0', fontSize: '.75rem', color: 'var(--text3)' }}>
              {new Date(selected.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {(() => {
            const m = STATUS_META[selected.status] || STATUS_META.pending;
            return (
              <span style={{ background: m.bg, color: m.text, border: `1px solid ${m.border}`, borderRadius: 20, fontSize: '.78rem', fontWeight: 700, padding: '4px 12px' }}>
                {m.label}
              </span>
            );
          })()}
        </div>

        <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: '.9rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem' }}>
          {[
            { l: 'Acheteur', v: selected.buyer_name },
            { l: 'Téléphone', v: selected.phone || selected.buyer_phone || '—' },
            { l: 'Adresse', v: selected.delivery_address, full: true },
            { l: 'Montant (paiement à la livraison)', v: `${parseFloat(selected.total_amount || selected.total || 0).toLocaleString('fr-FR')} FCFA`, highlight: true },
          ].map(({ l, v, full, highlight }) => (
            <div key={l} style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
              <div style={{ fontSize: '.7rem', color: 'var(--text3)', fontWeight: 600 }}>{l}</div>
              <div style={{ fontSize: '.85rem', color: highlight ? '#f97316' : 'var(--text)', fontWeight: highlight ? 800 : 600, lineHeight: 1.4, marginTop: '.1rem', wordBreak: 'break-word' }}>
                {v}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action suivante */}
      {NEXT_ACTION[selected.status] && (
        <div style={sx.card}>
          <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--text)', marginBottom: '.8rem' }}>Action suivante</div>
          <button
            type="button"
            onClick={() => updateStatus(NEXT_ACTION[selected.status].nextStatus)}
            disabled={actionLoading}
            style={{
              width: '100%',
              background: actionLoading ? '#e2e8f0' : NEXT_ACTION[selected.status].color,
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '.9rem',
              fontWeight: 800,
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '.5rem',
              fontSize: '.95rem',
              transition: 'all .2s',
              boxShadow: actionLoading ? 'none' : `0 6px 18px ${NEXT_ACTION[selected.status].color}55`,
              fontFamily: "'DM Sans',sans-serif"
            }}
          >
            {actionLoading ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Mise à jour…
              </>
            ) : (
              <>
                <Package size={16} />
                {NEXT_ACTION[selected.status].label}
              </>
            )}
          </button>
        </div>
      )}

      {/* GPS + MiniMap OSRM */}
      {(selected.status === 'processing' || selected.status === 'shipped') && (
        <div style={sx.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.9rem', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem' }}>
              <Navigation size={17} color="#3b82f6" />
              <span style={sx.cardTitle}>
                {selected.status === 'processing' ? 'Position en temps réel' : 'Itinéraire GPS'} — #{selected.id}
              </span>
            </div>

            <button
              type="button"
              onPointerUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleGPS(selected.id);
              }}
              style={{
                background: gpsActive ? 'rgba(239,68,68,.1)' : 'rgba(59,130,246,.1)',
                color: gpsActive ? '#f87171' : '#60a5fa',
                border: `1px solid ${gpsActive ? 'rgba(239,68,68,.3)' : 'rgba(59,130,246,.3)'}`,
                borderRadius: 20,
                padding: '.3rem .85rem',
                fontSize: '.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '.3rem',
                fontFamily: "'DM Sans',sans-serif",
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none',
                minWidth: 90,
              }}
            >
              {gpsActive ? <><Square size={11} /> Arrêter</> : <><Play size={11} /> Démarrer</>}
            </button>
          </div>

          <MiniMap
            vendorCoords={vendorCoords}
            deliveryAddress={selected.delivery_address}
            onRouteInfo={setRouteInfo}
          />

          {routeInfo && (
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '.65rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(59,130,246,.12)', borderRadius: 20, padding: '.28rem .75rem', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                <Clock size={12} color="#3b82f6" />
                <span style={{ fontSize: '.78rem', color: '#60a5fa', fontWeight: 700 }}>~{formatDuration(routeInfo.durationMin)} restantes</span>
              </div>
              <div style={{ background: 'rgba(22,163,74,.12)', borderRadius: 20, padding: '.28rem .75rem', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                <MapPin size={12} color="#16a34a" />
                <span style={{ fontSize: '.78rem', color: '#4ade80', fontWeight: 700 }}>{formatDistance(routeInfo.distanceKm)}</span>
              </div>
            </div>
          )}

          {vendorCoords && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', marginTop: '.7rem', background: 'rgba(22,163,74,.1)', borderRadius: 10, padding: '.55rem .85rem', flexWrap: 'wrap' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s ease infinite', flexShrink: 0 }} />
              <span style={{ fontSize: '.78rem', color: '#16a34a', fontWeight: 700 }}>
                {selected.status === 'processing' ? 'Préparation en cours — ' : 'En livraison — '}
                GPS actif · {vendorCoords[0].toFixed(4)}, {vendorCoords[1].toFixed(4)}
              </span>
            </div>
          )}

          {selected.status === 'shipped' && (
            <button
              type="button"
              onClick={confirmArrival}
              disabled={actionLoading || selected.delivery_confirmed_by_vendor}
              style={{
                width: '100%',
                marginTop: '.9rem',
                background: selected.delivery_confirmed_by_vendor ? '#f0fdf4' : actionLoading ? '#e2e8f0' : 'linear-gradient(135deg,#10b981,#22c55e)',
                color: selected.delivery_confirmed_by_vendor ? '#16a34a' : 'white',
                border: selected.delivery_confirmed_by_vendor ? '1px solid #86efac' : 'none',
                borderRadius: 12,
                padding: '.85rem',
                fontWeight: 800,
                cursor: (actionLoading || selected.delivery_confirmed_by_vendor) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '.45rem',
                fontSize: '.88rem',
                fontFamily: "'DM Sans',sans-serif"
              }}
            >
              {selected.delivery_confirmed_by_vendor ? (
                <>
                  <CheckCircle size={15} /> Acheteur notifié
                </>
              ) : actionLoading ? (
                <>
                  <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> …
                </>
              ) : (
                <>
                  <CheckCircle size={15} /> Je suis arrivé — Notifier l&apos;acheteur
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Photo colis */}
      {['processing', 'shipped'].includes(selected.status) && (
        <div style={sx.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', marginBottom: '.9rem' }}>
            <Camera size={17} color="#f97316" />
            <span style={sx.cardTitle}>Photo du colis</span>
            <span style={{ fontSize: '.72rem', color: '#94a3b8', marginLeft: '.2rem' }}>Visible par l&apos;acheteur</span>
          </div>

          {photoPreview ? (
            <div style={{ position: 'relative', marginBottom: '.9rem' }}>
              <img
                src={photoPreview}
                alt="Colis"
                style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12, border: '2px solid #f1f5f9' }}
              />
              <button
                type="button"
                onClick={() => { setPhotoFile(null); setPhotoPreview(null); setPhotoSent(false); }}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: 'rgba(0,0,0,.55)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={13} color="white" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: '2px dashed #e2e8f0',
                borderRadius: 12,
                padding: '1.8rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: '#fafafa',
                marginBottom: '.9rem'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#f97316'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <Upload size={26} color="#d1d5db" style={{ marginBottom: '.4rem' }} />
              <p style={{ color: '#94a3b8', fontSize: '.82rem', fontWeight: 600, margin: 0 }}>
                Cliquez pour prendre / importer une photo
              </p>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setPhotoFile(f);
              setPhotoPreview(URL.createObjectURL(f));
              setPhotoSent(false);
            }}
            style={{ display: 'none' }}
          />

          {photoFile && !photoSent && (
            <button
              type="button"
              onClick={sendPhoto}
              disabled={uploading}
              style={{
                width: '100%',
                background: uploading ? '#e2e8f0' : 'linear-gradient(135deg,#f97316,#fb923c)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '.85rem',
                fontWeight: 800,
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '.45rem',
                fontSize: '.9rem',
                boxShadow: uploading ? 'none' : '0 6px 18px rgba(249,115,22,.35)',
                fontFamily: "'DM Sans',sans-serif"
              }}
            >
              {uploading ? (
                <>
                  <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  Envoi en cours…
                </>
              ) : (
                <>
                  <Camera size={15} /> Envoyer au client
                </>
              )}
            </button>
          )}

          {photoSent && (
            <div style={{ background: 'rgba(22,163,74,.08)', border: '1px solid rgba(22,163,74,.3)', borderRadius: 10, padding: '.7rem', display: 'flex', alignItems: 'center', gap: '.45rem' }}>
              <CheckCircle size={15} color="#16a34a" />
              <span style={{ fontSize: '.83rem', color: '#16a34a', fontWeight: 700 }}>Photo envoyée au client</span>
            </div>
          )}
        </div>
      )}

      {/* Articles */}
      <div style={sx.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', marginBottom: '.9rem' }}>
          <Package size={17} color="#6366f1" />
          <span style={sx.cardTitle}>Articles ({selected.items?.length || 0})</span>
        </div>

        {(selected.items || []).map(item => (
          <div key={item.id} style={{ display: 'flex', gap: '.7rem', alignItems: 'center', padding: '.6rem 0', borderBottom: '1px solid #f8fafc' }}>
            <div style={{ width: 38, height: 38, background: 'var(--bg3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Package size={20} color="#f97316" />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '.84rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.product_name}
              </div>
              <div style={{ fontSize: '.73rem', color: 'var(--text3)' }}>x{item.quantity}</div>
            </div>

            <div style={{ fontWeight: 700, color: '#f97316', fontSize: '.84rem', flexShrink: 0 }}>
              {(parseFloat(item.price) * item.quantity).toLocaleString('fr-FR')} F
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────────────────────────── */
export default function VendorDelivery() {
  const dark = useDark();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const [gpsActive, setGpsActive] = useState(false);
  const [vendorCoords, setVendorCoords] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoSent, setPhotoSent] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const selectedRef = useRef(null);
  const watchRef = useRef(null);
  const fileRef = useRef(null);
  const lastGpsSentRef = useRef(0);
  const pollRef = useRef(null);

  const gpsActiveRef = useRef(false);
  const toggleLockRef = useRef(0);

  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { gpsActiveRef.current = gpsActive; }, [gpsActive]);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await ordersAPI.getVendorOrders();
      const list = Array.isArray(data) ? data : (data.results || []);
      setOrders(list);

      if (selectedRef.current) {
        const updated = list.find(o => o.id === selectedRef.current.id);
        if (updated) setSelected(updated);
      }
    } catch (err) {
      console.error('Fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authAPI.isAuthenticated()) { router.push('/login'); return; }
    fetchOrders();
    pollRef.current = setInterval(fetchOrders, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchOrders, router]);

  const stopGPS = useCallback(() => {
    setGpsActive(false);
    gpsActiveRef.current = false;

    if (watchRef.current !== null) {
      try { navigator.geolocation.clearWatch(watchRef.current); } catch (_) {}
      watchRef.current = null;
    }
    lastGpsSentRef.current = 0;
  }, []);

  const startGPS = useCallback((orderId) => {
    if (!orderId) return;

    if (!window.isSecureContext) {
      alert("Le GPS nécessite HTTPS sur mobile.");
      return;
    }

    if (!navigator.geolocation) {
      alert('Géolocalisation non disponible sur cet appareil.');
      return;
    }

    if (watchRef.current !== null) {
      try { navigator.geolocation.clearWatch(watchRef.current); } catch (_) {}
      watchRef.current = null;
    }

    setGpsActive(true);
    gpsActiveRef.current = true;

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setVendorCoords(coords);

        const now = Date.now();
        if (now - lastGpsSentRef.current < GPS_SEND_MS) return;
        lastGpsSentRef.current = now;

        ordersAPI.updateVendorLocation(orderId, { lat: coords[0], lng: coords[1] })
          .catch(err => console.error('GPS send error:', err));
      },
      (err) => {
        console.error('GPS error:', err?.code, err?.message, err);

        let msg = "Erreur GPS.";
        if (err?.code === 1) msg = "Permission GPS refusée. Autorisez la localisation dans le navigateur.";
        if (err?.code === 2) msg = "Position indisponible (signal GPS faible).";
        if (err?.code === 3) msg = "Timeout GPS. Réessayez (dehors) ou patientez.";

        alert(msg);
        stopGPS();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }, [stopGPS]);

  const handleToggleGPS = useCallback((orderId) => {
    const now = Date.now();
    if (now - toggleLockRef.current < 600) return;
    toggleLockRef.current = now;

    const isCurrentlyActive = gpsActiveRef.current;

    if (isCurrentlyActive) stopGPS();
    else startGPS(orderId);
  }, [startGPS, stopGPS]);

  useEffect(() => () => { stopGPS(); }, [stopGPS]);

  const sendPhoto = async () => {
    if (!photoFile || !selected) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('package_photo', photoFile);
      await ordersAPI.sendPackagePhoto(selected.id, fd);
      setPhotoSent(true);
    } catch {
      alert("Erreur lors de l'envoi de la photo");
    } finally {
      setUploading(false);
    }
  };

  const updateStatus = async (nextStatus) => {
    if (!selected) return;
    const orderId = selected.id;

    setActionLoading(true);
    try {
      await ordersAPI.updateStatus(orderId, { status: nextStatus });

      setSelected(prev => prev ? { ...prev, status: nextStatus } : prev);

      if ((nextStatus === 'processing' || nextStatus === 'shipped') && !gpsActiveRef.current) {
        const perm = await getGeolocationPermissionState();
        if (perm === 'granted') {
          startGPS(orderId);
        }
      }

      await fetchOrders();
    } catch (err) {
      console.error('Erreur updateStatus:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmArrival = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await ordersAPI.vendorConfirmArrival(selected.id);
      if (gpsActiveRef.current) stopGPS();
      await fetchOrders();
      setSelected(prev => prev ? { ...prev, delivery_confirmed_by_vendor: true } : prev);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelect = (order) => {
    if (gpsActiveRef.current && selectedRef.current?.id !== order.id) stopGPS();

    setSelected(order);
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoSent(false);
    setRouteInfo(null);
    setMobileDetailOpen(true);
  };

  const FILTERS = useMemo(() => ([
    { key: 'all', label: 'Toutes' },
    { key: 'pending', label: 'En attente' },
    { key: 'processing', label: 'Préparation' },
    { key: 'shipped', label: 'En livraison' },
  ]), []);

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter(o => o.status === filter);
  }, [orders, filter]);

  const detailProps = {
    selected,
    vendorCoords,
    routeInfo,
    setRouteInfo,
    gpsActive,
    onToggleGPS: handleToggleGPS,
    actionLoading,
    updateStatus,
    confirmArrival,
    photoPreview,
    photoFile,
    photoSent,
    uploading,
    setPhotoFile,
    setPhotoPreview,
    setPhotoSent,
    sendPhoto,
    fileRef,
  };

  if (loading) return (
    <>
      <Loader message="Chargement des commandes…" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans', system-ui, sans-serif", position: 'relative', zIndex: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <Navbar />

      <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '1rem 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem' }}>
            <button type="button" onClick={() => router.push('/orders')} style={sx.iconBtn} title="Retour">
              <ArrowLeft size={16} color="var(--text2)" />
            </button>

            <div style={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              boxShadow: '0 4px 12px rgba(59,130,246,.3)',
              flexShrink: 0
            }}>
              <Truck size={20} color="#fff" />
            </div>

            <div>
              <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>Gestion des livraisons</h1>
              <p style={{ margin: 0, fontSize: '.75rem', color: 'var(--text3)' }}>{orders.length} commande(s)</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '.35rem',
              background: gpsActive ? 'rgba(22,163,74,.12)' : 'var(--bg3)',
              border: `1px solid ${gpsActive ? 'rgba(22,163,74,.35)' : 'var(--border)'}`,
              borderRadius: 20,
              padding: '.35rem .8rem'
            }}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: gpsActive ? '#22c55e' : '#cbd5e1',
                display: 'inline-block',
                animation: gpsActive ? 'pulse 2s ease infinite' : 'none',
                flexShrink: 0
              }} />
              <span style={{ fontSize: '.75rem', fontWeight: 700, color: gpsActive ? '#4ade80' : 'var(--text3)', whiteSpace: 'nowrap' }}>
                GPS {gpsActive ? `ACTIF #${selected?.id}` : 'INACTIF'}
              </span>
            </div>

            <button type="button" onClick={fetchOrders} style={sx.iconBtn} title="Rafraîchir">
              <RefreshCw size={16} color="var(--text2)" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop 2 colonnes */}
      <div className="vd-desktop" style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                style={{
                  background: filter === f.key ? '#3b82f6' : 'var(--card)',
                  color: filter === f.key ? 'white' : 'var(--text2)',
                  border: `1px solid ${filter === f.key ? '#3b82f6' : 'var(--border)'}`,
                  borderRadius: 20,
                  padding: '.28rem .75rem',
                  fontSize: '.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all .15s',
                  fontFamily: "'DM Sans',sans-serif"
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', paddingRight: '.3rem' }}>
            {filtered.length === 0 ? (
              <div style={{ background: 'var(--card)', borderRadius: 14, padding: '3rem 1rem', textAlign: 'center' }}>
                <Package size={36} color="#e2e8f0" style={{ marginBottom: '.7rem' }} />
                <p style={{ color: '#94a3b8', fontWeight: 600, margin: 0, fontSize: '.88rem' }}>Aucune commande</p>
              </div>
            ) : (
              filtered.map(o => (
                <OrderCard key={o.id} order={o} onSelect={handleSelect} isActive={selected?.id === o.id} />
              ))
            )}
          </div>
        </div>

        <DetailPanel {...detailProps} />
      </div>

      {/* Mobile accordéon */}
      <div className="vd-mobile" style={{ display: 'none', padding: '1rem', paddingBottom: '100px', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={{
                background: filter === f.key ? '#3b82f6' : 'var(--card)',
                color: filter === f.key ? 'white' : 'var(--text2)',
                border: `1px solid ${filter === f.key ? '#3b82f6' : 'var(--border)'}`,
                borderRadius: 20,
                padding: '.3rem .85rem',
                fontSize: '.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontFamily: "'DM Sans',sans-serif"
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ background: 'var(--card)', borderRadius: 14, padding: '3rem 1rem', textAlign: 'center' }}>
            <Package size={36} color="#e2e8f0" style={{ marginBottom: '.7rem' }} />
            <p style={{ color: '#94a3b8', fontWeight: 600, margin: 0 }}>Aucune commande</p>
          </div>
        ) : (
          filtered.map(o => (
            <OrderCard key={o.id} order={o} onSelect={handleSelect} isActive={selected?.id === o.id} />
          ))
        )}

        {selected && (
          <div style={{ background: 'var(--card)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(15,23,42,.1)', border: '2px solid #3b82f6' }}>
            <button
              type="button"
              onClick={() => setMobileDetailOpen(v => !v)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg,rgba(59,130,246,.12),rgba(59,130,246,.06))',
                border: 'none',
                padding: '1rem 1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontFamily: "'DM Sans',sans-serif"
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={16} color="#1e40af" style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 800, fontSize: '.92rem', color: dark ? '#60a5fa' : '#1e40af' }}>
                  Commande #{selected.id} — Détails
                </span>
              </div>

              {mobileDetailOpen ? <ChevronDown size={18} color="#3b82f6" /> : <ChevronRight size={18} color="#3b82f6" />}
            </button>

            {mobileDetailOpen && (
              <div style={{ padding: '1rem' }}>
                <DetailPanel {...detailProps} />
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .leaflet-container { position: relative !important; }
        .leaflet-pane { z-index: 2 !important; }
        .leaflet-control-container { z-index: 3 !important; }
        .leaflet-top, .leaflet-bottom { z-index: 3 !important; }
        .leaflet-popup-pane { z-index: 4 !important; }
        .leaflet-popup { z-index: 4 !important; }

        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

        /* ✅ Carte agrandie sur mobile */
        @media(max-width:760px) {
          .vd-desktop { display: none !important; }
          .vd-mobile  { display: flex !important; }
          .minimap-container {
            height: clamp(300px, 55vw, 420px) !important;
          }
        }

        button {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          -webkit-touch-callout: none;
        }
      `}</style>

      <Footer />
    </div>
  );
}

const sx = {
  centered: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    fontFamily: 'system-ui,sans-serif'
  },
  spinner: {
    width: 52,
    height: 52,
    border: '4px solid #e2e8f0',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  iconBtn: {
    background: 'var(--bg3)',
    border: 'none',
    cursor: 'pointer',
    borderRadius: 10,
    padding: '.5rem',
    display: 'flex',
    alignItems: 'center'
  },
  card: {
    background: 'var(--card)',
    borderRadius: 16,
    padding: '1.2rem',
    boxShadow: '0 1px 12px rgba(15,23,42,.06)',
    border: '1px solid var(--border)'
  },
  cardTitle: {
    fontWeight: 700,
    fontSize: '.92rem',
    color: 'var(--text)'
  },
};