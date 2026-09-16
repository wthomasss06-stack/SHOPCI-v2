'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Target,
  Truck,
} from 'lucide-react';

const metrics = [
  { value: '10k+', label: 'produits disponibles' },
  { value: '24h', label: 'livraison express' },
  { value: '4.9/5', label: 'note clients' },
  { value: '80%', label: 'retours récurrents' },
];

const benefits = [
  {
    icon: Truck,
    title: 'Livraison rapide',
    text: 'Suivi simple, délais clairs et prise en charge fiable à travers la Côte d’Ivoire.',
  },
  {
    icon: ShieldCheck,
    title: 'Paiement sécurisé',
    text: 'Transactions protégées avec une expérience de commande rassurante pour chaque client.',
  },
  {
    icon: Store,
    title: 'Vendeurs qualifiés',
    text: 'Une marketplace pensée pour les détaillants sérieux et les marques locales.',
  },
];

const categories = [
  'Électroménager',
  'Smartphones',
  'Mode',
  'Maison',
  'Beauté',
  'Sport',
  'Enfants',
  'Accessoires',
];

const steps = [
  'Choisissez votre catégorie ou recherchez un produit.',
  'Comparez les offres, prix, avis et qualité.',
  'Commandez en quelques clics et recevez votre colis.',
];

