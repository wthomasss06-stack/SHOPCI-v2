'use client';

// ecommerce-frontend/src/pages/HelpPage.jsx
// ✅ Centre d'Aide ShopCI — UX/UI Premium — Inspiré TerraSafe

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  HelpCircle, ShoppingBag, MapPin, Truck, CreditCard,
  User, RotateCcw, Shield, ChevronDown, ChevronRight,
  Search, Package, Navigation, Star, Phone, Mail,
  MessageCircle, AlertTriangle, CheckCircle, Clock,
  ArrowRight, Zap, Lock, Smartphone, Camera, Award,
  Home, X, Menu, ExternalLink
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/* ══════════════════════════════════════════════════════════
   PARTICLES CANVAS (identique au Footer)
══════════════════════════════════════════════════════════ */
function ParticlesCanvas({ count = 35 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const setSize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width  = rect?.width  || window.innerWidth;
      canvas.height = rect?.height || 400;
    };
    setSize();
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * (canvas.width || 800),
      y: Math.random() * (canvas.height || 400),
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.4, dy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.3 + 0.15,
      pulse: Math.random() * Math.PI * 2,
    }));
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const cr = 249, cg = 115, cb = 22;
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy; p.pulse += 0.016;
        if (p.x < 0 || p.x > W) p.dx *= -1;
        if (p.y < 0 || p.y > H) p.dy *= -1;
        const a = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},${a})`);
        grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${Math.min(a + 0.2, 0.9)})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener('resize', setSize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', setSize); };
  }, [count]);
  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', top: 0, left: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 1, display: 'block',
    }}/>
  );
}

/* ══════════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════════ */

const QUICK_LINKS = [
  { id: 'commandes',  icon: ShoppingBag,  label: 'Commandes'        },
  { id: 'suivi',      icon: Navigation,   label: 'Suivi GPS'        },
  { id: 'livraison',  icon: Truck,        label: 'Livraison'        },
  { id: 'paiement',   icon: CreditCard,   label: 'Paiement'         },
  { id: 'vendeur',    icon: Package,      label: 'Espace Vendeur'   },
  { id: 'compte',     icon: User,         label: 'Mon Compte'       },
  { id: 'retours',    icon: RotateCcw,    label: 'Retours'          },
  { id: 'securite',   icon: Shield,       label: 'Sécurité'         },
];

const GUIDE_STEPS = [
  {
    id: 'commander',
    title: 'Passer une commande',
    icon: ShoppingBag,
    color: '#f97316',
    steps: [
      { n: 1, title: 'Rechercher un produit',        body: 'Utilisez la barre de recherche ou parcourez les catégories. Filtrez par prix, localisation ou catégorie pour affiner les résultats.' },
      { n: 2, title: 'Consulter la fiche produit',   body: 'Vérifiez les photos, la description, le stock disponible et les avis. Vous pouvez contacter le vendeur directement depuis la fiche.' },
      { n: 3, title: 'Ajouter au panier',             body: 'Cliquez sur "Ajouter au panier". Vous pouvez continuer vos achats et revenir à votre panier à tout moment.' },
      { n: 4, title: 'Renseigner votre adresse',      body: 'À la livraison, saisissez votre adresse complète avec des repères clairs : quartier, commune, et un point de repère connu (ex : face au marché X).' },
      { n: 5, title: 'Choisir le paiement',           body: 'Sélectionnez votre mode de paiement : à la livraison (cash) ou mobile money (Orange Money, MTN, Wave, Moov — bientôt disponibles).' },
      { n: 6, title: 'Confirmer la commande',         body: 'Vérifiez le récapitulatif et cliquez "Confirmer". Vous recevrez immédiatement votre numéro de commande et pourrez suivre sa progression.' },
    ],
  },
  {
    id: 'suivi-gps',
    title: 'Suivre une livraison GPS',
    icon: Navigation,
    color: '#3b82f6',
    steps: [
      { n: 1, title: 'Accéder au suivi',              body: 'Depuis "Mes commandes", cliquez sur "Suivre ma livraison" dès que le statut passe à "En cours" ou "Expédié".' },
      { n: 2, title: 'Carte interactive en direct',   body: 'La carte Leaflet affiche votre adresse de livraison (marqueur orange) et la position du livreur (marqueur bleu) en temps réel.' },
      { n: 3, title: 'Itinéraire OSRM',               body: 'Un itinéraire calculé sur les vraies routes s\'affiche entre le livreur et votre adresse. La durée estimée et la distance sont indiquées.' },
      { n: 4, title: 'Géolocalisation',               body: 'Votre adresse est automatiquement géocodée sur la carte de Côte d\'Ivoire. Pour une meilleure précision, précisez un repère (commune, quartier).' },
      { n: 5, title: 'Mise à jour automatique',        body: 'La carte se rafraîchit toutes les 8 secondes. Le bouton "Rafraîchir" permet une mise à jour manuelle instantanée.' },
      { n: 6, title: 'Confirmation de livraison',     body: 'Quand le livreur confirme son arrivée, vous recevez une notification. Confirmez la réception et laissez un avis pour finaliser.' },
    ],
  },
  {
    id: 'guide-vendeur',
    title: 'Vendre sur ShopCI',
    icon: Package,
    color: '#8b5cf6',
    steps: [
      { n: 1, title: 'Créer un compte vendeur',       body: 'Inscrivez-vous avec le type "Vendeur". Renseignez vos coordonnées complètes : numéro de téléphone (+225) et adresse vérifiable.' },
      { n: 2, title: 'Publier un produit',             body: 'Depuis votre tableau de bord, cliquez "Nouveau produit". Ajoutez des photos nettes, une description précise, le prix en FCFA et le stock disponible.' },
      { n: 3, title: 'Gérer les commandes',            body: 'Chaque nouvelle commande apparaît dans votre espace vendeur avec les détails de l\'acheteur, l\'adresse de livraison et le montant.' },
      { n: 4, title: 'Préparer le colis',              body: 'Emballez soigneusement le produit. Prenez une photo du colis avec le bouton "Photo colis" pour rassurer l\'acheteur.' },
      { n: 5, title: 'Activer le GPS',                 body: 'Lors de la livraison, activez le GPS dans l\'interface VendorDelivery. Votre position est partagée en temps réel avec l\'acheteur.' },
      { n: 6, title: 'Confirmer la livraison',         body: 'À l\'arrivée, cliquez "Je suis arrivé — Notifier l\'acheteur". L\'acheteur valide la réception, le paiement est libéré.' },
    ],
  },
  {
    id: 'retour-remboursement',
    title: 'Retour & Remboursement',
    icon: RotateCcw,
    color: '#16a34a',
    steps: [
      { n: 1, title: 'Inspecter à la réception',      body: 'Vérifiez le produit avant de confirmer la livraison. En cas de problème visible (emballage abîmé, produit endommagé), cliquez "Problème" au lieu de confirmer.' },
      { n: 2, title: 'Faire une demande de retour',   body: 'Depuis "Mes commandes", sélectionnez la commande concernée. Le délai de retour est de 7 jours après confirmation de livraison.' },
      { n: 3, title: 'Joindre des photos',             body: 'Photographiez le produit défectueux ou non conforme. Des preuves visuelles claires accélèrent le traitement de votre demande.' },
      { n: 4, title: 'Attendre la réponse vendeur',   body: 'Le vendeur a 48h pour accepter ou contester le retour. Vous êtes notifié de sa décision dans votre espace.' },
      { n: 5, title: 'Retour du produit',              body: 'Si accepté, le vendeur organise la reprise du produit. Conservez l\'emballage d\'origine pour faciliter le retour.' },
      { n: 6, title: 'Remboursement',                  body: 'Le remboursement est traité sous 3 à 5 jours ouvrables après réception du produit retourné. Il s\'effectue via le même canal que le paiement initial.' },
    ],
  },
];

const FAQ_SECTIONS = [
  {
    id: 'commandes',
    label: 'Commandes',
    icon: ShoppingBag,
    color: '#f97316',
    questions: [
      { q: 'Comment passer ma première commande ?', a: 'Parcourez les produits sur la page d\'accueil ou via la barre de recherche. Ajoutez l\'article au panier, accédez au checkout, renseignez votre adresse de livraison avec des repères précis (quartier, commune), choisissez le paiement à la livraison, puis confirmez. Vous recevez immédiatement votre numéro de commande.' },
      { q: 'Puis-je modifier une commande après confirmation ?', a: 'Une commande confirmée ne peut plus être modifiée directement. Si elle est encore au statut "En attente", vous pouvez l\'annuler depuis "Mes commandes" et repasser une nouvelle commande. Passé le statut "En cours de préparation", l\'annulation n\'est plus possible.' },
      { q: 'Comment annuler une commande ?', a: 'Accédez à "Mes commandes", ouvrez la commande concernée et cliquez "Annuler". Cette action est disponible uniquement pour les statuts "En attente" et "En cours". Une fois expédiée, la commande ne peut plus être annulée — suivez la procédure de retour.' },
      { q: 'Où voir l\'historique de mes commandes ?', a: 'Dans "Mes commandes" accessible depuis le menu principal ou votre profil. Vous pouvez filtrer par statut (en cours, livrées, annulées) et rechercher par numéro de commande ou nom de produit.' },
      { q: 'Que signifient les différents statuts ?', a: 'En attente : commande reçue, vendeur pas encore notifié. En cours : vendeur prépare le colis. Expédié : livreur en route vers vous. Livré : livraison confirmée. Annulé : commande annulée par vous ou le vendeur.' },
      { q: 'Comment contacter un vendeur ?', a: 'Depuis la fiche produit, cliquez sur le profil du vendeur pour accéder à ses coordonnées. Vous pouvez aussi envoyer un message depuis votre commande active. Le numéro de téléphone (+225) est généralement disponible sur la fiche boutique.' },
    ],
  },
  {
    id: 'suivi',
    label: 'Suivi GPS',
    icon: Navigation,
    color: '#3b82f6',
    questions: [
      { q: 'Comment fonctionne le suivi GPS en temps réel ?', a: 'Dès que votre commande passe au statut "Expédié", un bouton "Suivre ma livraison" apparaît. Il ouvre une carte interactive Leaflet qui affiche votre adresse (marqueur orange) et la position du livreur (marqueur bleu moto). La carte se met à jour toutes les 8 secondes via l\'API ShopCI.' },
      { q: 'Le suivi GPS est toujours disponible ?', a: 'Le suivi GPS est disponible uniquement quand le livreur active sa géolocalisation. Si la position n\'apparaît pas, le livreur n\'a pas encore démarré le partage ou se trouve en zone de signal faible. Utilisez le bouton "Rafraîchir" pour forcer une mise à jour.' },
      { q: 'L\'itinéraire affiché est-il précis ?', a: 'L\'itinéraire est calculé via OSRM sur les vraies routes d\'Abidjan et de Côte d\'Ivoire. La durée et la distance estimées sont recalculées automatiquement à chaque mise à jour GPS. En zone dense (Adjamé, Treichville), les embouteillages peuvent affecter la durée réelle.' },
      { q: 'Que faire si je ne vois pas le livreur sur la carte ?', a: 'Cliquez "Rafraîchir" en haut de la page de suivi. Si après 2–3 minutes le livreur n\'apparaît toujours pas et que le statut est "Expédié", appelez directement le vendeur dont le numéro figure dans les détails de commande.' },
      { q: 'Comment partager mon lien de suivi ?', a: 'Copiez l\'URL de la page de suivi depuis votre navigateur (ex : shopci.ci/orders/123/tracking). Ce lien est accessible uniquement aux utilisateurs connectés ayant accès à cette commande.' },
    ],
  },
  {
    id: 'livraison',
    label: 'Livraison',
    icon: Truck,
    color: '#8b5cf6',
    questions: [
      { q: 'Quelles zones sont couvertes par la livraison ?', a: 'ShopCI couvre tout le Grand Abidjan (Cocody, Plateau, Marcory, Treichville, Yopougon, Abobo, Adjamé, Koumassi, Port-Bouët, Bingerville, Anyama) et les principales villes de l\'intérieur : Bouaké, Yamoussoukro, San-Pédro, Abengourou, Korhogo, Daloa. Les délais varient selon la distance.' },
      { q: 'Combien coûte la livraison ?', a: 'La livraison est fixée à 2 000 FCFA pour tout le Grand Abidjan. Pour les villes de l\'intérieur, le tarif est calculé selon la distance et affiché au moment du checkout avant confirmation. Ce montant s\'ajoute au total de vos articles.' },
      { q: 'Quels sont les délais de livraison ?', a: 'Abidjan : 24 à 48h après confirmation du vendeur. Villes proches (Bingerville, Anyama) : 24 à 72h. Villes de l\'intérieur : 2 à 5 jours ouvrables. Ces délais peuvent varier en période de forte activité ou lors des fêtes.' },
      { q: 'Que faire si le livreur ne trouve pas mon adresse ?', a: 'Précisez toujours un repère connu dans votre adresse (ex : "Cocody Angré, face à la pharmacie Saint-Joseph, derrière la station Total"). Si le livreur vous appelle, guidez-le en temps réel. En cas de non-livraison, une tentative supplémentaire est programmée sous 24h.' },
      { q: 'Que se passe-t-il si je suis absent à la livraison ?', a: 'Le livreur vous appellera au numéro renseigné dans votre commande. Si vous êtes injoignable, il reviendra sous 24h. Après 2 tentatives infructueuses, la commande sera retournée au vendeur et un remboursement sera traité.' },
    ],
  },
  {
    id: 'paiement',
    label: 'Paiement',
    icon: CreditCard,
    color: '#f59e0b',
    questions: [
      { q: 'Quels modes de paiement sont acceptés ?', a: 'Actuellement, le paiement est uniquement disponible à la livraison en espèces (cash). Les paiements mobiles — Orange Money, MTN Mobile Money, Wave et Moov Money — sont en cours d\'intégration et seront disponibles très prochainement.' },
      { q: 'Le paiement à la livraison est-il sécurisé ?', a: 'Oui. Le système d\'escrow ShopCI retient le paiement jusqu\'à confirmation de livraison par l\'acheteur. Le vendeur n\'est payé qu\'après validation de réception. Cette protection vous couvre contre les non-livraisons et les articles non conformes.' },
      { q: 'Quand seront disponibles Orange Money et MTN ?', a: 'L\'intégration des paiements mobiles (Orange Money, MTN, Wave, Moov) est en cours de développement. Ces options apparaîtront directement dans le checkout dès leur activation. Suivez les mises à jour ShopCI sur nos réseaux sociaux.' },
      { q: 'Que faire si le livreur demande un paiement avant livraison ?', a: 'ShopCI pratique exclusivement le paiement à la réception. Ne payez jamais à l\'avance ou par virement externe à la plateforme. Si un livreur exige un paiement anticipé, refusez et signalez-le immédiatement via le bouton d\'assistance dans votre commande.' },
      { q: 'Comment fonctionnent les codes promo ?', a: 'Saisissez votre code promo dans le champ dédié au moment du checkout, avant de confirmer la commande. La réduction s\'applique automatiquement sur le sous-total (hors frais de livraison). Un code promo ne peut être utilisé qu\'une seule fois par compte.' },
    ],
  },
  {
    id: 'vendeur',
    label: 'Espace Vendeur',
    icon: Package,
    color: '#ec4899',
    questions: [
      { q: 'Comment créer un compte vendeur ?', a: 'Lors de l\'inscription, choisissez "Vendeur" comme type de compte. Renseignez vos informations complètes (nom, téléphone +225, adresse). Une fois connecté, vous accédez à votre tableau de bord vendeur avec toutes les fonctionnalités de gestion.' },
      { q: 'Comment ajouter un produit ?', a: 'Dans votre tableau de bord, cliquez "Nouveau produit". Renseignez le nom, la description, le prix en FCFA, le stock disponible et la catégorie. Ajoutez des photos nettes (fond uni recommandé). Le produit est visible immédiatement après validation.' },
      { q: 'Comment fonctionne le GPS lors des livraisons ?', a: 'Dans l\'interface "Gestion des livraisons", sélectionnez une commande et cliquez "Démarrer GPS". Votre position est partagée en temps réel avec l\'acheteur. Un itinéraire OSRM vers l\'adresse de livraison s\'affiche sur votre carte. Désactivez le GPS après livraison.' },
      { q: 'Quand suis-je payé pour mes ventes ?', a: 'Le paiement (cash) est collecté directement lors de la livraison. ShopCI facilite la mise en relation mais ne collecte pas les paiements actuellement. Avec l\'arrivée des paiements mobiles, les fonds seront virés sous 24-48h après confirmation de réception par l\'acheteur.' },
      { q: 'Comment améliorer la visibilité de mes produits ?', a: 'Utilisez des photos de haute qualité sur fond neutre. Rédigez des descriptions précises avec les caractéristiques techniques (dimensions, matière, couleur). Fixez des prix compétitifs par rapport aux produits similaires. Maintenez votre stock à jour pour éviter les commandes annulées.' },
      { q: 'Comment gérer un litige avec un acheteur ?', a: 'Si un acheteur signale un problème, vous serez notifié dans votre tableau de bord. Répondez sous 48h avec votre version des faits et des preuves (photos, tracking). Le service ShopCI arbitre les litiges de manière impartiale. En cas de produit défectueux avéré, un retour sera organisé.' },
    ],
  },
  {
    id: 'compte',
    label: 'Mon Compte',
    icon: User,
    color: '#06b6d4',
    questions: [
      { q: 'Comment créer un compte ShopCI ?', a: 'Cliquez "S\'inscrire" sur la page de connexion. Choisissez votre type (Acheteur ou Vendeur), renseignez votre nom, email, numéro de téléphone (+225) et un mot de passe sécurisé. Votre compte est actif immédiatement.' },
      { q: 'Comment récupérer mon mot de passe oublié ?', a: 'Sur la page de connexion, cliquez "Mot de passe oublié". Entrez votre email enregistré. Vous recevrez un lien de réinitialisation par email. Si vous n\'avez plus accès à cet email, contactez le support avec votre numéro de téléphone pour vérification.' },
      { q: 'Comment modifier mon adresse de livraison ?', a: 'Allez dans "Mon profil" > "Modifier le profil". Vous pouvez mettre à jour votre adresse principale. Pour chaque commande, vous pouvez saisir une adresse différente directement au moment du checkout.' },
      { q: 'Comment gérer mes produits favoris ?', a: 'Cliquez l\'icône cœur sur n\'importe quelle fiche produit pour l\'ajouter à vos favoris. Retrouvez-les depuis "Mon profil" > "Mes favoris". Les favoris sont sauvegardés dans votre compte et accessibles sur tous vos appareils.' },
      { q: 'Comment contacter le vendeur d\'une commande ?', a: 'Depuis votre commande active, les coordonnées du vendeur (numéro de téléphone) sont disponibles. Pour les questions avant achat, consultez la fiche produit qui affiche le profil et les informations de contact du vendeur.' },
    ],
  },
  {
    id: 'retours',
    label: 'Retours',
    icon: RotateCcw,
    color: '#16a34a',
    questions: [
      { q: 'Quelle est la politique de retour ?', a: 'Vous disposez de 7 jours après confirmation de livraison pour signaler un problème et demander un retour. Les articles doivent être dans leur état d\'origine, non utilisés et dans leur emballage. Les produits alimentaires, cosmétiques ouverts et articles personnalisés ne sont pas retournables.' },
      { q: 'Comment initier un retour ?', a: 'Dans "Mes commandes", sélectionnez la commande concernée et cliquez "Retourner un article". Décrivez le problème précisément, joignez des photos du produit et de l\'emballage. Votre demande est transmise au vendeur qui doit répondre sous 48h.' },
      { q: 'Combien de temps prend le remboursement ?', a: 'Une fois le retour accepté par le vendeur et le produit récupéré, le remboursement est traité sous 3 à 5 jours ouvrables. Pour les paiements cash à la livraison, le remboursement s\'effectue via le canal mobile money que vous aurez indiqué (ou à un point de retrait ShopCI).' },
      { q: 'Que faire si le produit reçu est endommagé ou non conforme ?', a: 'Photographiez immédiatement le produit endommagé et l\'emballage avant de confirmer la livraison. Si déjà confirmée, contactez le support sous 24h avec vos photos. Un produit non conforme à la description est éligible au retour sans frais, les frais étant à la charge du vendeur.' },
    ],
  },
  {
    id: 'securite',
    label: 'Sécurité',
    icon: Shield,
    color: '#dc2626',
    questions: [
      { q: 'Comment mes données personnelles sont-elles protégées ?', a: 'ShopCI respecte la réglementation ivoirienne sur la protection des données (ARTCI). Vos informations (nom, téléphone, adresse) sont chiffrées et ne sont partagées avec les vendeurs que pour les commandes actives. Nous ne vendons jamais vos données à des tiers.' },
      { q: 'Comment signaler un vendeur frauduleux ?', a: 'Depuis la fiche produit ou votre commande, cliquez "Signaler" et décrivez le problème. Notre équipe traite les signalements sous 24h. En cas de fraude avérée, le compte est suspendu et les acheteurs lésés sont remboursés. Vous pouvez aussi nous contacter au +225 01 42 50 77 50.' },
      { q: 'Comment activer la double authentification ?', a: 'Dans "Mon profil" > "Sécurité", activez la vérification en deux étapes. Lors de chaque connexion depuis un nouvel appareil, un code SMS sera envoyé à votre numéro (+225). Cette protection empêche l\'accès non autorisé même si votre mot de passe est compromis.' },
      { q: 'Que faire si je soupçonne une activité suspecte sur mon compte ?', a: 'Changez immédiatement votre mot de passe depuis "Mon profil" > "Sécurité". Vérifiez vos commandes récentes pour détecter toute activité inconnue. Contactez le support ShopCI au +225 01 42 50 77 50. Nous bloquerons votre compte temporairement pour investigation et vous aiderons à le sécuriser.' },
    ],
  },
];

/* ══════════════════════════════════════════════════════════
   COMPOSANTS
══════════════════════════════════════════════════════════ */

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: open ? 'rgba(249,115,22,.05)' : 'var(--bg3)',
      border: `1.5px solid ${open ? 'rgba(249,115,22,.35)' : 'var(--border)'}`,
      borderRadius: 14,
      overflow: 'hidden',
      transition: 'all .2s',
      marginBottom: 8,
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          padding: '16px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.5, flex: 1 }}>{q}</span>
        <ChevronDown size={18} color="#f97316" style={{ flexShrink: 0, marginTop: 2, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} />
      </button>
      {open && (
        <div style={{ padding: '0 20px 18px', animation: 'fadeDown .2s ease' }}>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8, margin: 0 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

function GuideStep({ step, color }) {
  return (
    <div style={{
      display: 'flex',
      gap: 16,
      padding: '18px 20px',
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform .2s, box-shadow .2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, ${color}, ${color}88)` }} />
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: color,
        color: '#fff',
        fontFamily: "'DM Sans',sans-serif",
        fontSize: 16,
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: `0 4px 12px ${color}55`,
      }}>{step.n}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 5 }}>{step.title}</div>
        <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>{step.body}</p>
      </div>
    </div>
  );
}

