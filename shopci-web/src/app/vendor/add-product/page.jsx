'use client';

// src/pages/vendor/AddProductPage.jsx
// ShopCI — Thème orange & blanc — Navbar unifiée (logo cliquable + retour seulement)

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, DollarSign, Hash, FileText, Upload, ArrowLeft, Save,
  AlertCircle, CheckCircle, X, Image as ImageIcon, Loader, Tag
} from 'lucide-react';
import { productsAPI, categoriesAPI, authAPI } from '@/services/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AddProductPage() {
  const router = useRouter();
  const user = authAPI.getCurrentUser();

  const [formData, setFormData] = useState({ name: '', description: '', price: '', stock: '', category: '' });
  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [additionalImagesPreviews, setAdditionalImagesPreviews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const MAX_ADDITIONAL_IMAGES = 9;

  useEffect(() => {
    if (!user || user.user_type !== 'vendeur') { router.push('/login'); return; }
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data.results || data || []);
    } catch { setCategories([]); }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  // Formate un nombre brut en FCFA lisible : 1500000 → "1 500 000"
  const formatFcfa = (val) => {
    const num = parseInt(String(val).replace(/\s/g, ''), 10);
    if (isNaN(num)) return '';
    return num.toLocaleString('fr-FR');
  };

  // Gestion saisie prix : on stocke la valeur brute (chiffres seulement)
  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/\s/g, '').replace(/[^0-9]/g, '');
    setFormData({ ...formData, price: raw });
    if (errors.price) setErrors({ ...errors, price: '' });
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("L'image principale ne doit pas dépasser 5 MB"); return; }
    setMainImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setMainImagePreview(reader.result);
    reader.readAsDataURL(file);
    if (errors.image) setErrors({ ...errors, image: '' });
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);
    const remaining = MAX_ADDITIONAL_IMAGES - additionalImages.length;
    if (files.length > remaining) { alert(`Vous pouvez ajouter seulement ${remaining} image(s) supplémentaire(s).`); return; }
    for (let f of files) { if (f.size > 5 * 1024 * 1024) { alert(`L'image ${f.name} dépasse 5 MB`); return; } }
    setAdditionalImages([...additionalImages, ...files]);
    const newPreviews = [...additionalImagesPreviews];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => { newPreviews.push(reader.result); setAdditionalImagesPreviews([...newPreviews]); };
      reader.readAsDataURL(file);
    });
  };

  const removeAdditionalImage = (index) => {
    setAdditionalImages(additionalImages.filter((_, i) => i !== index));
    setAdditionalImagesPreviews(additionalImagesPreviews.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const e = {};
    if (!formData.name || formData.name.length < 3) e.name = 'Le nom doit contenir au moins 3 caractères';
    if (!formData.description || formData.description.length < 10) e.description = 'La description doit contenir au moins 10 caractères';
    if (!formData.price || parseFloat(formData.price) <= 0) e.price = 'Le prix doit être supérieur à 0 FCFA';
    if (formData.price && parseFloat(formData.price) > 99999999999) e.price = 'Le prix ne peut pas dépasser 999 999 999 99 FCFA';
    if (!formData.stock || parseInt(formData.stock) < 0) e.stock = 'Le stock doit être un nombre positif';
    if (!formData.category) e.category = 'Veuillez sélectionner une catégorie';
    if (!mainImage) e.image = 'Veuillez ajouter une image principale du produit';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if (!validateForm()) return;
    setLoading(true); setErrors({});
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      if (mainImage) fd.append('image', mainImage);
      additionalImages.forEach(img => fd.append('additional_images', img));
      await productsAPI.create(fd);
      setSuccess(true);
      setTimeout(() => router.push('/vendor/dashboard'), 2000);
    } catch (err) {
      setErrors(err.response?.data || { general: "Erreur lors de l'ajout du produit" });
    } finally { setLoading(false); }
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

    /* ── PAGE TITLE ── */
    .ap-page-title{max-width:960px;margin:0 auto;padding:32px 20px 0}
    .ap-page-title h1{font-size:26px;font-weight:800;color:var(--text);margin:0 0 4px;letter-spacing:-0.5px}
    .ap-page-title p{font-size:14px;color:var(--text3);margin:0}

    /* ── CARD & SECTIONS ── */
    .ap-card{max-width:960px;margin:24px auto 48px;padding:0 20px}
    .ap-section{background:var(--card);border:1.5px solid var(--border);border-radius:18px;overflow:hidden;margin-bottom:20px;box-shadow:0 2px 12px rgba(0,0,0,.04)}
    .ap-section-header{display:flex;align-items:center;gap:10px;padding:16px 24px;border-bottom:1.5px solid var(--border);background:var(--bg3)}
    .ap-section-icon{width:34px;height:34px;background:rgba(249,115,22,.12);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#f97316}
    .ap-section-header span{font-size:14px;font-weight:700;color:var(--text)}
    .ap-section-body{padding:24px}
    .ap-field{display:flex;flex-direction:column;gap:6px;margin-bottom:20px}
    .ap-field:last-child{margin-bottom:0}
    .ap-label{font-size:13px;font-weight:600;color:var(--text)}
    .req{color:#f97316}
    .ap-input-wrap{position:relative}
    .ap-ico{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none}
    .ap-ico-top{top:16px;transform:none}
    .ap-input,.ap-textarea,.ap-select{width:100%;box-sizing:border-box;padding:13px 14px 13px 44px;border:1.5px solid var(--border);border-radius:12px;font-size:14px;color:var(--text);font-family:inherit;background:var(--input);transition:border-color .18s,box-shadow .18s;outline:none}
    .ap-input:focus,.ap-textarea:focus,.ap-select:focus{border-color:#f97316;box-shadow:0 0 0 3px rgba(249,115,22,.10);background:var(--card)}
    .ap-input.apErr,.ap-textarea.apErr,.ap-select.apErr{border-color:#f87171;box-shadow:0 0 0 3px rgba(248,113,113,.10)}
    .ap-input::placeholder,.ap-textarea::placeholder{color:var(--text3)}
    .ap-textarea{padding-top:14px;resize:vertical;min-height:110px}
    .ap-select{appearance:none}
    .ap-err-msg{display:flex;align-items:center;gap:5px;font-size:12.5px;color:#ef4444;margin-top:4px}
    .ap-grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}

    /* ── IMAGES ── */
    .ap-img-row{display:flex;align-items:flex-start;gap:20px;flex-wrap:wrap}
    .ap-img-placeholder{width:120px;height:120px;min-width:120px;border:2px dashed var(--border);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text3);gap:6px;font-size:11px;cursor:pointer;transition:all .18s;background:var(--bg3)}
    .ap-img-placeholder:hover{border-color:#f97316;color:#f97316;background:rgba(249,115,22,.08)}
    .ap-img-prev{width:120px;height:120px;min-width:120px;object-fit:cover;border-radius:14px;border:2px solid #f97316}
    .ap-img-prev-wrap{position:relative;width:120px;height:120px}
    .ap-img-rm{position:absolute;top:-8px;right:-8px;background:#ef4444;color:#fff;border:2px solid var(--card);border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .18s}
    .ap-img-rm:hover{background:#dc2626}
    .ap-upload-info{flex:1}
    .ap-upload-btn{display:inline-flex;align-items:center;gap:8px;background:var(--card);border:1.5px solid var(--border);color:var(--text);font-size:13.5px;font-weight:600;padding:10px 18px;border-radius:10px;cursor:pointer;transition:all .18s;font-family:inherit}
    .ap-upload-btn:hover{border-color:#f97316;color:#f97316;background:rgba(249,115,22,.08)}
    .ap-upload-hint{font-size:12px;color:var(--text3);margin-top:8px}
    .ap-add-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:12px;margin-bottom:14px}
    .ap-add-img-wrap{position:relative}
    .ap-add-img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;border:1.5px solid var(--border)}

    /* ── ALERTES ── */
    .ap-alert{display:flex;align-items:flex-start;gap:10px;padding:14px 18px;border-radius:12px;font-size:13.5px;margin-bottom:16px}
    .ap-alert-err{background:rgba(239,68,68,.08);border:1.5px solid rgba(239,68,68,.25);color:#dc2626}
    .ap-alert-warn{background:rgba(217,119,6,.08);border:1.5px solid rgba(217,119,6,.25);color:#d97706}

    /* ── SUCCESS ── */
    .ap-success-wrap{background:var(--card);border:1.5px solid var(--border);border-radius:20px;padding:64px 40px;text-align:center;max-width:480px;margin:60px auto;box-shadow:0 4px 24px rgba(0,0,0,.06)}
    .ap-success-icon{width:72px;height:72px;background:linear-gradient(135deg,#22c55e,#16a34a);border-radius:20px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(34,197,94,.35)}
    .ap-success-wrap h2{font-size:22px;font-weight:800;color:var(--text);margin:0 0 8px}
    .ap-success-wrap p{font-size:14px;color:var(--text3);margin:0 0 24px}
    .ap-success-btn{background:#f97316;color:#fff;border:none;padding:12px 28px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;transition:background .18s;font-family:inherit}
    .ap-success-btn:hover{background:#ea6a0a}

    /* ── ACTIONS ── */
    .ap-actions{display:flex;gap:12px;padding-bottom:8px}
    .ap-btn-cancel{flex:1;background:var(--card);border:1.5px solid var(--border);color:var(--text);font-size:14px;font-weight:700;padding:14px;border-radius:12px;cursor:pointer;transition:all .18s;font-family:inherit}
    .ap-btn-cancel:hover{border-color:#f97316;color:#f97316;background:rgba(249,115,22,.08)}
    .ap-btn-submit{flex:2;background:#f97316;border:none;color:#fff;font-size:14px;font-weight:700;padding:14px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .18s;box-shadow:0 4px 16px rgba(249,115,22,.30);font-family:inherit}
    .ap-btn-submit:hover:not(:disabled){background:#ea6a0a;transform:translateY(-1px)}
    .ap-btn-submit:disabled{opacity:.55;cursor:not-allowed}
    @keyframes spin{to{transform:rotate(360deg)}}

    /* ── RESPONSIVE ── */
    @media(max-width:640px){
      .ap-grid2{grid-template-columns:1fr}
      .ap-page-title{padding:20px 16px 0}
      .ap-card{padding:0 12px}
      .ap-section-body{padding:16px}
      .ap-section-header{padding:14px 16px}
      .ap-actions{flex-direction:column}
      .ap-btn-cancel,.ap-btn-submit{flex:unset;width:100%;justify-content:center}
    }
  `;

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:"'DM Sans','Inter',sans-serif", display:'flex', flexDirection:'column' }}>
      <style>{css}</style>

      {/* ── NAVBAR ── */}
      <Navbar pageCourante="/vendor/add-product" />

      {success ? (
        <>
          <div className="ap-success-wrap">
            <div className="ap-success-icon"><CheckCircle size={40} color="#fff"/></div>
            <h2>Produit ajouté !</h2>
            <p>Votre produit est maintenant visible dans votre catalogue.</p>
            <button className="ap-success-btn" onClick={() => router.push('/vendor/dashboard')}>Retour au tableau de bord</button>
          </div>
          <Footer />
        </>
      ) : (
        <>
          <div style={{ flex: 1 }}>
            <div className="ap-page-title">
              <h1>Nouveau produit</h1>
              <p>Remplissez les informations de votre produit pour le publier sur ShopCI.</p>
            </div>

            <div className="ap-card">
              {errors.general && (
                <div className="ap-alert ap-alert-err"><AlertCircle size={18} style={{flexShrink:0}}/><span>{errors.general}</span></div>
              )}
              {categories.length === 0 && (
                <div className="ap-alert ap-alert-warn">
                  <AlertCircle size={18} style={{flexShrink:0}}/>
                  <div><strong>Aucune catégorie disponible</strong><br/>Veuillez créer des catégories dans l'administration.</div>
                </div>
              )}

              {/* Section Images */}
              <div className="ap-section">
                <div className="ap-section-header">
                  <div className="ap-section-icon"><ImageIcon size={17}/></div>
                  <span>Visuels du produit</span>
                </div>
                <div className="ap-section-body">
                  <div className="ap-field">
                    <label className="ap-label">Image principale <span className="req">*</span></label>
                    <div className="ap-img-row">
                      {mainImagePreview ? (
                        <div className="ap-img-prev-wrap">
                          <img src={mainImagePreview} alt="Aperçu" className="ap-img-prev"/>
                          <button type="button" className="ap-img-rm" onClick={() => { setMainImage(null); setMainImagePreview(null); }}><X size={12}/></button>
                        </div>
                      ) : (
                        <label htmlFor="main-img-add">
                          <div className="ap-img-placeholder"><Upload size={24}/><span>Image principale</span></div>
                        </label>
                      )}
                      <div className="ap-upload-info">
                        <input type="file" accept="image/*" onChange={handleMainImageChange} id="main-img-add" style={{display:'none'}}/>
                        <label htmlFor="main-img-add" className="ap-upload-btn"><Upload size={16}/> Choisir l'image principale</label>
                        <p className="ap-upload-hint">JPG, PNG ou GIF · Max 5 MB</p>
                      </div>
                    </div>
                    {errors.image && <span className="ap-err-msg"><AlertCircle size={13}/>{errors.image}</span>}
                  </div>

                  <div className="ap-field">
                    <label className="ap-label">Images additionnelles <span style={{color:'var(--text3)',fontWeight:400}}>(max {MAX_ADDITIONAL_IMAGES})</span></label>
                    {additionalImagesPreviews.length > 0 && (
                      <div className="ap-add-grid">
                        {additionalImagesPreviews.map((src, i) => (
                          <div key={i} className="ap-add-img-wrap">
                            <img src={src} alt={`img ${i+1}`} className="ap-add-img"/>
                            <button type="button" className="ap-img-rm" style={{width:20,height:20}} onClick={() => removeAdditionalImage(i)}><X size={10}/></button>
                          </div>
                        ))}
                      </div>
                    )}
                    {additionalImages.length < MAX_ADDITIONAL_IMAGES && (
                      <>
                        <input type="file" accept="image/*" multiple onChange={handleAdditionalImagesChange} id="add-imgs" style={{display:'none'}}/>
                        <label htmlFor="add-imgs" className="ap-upload-btn" style={{width:'fit-content'}}><ImageIcon size={16}/> Ajouter des images ({additionalImages.length}/{MAX_ADDITIONAL_IMAGES})</label>
                        <p className="ap-upload-hint">Sélectionnez plusieurs images · 5 MB max chacune</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Section Infos */}
              <div className="ap-section">
                <div className="ap-section-header">
                  <div className="ap-section-icon"><Package size={17}/></div>
                  <span>Informations du produit</span>
                </div>
                <div className="ap-section-body">
                  <div className="ap-field">
                    <label className="ap-label">Nom du produit <span className="req">*</span></label>
                    <div className="ap-input-wrap">
                      <Package size={16} className="ap-ico"/>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: iPhone 14 Pro Max" className={`ap-input${errors.name?' apErr':''}`}/>
                    </div>
                    {errors.name && <span className="ap-err-msg"><AlertCircle size={13}/>{errors.name}</span>}
                  </div>

                  <div className="ap-field">
                    <label className="ap-label">Description <span className="req">*</span></label>
                    <div className="ap-input-wrap">
                      <FileText size={16} className="ap-ico ap-ico-top"/>
                      <textarea name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Décrivez votre produit en détail..." className={`ap-textarea${errors.description?' apErr':''}`}/>
                    </div>
                    {errors.description && <span className="ap-err-msg"><AlertCircle size={13}/>{errors.description}</span>}
                  </div>

                  <div className="ap-grid2">
                    <div className="ap-field">
                      <label className="ap-label">Prix (FCFA) <span className="req">*</span></label>
                      <div className="ap-input-wrap" style={{ display:'flex', alignItems:'center' }}>
                        <DollarSign size={16} className="ap-ico"/>
                        <input
                          type="text"
                          name="price"
                          value={formatFcfa(formData.price)}
                          onChange={handlePriceChange}
                          inputMode="numeric"
                          placeholder="Ex : 150 000"
                          className={`ap-input${errors.price?' apErr':''}`}
                          style={{ paddingRight: '60px' }}
                        />
                        <span style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', fontWeight:700, color:'var(--text3)', pointerEvents:'none', userSelect:'none' }}>FCFA</span>
                      </div>
                      {formData.price && !errors.price && (
                        <span style={{ fontSize:'12px', color:'#22c55e', fontWeight:600, marginTop:'4px', display:'block' }}>
                          ✓ {parseInt(formData.price).toLocaleString('fr-FR')} FCFA
                        </span>
                      )}
                      {errors.price && <span className="ap-err-msg"><AlertCircle size={13}/>{errors.price}</span>}
                    </div>
                    <div className="ap-field">
                      <label className="ap-label">Stock (unités) <span className="req">*</span></label>
                      <div className="ap-input-wrap">
                        <Hash size={16} className="ap-ico"/>
                        <input type="number" name="stock" value={formData.stock} onChange={handleChange} min="0" placeholder="0" className={`ap-input${errors.stock?' apErr':''}`}/>
                      </div>
                      {errors.stock && <span className="ap-err-msg"><AlertCircle size={13}/>{errors.stock}</span>}
                    </div>
                  </div>

                  <div className="ap-field">
                    <label className="ap-label">Catégorie <span className="req">*</span></label>
                    <div className="ap-input-wrap">
                      <Tag size={16} className="ap-ico"/>
                      <select name="category" value={formData.category} onChange={handleChange} disabled={categories.length===0} className={`ap-select${errors.category?' apErr':''}`} style={{paddingLeft:'44px'}}>
                        <option value="">{categories.length===0?'Aucune catégorie disponible':'Sélectionnez une catégorie'}</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    {errors.category && <span className="ap-err-msg"><AlertCircle size={13}/>{errors.category}</span>}
                  </div>
                </div>
              </div>

              <div className="ap-actions">
                <button type="button" className="ap-btn-cancel" onClick={() => router.push('/vendor/dashboard')}>Annuler</button>
                <button type="button" className="ap-btn-submit" disabled={loading||categories.length===0} onClick={handleSubmit}>
                  {loading
                    ? <><Loader size={18} style={{animation:'spin 1s linear infinite'}}/> Ajout en cours...</>
                    : <><Save size={18}/> Ajouter le produit</>
                  }
                </button>
              </div>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <Footer />
        </>
      )}
    </div>
  );
}