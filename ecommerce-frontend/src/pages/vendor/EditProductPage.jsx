'use client';

// src/pages/vendor/EditProductPage.jsx
// ShopCI — Thème orange & blanc — Navbar unifiée (logo cliquable + retour seulement)

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Package, DollarSign, Hash, FileText, Upload, ArrowLeft, Save,
  AlertCircle, CheckCircle, X, Image as ImageIcon, Loader, Tag
} from 'lucide-react';
import { productsAPI, categoriesAPI, authAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import PageLoader from '../../components/Loader';

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = authAPI.getCurrentUser();

  const [formData, setFormData] = useState({ name:'', description:'', price:'', stock:'', category:'' });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [additionalImagesPreviews, setAdditionalImagesPreviews] = useState([]);
  const [existingAdditionalImages, setExistingAdditionalImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [success, setSuccess] = useState(false);

  const MAX_ADDITIONAL_IMAGES = 9;

  useEffect(() => {
    if (!user || user.user_type !== 'vendeur') { router.push('/login'); return; }
    loadCategories();
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const data = await productsAPI.getProduct(id);
      setFormData({ name: data.name||'', description: data.description||'', price: data.price||'', stock: data.stock||'', category: data.category||'' });
      if (data.image) setCurrentImage(data.image);
      if (data.images && Array.isArray(data.images)) setExistingAdditionalImages(data.images);
    } catch {
      setErrors({ general: 'Produit introuvable' });
    } finally {
      setLoadingProduct(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data.results || data || []);
    } catch {}
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const formatFcfa = (val) => {
    const num = parseInt(String(val).replace(/\s/g, ''), 10);
    if (isNaN(num)) return '';
    return num.toLocaleString('fr-FR');
  };

  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/\s/g, '').replace(/[^0-9]/g, '');
    setFormData({ ...formData, price: raw });
    if (errors.price) setErrors({ ...errors, price: '' });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5*1024*1024) { alert("L'image principale ne doit pas dépasser 5 MB"); return; }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);
    const total = existingAdditionalImages.length + additionalImages.length;
    const remaining = MAX_ADDITIONAL_IMAGES - total;
    if (files.length > remaining) { alert(`Vous pouvez ajouter seulement ${remaining} image(s) supplémentaire(s).`); return; }
    for (let file of files) { if (file.size > 5*1024*1024) { alert(`L'image ${file.name} dépasse 5 MB`); return; } }
    setAdditionalImages([...additionalImages, ...files]);
    const newPreviews = [...additionalImagesPreviews];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => { newPreviews.push(reader.result); setAdditionalImagesPreviews([...newPreviews]); };
      reader.readAsDataURL(file);
    });
  };

  const removeAdditionalImage = (index) => {
    setAdditionalImages(additionalImages.filter((_,i) => i !== index));
    setAdditionalImagesPreviews(additionalImagesPreviews.filter((_,i) => i !== index));
  };

  const removeExistingImage = (imageId) => {
    setExistingAdditionalImages(existingAdditionalImages.filter(img => img.id !== imageId));
    setImagesToDelete([...imagesToDelete, imageId]);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `http://localhost:8000${cleanPath}`;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name || formData.name.length < 3) newErrors.name = 'Le nom doit contenir au moins 3 caractères';
    if (!formData.description || formData.description.length < 10) newErrors.description = 'La description doit contenir au moins 10 caractères';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Le prix doit être supérieur à 0 FCFA';
    if (formData.price && parseFloat(formData.price) > 99999999999) newErrors.price = 'Le prix ne peut pas dépasser 999 999 999 99 FCFA';
    if (!formData.stock || parseInt(formData.stock) < 0) newErrors.stock = 'Le stock doit être un nombre positif';
    if (!formData.category) newErrors.category = 'Veuillez sélectionner une catégorie';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true); setErrors({});
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('stock', formData.stock);
      formDataToSend.append('category', formData.category);
      if (image) formDataToSend.append('image', image);
      if (imagesToDelete.length > 0) formDataToSend.append('delete_images', JSON.stringify(imagesToDelete));
      additionalImages.forEach((img) => formDataToSend.append('additional_images', img));
      await productsAPI.update(id, formDataToSend);
      setSuccess(true);
      setTimeout(() => router.push('/vendor/dashboard'), 2000);
    } catch (err) {
      if (err.response?.data) setErrors(err.response.data);
      else setErrors({ general: 'Erreur lors de la mise à jour du produit' });
    } finally {
      setLoading(false);
    }
  };

  /* ── Loader partagé ── */
  if (loadingProduct) return <PageLoader message="Chargement du produit…" />;

  return (
    <div style={{ fontFamily:"'DM Sans','Inter',sans-serif", background:'var(--bg)', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

        /* ── PAGE HERO ── */
        .ep-hero{background:var(--card);border-bottom:1px solid var(--border)}
        .ep-hero-inner{max-width:960px;margin:0 auto;padding:28px 20px 24px;display:flex;align-items:center;gap:16px}
        .ep-hero-icon{width:52px;height:52px;background:linear-gradient(135deg,#1a1a1a,#374151);border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;box-shadow:0 4px 16px rgba(0,0,0,0.18)}
        .ep-h1{font-size:24px;font-weight:800;letter-spacing:-0.5px;color:var(--text);margin:0 0 4px}
        .ep-subtitle{font-size:14px;color:var(--text2);margin:0}

        /* ── MAIN ── */
        .ep-main{max-width:960px;margin:0 auto;padding:32px 20px 48px;flex:1}
        .ep-form{display:flex;flex-direction:column;gap:24px}
        .ep-alert{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:12px;font-size:14px}
        .ep-alert-error{background:rgba(239,68,68,.08);color:#dc2626;border:1px solid rgba(239,68,68,.25)}

        /* ── SUCCESS ── */
        .ep-success-card{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:64px 40px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.06)}
        .ep-success-icon{display:inline-flex;align-items:center;justify-content:center;width:80px;height:80px;background:rgba(22,163,74,.1);border-radius:50%;color:#16a34a;margin-bottom:20px}
        .ep-success-title{font-size:22px;font-weight:800;color:var(--text);margin:0 0 8px}
        .ep-success-sub{font-size:14px;color:var(--text2);margin:0 0 28px}

        /* ── SECTIONS ── */
        .ep-section{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:20px;box-shadow:0 2px 12px rgba(0,0,0,0.04)}
        .ep-section-header{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:700;color:var(--text);padding-bottom:12px;border-bottom:1px solid var(--border)}
        .ep-ico-orange{color:#f97316}
        .ep-field{display:flex;flex-direction:column;gap:6px}
        .ep-label{font-size:13.5px;font-weight:600;color:var(--text)}
        .ep-required{color:#f97316;margin-left:2px}
        .ep-optional{color:var(--text3);font-weight:400}
        .ep-hint{font-size:12px;color:var(--text3);margin:4px 0 0}
        .ep-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .ep-input-wrap{position:relative}
        .ep-input-ico{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none}
        .ep-input-ico-top{top:16px;transform:none}
        .ep-input{width:100%;padding:11px 14px 11px 40px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;font-family:inherit;color:var(--text);background:var(--input);outline:none;transition:border-color .18s,box-shadow .18s;box-sizing:border-box}
        .ep-input::placeholder{color:var(--text3)}
        .ep-input:focus{border-color:#f97316;background:var(--card);box-shadow:0 0 0 3px rgba(249,115,22,0.1)}
        .ep-input-error{border-color:#fca5a5 !important;background:rgba(239,68,68,.06) !important}
        .ep-textarea{padding-top:13px;resize:vertical;min-height:110px}
        .ep-select{appearance:none;cursor:pointer}
        .ep-error-msg{display:flex;align-items:center;gap:5px;font-size:12.5px;color:#dc2626;margin:2px 0 0}

        /* ── IMAGES ── */
        .ep-hidden{display:none}
        .ep-img-upload-row{display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap}
        .ep-img-placeholder{width:100px;height:100px;background:var(--bg3);border:2px dashed var(--border);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .ep-img-placeholder-ico{color:var(--text3)}
        .ep-img-preview-wrap{position:relative;flex-shrink:0}
        .ep-img-preview{width:100px;height:100px;object-fit:cover;border-radius:12px;border:2px solid #f97316;display:block}
        .ep-img-remove{position:absolute;top:-8px;right:-8px;width:22px;height:22px;background:#ef4444;color:#fff;border:none;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .18s,transform .15s}
        .ep-img-remove:hover{background:#dc2626;transform:scale(1.12)}
        .ep-img-upload-info{display:flex;flex-direction:column;gap:8px}
        .ep-img-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:10px;margin-bottom:12px}
        .ep-img-thumb-wrap{position:relative}
        .ep-img-thumb{width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px;border:1.5px solid var(--border);display:block;transition:transform .18s}
        .ep-img-thumb:hover{transform:scale(1.04)}
        .ep-upload-btn{display:inline-flex;align-items:center;gap:8px;padding:9px 18px;background:rgba(249,115,22,.1);color:#f97316;border:1.5px solid rgba(249,115,22,.3);border-radius:10px;font-size:13.5px;font-weight:600;cursor:pointer;transition:background .18s,border-color .18s,transform .15s}
        .ep-upload-btn:hover{background:rgba(249,115,22,.18);border-color:#f97316;transform:translateY(-1px)}
        .ep-upload-btn-ghost{background:var(--card);color:var(--text2);border-color:var(--border)}
        .ep-upload-btn-ghost:hover{background:var(--bg3);border-color:var(--text3);color:var(--text);transform:translateY(-1px)}

        /* ── ACTIONS ── */
        .ep-actions{display:flex;gap:12px;justify-content:flex-end;padding-top:4px}
        .ep-btn-orange{display:inline-flex;align-items:center;gap:8px;padding:13px 28px;background:#f97316;color:#fff;border:none;border-radius:12px;font-size:14.5px;font-weight:700;font-family:inherit;cursor:pointer;transition:background .18s,transform .15s,box-shadow .18s;box-shadow:0 4px 16px rgba(249,115,22,0.3)}
        .ep-btn-orange:hover:not(:disabled){background:#ea6a0a;transform:translateY(-1px);box-shadow:0 6px 20px rgba(249,115,22,0.4)}
        .ep-btn-orange:disabled{opacity:.5;cursor:not-allowed}
        .ep-btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:13px 28px;background:var(--card);color:var(--text2);border:1.5px solid var(--border);border-radius:12px;font-size:14.5px;font-weight:600;font-family:inherit;cursor:pointer;transition:background .18s,border-color .18s,color .18s}
        .ep-btn-ghost:hover{background:var(--bg3);border-color:#f97316;color:#f97316}
        .ep-spin{animation:ep-spin .8s linear infinite}
        @keyframes ep-spin{to{transform:rotate(360deg)}}

        /* ── RESPONSIVE ── */
        @media(max-width:640px){
          .ep-hero-inner{padding:20px 16px 18px}
          .ep-main{padding:20px 16px 36px}
          .ep-section{padding:18px 14px}
          .ep-grid-2{grid-template-columns:1fr}
          .ep-actions{flex-direction:column-reverse}
          .ep-btn-orange,.ep-btn-ghost{width:100%;justify-content:center}
          .ep-h1{font-size:20px}
          .ep-hero-icon{width:44px;height:44px;border-radius:12px}
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <Navbar pageCourante="/vendor/add-product" />

      {/* ── PAGE HERO ── */}
      <div className="ep-hero">
        <div className="ep-hero-inner">
          <div className="ep-hero-icon"><Save size={26}/></div>
          <div>
            <h1 className="ep-h1">Modifier le produit</h1>
            <p className="ep-subtitle">Mettez à jour les informations de votre article</p>
          </div>
        </div>
      </div>

      <main className="ep-main">
        {success ? (
          <div className="ep-success-card">
            <div className="ep-success-icon"><CheckCircle size={52}/></div>
            <h2 className="ep-success-title">Produit modifié avec succès !</h2>
            <p className="ep-success-sub">Vos modifications ont été enregistrées et sont visibles en boutique.</p>
            <button className="ep-btn-orange" onClick={() => router.push('/vendor/dashboard')}>Retour au tableau de bord</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="ep-form">

            {errors.general && (
              <div className="ep-alert ep-alert-error">
                <AlertCircle size={18}/><span>{errors.general}</span>
              </div>
            )}

            {/* ═══ Images ═══ */}
            <div className="ep-section">
              <div className="ep-section-header">
                <ImageIcon size={18} className="ep-ico-orange"/><span>Images du produit</span>
              </div>

              {/* Image principale */}
              <div className="ep-field">
                <label className="ep-label">Image principale</label>
                <div className="ep-img-upload-row">
                  {imagePreview || currentImage ? (
                    <div className="ep-img-preview-wrap">
                      <img src={imagePreview || getImageUrl(currentImage)} alt="Aperçu" className="ep-img-preview"
                        onError={(e) => { e.target.src='https://placehold.co/100x100/fff7ed/f97316?text=?'; }}/>
                      <button type="button" className="ep-img-remove"
                        onClick={() => { setImage(null); setImagePreview(null); setCurrentImage(null); }}>
                        <X size={14}/>
                      </button>
                    </div>
                  ) : (
                    <div className="ep-img-placeholder">
                      <Upload size={28} className="ep-img-placeholder-ico"/>
                    </div>
                  )}
                  <div className="ep-img-upload-info">
                    <input type="file" accept="image/*" onChange={handleImageChange} className="ep-hidden" id="image-upload"/>
                    <label htmlFor="image-upload" className="ep-upload-btn">
                      <Upload size={16}/> Changer l'image principale
                    </label>
                    <p className="ep-hint">JPG, PNG ou GIF — max 5 MB</p>
                  </div>
                </div>
              </div>

              {/* Images existantes */}
              {existingAdditionalImages.length > 0 && (
                <div className="ep-field">
                  <label className="ep-label">Images existantes <span className="ep-optional">({existingAdditionalImages.length})</span></label>
                  <div className="ep-img-grid">
                    {existingAdditionalImages.map((img) => (
                      <div key={img.id} className="ep-img-thumb-wrap">
                        <img src={getImageUrl(img.image)} alt={`Image ${img.id}`} className="ep-img-thumb"
                          onError={(e) => { e.target.src='https://placehold.co/80x80/fff7ed/f97316?text=?'; }}/>
                        <button type="button" className="ep-img-remove" onClick={() => removeExistingImage(img.id)}><X size={12}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nouvelles images */}
              {additionalImagesPreviews.length > 0 && (
                <div className="ep-field">
                  <label className="ep-label">Nouvelles images <span className="ep-optional">({additionalImagesPreviews.length})</span></label>
                  <div className="ep-img-grid">
                    {additionalImagesPreviews.map((preview, index) => (
                      <div key={index} className="ep-img-thumb-wrap">
                        <img src={preview} alt={`Nouveau ${index+1}`} className="ep-img-thumb"/>
                        <button type="button" className="ep-img-remove" onClick={() => removeAdditionalImage(index)}><X size={12}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton ajout */}
              {(existingAdditionalImages.length + additionalImages.length) < MAX_ADDITIONAL_IMAGES && (
                <div className="ep-field">
                  <input type="file" accept="image/*" multiple onChange={handleAdditionalImagesChange} className="ep-hidden" id="additional-images-upload"/>
                  <label htmlFor="additional-images-upload" className="ep-upload-btn ep-upload-btn-ghost">
                    <ImageIcon size={16}/> Ajouter des images ({existingAdditionalImages.length + additionalImages.length}/{MAX_ADDITIONAL_IMAGES})
                  </label>
                  <p className="ep-hint" style={{ marginTop:'6px' }}>Sélectionnez plusieurs images — 5 MB max par image</p>
                </div>
              )}
            </div>

            {/* ═══ Informations ═══ */}
            <div className="ep-section">
              <div className="ep-section-header">
                <Package size={18} className="ep-ico-orange"/><span>Informations du produit</span>
              </div>

              <div className="ep-field">
                <label className="ep-label" htmlFor="name">Nom du produit <span className="ep-required">*</span></label>
                <div className="ep-input-wrap">
                  <Package size={17} className="ep-input-ico"/>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleChange}
                    className={`ep-input${errors.name ? ' ep-input-error' : ''}`} placeholder="Ex : iPhone 14 Pro Max"/>
                </div>
                {errors.name && <p className="ep-error-msg"><AlertCircle size={13}/> {errors.name}</p>}
              </div>

              <div className="ep-field">
                <label className="ep-label" htmlFor="description">Description <span className="ep-required">*</span></label>
                <div className="ep-input-wrap">
                  <FileText size={17} className="ep-input-ico ep-input-ico-top"/>
                  <textarea id="description" name="description" value={formData.description} onChange={handleChange}
                    rows={4} className={`ep-input ep-textarea${errors.description ? ' ep-input-error' : ''}`}
                    placeholder="Décrivez votre produit en détail…"/>
                </div>
                {errors.description && <p className="ep-error-msg"><AlertCircle size={13}/> {errors.description}</p>}
              </div>

              <div className="ep-grid-2">
                <div className="ep-field">
                  <label className="ep-label" htmlFor="price">Prix (FCFA) <span className="ep-required">*</span></label>
                  <div className="ep-input-wrap" style={{ position:'relative' }}>
                    <DollarSign size={17} className="ep-input-ico"/>
                    <input
                      type="text"
                      id="price"
                      name="price"
                      value={formatFcfa(formData.price)}
                      onChange={handlePriceChange}
                      inputMode="numeric"
                      placeholder="Ex : 150 000"
                      className={`ep-input${errors.price ? ' ep-input-error' : ''}`}
                      style={{ paddingRight: '60px' }}
                    />
                    <span style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', fontWeight:700, color:'var(--text3)', pointerEvents:'none', userSelect:'none' }}>FCFA</span>
                  </div>
                  {formData.price && !errors.price && (
                    <p style={{ fontSize:'12px', color:'#22c55e', fontWeight:600, marginTop:'4px' }}>
                      ✓ {parseInt(formData.price).toLocaleString('fr-FR')} FCFA
                    </p>
                  )}
                  {errors.price && <p className="ep-error-msg"><AlertCircle size={13}/> {errors.price}</p>}
                </div>
                <div className="ep-field">
                  <label className="ep-label" htmlFor="stock">Stock (unités) <span className="ep-required">*</span></label>
                  <div className="ep-input-wrap">
                    <Hash size={17} className="ep-input-ico"/>
                    <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange}
                      min="0" className={`ep-input${errors.stock ? ' ep-input-error' : ''}`} placeholder="0"/>
                  </div>
                  {errors.stock && <p className="ep-error-msg"><AlertCircle size={13}/> {errors.stock}</p>}
                </div>
              </div>

              <div className="ep-field">
                <label className="ep-label" htmlFor="category">Catégorie <span className="ep-required">*</span></label>
                <div className="ep-input-wrap">
                  <Tag size={17} className="ep-input-ico"/>
                  <select id="category" name="category" value={formData.category} onChange={handleChange}
                    className={`ep-input ep-select${errors.category ? ' ep-input-error' : ''}`}>
                    <option value="">Sélectionnez une catégorie</option>
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                {errors.category && <p className="ep-error-msg"><AlertCircle size={13}/> {errors.category}</p>}
              </div>
            </div>

            <div className="ep-actions">
              <button type="button" className="ep-btn-ghost" onClick={() => router.push('/vendor/dashboard')}>Annuler</button>
              <button type="submit" className="ep-btn-orange" disabled={loading}>
                {loading ? <><Loader size={18} className="ep-spin"/> Mise à jour…</> : <><Save size={18}/> Enregistrer les modifications</>}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* ── FOOTER ── */}
      <Footer />
    </div>
  );
}