'use client';

// ecommerce-frontend/src/pages/Checkout.jsx
// ✅ Thème harmonisé ShopCI — Orange & Blanc
// 🔒 Paiements mobile verrouillés (travaux en cours) — seul paiement à la livraison actif

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart, MapPin, Phone, User, Check,
  AlertCircle, Truck, ShieldCheck, CreditCard, Loader,
  Lock, Construction
} from 'lucide-react';
import { cartAPI, ordersAPI, authAPI } from '@/services/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageLoader from '@/components/Loader';

export default function Checkout() {
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [orderError, setOrderError] = useState(null);
  const [resumeOpen, setResumeOpen] = useState(false);
  const user = authAPI.getCurrentUser();

  const [formData, setFormData] = useState({
    delivery_address: '',
    phone: user?.phone || '',
    payment_method: 'cash',
  });

  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cartAPI.getCart();
      if (!data.items || data.items.length === 0) {
        alert('Votre panier est vide !');
        router.push('/cart');
        return;
      }
      setCart(data);
    } catch (error) {
      console.error('Erreur chargement panier:', error);
      alert('Erreur lors du chargement du panier');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authAPI.isAuthenticated()) { router.push('/login'); return; }
    loadCart();
  }, [loadCart, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.delivery_address.trim()) { setOrderError("Veuillez saisir votre adresse de livraison"); return; }
    if (!formData.phone.trim()) { setOrderError("Veuillez saisir votre numéro de téléphone"); return; }
    setOrderError(null);
    setSubmitting(true);
    try {
      const result = await ordersAPI.create({
        delivery_address: formData.delivery_address,
        phone: formData.phone,
        payment_method: 'cash',
      });
      setOrderSuccess({ id: result.order.id });
    } catch (error) {
      if (error.response?.data?.error) {
        setOrderError(error.response.data.error);
      } else if (error.response?.data?.details) {
        const details = error.response.data.details
          .map(d => `${d.product}: demandé ${d.requested}, disponible ${d.available}`).join(', ');
        setOrderError(`Stock insuffisant : ${details}`);
      } else {
        setOrderError('Erreur lors de la création de la commande');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://placehold.co/64x64/fff7ed/f97316?text=ShopCI';
    if (imagePath.startsWith('http')) return imagePath;
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api$/, '');
    return `${base}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
  };

  // 🔒 Seul "cash" est actif — les autres sont verrouillés (travaux en cours)
  const PAYMENT_METHODS = [
    { value: 'cash',   label: 'Paiement à la livraison', desc: 'Payez en espèces à la réception de votre colis', logo: null,             color: '#16a34a', locked: false },
    { value: 'mtn',    label: 'MTN Mobile Money',         desc: 'Travaux en cours — bientôt disponible',          logo: 'mtn-logo.png',    color: '#fbbf24', locked: true  },
    { value: 'orange', label: 'Orange Money',             desc: 'Travaux en cours — bientôt disponible',          logo: 'orange-logo.png', color: '#f97316', locked: true  },
    { value: 'wave',   label: 'Wave',                     desc: 'Travaux en cours — bientôt disponible',          logo: 'wave-logo.png',   color: '#3b82f6', locked: true  },
    { value: 'moov',   label: 'Moov Money',               desc: 'Travaux en cours — bientôt disponible',          logo: 'moov-logo.png',   color: '#2563eb', locked: true  },
  ];

  if (loading) return <PageLoader message="Chargement de votre commande…" />;

  const cartItems = cart?.items || [];
  const subtotal = cart?.total || 0;
  const shipping = 2000;
  const total = subtotal + shipping;

  return (
    <div style={{ fontFamily: "'DM Sans','Inter',sans-serif", background: 'var(--bg,#fafafa)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box}

        /* ── SUCCÈS ── */
        .co-success-page{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 16px}
        .co-success-wrap{background:#fff;border:1.5px solid #f0f0f0;border-radius:20px;padding:52px 36px;text-align:center;max-width:460px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,.1)}
        .co-success-icon{width:72px;height:72px;background:linear-gradient(135deg,#22c55e,#16a34a);border-radius:20px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(34,197,94,.35)}
        .co-success-wrap h2{font-size:22px;font-weight:800;color:#1a1a1a;margin:0 0 8px}
        .co-success-wrap p{font-size:14px;color:#9ca3af;margin:0 0 6px;line-height:1.5}
        .co-success-order{font-size:13px;color:#f97316;font-weight:700;margin:0 0 24px}
        .co-success-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
        .co-success-btn{background:#f97316;color:#fff;border:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;transition:background .18s;font-family:inherit}
        .co-success-btn:hover{background:#ea6a0a}
        .co-success-btn-track{background:#1a1a1a;color:#fff;border:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;transition:background .18s;font-family:inherit;display:flex;align-items:center;gap:8px}
        .co-success-btn-track:hover{background:#333}

        /* ── ALERT ── */
        .co-alert-err{display:flex;align-items:flex-start;gap:10px;padding:13px 16px;border-radius:12px;font-size:13.5px;margin-bottom:14px;background:rgba(239,68,68,.1);border:1.5px solid rgba(239,68,68,.3);color:#ef4444}

        /* ── STEPS ── */
        .co-steps{background:#fff;border-bottom:1px solid #f0f0f0;overflow:hidden}
        .co-steps-inner{max-width:1280px;margin:0 auto;padding:0 20px;height:48px;display:flex;align-items:center;overflow-x:auto;scrollbar-width:none}
        .co-steps-inner::-webkit-scrollbar{display:none}
        .co-step{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#9ca3af;padding:0 14px 0 0;white-space:nowrap;flex-shrink:0}
        .co-step-num{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;background:#f3f4f6;color:#9ca3af;flex-shrink:0;transition:all .2s}
        .co-step.done .co-step-num{background:#22c55e;color:#fff}
        .co-step.active .co-step-num{background:#f97316;color:#fff}
        .co-step.active{color:#1a1a1a}
        .co-step.done{color:#22c55e}
        .co-step-sep{width:28px;height:2px;background:#f0f0f0;margin:0 4px;flex-shrink:0}
        .co-step-sep.done{background:#22c55e}

        /* ── MAIN GRID ── */
        .co-main{max-width:1280px;margin:28px auto;padding:0 20px 60px;display:grid;grid-template-columns:1fr 360px;gap:24px;align-items:start;flex:1;width:100%}

        /* ── CARDS ── */
        .co-card{background:#fff;border-radius:16px;border:1px solid #f0f0f0;margin-bottom:18px;overflow:hidden}
        .co-card:last-child{margin-bottom:0}
        .co-card-header{display:flex;align-items:center;gap:10px;padding:16px 22px;border-bottom:1px solid #f3f4f6}
        .co-card-header-ico{width:34px;height:34px;border-radius:10px;background:rgba(249,115,22,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .co-card-header-ico svg{color:#f97316}
        .co-card-title{font-size:15px;font-weight:800;color:#1a1a1a}
        .co-card-body{padding:22px}

        /* ── FORM ── */
        .co-field{margin-bottom:16px}
        .co-label{display:block;font-size:13px;font-weight:700;color:#374151;margin-bottom:6px}
        .co-input-wrap{position:relative}
        .co-input-ico{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#9ca3af;pointer-events:none}
        .co-input{width:100%;padding:11px 14px 11px 40px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'DM Sans',sans-serif;color:#1a1a1a;background:#fff;outline:none;transition:border-color .18s,box-shadow .18s}
        .co-input:focus{border-color:#f97316;box-shadow:0 0 0 3px rgba(249,115,22,0.12)}
        .co-input:disabled{background:#f9fafb;color:#9ca3af;cursor:not-allowed}
        .co-input.textarea{height:88px;resize:none;padding-top:12px}
        .co-input::placeholder{color:#9ca3af}

        /* ── PAIEMENT ── */
        .co-travaux-banner{background:linear-gradient(135deg,rgba(251,191,36,.12),rgba(245,87,61,.08));border:1.5px solid rgba(251,191,36,.4);border-radius:12px;padding:11px 14px;display:flex;align-items:flex-start;gap:10px;margin-bottom:14px}
        .co-travaux-banner svg{color:#f59e0b;flex-shrink:0;margin-top:1px}
        .co-travaux-text{font-size:12.5px;color:#92400e;line-height:1.5;font-weight:500}
        .co-payment-option{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;border:2px solid #f0f0f0;margin-bottom:8px;transition:all .18s;background:#fff;position:relative}
        .co-payment-option:not(.locked){cursor:pointer}
        .co-payment-option:hover:not(.locked){border-color:rgba(249,115,22,.4);background:rgba(249,115,22,.05)}
        .co-payment-option.selected{border-color:#f97316;background:rgba(249,115,22,.08)}
        .co-payment-option.locked{cursor:not-allowed;opacity:.5;background:#f9fafb}
        .co-payment-option input[type="radio"]{display:none}
        .co-payment-logo{width:44px;height:44px;background:#fff;border-radius:10px;border:1.5px solid #f0f0f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;padding:4px}
        .co-payment-logo img{max-width:100%;max-height:100%;object-fit:contain}
        .co-payment-info{flex:1;min-width:0}
        .co-payment-name{font-size:13.5px;font-weight:700;color:#1a1a1a}
        .co-payment-desc{font-size:11.5px;color:#9ca3af;margin-top:1px}
        .co-payment-check{width:22px;height:22px;border-radius:50%;background:#f97316;display:none;align-items:center;justify-content:center;flex-shrink:0}
        .co-payment-option.selected .co-payment-check{display:flex}
        .co-lock-badge{display:flex;align-items:center;gap:4px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);border-radius:20px;padding:3px 8px;font-size:10.5px;font-weight:700;color:#ef4444;flex-shrink:0;white-space:nowrap}

        /* ── BOUTON SUBMIT ── */
        .co-submit-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;background:#f97316;color:#fff;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;margin-top:14px;transition:background .2s,transform .15s;box-shadow:0 4px 16px rgba(249,115,22,.35);font-family:inherit}
        .co-submit-btn:hover:not(:disabled){background:#ea6a0a;transform:translateY(-1px)}
        .co-submit-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}

        /* ── GARANTIES ── */
        .co-garanties{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .co-garantie-item{background:#fff;border-radius:12px;border:1px solid #f0f0f0;padding:14px 10px;text-align:center}
        .co-garantie-ico{margin:0 auto 7px}
        .co-garantie-label{font-size:11.5px;font-weight:700;color:#374151}

        /* ── RÉSUMÉ DESKTOP (sticky colonne droite) ── */
        .co-resume{background:#fff;border-radius:16px;border:1px solid #f0f0f0;padding:22px;position:sticky;top:90px}
        .co-resume-titre{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:800;color:#1a1a1a;margin-bottom:18px}
        .co-resume-titre svg{color:#f97316}
        .co-resume-items{max-height:230px;overflow-y:auto;margin-bottom:14px}
        .co-resume-item{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #f9fafb}
        .co-resume-item:last-child{border-bottom:none}
        .co-resume-item-img{width:48px;height:48px;border-radius:8px;object-fit:cover;border:1px solid #f0f0f0;flex-shrink:0}
        .co-resume-item-info{flex:1;min-width:0}
        .co-resume-item-name{font-size:12.5px;font-weight:600;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .co-resume-item-qty{font-size:11.5px;color:#9ca3af;margin-top:2px}
        .co-resume-item-sub{font-size:12.5px;font-weight:700;color:#1a1a1a;flex-shrink:0;white-space:nowrap}
        .co-resume-ligne{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#6b7280;padding:7px 0;border-bottom:1px solid #f9fafb}
        .co-resume-ligne span:last-child{font-weight:600;color:#1a1a1a}
        .co-resume-total{display:flex;justify-content:space-between;align-items:center;padding:12px 0 0;border-top:2px solid #f3f4f6;margin-top:6px}
        .co-resume-total span:first-child{font-size:14px;font-weight:700;color:#1a1a1a}
        .co-resume-total span:last-child{font-size:21px;font-weight:800;color:#f97316}
        .co-alert-info{margin-top:13px;background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.25);border-radius:10px;padding:11px 13px;display:flex;gap:8px;align-items:flex-start}
        .co-alert-info svg{color:#3b82f6;flex-shrink:0;margin-top:1px}
        .co-alert-info p{font-size:12px;color:#3b82f6;line-height:1.5;margin:0}

        /* ── RÉSUMÉ MOBILE sticky accordéon bas de page ── */
        .co-resume-mobile{display:none;position:sticky;bottom:0;left:0;right:0;z-index:80;
          background:#fff;border-top:1.5px solid #f0f0f0;box-shadow:0 -4px 20px rgba(0,0,0,.13)}
        .co-rmob-toggle{display:flex;align-items:center;justify-content:space-between;
          padding:12px 16px;cursor:pointer;user-select:none;gap:8px}
        .co-rmob-left{display:flex;align-items:center;gap:8px;flex:1;min-width:0}
        .co-rmob-label{font-size:12.5px;font-weight:600;color:#6b7280;white-space:nowrap}
        .co-rmob-val{font-size:18px;font-weight:800;color:#f97316;white-space:nowrap}
        .co-rmob-body{padding:0 16px 14px;border-top:1px solid #f3f4f6}
        .co-rmob-item{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #f3f4f6}
        .co-rmob-item:last-of-type{border-bottom:none}
        .co-rmob-img{width:38px;height:38px;border-radius:7px;object-fit:cover;border:1px solid #f0f0f0;flex-shrink:0}
        .co-rmob-name{font-size:12.5px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .co-rmob-qty{font-size:11px;color:#9ca3af;margin-top:1px}
        .co-rmob-sub{font-size:12.5px;font-weight:700;color:#1a1a1a;flex-shrink:0}
        .co-rmob-totals{display:flex;justify-content:space-between;align-items:center;padding:8px 0 0;font-size:12.5px;color:#6b7280}
        .co-rmob-totals span:last-child{font-weight:700;color:#1a1a1a}

        @keyframes spin{to{transform:rotate(360deg)}}

        /* ══════════════════════════════
           RESPONSIVE
        ══════════════════════════════ */

        /* Tablette — 1 colonne, résumé desktop masqué, résumé mobile affiché */
        @media(max-width:900px){
          .co-main{grid-template-columns:1fr;padding-bottom:80px}
          .co-resume{display:none}
          .co-resume-mobile{display:block}
        }

        /* Mobile L */
        @media(max-width:600px){
          .co-main{margin:14px auto;padding:0 12px 80px;gap:14px}
          .co-card-body{padding:16px}
          .co-card-header{padding:13px 16px}
          .co-steps-inner{padding:0 12px;height:44px}
          .co-step{font-size:11.5px;padding:0 10px 0 0}
          .co-step-sep{width:18px}
          .co-garanties{gap:8px}
          .co-garantie-item{padding:12px 6px}
          .co-garantie-label{font-size:10.5px}
          .co-payment-option{padding:10px 12px;gap:10px}
          .co-payment-logo{width:40px;height:40px}
          .co-payment-name{font-size:13px}
          .co-payment-desc{font-size:11px}
          .co-lock-badge{font-size:10px;padding:2px 7px}
          .co-submit-btn{font-size:14px;padding:13px}
        }

        /* Mobile S */
        @media(max-width:400px){
          .co-main{padding:0 10px 80px}
          .co-card-body{padding:14px 12px}
          .co-card-header{padding:12px 13px}
          .co-garantie-item{padding:10px 4px}
          .co-garantie-label{font-size:10px}
          .co-lock-badge{display:none}
          .co-step-label{display:none}
          .co-step-sep{width:12px}
          .co-rmob-val{font-size:16px}
        }

        /* ══════════════════════════════
           DARK MODE
        ══════════════════════════════ */
        body.dark .co-steps{background:var(--card);border-color:var(--border)}
        body.dark .co-step-sep{background:var(--border)}
        body.dark .co-step-sep.done{background:#22c55e}
        body.dark .co-step-num{background:var(--bg3);color:var(--text3)}
        body.dark .co-step.active{color:var(--text)}
        body.dark .co-card{background:var(--card);border-color:var(--border)}
        body.dark .co-card-header{border-color:var(--border)}
        body.dark .co-card-title{color:var(--text)}
        body.dark .co-label{color:var(--text2)}
        body.dark .co-input{background:var(--input);border-color:var(--border);color:var(--text)}
        body.dark .co-input::placeholder{color:var(--text3)}
        body.dark .co-input:focus{border-color:var(--orange);box-shadow:0 0 0 3px rgba(249,115,22,.15)}
        body.dark .co-input:disabled{background:var(--bg3);color:var(--text3)}
        body.dark .co-payment-option{background:var(--card);border-color:var(--border)}
        body.dark .co-payment-option:hover:not(.locked){border-color:rgba(249,115,22,.5);background:rgba(249,115,22,.08)}
        body.dark .co-payment-option.selected{border-color:var(--orange);background:rgba(249,115,22,.1)}
        body.dark .co-payment-option.locked{background:var(--bg3)}
        body.dark .co-payment-logo{background:var(--bg3);border-color:var(--border)}
        body.dark .co-payment-name{color:var(--text)}
        body.dark .co-payment-desc{color:var(--text3)}
        body.dark .co-travaux-text{color:#fcd34d}
        body.dark .co-travaux-banner{border-color:rgba(251,191,36,.3)}
        body.dark .co-garantie-item{background:var(--card);border-color:var(--border)}
        body.dark .co-garantie-label{color:var(--text2)}
        body.dark .co-resume{background:var(--card);border-color:var(--border)}
        body.dark .co-resume-titre{color:var(--text)}
        body.dark .co-resume-item{border-color:var(--border)}
        body.dark .co-resume-item-img{border-color:var(--border)}
        body.dark .co-resume-item-name{color:var(--text)}
        body.dark .co-resume-item-sub{color:var(--text)}
        body.dark .co-resume-ligne{color:var(--text2);border-color:var(--border)}
        body.dark .co-resume-ligne span:last-child{color:var(--text)}
        body.dark .co-resume-total{border-color:var(--border)}
        body.dark .co-resume-total span:first-child{color:var(--text)}
        body.dark .co-resume-mobile{background:var(--card);border-color:var(--border)}
        body.dark .co-rmob-body{border-color:var(--border)}
        body.dark .co-rmob-item{border-color:var(--border)}
        body.dark .co-rmob-img{border-color:var(--border)}
        body.dark .co-rmob-name{color:var(--text)}
        body.dark .co-rmob-sub{color:var(--text)}
        body.dark .co-rmob-totals{color:var(--text2)}
        body.dark .co-rmob-totals span:last-child{color:var(--text)}
        body.dark .co-success-wrap{background:var(--card);border-color:var(--border)}
        body.dark .co-success-wrap h2{color:var(--text)}
        body.dark .co-success-wrap p{color:var(--text3)}
        body.dark .co-success-btn-track{background:var(--bg3);color:var(--text)}
        body.dark .co-success-btn-track:hover{background:var(--border)}
      `}</style>

      <Navbar pageCourante="/cart" />

      {orderSuccess ? (
        <>
          <div className="co-success-page">
            <div className="co-success-wrap">
              <div className="co-success-icon"><Check size={40} color="#fff" /></div>
              <h2>Commande confirmée !</h2>
              <p>Votre commande a été créée avec succès.<br />Suivez votre livraison en temps réel.</p>
              <p className="co-success-order">Commande #{orderSuccess.id}</p>
              <div className="co-success-btns">
                <button className="co-success-btn" onClick={() => router.push('/orders')}>Voir mes commandes</button>
                <button className="co-success-btn-track" onClick={() => router.push(`/orders/${orderSuccess.id}/tracking`)}>
                  <Truck size={16} /> Suivre ma livraison
                </button>
              </div>
            </div>
          </div>
          <Footer />
        </>
      ) : (
        <>
          <div className="co-steps">
            <div className="co-steps-inner">
              <div className="co-step done"><div className="co-step-num"><Check size={12} /></div>Panier</div>
              <div className="co-step-sep done" />
              <div className="co-step active"><div className="co-step-num">2</div>Livraison & Paiement</div>
              <div className="co-step-sep" />
              <div className="co-step"><div className="co-step-num">3</div>Confirmation</div>
            </div>
          </div>

          <main className="co-main">
            <div>
              <form onSubmit={handleSubmit}>
                {orderError && (
                  <div className="co-alert-err">
                    <AlertCircle size={18} style={{ flexShrink: 0 }} /><span>{orderError}</span>
                  </div>
                )}

                <div className="co-card">
                  <div className="co-card-header">
                    <div className="co-card-header-ico"><MapPin size={18} /></div>
                    <div className="co-card-title">Informations de livraison</div>
                  </div>
                  <div className="co-card-body">
                    <div className="co-field">
                      <label className="co-label">Nom complet</label>
                      <div className="co-input-wrap">
                        <User size={16} className="co-input-ico" />
                        <input type="text" value={user?.username || ''} disabled className="co-input" />
                      </div>
                    </div>
                    <div className="co-field">
                      <label className="co-label">Téléphone <span style={{ color: '#f97316' }}>*</span></label>
                      <div className="co-input-wrap">
                        <Phone size={16} className="co-input-ico" />
                        <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="co-input" placeholder="Ex: 07 00 00 00 00" required />
                      </div>
                    </div>
                    <div className="co-field" style={{ marginBottom: 0 }}>
                      <label className="co-label">Adresse de livraison <span style={{ color: '#f97316' }}>*</span></label>
                      <div className="co-input-wrap">
                        <MapPin size={16} className="co-input-ico" style={{ top: '16px', transform: 'none' }} />
                        <textarea value={formData.delivery_address} onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })} className="co-input textarea" placeholder="Quartier, commune, repère (ex : Cocody, près du lycée…)" required />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="co-card">
                  <div className="co-card-header">
                    <div className="co-card-header-ico"><CreditCard size={18} /></div>
                    <div className="co-card-title">Mode de paiement</div>
                  </div>
                  <div className="co-card-body">
                    <div className="co-travaux-banner">
                      <Construction size={18} />
                      <div className="co-travaux-text">
                        Les paiements mobiles (MTN, Orange, Wave, Moov) sont temporairement indisponibles. <strong>Travaux en cours — bientôt disponible.</strong>
                      </div>
                    </div>

                    {PAYMENT_METHODS.map((pm) => (
                      <div
                        key={pm.value}
                        className={`co-payment-option${formData.payment_method === pm.value ? ' selected' : ''}${pm.locked ? ' locked' : ''}`}
                        onClick={() => !pm.locked && setFormData({ ...formData, payment_method: pm.value })}
                      >
                        <input type="radio" name="payment_method" value={pm.value} readOnly checked={formData.payment_method === pm.value} />
                        <div className="co-payment-logo" style={{ background: pm.value === 'cash' ? 'rgba(34,197,94,.1)' : '#f9fafb' }}>
                          {pm.logo ? (
                            <img src={`/images/payment/${pm.logo}`} alt={pm.label}
                              onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<span style="font-size:11px;font-weight:800;color:${pm.color}">${pm.label.split(' ')[0]}</span>`; }}
                            />
                          ) : (
                            <Check size={20} style={{ color: pm.color }} />
                          )}
                        </div>
                        <div className="co-payment-info">
                          <div className="co-payment-name">{pm.label}</div>
                          <div className="co-payment-desc">{pm.desc}</div>
                        </div>
                        {pm.locked ? (
                          <div className="co-lock-badge"><Lock size={10} /> Bientôt</div>
                        ) : (
                          <div className="co-payment-check"><Check size={13} style={{ color: '#fff' }} /></div>
                        )}
                      </div>
                    ))}

                    <button type="submit" disabled={submitting} className="co-submit-btn">
                      {submitting
                        ? <><Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> Création en cours…</>
                        : <><Check size={20} /> Confirmer la commande</>
                      }
                    </button>
                  </div>
                </div>
              </form>

              <div className="co-garanties">
                {[
                  { icon: <ShieldCheck size={24} style={{ color: '#22c55e' }} />, label: 'Paiement sécurisé' },
                  { icon: <Truck size={24} style={{ color: '#3b82f6' }} />, label: 'Livraison rapide' },
                  { icon: <Check size={24} style={{ color: '#f97316' }} />, label: 'Garantie 2 ans' },
                ].map(({ icon, label }) => (
                  <div key={label} className="co-garantie-item">
                    <div className="co-garantie-ico">{icon}</div>
                    <div className="co-garantie-label">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="co-resume">
                <div className="co-resume-titre"><ShoppingCart size={18} /> Résumé de commande</div>
                <div className="co-resume-items">
                  {cartItems.map((item) => (
                    <div key={item.id} className="co-resume-item">
                      <img src={getImageUrl(item.product?.image)} alt={item.product?.name} className="co-resume-item-img"
                        onError={(e) => { e.target.src = 'https://placehold.co/52x52/fff7ed/f97316?text=CI'; }} />
                      <div className="co-resume-item-info">
                        <div className="co-resume-item-name">{item.product?.name}</div>
                        <div className="co-resume-item-qty">{item.quantity} × {item.product?.price?.toLocaleString('fr-FR')} FCFA</div>
                      </div>
                      <div className="co-resume-item-sub">{item.subtotal?.toLocaleString('fr-FR')} FCFA</div>
                    </div>
                  ))}
                </div>
                <div className="co-resume-ligne"><span>Sous-total</span><span>{subtotal?.toLocaleString('fr-FR')} FCFA</span></div>
                <div className="co-resume-ligne"><span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Truck size={13} style={{ color: '#9ca3af' }} /> Livraison</span><span>{shipping.toLocaleString('fr-FR')} FCFA</span></div>
                <div className="co-resume-total"><span>Total TTC</span><span>{total.toLocaleString('fr-FR')} FCFA</span></div>
                <div className="co-alert-info">
                  <AlertCircle size={16} />
                  <p>En validant, le stock sera automatiquement déduit et votre commande envoyée au vendeur.</p>
                </div>
              </div>
            </div>
          </main>

          {/* ── Résumé mobile sticky (accordéon bas d'écran) ── */}
          <div className="co-resume-mobile">
            <div className="co-rmob-toggle" onClick={() => setResumeOpen(r => !r)}>
              <div className="co-rmob-left">
                <ShoppingCart size={16} color="#f97316" />
                <span className="co-rmob-label">Total TTC</span>
                <span className="co-rmob-val">{total.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <span style={{ fontSize:'12px', color:'#9ca3af', fontWeight:600 }}>{resumeOpen ? '▼ Masquer' : '▲ Voir'}</span>
            </div>
            {resumeOpen && (
              <div className="co-rmob-body">
                {cartItems.map(item => (
                  <div key={item.id} className="co-rmob-item">
                    <img src={getImageUrl(item.product?.image)} alt={item.product?.name} className="co-rmob-img"
                      onError={e => { e.target.src='https://placehold.co/38x38/fff7ed/f97316?text=CI'; }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="co-rmob-name">{item.product?.name}</div>
                      <div className="co-rmob-qty">{item.quantity} × {item.product?.price?.toLocaleString('fr-FR')} FCFA</div>
                    </div>
                    <div className="co-rmob-sub">{item.subtotal?.toLocaleString('fr-FR')} FCFA</div>
                  </div>
                ))}
                <div className="co-rmob-totals">
                  <span>Livraison</span>
                  <span>{shipping.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>
            )}
          </div>

          <Footer />
        </>
      )}
    </div>
  );
}