function InfoBox({ icon: Icon, title, children, color = '#3b82f6', bg = 'rgba(59,130,246,.08)', border = 'rgba(59,130,246,.25)', borderLeft = '#3b82f6' }) {
  return (
    <div style={{ display: 'flex', gap: 12, background: bg, border: `1px solid ${border}`, borderLeft: `4px solid ${borderLeft}`, borderRadius: 12, padding: '14px 16px', margin: '14px 0' }}>
      <Icon size={18} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        {title && <div style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{title}</div>}
        <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  );
}

function WarnBox({ children }) {
  return (
    <InfoBox icon={AlertTriangle} color="#d97706" bg="rgba(245,158,11,.08)" border="rgba(245,158,11,.3)" borderLeft="#f59e0b">
      {children}
    </InfoBox>
  );
}

function SuccessBox({ children }) {
  return (
    <InfoBox icon={CheckCircle} color="#16a34a" bg="rgba(22,163,74,.08)" border="rgba(22,163,74,.3)" borderLeft="#22c55e">
      {children}
    </InfoBox>
  );
}

function SectionHeader({ id, icon: Icon, color, title, subtitle }) {
  return (
    <div id={id} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28, scrollMarginTop: 100 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}18`, border: `1.5px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
          {title}
        </h2>
        {subtitle && <p style={{ fontSize: 14, color: 'var(--text3)', margin: 0 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════ */
export default function HelpPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('commandes');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGuide, setActiveGuide] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);

  // Search through all FAQ
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    const results = [];
    FAQ_SECTIONS.forEach(section => {
      section.questions.forEach(item => {
        if (item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)) {
          results.push({ ...item, section: section.label, sectionId: section.id, color: section.color });
        }
      });
    });
    setSearchResults(results);
  }, [searchQuery]);

  const scrollToSection = (id) => {
    setActiveSection(id);
    setActiveGuide(null);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 100, behavior: 'smooth' });
    }, 50);
  };

  const currentFAQ = FAQ_SECTIONS.find(s => s.id === activeSection);
  const currentGuide = GUIDE_STEPS.find(g => g.id === activeGuide);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');

        .hp-root, .hp-root * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hp-fade { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes hp-hero-in { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes pulse-ring { 0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); } 50% { box-shadow: 0 0 0 14px rgba(249,115,22,.08); } }

        .hp-fade { animation: hp-fade .5s cubic-bezier(.22,1,.36,1) both; }
        .hp-fade-1 { animation-delay: 60ms; }
        .hp-fade-2 { animation-delay: 120ms; }
        .hp-fade-3 { animation-delay: 180ms; }

        /* HERO */
        .hp-hero {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%) !important;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          position: relative; overflow: hidden;
          padding: 110px 40px 80px; text-align: center;
        }
        .hp-hero::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 70% 60% at 80% 10%, rgba(249,115,22,.18) 0%, transparent 55%),
            radial-gradient(ellipse 50% 60% at 15% 90%, rgba(59,130,246,.12) 0%, transparent 55%);
          pointer-events: none;
          z-index: 2;
        }
        .hp-hero-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
          background-size: 52px 52px;
          pointer-events: none;
          z-index: 2;
        }

        /* QUICK NAV */
        .hp-quicknav {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          max-width: 960px;
          margin: 0 auto;
        }
        .hp-qn-item {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          padding: 20px 12px;
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 16px;
          cursor: pointer;
          transition: all .2s cubic-bezier(.34,1.56,.64,1);
          text-decoration: none;
        }
        .hp-qn-item:hover {
          background: rgba(249,115,22,.15);
          border-color: rgba(249,115,22,.4);
          transform: translateY(-5px);
        }
        .hp-qn-item.active {
          background: rgba(249,115,22,.18);
          border-color: rgba(249,115,22,.6);
        }
        .hp-qn-label { font-size: 12px; font-weight: 600; color: rgba(255,255,255,.7); text-align: center; line-height: 1.4; }

        /* SEARCH */
        .hp-search-wrap { position: relative; max-width: 600px; margin: 0 auto 40px; }
        .hp-search-ico { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); pointer-events: none; }
        .hp-search-input {
          width: 100%;
          padding: 16px 20px 16px 50px;
          background: rgba(255,255,255,.1);
          border: 1.5px solid rgba(255,255,255,.2);
          border-radius: 14px;
          font-size: 15px;
          color: #fff;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          transition: all .2s;
          backdrop-filter: blur(10px);
        }
        .hp-search-input::placeholder { color: rgba(255,255,255,.45); }
        .hp-search-input:focus { border-color: rgba(249,115,22,.7); background: rgba(255,255,255,.15); box-shadow: 0 0 0 4px rgba(249,115,22,.12); }

        /* CONTENT LAYOUT */
        .hp-content { max-width: 1200px; margin: 0 auto; padding: 56px 24px 80px; }

        /* CARD */
        .hp-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 40px;
          margin-bottom: 28px;
          box-shadow: 0 2px 16px rgba(0,0,0,.05);
        }

        /* TABS */
        .hp-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
        .hp-tab {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 10px;
          border: 1.5px solid var(--border);
          background: var(--bg3);
          color: var(--text2);
          font-size: 13px; font-weight: 600;
          cursor: pointer;
          transition: all .18s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .hp-tab:hover { border-color: rgba(249,115,22,.4); color: #f97316; background: rgba(249,115,22,.08); }
        .hp-tab.active { background: rgba(249,115,22,.12); border-color: rgba(249,115,22,.5); color: #f97316; }

        /* GUIDE CARDS */
        .hp-guide-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .hp-guide-card {
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all .2s;
          display: flex; flex-direction: column; gap: 12px;
        }
        .hp-guide-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,.1); }
        .hp-guide-card.active { border-color: rgba(249,115,22,.5); background: rgba(249,115,22,.05); }

        /* FEATURE GRID */
        .hp-feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 20px 0; }
        .hp-feature {
          background: var(--bg3);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 22px 18px;
          text-align: center;
          transition: all .2s;
        }
        .hp-feature:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,.08); border-color: rgba(249,115,22,.3); }

        /* LIST */
        .hp-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .hp-list li {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px 16px;
          background: var(--bg3);
          border: 1px solid var(--border);
          border-radius: 10px;
          font-size: 14px; color: var(--text); line-height: 1.65;
        }

        /* STATUS BADGE */
        .hp-status { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1.5px solid; }

        /* CONTACT CARD */
        .hp-contact-card {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%) !important;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 48px;
          text-align: center;
          position: relative; overflow: hidden;
          margin-top: 8px;
        }
        .hp-contact-card::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(circle at 80% 20%, rgba(249,115,22,.2), transparent 50%),
            radial-gradient(circle at 15% 80%, rgba(59,130,246,.12), transparent 50%);
          pointer-events: none;
          z-index: 2;
        }

        /* SEARCH RESULTS */
        .hp-search-result {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: all .18s;
        }
        .hp-search-result:hover { border-color: rgba(249,115,22,.4); box-shadow: 0 4px 16px rgba(0,0,0,.08); }

        /* BACK BUTTON */
        .hp-back-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 18px;
          background: var(--bg3);
          border: 1.5px solid var(--border);
          border-radius: 10px;
          color: var(--text2);
          font-size: 13px; font-weight: 600;
          cursor: pointer;
          margin-bottom: 24px;
          transition: all .18s;
          font-family: 'DM Sans', sans-serif;
        }
        .hp-back-btn:hover { background: rgba(249,115,22,.1); border-color: rgba(249,115,22,.4); color: #f97316; }

        /* SUB TITLE */
        .hp-sub-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 800;
          color: #f97316;
          text-transform: uppercase;
          letter-spacing: .09em;
          margin: 28px 0 14px;
        }

        /* DIVIDER */
        .hp-divider { height: 1px; background: var(--border); margin: 36px 0; }

        /* HERO ICON */
        .hp-hero-icon {
          width: 88px; height: 88px;
          background: rgba(249,115,22,.12);
          border: 1.5px solid rgba(249,115,22,.3);
          border-radius: 22px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 28px;
          animation: pulse-ring 3s ease-in-out infinite, hp-hero-in .7s ease both;
        }

        @media (max-width: 900px) {
          .hp-quicknav { grid-template-columns: repeat(4, 1fr); }
          .hp-guide-grid { grid-template-columns: 1fr; }
          .hp-feature-grid { grid-template-columns: 1fr 1fr; }
          .hp-card { padding: 24px 20px; }
          .hp-content { padding: 36px 16px 60px; }
          .hp-hero { padding: 90px 20px 64px; }
          .hp-contact-card { padding: 32px 20px; }
        }
        @media (max-width: 640px) {
          .hp-quicknav { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .hp-tabs { gap: 5px; }
          .hp-tab { padding: 7px 12px; font-size: 12px; }
          .hp-feature-grid { grid-template-columns: 1fr; }
          .hp-hero { padding: 80px 16px 56px; }
        }
      `}</style>

      <div className="hp-root" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar pageCourante="/help" />

        {/* ═══ HERO ═══ */}
        <section className="hp-hero">
          <ParticlesCanvas count={40} />
          <div className="hp-hero-grid" />
          <div style={{ position: 'relative', zIndex: 3, maxWidth: 1000, margin: '0 auto' }}>

            {/* Eyebrow */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24, animation: 'hp-hero-in .6s ease both' }}>
              <div style={{ height: 1, width: 28, background: '#f97316', opacity: .7 }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f97316' }}>Documentation</span>
              <div style={{ height: 1, width: 28, background: '#f97316', opacity: .7 }} />
            </div>

            {/* Icon */}
            <div className="hp-hero-icon" style={{ animation: 'pulse-ring 3s ease-in-out infinite, hp-hero-in .7s ease 80ms both' }}>
              <HelpCircle size={44} color="#f97316" />
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 'clamp(36px, 7vw, 68px)',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.025em',
              lineHeight: 1.0,
              margin: '0 0 16px',
              animation: 'hp-hero-in .7s ease .12s both',
            }}>
              Centre <span style={{ color: '#f97316', fontStyle: 'italic', fontFamily: 'Georgia, serif', fontWeight: 400 }}>d'Aide</span> ShopCI
            </h1>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,.55)', lineHeight: 1.7, maxWidth: 600, margin: '0 auto 40px', animation: 'hp-hero-in .7s ease .18s both' }}>
              Tout ce que vous devez savoir pour acheter, vendre et livrer sur ShopCI Côte d'Ivoire
            </p>

            {/* Search */}
            <div className="hp-search-wrap" style={{ animation: 'hp-hero-in .7s ease .24s both' }}>
              <Search size={18} color="rgba(255,255,255,.5)" className="hp-search-ico" />
              <input
                ref={searchRef}
                className="hp-search-input"
                type="text"
                placeholder="Rechercher une question, un sujet…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.5)', display: 'flex', alignItems: 'center' }}>
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Quick nav */}
            <div className="hp-quicknav" style={{ animation: 'hp-hero-in .7s ease .3s both' }}>
              {QUICK_LINKS.map(({ id, icon: Icon, label }) => (
                <button key={id}
                  className={`hp-qn-item${activeSection === id ? ' active' : ''}`}
                  onClick={() => scrollToSection(id)}
                >
                  <Icon size={26} color={activeSection === id ? '#f97316' : 'rgba(255,255,255,.7)'} />
                  <span className="hp-qn-label">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CONTENT ═══ */}
        <div className="hp-content">

          {/* SEARCH RESULTS */}
          {searchQuery && (
            <div className="hp-fade">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Search size={18} color="#f97316" />
                <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 16 }}>
                  {searchResults.length} résultat{searchResults.length !== 1 ? 's' : ''} pour "{searchQuery}"
                </span>
              </div>
              {searchResults.length === 0 ? (
                <div className="hp-card" style={{ textAlign: 'center', padding: '48px 20px' }}>
                  <HelpCircle size={48} color="#e5e7eb" style={{ marginBottom: 12 }} />
                  <p style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>Aucun résultat</p>
                  <p style={{ fontSize: 14, color: 'var(--text3)' }}>Essayez d'autres mots-clés ou consultez les sections ci-dessous.</p>
                </div>
              ) : (
                searchResults.map((r, i) => (
                  <div key={i} className="hp-search-result" onClick={() => { setSearchQuery(''); scrollToSection(r.sectionId); }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: r.color, background: `${r.color}18`, padding: '2px 9px', borderRadius: 20 }}>{r.section}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 5 }}>{r.q}</div>
                    <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.a}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {!searchQuery && (
            <>
              {/* ─── GUIDES VISUELS ─── */}
              <div className="hp-card hp-fade">
                <div style={{ marginBottom: 28 }}>
                  <div className="hp-sub-title"><Zap size={14} /> Guides étape par étape</div>
                  <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
                    Guides visuels
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--text3)', margin: 0 }}>Des parcours illustrés pour maîtriser ShopCI en quelques minutes</p>
                </div>

                {activeGuide && currentGuide ? (
                  <>
                    <button className="hp-back-btn" onClick={() => setActiveGuide(null)}>
                      <ChevronDown size={14} style={{ transform: 'rotate(90deg)' }} /> Retour aux guides
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${currentGuide.color}18`, border: `1.5px solid ${currentGuide.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <currentGuide.icon size={24} color={currentGuide.color} />
                      </div>
                      <div>
                        <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: 'var(--text)', margin: '0 0 3px', letterSpacing: '-0.01em' }}>{currentGuide.title}</h3>
                        <p style={{ fontSize: 13, color: 'var(--text3)', margin: 0 }}>{currentGuide.steps.length} étapes</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {currentGuide.steps.map(step => (
                        <GuideStep key={step.n} step={step} color={currentGuide.color} />
                      ))}
                    </div>
                    <SuccessBox>Guide terminé ! Besoin d'aide supplémentaire ? Consultez la FAQ ci-dessous ou contactez notre support.</SuccessBox>
                  </>
                ) : (
                  <div className="hp-guide-grid">
                    {GUIDE_STEPS.map(guide => (
                      <div key={guide.id}
                        className={`hp-guide-card${activeGuide === guide.id ? ' active' : ''}`}
                        onClick={() => { setActiveGuide(guide.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${guide.color}18`, border: `1.5px solid ${guide.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <guide.icon size={22} color={guide.color} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--text)' }}>{guide.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{guide.steps.length} étapes</div>
                          </div>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{guide.steps[0].body.slice(0, 90)}…</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: guide.color, fontSize: 13, fontWeight: 700 }}>
                          Voir le guide <ArrowRight size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ─── FAQ ─── */}
              <div className="hp-card hp-fade hp-fade-1">
                <div style={{ marginBottom: 28 }}>
                  <div className="hp-sub-title"><HelpCircle size={14} /> Questions fréquentes</div>
                  <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
                    FAQ — Réponses rapides
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--text3)', margin: 0 }}>Sélectionnez une catégorie pour filtrer les questions</p>
                </div>

                {/* Tabs */}
                <div className="hp-tabs">
                  {FAQ_SECTIONS.map(s => (
                    <button key={s.id}
                      className={`hp-tab${activeSection === s.id ? ' active' : ''}`}
                      onClick={() => setActiveSection(s.id)}
                    >
                      <s.icon size={14} />
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Current FAQ section */}
                {currentFAQ && (
                  <div style={{ animation: 'hp-fade .3s ease both' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: `${currentFAQ.color}18`, border: `1.5px solid ${currentFAQ.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <currentFAQ.icon size={20} color={currentFAQ.color} />
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.01em' }}>{currentFAQ.label}</span>
                      <span style={{ fontSize: 12, color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 10px', fontWeight: 600 }}>
                        {currentFAQ.questions.length} questions
                      </span>
                    </div>
                    {currentFAQ.questions.map((item, i) => (
                      <FAQItem key={i} q={item.q} a={item.a} />
                    ))}
                  </div>
                )}
              </div>

              {/* ─── INFOS PAIEMENT & STATUTS ─── */}
              <div className="hp-card hp-fade hp-fade-2">

                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                  <div className="hp-sub-title"><CreditCard size={14} /> Paiement & Suivi</div>
                  <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
                    Paiement & Statuts de commande
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--text3)', margin: 0 }}>Méthodes acceptées, sécurité des transactions et cycle de vie de vos commandes</p>
                </div>

                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>

                  {/* ── Paiements ── */}
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,.15)', border: '1.5px solid rgba(245,158,11,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CreditCard size={18} color="#f59e0b" />
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>Modes de paiement</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Disponibles &amp; à venir sur ShopCI</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {/* Actif */}
                      <div style={{ padding: '14px 16px', background: 'rgba(22,163,74,.07)', border: '1.5px solid rgba(22,163,74,.25)', borderRadius: 13, borderLeft: '4px solid #16a34a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <CheckCircle size={16} color="#fff" />
                            </div>
                            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>Paiement à la livraison</span>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: 'rgba(22,163,74,.15)', padding: '3px 10px', borderRadius: 20 }}>✓ Actif</span>
                        </div>
                        <p style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
                          Payez en <strong>espèces (FCFA)</strong> directement au livreur à la réception. Aucun pré-paiement requis. Vérifiez votre commande avant de payer.
                        </p>
                      </div>

                      {/* Mobile money - bientôt */}
                      {[
                        { label: 'Orange Money', icon: '🟠', color: '#f97316', desc: 'Paiement via l\'application Orange Money (+225). Disponible prochainement dans la section checkout.' },
                        { label: 'MTN Mobile Money', icon: '🟡', color: '#f59e0b', desc: 'Paiement via MTN MoMo. Intégration en cours — bientôt disponible pour tous les utilisateurs.' },
                        { label: 'Wave', icon: '🔵', color: '#3b82f6', desc: 'Paiement via Wave Côte d\'Ivoire. Solution rapide et sans frais cachés — bientôt disponible.' },
                        { label: 'Moov Money', icon: '🔷', color: '#2563eb', desc: 'Paiement Moov Africa. En cours d\'intégration pour les utilisateurs Moov.' },
                      ].map((pm, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, opacity: 0.85 }}>
                          <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{pm.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>{pm.label}</span>
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#d97706', background: 'rgba(245,158,11,.12)', padding: '2px 8px', borderRadius: 20, flexShrink: 0, marginLeft: 8 }}>Bientôt</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{pm.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <InfoBox icon={Lock} color="#16a34a" bg="rgba(22,163,74,.07)" border="rgba(22,163,74,.25)" borderLeft="#22c55e">
                      <strong>Protection acheteur :</strong> Les paiements mobiles (à venir) seront sécurisés par un système escrow — les fonds ne sont libérés au vendeur qu'après votre confirmation de réception.
                    </InfoBox>

                    <WarnBox>
                      <strong>Important :</strong> Ne payez jamais en dehors de la plateforme. ShopCI ne demande <em>jamais</em> de virement bancaire ou de paiement via WhatsApp / appel téléphonique.
                    </WarnBox>
                  </div>

                  <div style={{ width: 1, background: 'var(--border)', flexShrink: 0, alignSelf: 'stretch' }} />

                  {/* ── Statuts ── */}
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,.15)', border: '1.5px solid rgba(139,92,246,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={18} color="#8b5cf6" />
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>Cycle de vie d'une commande</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>5 statuts — de la création à la livraison</div>
                      </div>
                    </div>

                    {/* Timeline verticale */}
                    <div style={{ position: 'relative', paddingLeft: 24 }}>
                      {/* ligne verticale */}
                      <div style={{ position: 'absolute', left: 10, top: 20, bottom: 20, width: 2, background: 'var(--border)', borderRadius: 2 }} />

                      {[
                        {
                          s: 'En attente', icon: Clock, color: '#d97706', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.3)',
                          desc: 'Votre commande a été reçue. Le vendeur est notifié et dispose de 2h pour confirmer ou refuser.',
                          action: 'Vous pouvez encore annuler à cette étape.'
                        },
                        {
                          s: 'En cours de préparation', icon: Package, color: '#3b82f6', bg: 'rgba(59,130,246,.12)', border: 'rgba(59,130,246,.3)',
                          desc: 'Le vendeur prépare et emballe votre colis. Une photo du colis peut être partagée.',
                          action: 'Annulation impossible à partir d\'ici.'
                        },
                        {
                          s: 'Expédié — GPS actif', icon: Truck, color: '#8b5cf6', bg: 'rgba(139,92,246,.12)', border: 'rgba(139,92,246,.3)',
                          desc: 'Le livreur est en route. Suivez sa position en temps réel sur la carte interactive.',
                          action: 'Cliquez « Suivre ma livraison » dans Mes commandes.'
                        },
                        {
                          s: 'Livré', icon: CheckCircle, color: '#16a34a', bg: 'rgba(22,163,74,.12)', border: 'rgba(22,163,74,.3)',
                          desc: 'Livraison confirmée par vous ou automatiquement après 24h sans contestation.',
                          action: 'Le paiement est libéré au vendeur. Laissez un avis !'
                        },
                        {
                          s: 'Annulé', icon: X, color: '#dc2626', bg: 'rgba(220,38,38,.12)', border: 'rgba(220,38,38,.3)',
                          desc: 'La commande a été annulée par vous, le vendeur ou le support ShopCI.',
                          action: 'Remboursement traité sous 3–5 jours si déjà payé.'
                        },
                      ].map((item, i, arr) => (
                        <div key={i} style={{ position: 'relative', display: 'flex', gap: 16, paddingBottom: i < arr.length - 1 ? 20 : 0 }}>
                          {/* dot */}
                          <div style={{ position: 'absolute', left: -24, top: 14, width: 20, height: 20, borderRadius: '50%', background: item.bg, border: `2px solid ${item.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                            <item.icon size={10} color={item.color} />
                          </div>
                          <div style={{ flex: 1, padding: '12px 14px', background: item.bg, border: `1px solid ${item.border}`, borderRadius: 12 }}>
                            <div style={{ fontWeight: 800, fontSize: 13.5, color: item.color, marginBottom: 4 }}>{item.s}</div>
                            <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 5 }}>{item.desc}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--text3)', fontStyle: 'italic' }}>→ {item.action}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <SuccessBox>
                      <strong>Délai de livraison :</strong> Abidjan 24–48h · Villes proches 24–72h · Intérieur 2–5 jours ouvrables
                    </SuccessBox>
                  </div>
                </div>
              </div>

              {/* ─── SÉCURITÉ ─── */}
              <div className="hp-card hp-fade hp-fade-2">
                <div style={{ marginBottom: 28 }}>
                  <div className="hp-sub-title"><Shield size={14} /> Sécurité</div>
                  <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
                    Conseils de sécurité
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--text3)', margin: 0 }}>Protégez-vous et achetez sereinement sur ShopCI Côte d'Ivoire</p>
                </div>

                <div className="hp-feature-grid">
                  {[
                    {
                      icon: Star, color: '#f59e0b',
                      title: 'Vérifiez les avis vendeur',
                      desc: 'Avant de commander, lisez les évaluations laissées par les acheteurs précédents. Un vendeur fiable a un historique de livraisons réussies et des notes élevées.',
                      tip: 'Méfiez-vous des vendeurs sans aucun avis ou avec un seul avis 5 étoiles.'
                    },
                    {
                      icon: Lock, color: '#3b82f6',
                      title: 'Payez uniquement à la livraison',
                      desc: 'Ne payez jamais avant de recevoir et inspecter votre produit. Le paiement à la livraison vous protège contre les arnaques et les envois non conformes.',
                      tip: 'Refusez tout vendeur qui exige un pré-paiement par virement ou mobile money hors plateforme.'
                    },
                    {
                      icon: Camera, color: '#8b5cf6',
                      title: 'Exigez la photo du colis',
                      desc: 'Un vendeur sérieux prend et partage une photo de votre colis emballé via ShopCI avant l\'expédition. Cette preuve protège les deux parties.',
                      tip: 'Si le vendeur refuse de montrer le colis, c\'est un signal d\'alerte.'
                    },
                    {
                      icon: Navigation, color: '#16a34a',
                      title: 'Suivez le livreur en GPS',
                      desc: 'Utilisez le suivi GPS intégré pour localiser votre livreur en temps réel. Tout livreur ShopCI partage sa position dès l\'expédition.',
                      tip: 'Si le livreur ne partage pas sa position GPS, signalez-le au support.'
                    },
                    {
                      icon: AlertTriangle, color: '#dc2626',
                      title: 'Signalez les fraudes',
                      desc: 'Tout comportement suspect — produit non conforme, livreur fantôme, double facturation — doit être signalé immédiatement. Notre équipe traite les signalements sous 24h.',
                      tip: 'Utilisez le bouton « Signaler » sur la fiche produit ou dans votre commande.'
                    },
                    {
                      icon: Shield, color: '#f97316',
                      title: 'Sécurisez votre compte',
                      desc: 'Activez la double authentification (2FA) dans Profil > Sécurité. Ne partagez jamais votre mot de passe ni votre code SMS avec qui que ce soit, même le support ShopCI.',
                      tip: 'Changez votre mot de passe régulièrement et utilisez un mot de passe unique.'
                    },
                    {
                      icon: Award, color: '#06b6d4',
                      title: 'Notez vos livraisons',
                      desc: 'Après chaque livraison, laissez une évaluation honnête. Vos avis aident les futurs acheteurs à choisir des vendeurs fiables et maintiennent la qualité de ShopCI.',
                      tip: 'Soyez précis dans vos commentaires — prix, délai, conformité, emballage.'
                    },
                    {
                      icon: Smartphone, color: '#10b981',
                      title: 'Contacts officiels ShopCI',
                      desc: 'Le support ShopCI ne vous contactera jamais en premier par WhatsApp ou numéro inconnu pour demander un paiement. Utilisez uniquement les canaux officiels.',
                      tip: 'Support officiel : +225 01 42 50 77 50 · contact@shopci.ci'
                    },
                  ].map((f, i) => (
                    <div key={i} className="hp-feature" style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}18`, border: `1.5px solid ${f.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <f.icon size={22} color={f.color} />
                        </div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, color: 'var(--text)', lineHeight: 1.3 }}>{f.title}</div>
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.65, margin: '0 0 8px' }}>{f.desc}</p>
                      <div style={{ fontSize: 11.5, color: f.color, background: `${f.color}10`, border: `1px solid ${f.color}20`, borderRadius: 8, padding: '6px 10px', lineHeight: 1.5 }}>
                        💡 {f.tip}
                      </div>
                    </div>
                  ))}
                </div>

                <WarnBox>
                  <strong>⚠ Alerte fraude :</strong> ShopCI ne demande <em>jamais</em> de paiement par virement bancaire, envoi d'argent via WhatsApp ou appel téléphonique. Tout contact suspect doit être signalé au <strong>+225 01 42 50 77 50</strong> ou sur <strong>contact@shopci.ci</strong>.
                </WarnBox>

                {/* ARTCI */}
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(59,130,246,.07)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 12 }}>
                  <Lock size={18} color="#3b82f6" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--text)' }}>Conformité ARTCI :</strong> ShopCI respecte les réglementations de l'Autorité de Régulation des Télécommunications/TIC de Côte d'Ivoire en matière de protection des données personnelles et de sécurité des transactions en ligne.
                  </div>
                </div>
              </div>

              {/* ─── CONTACT ─── */}
              <div className="hp-contact-card hp-fade hp-fade-3">
                <ParticlesCanvas count={30} />
                <div style={{ position: 'relative', zIndex: 3 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(249,115,22,.18)', border: '1.5px solid rgba(249,115,22,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'float 3.5s ease-in-out infinite' }}>
                    <MessageCircle size={28} color="#f97316" />
                  </div>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                    Besoin d'aide supplémentaire ?
                  </h3>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,.55)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto 32px' }}>
                    Notre équipe ShopCI est disponible pour répondre à toutes vos questions. N'hésitez pas à nous contacter.
                  </p>
                  <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[
                      { icon: Phone,   label: '+225 01 42 50 77 50',   href: 'tel:+22501425077',             color: '#f97316' },
                      { icon: Mail,    label: 'contact@shopci.ci',   href: 'mailto:contact@shopci.ci',    color: '#3b82f6' },
                      { icon: MapPin,  label: 'Abidjan, Plateau — CI',          href: '#',                             color: '#16a34a' },
                    ].map((c, i) => (
                      <a key={i} href={c.href}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'rgba(255,255,255,.65)', textDecoration: 'none', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', padding: '10px 18px', borderRadius: 11, transition: 'all .18s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.12)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.07)'; e.currentTarget.style.color = 'rgba(255,255,255,.65)'; }}
                      >
                        <c.icon size={17} color={c.color} />
                        {c.label}
                      </a>
                    ))}
                  </div>

                  {/* Nav links */}
                  <div style={{ marginTop: 28, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Accueil ShopCI', action: () => router.push('/') },
                      { label: 'Mes commandes',  action: () => router.push('/orders') },
                      { label: 'Mon panier',      action: () => router.push('/cart') },
                    ].map((link, i) => (
                      <button key={i} onClick={link.action}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#f97316', background: 'rgba(249,115,22,.12)', border: '1.5px solid rgba(249,115,22,.3)', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .18s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(249,115,22,.12)'; }}
                      >
                        {link.label} <ExternalLink size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}