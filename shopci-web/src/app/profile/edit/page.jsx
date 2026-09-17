'use client';

// ecommerce-frontend/src/pages/ProfileEditPage.jsx
// ✅ Thème harmonisé ShopCI — Orange & Blanc — même UX que HomePage

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cropper from 'react-easy-crop';
import {
  User, Mail, Phone, MapPin, Lock, Save, ArrowLeft, AlertCircle, CheckCircle,
  Camera, Eye, EyeOff, Trash2, PauseCircle, Crop, Check, Home, ShieldCheck,
} from 'lucide-react';
import { authAPI, setSession } from '@/services/api';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Loader from '@/components/Loader';

// ── Cropping utils ──────────────────────────────────────────────
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (e) => reject(e));
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width  = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9));
}

// ── Composant ───────────────────────────────────────────────────
export default function ProfileEditPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = authAPI.getCurrentUser();

  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setPageLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const [formData, setFormData] = useState({
    username: user?.username || '',
    email:    user?.email    || '',
    phone:    user?.phone    || '',
    address:  user?.address  || '',
  });
  const [profilePhoto,    setProfilePhoto]    = useState(user?.profile_photo || null);
  const [photoPreview,    setPhotoPreview]    = useState(user?.profile_photo || null);
  const [imageToCrop,     setImageToCrop]     = useState(null);
  const [crop,            setCrop]            = useState({ x: 0, y: 0 });
  const [zoom,            setZoom]            = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [passwordData,    setPasswordData]    = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [showPasswords,   setShowPasswords]   = useState({ old_password: false, new_password: false, confirm_password: false });
  const [errors,          setErrors]          = useState({});
  const [loading,         setLoading]         = useState(false);
  const [success,         setSuccess]         = useState('');
  const [activeTab,       setActiveTab]       = useState('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuspendModal,setShowSuspendModal]= useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };
  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };
  const togglePasswordVisibility = (field) =>
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErrors({ photo: "L'image ne doit pas dépasser 5 Mo" }); return; }
    if (!file.type.startsWith('image/')) { setErrors({ photo: 'Veuillez sélectionner une image valide' }); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setImageToCrop(reader.result); setPhotoPreview(reader.result); setProfilePhoto(null); setActiveTab('photo'); };
    reader.readAsDataURL(file);
    setErrors({ ...errors, photo: '' });
  };
  const onCropComplete = useCallback((_, pixels) => setCroppedAreaPixels(pixels), []);
  const handleCropDone = useCallback(async () => {
    if (!croppedAreaPixels || !imageToCrop) return;
    setLoading(true);
    try {
      const blob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const file = new File([blob], `profile-${user.username}.jpeg`, { type: 'image/jpeg' });
      setPhotoPreview(URL.createObjectURL(file));
      setProfilePhoto(file);
      setImageToCrop(null);
      setSuccess('Photo rognée et prête à être enregistrée.');
    } catch { setErrors({ photo: 'Erreur lors du rognage.' }); }
    finally { setLoading(false); }
  }, [imageToCrop, croppedAreaPixels, user]);
  const handleCropCancel = useCallback(() => { setImageToCrop(null); setPhotoPreview(user?.profile_photo || null); setProfilePhoto(null); }, [user]);

  const handleProfileSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setErrors({}); setSuccess(''); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('username', formData.username);
      fd.append('email',    formData.email);
      fd.append('phone',    formData.phone);
      fd.append('address',  formData.address);
      if (profilePhoto instanceof File) fd.append('profile_photo', profilePhoto);
      await authAPI.updateProfile(fd);
      const updated = { ...user, ...formData, profile_photo: profilePhoto instanceof File ? photoPreview : (profilePhoto || user?.profile_photo) };
      setSession(session?.accessToken || null, updated);
      setSuccess('Profil mis à jour avec succès !');
      setTimeout(() => router.push(user?.user_type === 'vendeur' ? '/vendor/dashboard' : '/buyer/dashboard'), 2000);
    } catch (err) {
      setErrors(err.response?.data || { general: 'Erreur lors de la mise à jour du profil' });
    } finally { setLoading(false); }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault(); setErrors({}); setSuccess('');
    if (passwordData.new_password !== passwordData.confirm_password) { setErrors({ confirm_password: 'Les mots de passe ne correspondent pas' }); return; }
    if (passwordData.new_password.length < 8) { setErrors({ new_password: 'Minimum 8 caractères requis' }); return; }
    setLoading(true);
    try {
      await authAPI.changePassword({ old_password: passwordData.old_password, new_password: passwordData.new_password });
      setSuccess('Mot de passe changé ! Redirection vers la connexion…');
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => { authAPI.logout(); router.push('/login'); }, 2000);
    } catch (err) {
      setErrors(err.response?.data || { general: 'Erreur lors du changement de mot de passe' });
    } finally { setLoading(false); }
  };

  const handleSuspendAccount = async () => {
    setLoading(true);
    try {
      await authAPI.suspendAccount();
      setSuccess('Compte suspendu avec succès.');
      setTimeout(() => { authAPI.logout(); router.push('/login'); }, 2000);
    } catch { setErrors({ general: 'Erreur lors de la suspension du compte' }); }
    finally { setLoading(false); setShowSuspendModal(false); }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await authAPI.deleteAccount();
      setSuccess('Compte supprimé.');
      setTimeout(() => { authAPI.logout(); router.push('/'); }, 2000);
    } catch { setErrors({ general: 'Erreur lors de la suppression du compte' }); }
    finally { setLoading(false); setShowDeleteModal(false); }
  };

  const initiales = (user?.username || 'U')[0].toUpperCase();

  const TABS = [
    { id: 'profile',  label: 'Informations',  icon: User },
    { id: 'photo',    label: 'Photo',          icon: Camera },
    { id: 'account',  label: 'Compte',         icon: ShieldCheck },
  ];

  if (pageLoading) return <Loader message="Chargement de votre profil…" />;

  return (
    <div style={{ fontFamily: "'DM Sans', 'Inter', sans-serif", background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        .pe-main {
          max-width: 1024px; margin: 32px auto; padding: 0 20px;
          display: grid; grid-template-columns: 240px 1fr; gap: 24px;
          align-items: start;
        }

        /* ── SIDEBAR ── */
        .pe-sidebar {
          background: var(--card); border-radius: 16px; border: 1px solid var(--border);
          overflow: hidden; position: sticky; top: 90px;
        }
        .pe-sidebar-header {
          background: linear-gradient(135deg, #f97316, #fb923c);
          padding: 24px 20px; text-align: center; color: #fff;
        }
        .pe-avatar-wrap {
          width: 72px; height: 72px; border-radius: 50%;
          border: 3px solid rgba(255,255,255,0.5);
          margin: 0 auto 12px; overflow: hidden; background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
        }
        .pe-avatar-initiales { font-size: 28px; font-weight: 800; color: #fff; }
        .pe-sidebar-name { font-size: 15px; font-weight: 800; margin-bottom: 2px; }
        .pe-sidebar-email { font-size: 12px; opacity: .8; }

        /* ── TABS NAV ── */
        .pe-tab-nav { padding: 8px; display: flex; flex-direction: column; gap: 2px; }
        .pe-tab-btn {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 11px 14px; border-radius: 10px;
          background: none; border: none; cursor: pointer;
          font-size: 14px; font-weight: 600; color: var(--text2);
          transition: all .18s; text-align: left; font-family: 'DM Sans', sans-serif;
        }
        .pe-tab-btn:hover { background: rgba(249,115,22,.1); color: #f97316; }
        .pe-tab-btn.active { background: rgba(249,115,22,.12); color: #f97316; }
        .pe-tab-btn svg { flex-shrink: 0; }

        /* ── PANEL ── */
        .pe-panel {
          background: var(--card); border-radius: 16px; border: 1px solid var(--border);
          overflow: hidden;
        }
        .pe-panel-header {
          padding: 20px 24px; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; gap: 12px;
        }
        .pe-panel-header-ico {
          width: 40px; height: 40px; border-radius: 11px;
          background: rgba(249,115,22,.12); border: 1px solid rgba(249,115,22,.2);
          display: flex; align-items: center; justify-content: center;
        }
        .pe-panel-header-ico svg { color: #f97316; }
        .pe-panel-title { font-size: 17px; font-weight: 800; color: var(--text); }
        .pe-panel-subtitle { font-size: 13px; color: var(--text3); margin-top: 1px; }
        .pe-panel-body { padding: 24px; }

        /* ── ALERTS ── */
        .pe-alert { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 12px; margin-bottom: 20px; }
        .pe-alert-success { background: rgba(22,163,74,.08); border: 1px solid rgba(22,163,74,.25); }
        .pe-alert-success svg { color: #22c55e; flex-shrink: 0; }
        .pe-alert-success span { color: #16a34a; font-size: 14px; font-weight: 500; }
        .pe-alert-error { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.25); }
        .pe-alert-error svg { color: #ef4444; flex-shrink: 0; }
        .pe-alert-error span { color: #dc2626; font-size: 14px; font-weight: 500; }
        .pe-alert-info { background: rgba(59,130,246,.08); border: 1px solid rgba(59,130,246,.25); }
        .pe-alert-info svg { color: #3b82f6; flex-shrink: 0; }
        .pe-alert-info span { color: #3b82f6; font-size: 13px; line-height: 1.5; }
        .pe-alert-warn { background: rgba(217,119,6,.08); border: 1px solid rgba(217,119,6,.25); }
        .pe-alert-warn svg { color: #d97706; flex-shrink: 0; }
        .pe-alert-warn span { color: #d97706; font-size: 13px; }

        /* ── FORM ── */
        .pe-field { margin-bottom: 18px; }
        .pe-label { display: block; font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
        .pe-input-wrap { position: relative; }
        .pe-input-ico { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text3); pointer-events: none; }
        .pe-input-ico-top { position: absolute; left: 12px; top: 14px; color: var(--text3); pointer-events: none; }
        .pe-input-ico-right { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text3); padding: 2px; }
        .pe-input-ico-right:hover { color: #f97316; }
        .pe-input {
          width: 100%; padding: 11px 14px 11px 40px;
          border: 1.5px solid var(--border); border-radius: 10px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: var(--text); background: var(--input); outline: none;
          transition: border-color .18s, box-shadow .18s;
        }
        .pe-input:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.12); background: var(--card); }
        .pe-input.error { border-color: #ef4444; }
        .pe-input.pr { padding-right: 44px; }
        .pe-input.textarea { height: 88px; resize: none; padding-top: 12px; }
        .pe-input::placeholder { color: var(--text3); }
        .pe-error-msg { font-size: 12px; color: #ef4444; margin-top: 5px; }

        /* ── BUTTONS ── */
        .pe-btn-primary {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
          background: #f97316; color: #fff; border: none; border-radius: 12px;
          padding: 13px; font-size: 15px; font-weight: 700; cursor: pointer;
          margin-top: 8px; transition: background .2s, transform .15s;
          box-shadow: 0 4px 16px rgba(249,115,22,0.30); font-family: 'DM Sans', sans-serif;
        }
        .pe-btn-primary:hover:not(:disabled) { background: #ea6a0a; transform: translateY(-1px); }
        .pe-btn-primary:disabled { opacity: .6; cursor: not-allowed; transform: none; }
        .pe-btn-danger {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 18px; border-radius: 10px;
          font-size: 13.5px; font-weight: 600; cursor: pointer;
          border: 1.5px solid rgba(239,68,68,.3); background: rgba(239,68,68,.08); color: #dc2626;
          transition: all .18s; font-family: 'DM Sans', sans-serif;
        }
        .pe-btn-danger:hover { background: rgba(239,68,68,.14); border-color: rgba(239,68,68,.5); }
        .pe-btn-warn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 18px; border-radius: 10px;
          font-size: 13.5px; font-weight: 600; cursor: pointer;
          border: 1.5px solid rgba(217,119,6,.3); background: rgba(217,119,6,.08); color: #d97706;
          transition: all .18s; font-family: 'DM Sans', sans-serif;
        }
        .pe-btn-warn:hover { background: rgba(217,119,6,.14); border-color: rgba(217,119,6,.5); }

        /* ── PHOTO ── */
        .pe-photo-center { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .pe-avatar-big {
          width: 140px; height: 140px; border-radius: 50%;
          border: 4px solid #f97316; overflow: hidden;
          background: rgba(249,115,22,.1); position: relative;
          margin-bottom: 20px;
          box-shadow: 0 4px 20px rgba(249,115,22,0.25);
        }
        .pe-avatar-big img { width: 100%; height: 100%; object-fit: cover; }
        .pe-avatar-big .pe-avatar-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        .pe-avatar-big .pe-avatar-placeholder svg { color: #f97316; }
        .pe-camera-btn {
          position: absolute; bottom: 4px; right: 4px;
          width: 36px; height: 36px; border-radius: 50%;
          background: #f97316; display: flex; align-items: center; justify-content: center;
          cursor: pointer; border: 2px solid var(--card);
          box-shadow: 0 2px 8px rgba(249,115,22,0.4);
          transition: background .18s;
        }
        .pe-camera-btn:hover { background: #ea6a0a; }
        .pe-camera-btn svg { color: #fff; }

        /* ── ACCOUNT CARDS ── */
        .pe-account-card {
          border-radius: 12px; border: 1px solid var(--border);
          padding: 20px; margin-bottom: 16px; background: var(--bg3);
          display: flex; gap: 16px; align-items: flex-start;
        }
        .pe-account-card-danger {
          border-color: rgba(239,68,68,.3) !important;
          background: rgba(239,68,68,.05) !important;
        }
        .pe-account-ico {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .pe-account-ico.warn { background: rgba(217,119,6,.12); }
        .pe-account-ico.warn svg { color: #d97706; }
        .pe-account-ico.danger { background: rgba(239,68,68,.1); }
        .pe-account-ico.danger svg { color: #ef4444; }
        .pe-account-info h3 { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .pe-account-info p  { font-size: 13px; color: var(--text2); line-height: 1.5; margin-bottom: 14px; }

        /* ── MODAL ── */
        .pe-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.55);
          display: flex; align-items: center; justify-content: center;
          z-index: 999; padding: 20px; backdrop-filter: blur(4px);
        }
        .pe-modal {
          background: var(--card); border-radius: 20px; max-width: 420px; width: 100%;
          padding: 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.35);
          border: 1px solid var(--border);
          animation: pe-modal-in .2s ease-out;
        }
        @keyframes pe-modal-in { from { opacity:0; transform:scale(.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .pe-modal-ico { width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; }
        .pe-modal h3 { font-size: 18px; font-weight: 800; text-align: center; color: var(--text); margin-bottom: 8px; }
        .pe-modal p  { font-size: 14px; text-align: center; color: var(--text2); margin-bottom: 24px; line-height: 1.5; }
        .pe-modal strong { color: var(--text); }
        .pe-modal-actions { display: flex; gap: 10px; }
        .pe-modal-cancel {
          flex: 1; padding: 11px; border-radius: 10px;
          border: 1.5px solid var(--border); background: var(--bg3); color: var(--text);
          font-size: 14px; font-weight: 600; cursor: pointer; transition: all .18s;
          font-family: 'DM Sans', sans-serif;
        }
        .pe-modal-cancel:hover { border-color: #f97316; color: #f97316; background: rgba(249,115,22,.08); }
        .pe-modal-confirm {
          flex: 1; padding: 11px; border-radius: 10px; border: none;
          font-size: 14px; font-weight: 700; cursor: pointer; color: #fff; transition: all .18s;
          font-family: 'DM Sans', sans-serif;
        }
        .pe-modal-confirm.warn   { background: #d97706; }
        .pe-modal-confirm.warn:hover   { background: #b45309; }
        .pe-modal-confirm.danger { background: #dc2626; }
        .pe-modal-confirm.danger:hover { background: #b91c1c; }
        .pe-modal-confirm:disabled { opacity: .6; cursor: not-allowed; }

        @media (max-width: 768px) {
          .pe-main { grid-template-columns: 1fr; }
          .pe-sidebar { position: static; }
          .pe-tab-nav { flex-direction: row; overflow-x: auto; padding: 8px 8px; gap: 4px; }
          .pe-tab-btn { white-space: nowrap; padding: 8px 12px; font-size: 13px; }
          .pe-sidebar-header { padding: 16px 20px; display: flex; align-items: center; gap: 14px; text-align: left; }
          .pe-avatar-wrap { margin: 0; width: 52px; height: 52px; }
          .pe-avatar-initiales { font-size: 20px; }
        }
        @media (max-width: 480px) {
          .pe-panel-body { padding: 16px; }
          .pe-main { padding: 0 12px; margin: 16px auto; }
        }

        /* ══════════════════════════════════════════════
           DARK MODE — ajustements fins uniquement
           (les variables CSS gèrent le reste automatiquement)
        ══════════════════════════════════════════════ */

        /* Alerts — teintes de texte dark */
        body.dark .pe-alert-success { background: rgba(22,163,74,.1); border-color: rgba(22,163,74,.3); }
        body.dark .pe-alert-success span { color: #4ade80; }
        body.dark .pe-alert-error   { background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.3); }
        body.dark .pe-alert-error span   { color: #f87171; }
        body.dark .pe-alert-info    { background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.3); }
        body.dark .pe-alert-info span    { color: #93c5fd; }
        body.dark .pe-alert-warn    { background: rgba(217,119,6,.1); border-color: rgba(217,119,6,.3); }
        body.dark .pe-alert-warn span    { color: #fcd34d; }
        body.dark .pe-alert-warn strong  { color: #fbbf24; }

        /* Input focus & erreur */
        body.dark .pe-input:focus { border-color: #f97316; background: var(--bg2); box-shadow: 0 0 0 3px rgba(249,115,22,.12); }
        body.dark .pe-input.error { border-color: #f87171; }
        body.dark .pe-error-msg   { color: #f87171; }

        /* Boutons warn/danger — teintes dark */
        body.dark .pe-btn-warn  { background: rgba(217,119,6,.1);  border-color: rgba(217,119,6,.3);  color: #fcd34d; }
        body.dark .pe-btn-warn:hover  { background: rgba(217,119,6,.18); border-color: rgba(217,119,6,.5); }
        body.dark .pe-btn-danger { background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.3); color: #f87171; }
        body.dark .pe-btn-danger:hover { background: rgba(239,68,68,.18); border-color: rgba(239,68,68,.5); }

        /* Modal ombre renforcée */
        body.dark .pe-modal { box-shadow: 0 20px 60px rgba(0,0,0,.6); }
        body.dark .pe-modal-cancel:hover { border-color: #f97316; color: #f97316; background: rgba(249,115,22,.08); }
      `}</style>

      <Navbar pageCourante="/profile/edit" />

      <main className="pe-main">

        {/* ── SIDEBAR ── */}
        <div className="pe-sidebar">
          <div className="pe-sidebar-header">
            <div className="pe-avatar-wrap">
              {photoPreview ? (
                <img src={photoPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span className="pe-avatar-initiales">{initiales}</span>
              )}
            </div>
            <div>
              <div className="pe-sidebar-name">{user?.username || 'Utilisateur'}</div>
              <div className="pe-sidebar-email">{user?.email || ''}</div>
            </div>
          </div>
          <nav className="pe-tab-nav">
            {TABS.map(({ id, label, icon: Ico }) => (
              <button
                key={id}
                className={`pe-tab-btn${activeTab === id ? ' active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                <Ico size={16} /> {label}
              </button>
            ))}
          </nav>
        </div>

        {/* ── PANEL ── */}
        <div className="pe-panel">
          <div className="pe-panel-header">
            <div className="pe-panel-header-ico">
              {activeTab === 'profile'  && <User size={20} />}
              {activeTab === 'photo'    && <Camera size={20} />}
              {activeTab === 'account'  && <ShieldCheck size={20} />}
            </div>
            <div>
              <div className="pe-panel-title">
                {activeTab === 'profile'  && 'Informations personnelles'}
                {activeTab === 'photo'    && 'Photo de profil'}
                {activeTab === 'account'  && 'Gestion du compte'}
              </div>
              <div className="pe-panel-subtitle">
                {activeTab === 'profile'  && 'Modifiez vos informations de base'}
                {activeTab === 'photo'    && 'Choisissez et recadrez votre photo'}
                {activeTab === 'account'  && 'Actions irréversibles sur votre compte'}
              </div>
            </div>
          </div>

          <div className="pe-panel-body" key={activeTab}>
            {success && (
              <div className="pe-alert pe-alert-success">
                <CheckCircle size={18} />
                <span>{success}</span>
              </div>
            )}
            {errors.general && (
              <div className="pe-alert pe-alert-error">
                <AlertCircle size={18} />
                <span>{errors.general}</span>
              </div>
            )}

            {/* ── TAB PROFIL ── */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit}>
                <div className="pe-field">
                  <label className="pe-label">Nom d'utilisateur</label>
                  <div className="pe-input-wrap">
                    <User size={16} className="pe-input-ico" />
                    <input type="text" name="username" value={formData.username} onChange={handleChange}
                      className={`pe-input${errors.username ? ' error' : ''}`} placeholder="Votre nom d'utilisateur" />
                  </div>
                  {errors.username && <p className="pe-error-msg">{errors.username}</p>}
                </div>

                <div className="pe-field">
                  <label className="pe-label">Adresse e-mail</label>
                  <div className="pe-input-wrap">
                    <Mail size={16} className="pe-input-ico" />
                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                      className={`pe-input${errors.email ? ' error' : ''}`} placeholder="votre@email.com" />
                  </div>
                  {errors.email && <p className="pe-error-msg">{errors.email}</p>}
                </div>

                <div className="pe-field">
                  <label className="pe-label">Téléphone</label>
                  <div className="pe-input-wrap">
                    <Phone size={16} className="pe-input-ico" />
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                      className={`pe-input${errors.phone ? ' error' : ''}`} placeholder="+225 07 12 34 56 78" />
                  </div>
                  {errors.phone && <p className="pe-error-msg">{errors.phone}</p>}
                </div>

                <div className="pe-field">
                  <label className="pe-label">Adresse</label>
                  <div className="pe-input-wrap">
                    <MapPin size={16} className="pe-input-ico-top" />
                    <textarea name="address" value={formData.address} onChange={handleChange}
                      className="pe-input textarea" placeholder="Votre adresse complète (quartier, commune…)" />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="pe-btn-primary">
                  {loading ? (
                    <><svg viewBox="0 0 24 24" width="18" height="18" style={{ animation: 'spin .8s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" strokeDasharray="30 60" />
                    </svg> Enregistrement…</>
                  ) : (
                    <><Save size={18} /> Enregistrer les modifications</>
                  )}
                </button>
              </form>
            )}

            {/* ── TAB PHOTO ── */}
            {activeTab === 'photo' && (
              <div>
                {imageToCrop ? (
                  <div>
                    <div className="pe-alert pe-alert-info">
                      <AlertCircle size={16} />
                      <span>Ajustez la zone de rognage. La photo sera affichée en format rond.</span>
                    </div>
                    <div style={{ position: 'relative', width: '100%', height: '320px', background: '#000', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                      <Cropper
                        image={imageToCrop}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        cropShape="round"
                        objectFit="contain"
                        showGrid={false}
                        style={{ containerStyle: { background: '#111' } }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg3)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '16px' }}>
                      <Crop size={16} style={{ color: '#f97316', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', width: '40px' }}>Zoom</span>
                      <input
                        type="range" min={1} max={3} step={0.05} value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        style={{ flex: 1, accentColor: '#f97316' }}
                      />
                      <span style={{ fontSize: '13px', color: '#f97316', fontWeight: '700', width: '32px' }}>{zoom.toFixed(1)}×</span>                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={handleCropCancel}
                        style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                        Annuler
                      </button>
                      <button onClick={handleCropDone} disabled={loading} className="pe-btn-primary" style={{ flex: 1, marginTop: 0 }}>
                        {loading ? 'Traitement…' : <><Check size={16} /> Valider le rognage</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pe-photo-center">
                    <div className="pe-avatar-big">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Photo de profil" />
                      ) : (
                        <div className="pe-avatar-placeholder"><User size={64} /></div>
                      )}
                      <label htmlFor="photo-upload" className="pe-camera-btn">
                        <Camera size={16} />
                      </label>
                      <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                    </div>

                    {errors.photo && <p className="pe-error-msg" style={{ marginBottom: '12px' }}>{errors.photo}</p>}

                    <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '4px' }}>
                      Cliquez sur l'appareil photo pour choisir une image à recadrer.
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '20px' }}>
                      JPG, PNG, GIF — Max. 5 Mo
                    </p>

                    <button
                      onClick={handleProfileSubmit}
                      disabled={loading || !(profilePhoto instanceof File)}
                      className="pe-btn-primary" style={{ maxWidth: '320px' }}
                    >
                      {loading ? 'Enregistrement…' : <><Save size={16} /> Enregistrer la photo</>}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB COMPTE ── */}
            {activeTab === 'account' && (
              <div>
                <div className="pe-alert pe-alert-warn" style={{ marginBottom: '20px' }}>
                  <AlertCircle size={16} />
                  <span><strong>Attention :</strong> Ces actions affectent l'état de votre compte.</span>
                </div>

                <div className="pe-account-card">
                  <div className="pe-account-ico warn">
                    <PauseCircle size={22} />
                  </div>
                  <div className="pe-account-info">
                    <h3>Suspendre mon compte</h3>
                    <p>Désactivez temporairement votre compte. Vous pourrez le réactiver en vous reconnectant à tout moment.</p>
                    <button className="pe-btn-warn" onClick={() => setShowSuspendModal(true)}>
                      <PauseCircle size={15} /> Suspendre mon compte
                    </button>
                  </div>
                </div>

                <div className="pe-account-card pe-account-card-danger">
                  <div className="pe-account-ico danger">
                    <Trash2 size={22} />
                  </div>
                  <div className="pe-account-info">
                    <h3>Supprimer mon compte</h3>
                    <p>Supprimez définitivement votre compte et toutes vos données. <strong>Cette action est irréversible.</strong></p>
                    <button className="pe-btn-danger" onClick={() => setShowDeleteModal(true)}>
                      <Trash2 size={15} /> Supprimer mon compte
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── MODAL SUSPENSION ── */}
      {showSuspendModal && (
        <div className="pe-modal-overlay">
          <div className="pe-modal">
            <div className="pe-modal-ico" style={{ background: 'rgba(217,119,6,.12)' }}>
              <PauseCircle size={26} style={{ color: '#d97706' }} />
            </div>
            <h3>Suspendre le compte ?</h3>
            <p>Votre compte sera temporairement désactivé. Vous pourrez le réactiver en vous reconnectant.</p>
            <div className="pe-modal-actions">
              <button className="pe-modal-cancel" onClick={() => setShowSuspendModal(false)}>Annuler</button>
              <button className="pe-modal-confirm warn" onClick={handleSuspendAccount} disabled={loading}>
                {loading ? 'Suspension…' : 'Suspendre'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL SUPPRESSION ── */}
      {showDeleteModal && (
        <div className="pe-modal-overlay">
          <div className="pe-modal">
            <div className="pe-modal-ico" style={{ background: 'rgba(239,68,68,.1)' }}>
              <Trash2 size={26} style={{ color: '#dc2626' }} />
            </div>
            <h3>Supprimer le compte ?</h3>
            <p>Cette action est <strong>irréversible</strong>. Toutes vos données seront définitivement supprimées.</p>
            <div className="pe-modal-actions">
              <button className="pe-modal-cancel" onClick={() => setShowDeleteModal(false)}>Annuler</button>
              <button className="pe-modal-confirm danger" onClick={handleDeleteAccount} disabled={loading}>
                {loading ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <Footer />
    </div>
  );
}