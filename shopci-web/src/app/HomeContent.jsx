'use client';

// src/pages/HomePage.jsx
// ShopCI — Thème orange & noir — 100% Français

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart, Search, ShoppingBag, TrendingUp,
  Smartphone, Laptop, Tv, Home, Sofa,
  Shirt, Footprints, Watch, Sparkles, Heart,
  Dumbbell, Baby, Book, Apple, Car, Hammer,
  Gem, Briefcase, Package, Menu, X,
  ChevronLeft, ChevronRight, Star, Plus, HelpCircle, ShieldCheck, Info,
  Tag, Flame, BadgePercent, ArrowRight, Clock, SlidersHorizontal, ArrowUpDown,
} from 'lucide-react';
import { productsAPI, cartAPI, authAPI } from '@/services/api';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

/* ─── Loader inline (pas besoin de fichier séparé) ──────────── */
function Loader({ message = 'Chargement...' }) {
  const dark = typeof document !== 'undefined' && document.body.classList.contains('dark');
  return (
    <div style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background: dark ? '#111113' : '#fafafa', zIndex:9999 }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'18px', background: dark ? '#1c1c1e' : '#fff', padding:'40px 48px', borderRadius:'20px', boxShadow: dark ? '0 8px 40px rgba(0,0,0,0.5)' : '0 8px 40px rgba(0,0,0,0.10)', border: dark ? '1px solid #3a3a3c' : '1px solid #f3f4f6' }}>
        {/* Logo animé */}
        <div style={{ position:'relative', width:'64px', height:'64px', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg viewBox="0 0 44 44" width="52" height="52" fill="none">
            <rect width="44" height="44" rx="12" fill="#f97316" style={{ filter:'drop-shadow(0 4px 12px rgba(249,115,22,0.4))' }}/>
            <path d="M10 16h4l4.5 13h11l3.5-10H14" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="19.5" cy="32" r="2" fill="white"/>
            <circle cx="27.5" cy="32" r="2" fill="white"/>
          </svg>
          <div style={{ position:'absolute', inset:'-6px', borderRadius:'50%', border:'3px solid #f97316', animation:'shopci-ring 1.4s ease-out infinite' }}/>
        </div>
        {/* Nom */}
        <div style={{ fontSize:'26px', fontWeight:'800', letterSpacing:'-0.8px' }}>
          <span style={{ color: dark ? '#f5f5f7' : '#1a1a1a' }}>Shop</span>
          <span style={{ color:'#f97316' }}>CI</span>
        </div>
        {/* Barre de progression */}
        <div style={{ width:'160px', height:'4px', background:'#f3f4f6', borderRadius:'4px', overflow:'hidden' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#f97316,#fb923c,#f97316)', borderRadius:'4px', animation:'shopci-progress 1.6s ease-in-out infinite' }}/>
        </div>
        {/* Points */}
        <div style={{ display:'flex', gap:'8px' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width:'10px', height:'10px', borderRadius:'50%', background:'#f97316', animation:`shopci-dot 1.2s ease-in-out ${i*0.15}s infinite` }}/>
          ))}
        </div>
        <p style={{ fontSize:'13px', color:'#9ca3af' }}>{message}</p>
      </div>
      <style>{`
        @keyframes shopci-ring     { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.8);opacity:0} }
        @keyframes shopci-progress { 0%{width:0%;margin-left:0} 50%{width:70%;margin-left:0} 100%{width:0%;margin-left:100%} }
        @keyframes shopci-dot      { 0%,80%,100%{transform:scale(.6);opacity:.3} 40%{transform:scale(1.2);opacity:1} }
      `}</style>
    </div>
  );
}

/* ─── Mapping catégories → icônes ─────────────────────────── */
const CATEGORIE_ICONES = {
  'Électroménager':        Home,
  'Smartphones':           Smartphone,
  'Ordinateurs & Tablettes': Laptop,
  'Télévisions & Audio':   Tv,
  'Vêtements Homme':       Shirt,
  'Vêtements Femme':       Shirt,
  'Chaussures':            Footprints,
  'Accessoires de Mode':   Watch,
  'Beauté & Parfums':      Sparkles,
  'Santé & Bien-être':     Heart,
  'Sports & Loisirs':      Dumbbell,
  'Jouets & Enfants':      Baby,
  'Maison & Décoration':   Home,
  'Meubles':               Sofa,
  'Livres & Médias':       Book,
  'Alimentation & Boissons': Apple,
  'Automobile & Moto':     Car,
  'Jardin & Bricolage':    Hammer,
  'Bijoux & Montres':      Gem,
  'Bagagerie & Voyage':    Briefcase,
};

/* ─── Logo inline ─────────────────────────────────────────── */
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