export default function LandingPageClient() {
  return (
    <main className="shopci-landing-page">
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-badge">
            <Sparkles size={14} />
            Marketplace ivoirienne n°1
          </div>

          <h1>Les meilleurs produits, livrés simplement.</h1>

          <p className="landing-subtitle">
            ShopCI réunit les meilleures offres du quotidien, les marques locales et les vendeurs fiables
            dans une plateforme pensée pour la conversion, la confiance et la simplicité.
          </p>

          <div className="landing-cta-row">
            <Link href="/shop" className="landing-primary-btn">
              Explorer la boutique
              <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="landing-secondary-btn">
              Vendre sur ShopCI
            </Link>
          </div>

          <ul className="landing-trust-list">
            {['Livraison dans les meilleurs délais', 'Paiement sécurisé', 'Vendeurs vérifiés'].map((item) => (
              <li key={item}>
                <CheckCircle2 size={16} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="landing-hero-panel">
          <div className="panel-card highlight-card">
            <div className="panel-topline">
              <span className="mini-dot" />
              ShopCI live
            </div>
            <div className="panel-product">
              <div className="panel-product-image" />
              <div>
                <p className="eyebrow">Produit vedette</p>
                <h3>AirPods Pro Max</h3>
                <div className="product-meta">
                  <span>4.9 ★</span>
                  <strong>145 000 FCFA</strong>
                </div>
              </div>
            </div>
            <div className="panel-stats">
              <div>
                <span>Commandes</span>
                <strong>1.2k</strong>
              </div>
              <div>
                <span>Confiance</span>
                <strong>98%</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-metrics" aria-label="Chiffres clés ShopCI">
        {metrics.map((metric) => (
          <div key={metric.label} className="metric-box">
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </section>

      <section className="landing-features">
        <div className="section-heading">
          <p className="section-kicker">Pourquoi ShopCI</p>
          <h2>Une expérience shopping pensée pour convertir.</h2>
        </div>

        <div className="feature-grid">
          {benefits.map(({ icon: Icon, title, text }) => (
            <article key={title} className="feature-card">
              <div className="feature-icon">
                <Icon size={22} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-process">
        <div className="section-heading left">
          <p className="section-kicker">Comment ça marche</p>
          <h2>Commandez en 3 étapes simples.</h2>
        </div>

        <div className="steps-grid">
          {steps.map((step, index) => (
            <div key={step} className="step-card">
              <span className="step-index">0{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-categories">
        <div className="section-heading">
          <p className="section-kicker">Catalogue</p>
          <h2>Un large choix de catégories populaires.</h2>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <div key={category} className="category-pill">{category}</div>
          ))}
        </div>
      </section>

      <section className="landing-cta-band">
        <div>
          <p className="section-kicker">Prêt à commander ?</p>
          <h2>Découvrez tout ce que ShopCI a à offrir.</h2>
        </div>
        <Link href="/shop" className="landing-primary-btn large">
          Voir le catalogue
          <ArrowRight size={18} />
        </Link>
      </section>

      <section className="landing-proof">
        <div className="review-box">
          <div className="stars">
            {[...Array(5)].map((_, index) => (
              <Star key={index} size={16} fill="currentColor" />
            ))}
          </div>
          <p>
            “Très bon service, livraison rapide et paiement simple. J’achète ici régulièrement pour ma maison.”
          </p>
          <strong>— Élodie, client ShopCI</strong>
        </div>

        <div className="proof-card">
          <Target size={22} />
          <div>
            <strong>Conversion orientée</strong>
            <p>Une interface simple, claire et orientée action pour attirer et convertir.</p>
          </div>
        </div>
      </section>

      <style>{`
        .shopci-landing-page {
          background: linear-gradient(180deg, #fffaf5 0%, #ffffff 32%, #fff7ed 100%);
          color: #111827;
          min-height: 100vh;
        }

        .landing-hero {
          max-width: 1200px;
          margin: 0 auto;
          padding: 72px 20px 32px;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 32px;
          align-items: center;
        }

        .landing-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(249,115,22,0.12);
          color: #c2410c;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .landing-hero h1 {
          margin-top: 18px;
          font-size: clamp(2.8rem, 5vw, 5rem);
          line-height: 1.05;
          letter-spacing: -0.06em;
          font-weight: 900;
          color: #111827;
        }

        .landing-subtitle {
          max-width: 620px;
          margin-top: 18px;
          font-size: 1.08rem;
          line-height: 1.7;
          color: #4b5563;
        }

        .landing-cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 28px;
        }

        .landing-primary-btn,
        .landing-secondary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 14px;
          padding: 15px 22px;
          text-decoration: none;
          font-weight: 700;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .landing-primary-btn {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
          box-shadow: 0 12px 28px rgba(249,115,22,0.22);
        }

        .landing-primary-btn.large {
          padding: 16px 26px;
        }

        .landing-secondary-btn {
          background: white;
          color: #111827;
          border: 1px solid rgba(17,24,39,0.08);
        }

        .landing-primary-btn:hover,
        .landing-secondary-btn:hover {
          transform: translateY(-1px);
        }

        .landing-trust-list {
          margin-top: 28px;
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 18px 26px;
          padding: 0;
          color: #374151;
          font-weight: 600;
        }

        .landing-trust-list li {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .landing-trust-list svg {
          color: #f97316;
        }

        .landing-hero-panel {
          display: flex;
          justify-content: center;
        }

        .panel-card {
          width: min(100%, 440px);
          background: rgba(17,24,39,0.97);
          color: white;
          border-radius: 28px;
          padding: 26px;
          box-shadow: 0 30px 60px rgba(17,24,39,0.22);
        }

        .panel-topline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #fbbf24;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .mini-dot {
          display: inline-block;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 6px rgba(34,197,94,0.15);
        }

        .panel-product {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-top: 20px;
          padding: 18px;
          border-radius: 20px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .panel-product-image {
          width: 110px;
          height: 110px;
          border-radius: 20px;
          background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
          position: relative;
          overflow: hidden;
        }

        .panel-product-image::before {
          content: "";
          position: absolute;
          inset: 18px 20px 18px 20px;
          border-radius: 14px;
          background: rgba(255,255,255,0.22);
        }

        .eyebrow {
          color: #cbd5e1;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }

        .panel-product h3 {
          font-size: 1.55rem;
          margin: 0;
        }

        .product-meta {
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #f9fafb;
        }

        .product-meta span {
          color: #fcd34d;
          font-weight: 700;
        }

        .product-meta strong {
          font-size: 0.98rem;
        }

        .panel-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 18px;
        }

        .panel-stats div {
          padding: 16px 18px;
          border-radius: 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .panel-stats span {
          display: block;
          color: #cbd5e1;
          font-size: 12px;
          margin-bottom: 5px;
        }

        .panel-stats strong {
          font-size: 1.6rem;
          letter-spacing: -0.04em;
        }

        .landing-metrics,
        .feature-grid,
        .steps-grid,
        .category-grid,
        .landing-proof {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .landing-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
          margin-top: 14px;
          margin-bottom: 28px;
        }

        .metric-box {
          background: white;
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: 20px;
          padding: 22px 18px;
          text-align: center;
          box-shadow: 0 14px 35px rgba(15, 23, 42, 0.04);
        }

        .metric-box strong {
          display: block;
          font-size: clamp(1.7rem, 2vw, 2.2rem);
          letter-spacing: -0.06em;
          color: #111827;
        }

        .metric-box span {
          display: block;
          margin-top: 6px;
          color: #6b7280;
          font-size: 0.96rem;
        }

        .landing-features,
        .landing-process,
        .landing-categories,
        .landing-cta-band,
        .landing-proof {
          max-width: 1200px;
          margin: 0 auto;
          padding: 52px 20px 0;
        }

        .section-heading {
          text-align: center;
          margin-bottom: 28px;
        }

        .section-heading.left {
          text-align: left;
        }

        .section-kicker {
          margin: 0 0 10px;
          color: #f97316;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .section-heading h2 {
          font-size: clamp(2rem, 3vw, 3rem);
          line-height: 1.1;
          letter-spacing: -0.05em;
          color: #111827;
          margin: 0;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
        }

        .feature-card {
          background: rgba(255,255,255,0.8);
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: 22px;
          padding: 24px;
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.04);
        }

        .feature-icon {
          width: 52px;
          height: 52px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
          color: #f97316;
          margin-bottom: 18px;
        }

        .feature-card h3 {
          font-size: 1.35rem;
          margin: 0 0 10px;
        }

        .feature-card p {
          margin: 0;
          color: #6b7280;
          line-height: 1.7;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
        }

        .step-card {
          background: linear-gradient(180deg, #ffffff 0%, #fff7ed 100%);
          border: 1px solid rgba(249,115,22,0.12);
          border-radius: 20px;
          padding: 24px;
        }

        .step-index {
          display: inline-block;
          margin-bottom: 14px;
          font-size: 12px;
          color: #f97316;
          font-weight: 800;
          letter-spacing: 0.09em;
        }

        .step-card p {
          margin: 0;
          color: #374151;
          line-height: 1.7;
          font-weight: 600;
        }

        .category-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;
        }

        .category-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 18px;
          border-radius: 999px;
          background: white;
          border: 1px solid rgba(15, 23, 42, 0.08);
          color: #374151;
          font-weight: 600;
        }

        .landing-cta-band {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding-top: 52px;
          padding-bottom: 12px;
        }

        .landing-cta-band h2 {
          margin: 0;
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          letter-spacing: -0.05em;
          color: #111827;
        }

        .landing-proof {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 22px;
          padding-bottom: 80px;
        }

        .review-box,
        .proof-card {
          background: white;
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.04);
        }

        .stars {
          display: flex;
          gap: 6px;
          color: #f59e0b;
          margin-bottom: 14px;
        }

        .review-box p {
          margin: 0 0 14px;
          color: #374151;
          line-height: 1.7;
          font-size: 1.05rem;
        }

        .review-box strong {
          color: #111827;
        }

        .proof-card {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          background: linear-gradient(180deg, #fff7ed 0%, #ffffff 100%);
        }

        .proof-card svg {
          color: #f97316;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .proof-card strong {
          display: block;
          margin-bottom: 8px;
          font-size: 1.1rem;
        }

        .proof-card p {
          margin: 0;
          color: #4b5563;
          line-height: 1.7;
        }

        @media (max-width: 900px) {
          .landing-hero,
          .landing-proof,
          .landing-cta-band {
            grid-template-columns: 1fr;
            display: grid;
          }

          .landing-metrics,
          .feature-grid,
          .steps-grid {
            grid-template-columns: 1fr 1fr;
          }

          .landing-cta-band {
            display: grid;
            align-items: start;
          }
        }

        @media (max-width: 640px) {
          .landing-hero {
            padding-top: 52px;
          }

          .landing-metrics,
          .feature-grid,
          .steps-grid,
          .landing-proof {
            grid-template-columns: 1fr;
          }

          .landing-cta-row {
            flex-direction: column;
            align-items: stretch;
          }

          .landing-primary-btn,
          .landing-secondary-btn {
            width: 100%;
          }

          .panel-card {
            padding: 22px 18px;
          }
        }
      `}</style>
    </main>
  );
}