/* ─── Carte Produit — Glass Style ──────────────────────────── */
function CarteProduit({ produit, onClic, getImageUrl, onAjouterPanier }) {
  const [survol, setSurvol] = useState(false);
  const [indexImg, setIndexImg] = useState(0);
  const touchStartX = useRef(null);

  const images = [produit.image, ...(produit.images?.map(i => i.image) || [])].filter(Boolean);
  const nbImages = images.length;

  const imgSuivante = (e) => { e.stopPropagation(); setIndexImg((indexImg + 1) % nbImages); };
  const imgPrecedente = (e) => { e.stopPropagation(); setIndexImg((indexImg - 1 + nbImages) % nbImages); };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setIndexImg((prev) => (prev + 1) % nbImages);
      else setIndexImg((prev) => (prev - 1 + nbImages) % nbImages);
    }
    touchStartX.current = null;
  };

  const prixFormate = produit.price?.toLocaleString('fr-FR');

  return (
    <div
      className="gc-carte"
      onClick={onClic}
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
    >
      <div
        className="gc-img-zone"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={getImageUrl(images[indexImg] || null)}
          alt={produit.name}
          className={`gc-img${survol ? ' gc-img-zoom' : ''}`}
          onError={(e) => { e.target.src = 'https://placehold.co/400x400/1a1a2e/f97316?text=ShopCI'; }}
        />
        <div className="gc-overlay"/>
        <span className="gc-badge-cat">{produit.category_name || 'Autre'}</span>
        {produit.is_new && (
          <span className="gc-badge-new"><Flame size={10}/> Nouveau</span>
        )}
        {produit.discount && (
          <span className="gc-badge-promo"><BadgePercent size={10}/> -{produit.discount}%</span>
        )}
        {nbImages > 1 && (
          <>
            <button className="gc-fleche gc-fleche-g" onClick={imgPrecedente}>
              <ChevronLeft size={14}/>
            </button>
            <button className="gc-fleche gc-fleche-d" onClick={imgSuivante}>
              <ChevronRight size={14}/>
            </button>
            <div className="gc-dots-top">
              {images.map((_, i) => (
                <span key={i} className={`gc-dot-top${i === indexImg ? ' gc-dot-top-active' : ''}`}/>
              ))}
            </div>
          </>
        )}
        <div className="gc-glass">
          <div className="gc-vendeur-row">
            {produit.vendor_profile_photo ? (
              <img
                src={getImageUrl(produit.vendor_profile_photo)}
                alt={produit.vendor_name}
                className="gc-avatar"
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
              />
            ) : null}
            <div className="gc-avatar" style={{ display: produit.vendor_profile_photo ? 'none' : 'flex' }}>
              {(produit.vendor_name || 'V')[0].toUpperCase()}
            </div>
            <span className="gc-vendeur-nom">{produit.vendor_name || 'Vendeur'}</span>
            <span className="gc-badge-pro">PRO</span>
          </div>
          <h3 className="gc-titre">{produit.name}</h3>
          <div className="gc-prix-row">
            <span className="gc-prix">{prixFormate} <small>FCFA</small></span>
            <button
              className="gc-btn-acheter"
              onClick={(e) => { e.stopPropagation(); onClic(); }}
            >
              Acheter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Carte Recommandation — Glass Style ──────────────────── */
function RecoCarteSlide({ produit, getImageUrl, onClic }) {
  const [indexImg, setIndexImg] = useState(0);
  const [survol, setSurvol] = useState(false);
  const touchStartX = useRef(null);

  const images = [produit.image, ...(produit.images?.map(i => i.image) || [])].filter(Boolean);
  const nbImages = images.length;

  const imgSuivante = (e) => { e.stopPropagation(); setIndexImg((prev) => (prev + 1) % nbImages); };
  const imgPrecedente = (e) => { e.stopPropagation(); setIndexImg((prev) => (prev - 1 + nbImages) % nbImages); };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setIndexImg((prev) => (prev + 1) % nbImages);
      else setIndexImg((prev) => (prev - 1 + nbImages) % nbImages);
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="gc-carte reco-gc"
      onClick={onClic}
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
    >
      <div
        className="gc-img-zone reco-gc-img-zone"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={getImageUrl(images[indexImg] || null)}
          alt={produit.name}
          className={`gc-img${survol ? ' gc-img-zoom' : ''}`}
          onError={(e) => { e.target.src = 'https://placehold.co/300x300/1a1a2e/f97316?text=ShopCI'; }}
        />
        <div className="gc-overlay"/>
        <span className="gc-badge-cat">{produit.category_name || 'Autre'}</span>
        {nbImages > 1 && (
          <>
            <button className="gc-fleche gc-fleche-g" onClick={imgPrecedente}><ChevronLeft size={12}/></button>
            <button className="gc-fleche gc-fleche-d" onClick={imgSuivante}><ChevronRight size={12}/></button>
            <div className="gc-dots-top">
              {images.map((_, i) => (
                <span key={i} className={`gc-dot-top${i === indexImg ? ' gc-dot-top-active' : ''}`}/>
              ))}
            </div>
          </>
        )}
        <div className="gc-glass">
          <div className="gc-vendeur-row">
            {produit.vendor_profile_photo ? (
              <img src={getImageUrl(produit.vendor_profile_photo)} alt={produit.vendor_name} className="gc-avatar"
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}/>
            ) : null}
            <div className="gc-avatar" style={{ display: produit.vendor_profile_photo ? 'none' : 'flex' }}>
              {(produit.vendor_name || 'V')[0].toUpperCase()}
            </div>
            <span className="gc-vendeur-nom">{produit.vendor_name || 'Vendeur'}</span>
            <span className="gc-badge-pro">PRO</span>
          </div>
          <h3 className="gc-titre">{produit.name}</h3>
          <div className="gc-prix-row">
            <span className="gc-prix">{produit.price?.toLocaleString('fr-FR')} <small>FCFA</small></span>
            <button className="gc-btn-acheter" onClick={(e) => { e.stopPropagation(); onClic(); }}>Acheter</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Carrousel 3D Nouveautés — Glass Style ───────────────── */
function Carrousel3D({ produits, getImageUrl, onClic }) {
  const [actif, setActif] = useState(0);
  const total = produits.length;
  const autoRef = useRef(null);

  const aller = (dir) => { setActif(prev => (prev + dir + total) % total); };

  useEffect(() => {
    autoRef.current = setInterval(() => aller(1), 4000);
    return () => { clearInterval(autoRef.current); };
  }, [total]);

  if (!total) return null;

  const getRelIndex = (i) => ((i - actif) % total + total) % total;
  const p = produits[actif];

  return (
    <div className="car3d-wrap">
      <div className="car3d-scene">
        {produits.map((prod, i) => {
          const rel = getRelIndex(i);
          let style = {};
          if (rel === 0) {
            style = { transform: 'translateX(0px) scale(1) rotateY(0deg)', opacity: 1, zIndex: 5 };
          } else if (rel === 1 || rel === total - 1) {
            const dir = rel === 1 ? 1 : -1;
            style = { transform: `translateX(${dir * 185}px) scale(0.8) rotateY(${dir * -35}deg)`, opacity: 0.65, zIndex: 3 };
          } else if (rel === 2 || rel === total - 2) {
            const dir = rel === 2 ? 1 : -1;
            style = { transform: `translateX(${dir * 300}px) scale(0.62) rotateY(${dir * -50}deg)`, opacity: 0.3, zIndex: 1 };
          } else {
            style = { opacity: 0, zIndex: 0, pointerEvents: 'none' };
          }
          const isActive = rel === 0;
          const isSide = rel === 1 || rel === total - 1;
          return (
            <div
              key={prod.id}
              className="car3d-carte"
              style={{ ...style, pointerEvents: isActive || isSide ? 'auto' : 'none', transition: 'all 0.5s cubic-bezier(.4,0,.2,1)', cursor: 'pointer' }}
              onClick={() => isActive ? onClic(prod.id) : aller(rel === 1 ? 1 : -1)}
            >
              <div className="car3d-img-zone">
                <img
                  src={getImageUrl(prod.image)}
                  alt={prod.name}
                  className="car3d-img"
                  onError={e => { e.target.src = 'https://placehold.co/400x400/1a1a2e/f97316?text=ShopCI'; }}
                />
                <span className="car3d-badge-new"><Flame size={10}/> Nouveau</span>
                <div className="car3d-glass-info">
                  <p className="car3d-glass-nom">{prod.name}</p>
                  <div className="car3d-glass-prix-row">
                    <span className="car3d-glass-prix">{prod.price?.toLocaleString('fr-FR')} <small>FCFA</small></span>
                    {isActive && (
                      <span className="car3d-glass-vendeur">
                        <div className="car3d-glass-avatar">
                          {(prod.vendor_name || 'V')[0].toUpperCase()}
                        </div>
                        {prod.vendor_name || 'Vendeur'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="car3d-fleche car3d-fl-g" onClick={() => aller(-1)}><ChevronLeft size={20}/></button>
      <button className="car3d-fleche car3d-fl-d" onClick={() => aller(1)}><ChevronRight size={20}/></button>

      <div className="car3d-dots">
        {produits.map((_, i) => (
          <button key={i} className={`car3d-dot${i === actif ? ' car3d-dot-a' : ''}`} onClick={() => setActif(i)}/>
        ))}
      </div>

      <div className="car3d-label" key={actif}>
        <Clock size={12}/> 30 jours · <strong>{p.vendor_name || 'Vendeur'}</strong>
        <button className="car3d-voir" onClick={() => onClic(p.id)}>Voir →</button>
      </div>
    </div>
  );
}

/* ─── Scroll smooth vers un id ──────────────────────────────── */
function scrollVers(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ─── Composant principal ──────────────────────────────────── */
export default function HomePage() {
  const router = useRouter();
  const recoRef = useRef(null);
  const catScrollRef = useRef(null);

  const [produits, setProduits]           = useState([]);
  const [tousLesProduits, setTous]        = useState([]);
  const [categories, setCategories]       = useState([]);
  const [nbPanier, setNbPanier]           = useState(0);
  const [chargement, setChargement]       = useState(true);
  const [categorieActive, setCatActive]   = useState(null);
  const [recherche, setRecherche]         = useState('');
  const [page, setPage]                   = useState(1);
  const [emailNewsletter, setEmailNews]   = useState('');
  const [menuMobile, setMenuMobile]       = useState(false);
  const [sidebarMobile, setSidebarMobile] = useState(false);
  const [messagesBienvenue, setMsgBien]   = useState(true);
  const [user]                            = useState(authAPI.getCurrentUser());
  const [prixMin, setPrixMin]             = useState(0);
  const [prixMax, setPrixMax]             = useState(10000000);
  const [prixMaxGlobal, setPrixMaxGlobal] = useState(10000000);
  const [filtrePrixActif, setFiltrePrix]  = useState(false);
  const [triPrix, setTriPrix]             = useState('');
  const [triFecha, setTriFecha]           = useState('nouveau');
  const [produitsNouveaux, setProduitsNouveaux] = useState([]);

  const PAR_PAGE = 6;

  useEffect(() => {
    if (user && messagesBienvenue) {
      const t = setTimeout(() => setMsgBien(false), 10000);
      return () => clearTimeout(t);
    }
  }, [user, messagesBienvenue]);

  useEffect(() => { chargerDonnees(); }, []);

  const chargerDonnees = async () => {
    try {
      const [resProduits, resCats] = await Promise.all([
        productsAPI.getProducts(),
        productsAPI.getCategories(),
      ]);
      const liste = resProduits.results || resProduits || [];
      setProduits(liste);
      setTous(liste);
      setCategories(resCats.results || resCats || []);

      const ilYa30Jours = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const nouveaux = liste.filter(p => {
        if (!p.created_at && !p.date_added) return false;
        const d = new Date(p.created_at || p.date_added);
        return d >= ilYa30Jours;
      });
      setProduitsNouveaux(nouveaux);

      const maxPrix = Math.max(...liste.map(p => p.price || 0), 10000000);
      setPrixMaxGlobal(maxPrix);
      setPrixMax(maxPrix);

      if (authAPI.isAuthenticated()) {
        const panier = await cartAPI.getCart();
        setNbPanier(panier.items_count || 0);
      }
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setChargement(false);
    }
  };

  const appliquerFiltres = (base, catId, minP, maxP, tri, date) => {
    let res = base;
    if (catId) res = res.filter(p => p.category === catId);
    if (filtrePrixActif || minP > 0 || maxP < prixMaxGlobal) {
      res = res.filter(p => (p.price || 0) >= minP && (p.price || 0) <= maxP);
    }
    if (tri === 'desc') res = [...res].sort((a, b) => (b.price || 0) - (a.price || 0));
    if (tri === 'asc')  res = [...res].sort((a, b) => (a.price || 0) - (b.price || 0));
    if (date === 'ancien') res = [...res].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    if (date === 'nouveau') res = [...res].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return res;
  };

  const filtrerParCategorie = (catId) => {
    setCatActive(catId);
    setPage(1);
    setRecherche('');
    setProduits(appliquerFiltres(tousLesProduits, catId, prixMin, prixMax, triPrix, triFecha));
    setSidebarMobile(false);
  };

  const appliquerFiltrePrix = () => {
    setFiltrePrix(true);
    setPage(1);
    setProduits(appliquerFiltres(tousLesProduits, categorieActive, prixMin, prixMax, triPrix, triFecha));
  };

  const changerTri = (valeur) => {
    setTriPrix(valeur);
    setPage(1);
    setProduits(appliquerFiltres(tousLesProduits, categorieActive, prixMin, prixMax, valeur, triFecha));
  };

  const changerDate = (valeur) => {
    setTriFecha(valeur);
    setPage(1);
    setProduits(appliquerFiltres(tousLesProduits, categorieActive, prixMin, prixMax, triPrix, valeur));
  };

  const reinitialiserFiltres = () => {
    setPrixMin(0);
    setPrixMax(prixMaxGlobal);
    setFiltrePrix(false);
    setTriPrix('');
    setTriFecha('nouveau');
    setCatActive(null);
    setPage(1);
    setProduits(tousLesProduits);
  };

  const lancerRecherche = (e) => {
    e.preventDefault();
    setCatActive(null);
    setPage(1);
    const q = recherche.trim().toLowerCase();
    setProduits(q
      ? tousLesProduits.filter(p =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
        )
      : tousLesProduits
    );
  };

  useEffect(() => {
    if (!recherche && !categorieActive) setProduits(tousLesProduits);
  }, [recherche, tousLesProduits, categorieActive]);

  const getImageUrl = (chemin) => {
    if (!chemin) return 'https://placehold.co/400x300/fff7ed/f97316?text=ShopCI';
    if (chemin.startsWith('http')) return chemin;
    return `http://localhost:8000${chemin.startsWith('/') ? chemin : '/' + chemin}`;
  };

  const deconnexion = () => { authAPI.logout(); router.push('/login'); };

  const produitsTries = triFecha === 'ancien'
    ? [...produits].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
    : produits;
  const produitsPage = produitsTries;
  const totalPages   = Math.max(1, Math.ceil(produits.length / PAR_PAGE));

  const scrollReco = (dir) =>
    recoRef.current?.scrollBy({ left: dir === 'gauche' ? -340 : 340, behavior: 'smooth' });

  const scrollCat = (dir) =>
    catScrollRef.current?.scrollBy({ left: dir === 'gauche' ? -260 : 260, behavior: 'smooth' });

  if (chargement) return <Loader message="Chargement de ShopCI…" />;

  return (
    <div className="shopci-root">

      {/* ════════════════ NAVBAR ════════════════ */}
      <Navbar nbPanier={nbPanier} pageCourante="/" />

      {/* ════════════════════════════════════════
          HERO BANNER
      ════════════════════════════════════════ */}
      <section className="shopci-hero">
        <div className="hero-bg-text">ShopCI</div>

        <div className="hero-overlay">
          <div className="hero-contenu">
            <div className="hero-texte fade-in">
              <span className="hero-tag"><Flame size={14}/> Offres du jour</span>
              <h1 className="hero-titre">Tout ce dont<br/>vous avez besoin</h1>
              <p className="hero-sous-titre">
                La marketplace N°1 de Côte d'Ivoire.<br/>
                Des milliers de produits livrés chez vous.
              </p>
              <div className="hero-btns">
                {/* ── MODIFIÉ : scroll vers #recommandations ── */}
                <button
                  className="hero-btn-principal"
                  onClick={() => scrollVers('section-recommandations')}
                >
                  Explorer la boutique <ArrowRight size={18}/>
                </button>
                {/* ── MODIFIÉ : redirige vers /login ── */}
                <button
                  className="hero-btn-secondaire"
                  onClick={() => router.push('/login')}
                >
                  Vendre sur ShopCI
                </button>
              </div>
            </div>

            {/* Barre de recherche hero */}
            <form className="hero-search" onSubmit={lancerRecherche}>
              <Search size={18} className="hero-search-ico"/>
              <input
                type="text"
                placeholder="Rechercher sur ShopCI…"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="hero-search-input"
              />
              <button type="submit" className="hero-search-btn">Rechercher</button>
            </form>
          </div>

          {produitsNouveaux.length > 0 && (
            <div className="hero-car3d">
              <div className="hero-car3d-tag"><Clock size={12}/> Nouveautés du mois</div>
              <Carrousel3D
                produits={produitsNouveaux}
                getImageUrl={getImageUrl}
                onClic={(id) => router.push(`/product/${id}`)}
              />
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════
          BARRE CATÉGORIES HORIZONTALE
      ════════════════════════════════════════ */}
      <div className="shopci-cats-barre">
        <div className="cats-barre-inner">
          <button className="cats-arrow" onClick={() => scrollCat('gauche')}><ChevronLeft size={18}/></button>
          <div className="cats-scroll" ref={catScrollRef}>
            <button
              className={`cat-pill${!categorieActive ? ' cat-pill-active' : ''}`}
              onClick={() => filtrerParCategorie(null)}
            >
              <Package size={16}/> Tout
            </button>
            {categories.map((cat) => {
              const Icone = CATEGORIE_ICONES[cat.name] || Tag;
              return (
                <button
                  key={cat.id}
                  className={`cat-pill${categorieActive === cat.id ? ' cat-pill-active' : ''}`}
                  onClick={() => filtrerParCategorie(cat.id)}
                >
                  <Icone size={16}/> {cat.name}
                </button>
              );
            })}
          </div>
          <button className="cats-arrow" onClick={() => scrollCat('droite')}><ChevronRight size={18}/></button>
        </div>
      </div>

      {/* ════════════════════════════════════════
          LAYOUT PRINCIPAL : SIDEBAR + GRILLE
      ════════════════════════════════════════ */}
      <main className="shopci-main">

        {/* ── Sidebar catégories desktop ── */}
        <aside className="shopci-sidebar">
          <p className="sidebar-titre">Catégories</p>

          <button
            className={`sidebar-item sidebar-item-tout${!categorieActive ? ' actif' : ''}`}
            onClick={() => filtrerParCategorie(null)}
          >
            <Package size={17}/> <span>Tous les produits</span>
            {!categorieActive && <span className="sidebar-count">{tousLesProduits.length}</span>}
          </button>

          {categories.map((cat) => {
            const Icone = CATEGORIE_ICONES[cat.name] || Tag;
            const nbCat = tousLesProduits.filter(p => p.category === cat.id).length;
            return (
              <button
                key={cat.id}
                className={`sidebar-item${categorieActive === cat.id ? ' actif' : ''}`}
                onClick={() => filtrerParCategorie(cat.id)}
              >
                <Icone size={16}/>
                <span>{cat.name}</span>
                <span className="sidebar-count">{nbCat}</span>
              </button>
            );
          })}

          <div className="sidebar-sep"/>
          <p className="sidebar-titre" style={{marginTop:'4px'}}>Filtrer par prix</p>
          
          <div className="prix-filtre-zone">
            <div className="prix-range-labels">
              <span>{prixMin.toLocaleString('fr-FR')} FCFA</span>
              <span>{prixMax.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="dual-range-wrap">
              <div
                className="dual-range-track"
                style={{
                  left: `${(prixMin / prixMaxGlobal) * 100}%`,
                  right: `${100 - (prixMax / prixMaxGlobal) * 100}%`,
                }}
              />
              <input
                type="range"
                min={0}
                max={prixMaxGlobal}
                step={1000}
                value={prixMin}
                className="dual-slider dual-slider-min"
                onChange={e => {
                  const v = Number(e.target.value);
                  if (v < prixMax) setPrixMin(v);
                }}
              />
              <input
                type="range"
                min={0}
                max={prixMaxGlobal}
                step={1000}
                value={prixMax}
                className="dual-slider dual-slider-max"
                onChange={e => {
                  const v = Number(e.target.value);
                  if (v > prixMin) setPrixMax(v);
                }}
              />
            </div>
            <button className="prix-appliquer-btn" onClick={appliquerFiltrePrix}>
              <SlidersHorizontal size={13}/> Appliquer
            </button>
          </div>

          <div className="sidebar-sep"/>
          <p className="sidebar-titre">Trier par prix</p>
          {[
            { label: 'Prix croissant', val: 'asc' },
            { label: 'Prix décroissant', val: 'desc' },
          ].map(({ label, val }) => (
            <button
              key={val}
              className={`sidebar-item${triPrix === val ? ' actif' : ''}`}
              onClick={() => changerTri(triPrix === val ? '' : val)}
            >
              <ArrowUpDown size={15}/> <span>{label}</span>
            </button>
          ))}

          <div className="sidebar-sep"/>
          <p className="sidebar-titre">Trier par date</p>
          {[
            { label: 'Plus récent', val: 'nouveau' },
            { label: 'Plus ancien', val: 'ancien' },
          ].map(({ label, val }) => (
            <button
              key={val}
              className={`sidebar-item${triFecha === val ? ' actif' : ''}`}
              onClick={() => changerDate(val)}
            >
              <Clock size={15}/> <span>{label}</span>
            </button>
          ))}

          {(filtrePrixActif || triPrix || triFecha !== 'nouveau' || categorieActive) && (
            <>
              <div className="sidebar-sep"/>
              <button className="sidebar-item" style={{color:'#ef4444'}} onClick={reinitialiserFiltres}>
                <X size={15}/> <span>Réinitialiser tout</span>
              </button>
            </>
          )}
        </aside>

        {/* ── Section produits ── */}
        <section className="shopci-section-produits">
          <div className="section-entete">
            <div className="section-entete-gauche">
              <TrendingUp size={22} className="ico-orange"/>
              <h2 className="section-titre">
                {recherche
                  ? `Résultats pour "${recherche}"`
                  : categorieActive
                    ? categories.find(c => c.id === categorieActive)?.name
                    : 'Produits disponibles'}
              </h2>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <span className="section-nb">{produits.length} produit{produits.length !== 1 ? 's' : ''}</span>
              <select
                className="tri-select"
                value={triFecha}
                onChange={e => changerDate(e.target.value)}
              >
                <option value="nouveau">Plus récent</option>
                <option value="ancien">Plus ancien</option>
              </select>
            </div>
          </div>

          {recherche && (
            <div className="shopci-notice fade-in">
              <span><strong>{produits.length}</strong> résultat{produits.length !== 1 ? 's' : ''} pour <em>« {recherche} »</em></span>
              <button onClick={() => { setRecherche(''); setProduits(tousLesProduits); }}>✕ Effacer</button>
            </div>
          )}

          {produitsPage.length === 0 ? (
            <div className="shopci-vide fade-in">
              <Package size={64}/>
              <p>Aucun produit trouvé</p>
              {recherche && (
                <button className="shopci-btn-reset" onClick={() => { setRecherche(''); setProduits(tousLesProduits); }}>
                  Voir tous les produits
                </button>
              )}
            </div>
          ) : (
            <div className="shopci-grille">
              {produitsPage.map((produit) => (
                <CarteProduit
                  key={produit.id}
                  produit={produit}
                  onClic={() => router.push(`/product/${produit.id}`)}
                  getImageUrl={getImageUrl}
                  onAjouterPanier={() => router.push('/cart')}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ════════════════════════════════════════
          RECOMMANDATIONS  ← id anchor ici
      ════════════════════════════════════════ */}
      <section className="shopci-reco" id="section-recommandations">
        <div className="reco-entete">
          <div className="reco-entete-gauche">
            <Sparkles size={22} className="ico-orange"/>
            <h2 className="section-titre">Nos recommandations</h2>
          </div>
          <div className="reco-nav">
            <button onClick={() => scrollReco('gauche')}><ChevronLeft size={20}/></button>
            <button onClick={() => scrollReco('droite')}><ChevronRight size={20}/></button>
          </div>
        </div>

        <div className="reco-piste" ref={recoRef}>
          {tousLesProduits.slice(0, 10).map((produit) => (
            <RecoCarteSlide
              key={produit.id}
              produit={produit}
              getImageUrl={getImageUrl}
              onClic={() => router.push(`/product/${produit.id}`)}
            />
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          BANNIÈRE NEWSLETTER
      ════════════════════════════════════════ */}
      <section className="shopci-newsletter">
        <div className="newsletter-inner">
          <div className="newsletter-gauche">
            <span className="newsletter-tag">Newsletter</span>
            <h2 className="newsletter-titre">Restez informé des<br/>meilleures offres</h2>
            <p className="newsletter-sous">
              Recevez en avant-première les promotions, nouveautés et bons plans exclusifs.
            </p>
            <form
              className="newsletter-form"
              onSubmit={(e) => { e.preventDefault(); alert(`Merci ! ${emailNewsletter} inscrit.`); setEmailNews(''); }}
            >
              <input
                type="email"
                placeholder="Votre adresse email"
                value={emailNewsletter}
                onChange={(e) => setEmailNews(e.target.value)}
                required
                className="newsletter-input"
              />
              <button type="submit" className="newsletter-btn">S'abonner</button>
            </form>
          </div>
          <div className="newsletter-droite">
            <div className="newsletter-deco">
              <ShoppingCart size={80} className="deco-ico"/>
              <div className="deco-cercle-1"/>
              <div className="deco-cercle-2"/>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <Footer />

      {/* ════════════════════════════════════════
          SIDEBAR MOBILE CATÉGORIES
      ════════════════════════════════════════ */}
      {sidebarMobile && (
        <>
          <div className="sidebar-overlay" onClick={() => setSidebarMobile(false)}/>
          <div className="sidebar-mobile slide-in">
            <div className="sidebar-mobile-header">
              <span>Catégories</span>
              <button onClick={() => setSidebarMobile(false)}><X size={22}/></button>
            </div>
            <button
              className={`sidebar-item${!categorieActive ? ' actif' : ''}`}
              onClick={() => filtrerParCategorie(null)}
            >
              <Package size={17}/> Tous les produits
            </button>
            {categories.map((cat) => {
              const Icone = CATEGORIE_ICONES[cat.name] || Tag;
              return (
                <button
                  key={cat.id}
                  className={`sidebar-item${categorieActive === cat.id ? ' actif' : ''}`}
                  onClick={() => filtrerParCategorie(cat.id)}
                >
                  <Icone size={16}/> {cat.name}
                </button>
              );
            })}
          </div>
        </>
      )}

      <button className="shopci-fab" onClick={() => setSidebarMobile(true)}>
        <Menu size={22}/>
        <span>Catégories</span>
      </button>

      <style>{`
        /* ── Root ── */
        .shopci-root {
          font-family: 'DM Sans', system-ui, sans-serif;
          background: #fafafa;
          color: #1a1a1a;
          min-height: 100vh;
        }
        .shopci-nav {
          background: #fff;
          border-bottom: 1px solid #f0f0f0;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 8px rgba(0,0,0,0.06);
        }
        .nav-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 20px;
          height: 62px;
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .nav-logo { background: none; border: none; cursor: pointer; padding: 0; display: flex; flex-shrink: 0; }
        .nav-liens { display: flex; gap: 24px; flex-shrink: 0; }
        .nav-lien { font-size: 14px; color: #555; text-decoration: none; font-weight: 500; transition: color .2s; white-space: nowrap; }
        .nav-lien:hover, .nav-lien-actif { color: #f97316; font-weight: 600; }
        .nav-droite { margin-left: auto; display: flex; align-items: center; gap: 6px; }
        .nav-search { display: flex; align-items: center; background: #f3f4f6; border-radius: 10px; padding: 0 12px; gap: 8px; height: 38px; }
        .nav-search-ico { color: #9ca3af; flex-shrink: 0; }
        .nav-search-input { border: none; background: transparent; outline: none; font-size: 14px; width: 200px; color: #1a1a1a; }
        .nav-search-input::placeholder { color: #9ca3af; }
        .nav-icone-btn { background: none; border: none; cursor: pointer; color: #555; padding: 7px; border-radius: 9px; display: flex; align-items: center; justify-content: center; transition: background .18s, color .18s; }
        .nav-icone-btn:hover { background: #fff7ed; color: #f97316; }
        .nav-panier-btn { position: relative; }
        .nav-badge { position: absolute; top: -3px; right: -3px; background: #f97316; color: #fff; font-size: 10px; font-weight: 700; border-radius: 999px; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; }
        .nav-user { display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; padding: 4px 8px; border-radius: 10px; transition: background .18s; }
        .nav-user:hover { background: #fff7ed; }
        .nav-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid #f97316; }
        .nav-avatar-placeholder { width: 32px; height: 32px; border-radius: 50%; background: #f97316; color: #fff; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; }
        .nav-username { font-size: 13px; font-weight: 600; color: #1a1a1a; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .nav-bienvenue { color: #9ca3af; font-weight: 400; }
        .nav-logout:hover { background: #fef2f2; color: #ef4444; }
        .nav-btn-connexion { background: none; border: 1.5px solid #e5e7eb; border-radius: 9px; padding: 7px 16px; font-size: 13px; font-weight: 600; cursor: pointer; color: #1a1a1a; transition: border-color .2s, color .2s; white-space: nowrap; }
        .nav-btn-connexion:hover { border-color: #f97316; color: #f97316; }
        .nav-btn-inscription { background: #f97316; border: none; border-radius: 9px; padding: 7px 16px; font-size: 13px; font-weight: 600; cursor: pointer; color: #fff; transition: background .2s; white-space: nowrap; }
        .nav-btn-inscription:hover { background: #ea6a0a; }
        .nav-burger { display: none; }
        .nav-menu-mobile { display: flex; flex-direction: column; padding: 12px 20px 16px; gap: 4px; border-top: 1px solid #f0f0f0; background: #fff; }
        .nav-menu-mobile a { padding: 10px 12px; font-size: 15px; color: #333; text-decoration: none; font-weight: 500; border-radius: 8px; transition: background .18s, color .18s; }
        .nav-menu-mobile a:hover { background: #fff7ed; color: #f97316; }
        .nav-search-mobile { display: flex; align-items: center; gap: 8px; background: #f3f4f6; border-radius: 10px; padding: 0 14px; height: 40px; margin-bottom: 8px; }
        .nav-search-mobile input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; }
        .nav-mobile-auth { display: flex; gap: 10px; margin-top: 8px; }
        .nav-mobile-auth button { flex: 1; padding: 10px; border-radius: 9px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1.5px solid #e5e7eb; background: none; color: #1a1a1a; }
        .nav-mobile-auth button.orange { background: #f97316; border-color: #f97316; color: #fff; }

        /* ── HERO ── */
        .shopci-hero {
          position: relative;
          min-height: 380px;
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%);
          overflow: hidden;
        }
        .hero-bg-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: clamp(80px, 16vw, 180px);
          font-weight: 900;
          color: rgba(249,115,22,0.07);
          letter-spacing: -4px;
          white-space: nowrap;
          pointer-events: none;
          user-select: none;
        }
        .shopci-hero::before {
          content: '';
          position: absolute;
          top: -80px; right: -80px;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%);
        }
        .shopci-hero::after {
          content: '';
          position: absolute;
          bottom: -60px; left: -60px;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%);
        }
        .hero-overlay {
          position: relative;
          z-index: 2;
          max-width: 1280px;
          margin: 0 auto;
          padding: 48px 40px 48px;
          display: grid;
          grid-template-columns: 480px 1fr;
          align-items: center;
          gap: 40px;
        }
        .hero-contenu { display: flex; flex-direction: column; gap: 28px; }
        .hero-car3d { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .hero-car3d-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(249,115,22,0.15);
          border: 1px solid rgba(249,115,22,0.3);
          color: #f97316;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 999px;
          letter-spacing: .4px;
        }
        @media (max-width: 1100px) { .hero-overlay { grid-template-columns: 400px 1fr; padding: 40px 24px; } }
        @media (max-width: 900px) { .hero-overlay { grid-template-columns: 1fr; padding: 40px 16px 36px; } .hero-car3d { display: none; } }
        .hero-texte { max-width: 580px; }
        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(249,115,22,0.15);
          border: 1px solid rgba(249,115,22,0.3);
          color: #f97316;
          font-size: 12px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 999px;
          letter-spacing: .4px;
          margin-bottom: 16px;
        }
        .hero-titre {
          font-size: clamp(28px, 4vw, 46px);
          font-weight: 800;
          color: #fff;
          line-height: 1.15;
          margin-bottom: 14px;
          letter-spacing: -1px;
        }
        .hero-sous-titre {
          font-size: 15px;
          color: rgba(255,255,255,0.65);
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .hero-btns { display: flex; gap: 12px; flex-wrap: wrap; }
        .hero-btn-principal {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #f97316;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 13px 24px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background .2s, transform .15s;
          box-shadow: 0 4px 16px rgba(249,115,22,0.4);
        }
        .hero-btn-principal:hover { background: #ea6a0a; transform: translateY(-1px); }
        .hero-btn-secondaire {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.1);
          color: #fff;
          border: 1.5px solid rgba(255,255,255,0.25);
          border-radius: 12px;
          padding: 13px 24px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background .2s;
          backdrop-filter: blur(4px);
        }
        .hero-btn-secondaire:hover { background: rgba(255,255,255,0.18); }
        .hero-search {
          display: flex;
          align-items: center;
          background: #fff;
          border-radius: 14px;
          padding: 4px 4px 4px 16px;
          gap: 10px;
          max-width: 560px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.25);
        }
        .hero-search-ico { color: #9ca3af; flex-shrink: 0; }
        .hero-search-input { flex: 1; border: none; outline: none; font-size: 14.5px; height: 44px; background: transparent; color: #1a1a1a; }
        .hero-search-input::placeholder { color: #9ca3af; }
        .hero-search-btn {
          background: #f97316;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 10px 22px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background .2s;
          white-space: nowrap;
        }
        .hero-search-btn:hover { background: #ea6a0a; }

        /* ── BARRE CATÉGORIES ── */
        .shopci-cats-barre { display: none; background: #fff; border-bottom: 1px solid #f0f0f0; position: sticky; top: 62px; z-index: 90; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        .cats-barre-inner { max-width: 1280px; margin: 0 auto; padding: 0 12px; display: flex; align-items: center; gap: 4px; height: 52px; }
        .cats-arrow { background: none; border: none; cursor: pointer; color: #9ca3af; padding: 6px; border-radius: 8px; display: flex; flex-shrink: 0; transition: background .18s, color .18s; }
        .cats-arrow:hover { background: #fff7ed; color: #f97316; }
        .cats-scroll { display: flex; gap: 6px; overflow-x: auto; flex: 1; padding: 6px 0; scrollbar-width: none; }
        .cats-scroll::-webkit-scrollbar { display: none; }
        .cat-pill { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 999px; font-size: 13px; font-weight: 500; white-space: nowrap; cursor: pointer; background: #f3f4f6; border: 1.5px solid transparent; color: #555; transition: all .18s; flex-shrink: 0; }
        .cat-pill:hover { background: #fff7ed; color: #f97316; border-color: #fed7aa; }
        .cat-pill-active { background: #f97316; color: #fff; border-color: #f97316; font-weight: 700; }
        .cat-pill-active:hover { background: #ea6a0a; border-color: #ea6a0a; }

        /* ── MAIN LAYOUT ── */
        .shopci-main { max-width: 1280px; margin: 28px auto; padding: 0 20px; display: grid; grid-template-columns: 230px 1fr; gap: 28px; align-items: start; }

        /* ── SIDEBAR DESKTOP ── */
        .shopci-sidebar { background: #fff; border-radius: 16px; padding: 20px 14px; border: 1px solid #f0f0f0; position: sticky; top: 130px; display: flex; flex-direction: column; gap: 2px; }
        .sidebar-titre { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; padding: 4px 10px 8px; margin: 0; }
        .sidebar-item { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 10px; background: none; border: none; font-size: 13.5px; color: #555; cursor: pointer; text-align: left; width: 100%; transition: background .18s, color .18s; }
        .sidebar-item:hover { background: #fff7ed; color: #f97316; }
        .sidebar-item.actif { background: #fff7ed; color: #f97316; font-weight: 700; }
        .sidebar-item-tout { font-weight: 600; }
        .sidebar-count { margin-left: auto; font-size: 11px; color: #9ca3af; background: #f3f4f6; border-radius: 999px; padding: 1px 8px; }
        .sidebar-item.actif .sidebar-count { background: rgba(249,115,22,0.15); color: #f97316; }
        .sidebar-sep { height: 1px; background: #f0f0f0; margin: 10px 0; }

        /* ── SECTION PRODUITS ── */
        .shopci-section-produits { min-width: 0; }
        .section-entete { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 8px; }
        .section-entete-gauche { display: flex; align-items: center; gap: 10px; }
        .section-titre { font-size: 20px; font-weight: 800; color: #1a1a1a; letter-spacing: -0.4px; }
        .section-nb { font-size: 13px; color: #9ca3af; }
        .ico-orange { color: #f97316; }
        .shopci-notice { display: flex; align-items: center; justify-content: space-between; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 10px 16px; font-size: 14px; margin-bottom: 18px; color: #555; }
        .shopci-notice button { background: none; border: none; cursor: pointer; color: #f97316; font-size: 13px; font-weight: 600; }

        /* ── GRILLE PRODUITS ── */
        .shopci-grille { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .shopci-vide { text-align: center; padding: 80px 20px; color: #d1d5db; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .shopci-vide p { font-size: 16px; color: #9ca3af; }
        .shopci-btn-reset { margin-top: 8px; padding: 10px 22px; background: #f97316; color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; }

        /* ── CARTE PRODUIT — GLASS STYLE ── */
        .gc-carte { border-radius: 18px; overflow: hidden; cursor: pointer; position: relative; transition: transform .28s, box-shadow .28s; background: #111; box-shadow: 0 4px 20px rgba(0,0,0,0.18); }
        .gc-carte:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(249,115,22,0.22); }
        .gc-img-zone { position: relative; aspect-ratio: 4/5; overflow: hidden; background: #1a1a1a; }
        .gc-img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s ease; display: block; }
        .gc-img-zoom { transform: scale(1.08); }
        .gc-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 45%, transparent 70%); pointer-events: none; z-index: 1; }
        .gc-badge-cat { position: absolute; top: 10px; left: 10px; background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.22); border-radius: 6px; padding: 3px 10px; font-size: 10.5px; font-weight: 700; color: #fff; z-index: 3; letter-spacing: .3px; }
        .gc-badge-new { position: absolute; top: 10px; right: 10px; background: #f97316; color: #fff; font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 6px; display: flex; align-items: center; gap: 4px; z-index: 3; }
        .gc-badge-promo { position: absolute; top: 38px; right: 10px; background: #ef4444; color: #fff; font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 6px; display: flex; align-items: center; gap: 4px; z-index: 3; }
        .gc-fleche { position: absolute; top: 42%; transform: translateY(-50%); background: rgba(255,255,255,0.18); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); border: 1px solid rgba(255,255,255,0.25); border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #fff; z-index: 4; transition: background .18s; }
        .gc-fleche:hover { background: rgba(249,115,22,0.7); border-color: #f97316; }
        .gc-fleche-g { left: 8px; }
        .gc-fleche-d { right: 8px; }
        .gc-dots-top { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 5px; z-index: 4; }
        .gc-dot-top { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.4); transition: all .2s; }
        .gc-dot-top-active { background: #f97316; width: 14px; border-radius: 3px; }
        .gc-glass { position: absolute; bottom: 0; left: 0; right: 0; z-index: 2; padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 6px; }
        .gc-vendeur-row { display: flex; align-items: center; gap: 7px; }
        .gc-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #f97316, #fb923c); color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; object-fit: cover; border: 2px solid rgba(255,255,255,0.35); }
        .gc-vendeur-nom { font-size: 11.5px; color: rgba(255,255,255,0.8); font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .gc-badge-pro { font-size: 9.5px; font-weight: 800; color: #f97316; background: rgba(249,115,22,0.18); border: 1px solid rgba(249,115,22,0.45); border-radius: 5px; padding: 1px 6px; flex-shrink: 0; letter-spacing: .5px; }
        .gc-titre { font-size: 13.5px; font-weight: 700; color: #fff; margin: 0; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-shadow: 0 1px 4px rgba(0,0,0,0.5); }
        .gc-prix-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 6px; margin-top: 2px; }
        .gc-prix { font-size: 14px; font-weight: 800; color: #f97316; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
        .gc-prix small { font-size: 9px; font-weight: 500; color: rgba(255,255,255,0.5); }
        .gc-btn-acheter { flex-shrink: 0; padding: 6px 12px; background: #f97316; color: #fff; border: none; border-radius: 8px; font-size: 11.5px; font-weight: 700; cursor: pointer; transition: background .18s, transform .15s; white-space: nowrap; font-family: inherit; }
        .gc-btn-acheter:hover { background: #ea6a0a; transform: scale(1.04); }
        .shopci-badge-cat { display: none; }
        .shopci-fleche-mobile { display: none; }
        .shopci-btn-panier { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 8px 4px; border: 1.5px solid #f97316; border-radius: 9px; background: none; font-size: 12px; font-weight: 600; cursor: pointer; color: #f97316; transition: background .18s, color .18s; }
        .shopci-btn-acheter { flex: 1; padding: 8px 4px; border: 1.5px solid #f97316; border-radius: 9px; background: #f97316; font-size: 12px; font-weight: 700; cursor: pointer; color: #fff; transition: background .18s; }
        .shopci-btn-acheter:hover { background: #ea6a0a; border-color: #ea6a0a; }

        /* ── RECOMMANDATIONS ── */
        .shopci-reco { max-width: 1280px; margin: 0 auto 40px; padding: 0 20px; scroll-margin-top: 80px; }
        .reco-entete { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .reco-entete-gauche { display: flex; align-items: center; gap: 10px; }
        .reco-nav { display: flex; gap: 8px; }
        .reco-nav button { width: 36px; height: 36px; border: 1.5px solid #e5e7eb; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .18s; color: #555; }
        .reco-nav button:hover { border-color: #f97316; color: #f97316; background: #fff7ed; }
        .reco-piste { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none; }
        .reco-piste::-webkit-scrollbar { display: none; }
        .reco-gc { flex-shrink: 0 !important; width: 170px !important; }
        .reco-gc-img-zone { aspect-ratio: 4/5 !important; }
        .reco-gc .gc-glass { padding: 8px 10px 10px; gap: 4px; }
        .reco-gc .gc-titre { font-size: 11.5px; -webkit-line-clamp: 1; }
        .reco-gc .gc-prix { font-size: 12px; }
        .reco-gc .gc-prix-row { gap: 4px; }
        .reco-gc .gc-btn-acheter { padding: 4px 8px; font-size: 10px; flex-shrink: 0; }
        .reco-gc .gc-avatar { width: 22px; height: 22px; font-size: 9px; }
        .reco-gc .gc-vendeur-nom { font-size: 10px; }
        .reco-gc .gc-badge-pro { font-size: 8.5px; padding: 1px 5px; }
        .reco-gc .gc-fleche { width: 22px; height: 22px; }
        @media (max-width: 580px) { .reco-gc { width: 145px !important; } }

        /* ── NEWSLETTER ── */
        .shopci-newsletter { background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); margin: 0; padding: 0; position: relative; overflow: hidden; }
        .shopci-newsletter::before { content: ''; position: absolute; top: -100px; right: -100px; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%); pointer-events: none; }
        .newsletter-inner { max-width: 1280px; margin: 0 auto; padding: 60px 20px; display: flex; align-items: center; gap: 40px; flex-wrap: wrap; }
        .newsletter-gauche { flex: 1; min-width: 300px; position: relative; z-index: 1; }
        .newsletter-tag { display: inline-block; background: rgba(249,115,22,0.15); border: 1px solid rgba(249,115,22,0.3); color: #f97316; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; letter-spacing: .5px; margin-bottom: 14px; }
        .newsletter-titre { font-size: clamp(24px, 3vw, 36px); font-weight: 800; color: #fff; line-height: 1.2; margin-bottom: 12px; letter-spacing: -0.5px; }
        .newsletter-sous { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.6; margin-bottom: 24px; }
        .newsletter-form { display: flex; gap: 8px; max-width: 420px; }
        .newsletter-input { flex: 1; padding: 12px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.08); color: #fff; font-size: 14px; outline: none; transition: border-color .2s; }
        .newsletter-input::placeholder { color: rgba(255,255,255,0.35); }
        .newsletter-input:focus { border-color: #f97316; }
        .newsletter-btn { padding: 12px 24px; background: #f97316; color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; transition: background .2s; white-space: nowrap; }
        .newsletter-btn:hover { background: #ea6a0a; }
        .newsletter-droite { flex: 0 0 200px; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1; }
        .newsletter-deco { position: relative; }
        .deco-ico { color: rgba(249,115,22,0.4); position: relative; z-index: 2; }
        .deco-cercle-1 { position: absolute; inset: -24px; border-radius: 50%; border: 2px dashed rgba(249,115,22,0.2); animation: spinSlow 15s linear infinite; }
        .deco-cercle-2 { position: absolute; inset: -50px; border-radius: 50%; border: 1px dashed rgba(249,115,22,0.1); animation: spinSlow 25s linear infinite reverse; }
        @keyframes spinSlow { to { transform: rotate(360deg); } }

        /* ── FOOTER ── */
        .shopci-footer { background: #fff; border-top: 1px solid #f0f0f0; }
        .footer-inner { max-width: 1280px; margin: 0 auto; padding: 48px 20px 32px; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; flex-wrap: wrap; }
        .footer-col { display: flex; flex-direction: column; gap: 10px; }
        .footer-col-brand { gap: 14px; }
        .footer-desc { font-size: 13.5px; color: #6b7280; line-height: 1.6; }
        .footer-socials { display: flex; gap: 10px; }
        .social-lien { width: 36px; height: 36px; border: 1.5px solid #f0f0f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #555; text-decoration: none; transition: all .18s; }
        .social-lien:hover { border-color: #f97316; color: #f97316; background: #fff7ed; }
        .footer-contact { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
        .footer-contact span { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #6b7280; }
        .footer-titre-col { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #1a1a1a; margin-bottom: 4px; }
        .footer-col a { display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: #6b7280; text-decoration: none; transition: color .18s; }
        .footer-col a:hover { color: #f97316; }
        .footer-bas { border-top: 1px solid #f0f0f0; padding: 16px 20px; max-width: 1280px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
        .footer-bas p { font-size: 12.5px; color: #9ca3af; }
        .footer-bas-liens { display: flex; gap: 20px; }
        .footer-bas-liens a { font-size: 12.5px; color: #9ca3af; text-decoration: none; transition: color .18s; }
        .footer-bas-liens a:hover { color: #f97316; }

        /* ── SIDEBAR MOBILE ── */
        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; backdrop-filter: blur(2px); }
        .sidebar-mobile { position: fixed; top: 0; left: 0; height: 100%; width: 280px; background: #fff; z-index: 201; overflow-y: auto; box-shadow: 4px 0 24px rgba(0,0,0,0.12); display: flex; flex-direction: column; gap: 2px; }
        .sidebar-mobile-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 16px; border-bottom: 1px solid #f0f0f0; font-weight: 700; font-size: 16px; }
        .sidebar-mobile-header button { background: none; border: none; cursor: pointer; color: #555; padding: 4px; border-radius: 6px; }
        .sidebar-mobile .sidebar-item { padding: 12px 16px; font-size: 14px; }

        /* ── FAB CATÉGORIES MOBILE ── */
        .shopci-fab { display: none; position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #f97316; color: #fff; border: none; border-radius: 999px; padding: 12px 22px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 20px rgba(249,115,22,0.45); z-index: 50; align-items: center; gap: 8px; transition: background .2s, transform .15s; }
        .shopci-fab:hover { background: #ea6a0a; transform: translateX(-50%) translateY(-2px); }

        /* ── CARROUSEL 3D ── */
        .car3d-section { display: none; }
        .car3d-wrap { position: relative; height: 300px; width: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .car3d-scene { position: relative; width: 200px; height: 280px; perspective: 900px; transform-style: preserve-3d; }
        .car3d-carte { position: absolute; top: 0; left: 0; width: 200px; border-radius: 18px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.35); will-change: transform, opacity; background: transparent; }
        .car3d-img-zone { position: relative; width: 100%; aspect-ratio: 4/5; overflow: hidden; background: transparent; }
        .car3d-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .car3d-badge-new { position: absolute; top: 8px; right: 8px; background: #f97316; color: #fff; font-size: 9.5px; font-weight: 700; padding: 3px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px; z-index: 4; }
        .car3d-glass-info { position: absolute; bottom: 0; left: 0; right: 0; z-index: 3; padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 5px; }
        .car3d-glass-nom { font-size: 12.5px; font-weight: 700; color: #fff; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 4px rgba(0,0,0,0.6); }
        .car3d-glass-prix-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
        .car3d-glass-prix { font-size: 13px; font-weight: 800; color: #f97316; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
        .car3d-glass-prix small { font-size: 9px; font-weight: 500; color: rgba(255,255,255,0.5); }
        .car3d-glass-vendeur { display: flex; align-items: center; gap: 5px; font-size: 10.5px; color: rgba(255,255,255,0.7); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 90px; }
        .car3d-glass-avatar { width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(135deg, #f97316, #fb923c); color: #fff; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1.5px solid rgba(255,255,255,0.3); }
        .car3d-fleche { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.25); border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; color: #fff; transition: background .18s; }
        .car3d-fleche:hover { background: rgba(249,115,22,0.6); border-color: #f97316; }
        .car3d-fl-g { left: 4px; }
        .car3d-fl-d { right: 4px; }
        .car3d-dots { position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 10; }
        .car3d-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.35); border: none; cursor: pointer; padding: 0; transition: all .2s; }
        .car3d-dot-a { background: #f97316; width: 18px; border-radius: 3px; }
        .car3d-label { position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%); white-space: nowrap; font-size: 11.5px; color: #9ca3af; display: flex; align-items: center; gap: 5px; }
        .car3d-label strong { color: #555; }
        .car3d-voir { background: none; border: none; color: #f97316; font-size: 11.5px; font-weight: 700; cursor: pointer; padding: 0; margin-left: 4px; font-family: inherit; }
        .car3d-voir:hover { text-decoration: underline; }
        @media (max-width: 900px) {
          .car3d-wrap { height: auto; overflow: visible; }
          .car3d-scene { width: 100%; height: auto; perspective: none; display: flex; gap: 12px; overflow-x: auto; padding: 0 4px 8px; scrollbar-width: none; }
          .car3d-scene::-webkit-scrollbar { display: none; }
          .car3d-carte { position: relative; top: auto; left: auto; flex-shrink: 0; width: 150px; opacity: 1 !important; transform: none !important; }
          .car3d-fleche { display: none; }
          .car3d-dots { display: none; }
          .car3d-label { display: none; }
        }

        /* ── FILTRE PRIX SIDEBAR ── */
        .prix-filtre-zone { padding: 10px 10px; display: flex; flex-direction: column; gap: 10px; }
        .prix-range-labels { display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; }
        .dual-range-wrap { position: relative; height: 20px; width: 100%; margin: 4px 0; }
        .dual-range-wrap::before { content: ''; position: absolute; top: 50%; transform: translateY(-50%); left: 0; right: 0; height: 4px; background: #e5e7eb; border-radius: 4px; }
        .dual-range-track { position: absolute; top: 50%; transform: translateY(-50%); height: 4px; background: linear-gradient(to right, #f97316, #fb923c); border-radius: 4px; pointer-events: none; }
        .dual-slider { position: absolute; top: 0; left: 0; width: 100%; -webkit-appearance: none; appearance: none; height: 20px; background: transparent; pointer-events: none; outline: none; margin: 0; }
        .dual-slider::-webkit-slider-thumb { -webkit-appearance: none; pointer-events: all; width: 20px; height: 20px; border-radius: 50%; background: #f97316; cursor: pointer; border: 3px solid #fff; box-shadow: 0 0 0 2px #f97316, 0 2px 6px rgba(249,115,22,0.4); transition: transform .15s; }
        .dual-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .dual-slider::-moz-range-thumb { pointer-events: all; width: 20px; height: 20px; border-radius: 50%; background: #f97316; cursor: pointer; border: 3px solid #fff; box-shadow: 0 0 0 2px #f97316; }
        .prix-appliquer-btn { display: flex; align-items: center; justify-content: center; gap: 6px; background: #f97316; color: #fff; border: none; border-radius: 8px; padding: 7px 12px; font-size: 12px; font-weight: 700; cursor: pointer; transition: background .18s; }
        .prix-appliquer-btn:hover { background: #ea6a0a; }

        /* ── TRI SELECT ── */
        .tri-select { border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 5px 10px; font-size: 12px; font-weight: 600; color: #555; background: #fff; cursor: pointer; outline: none; transition: border-color .18s; }
        .tri-select:focus { border-color: #f97316; }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) { .shopci-grille { grid-template-columns: repeat(2, 1fr); } .footer-inner { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 900px) {
          .nav-liens { display: none; }
          .nav-search { display: none; }
          .nav-btn-connexion, .nav-btn-inscription { display: none; }
          .nav-burger { display: flex; }
          .shopci-main { grid-template-columns: 1fr; }
          .shopci-sidebar { display: none; }
          .shopci-cats-barre { display: block; }
          .shopci-fab { display: none; }
          .gc-fleche { display: flex; }
        }
        @media (max-width: 580px) {
          .shopci-grille { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .footer-inner { grid-template-columns: 1fr; }
          .newsletter-inner { padding: 40px 16px; }
          .newsletter-droite { display: none; }
          .gc-titre { font-size: 12px; }
          .gc-prix { font-size: 13px; }
        }
      `}</style>
    </div>
  );
}