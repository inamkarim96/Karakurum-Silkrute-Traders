import { useState, useEffect, useRef } from 'react';
import { Save, Image, X, Upload } from 'lucide-react';
import { Button, Input } from '../components/ui';
import * as siteApi from '../api/site';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = {
  company_name: '',
  tagline: '',
  logo_url: '',
  address_line: '',
  city: '',
  email: '',
  notification_email: '',
  phone: '',
  whatsapp: '',
  facebook_url: '',
  instagram_url: '',
  website_url: '',
  map_embed_url: '',
  footer_text: '',
  // Page images
  hero_image_url: '',
  about_hero_image_url: '',
  about_mission_image_url: '',
  contact_hero_image_url: ''
};

// Fields that map to actual page images, shown in the Page Images section
const PAGE_IMAGE_FIELDS = [
  {
    key: 'hero_image_url',
    label: 'Landing Page Hero',
    hint: 'Full-width background for the main landing page hero section.'
  },
  {
    key: 'about_hero_image_url',
    label: 'About Page Hero',
    hint: 'Full-width background at the top of the About page.'
  },
  {
    key: 'about_mission_image_url',
    label: 'About — Mission Photo',
    hint: 'The "Rooted in Nature" side image on the About page.'
  },
  {
    key: 'contact_hero_image_url',
    label: 'Contact Page Hero',
    hint: 'Full-width background at the top of the Contact page.'
  }
];

/**
 * Reusable image picker used for each page image field.
 * Shows the current image, lets the admin upload a new file or clear it.
 */
const ImagePicker = ({ label, hint, value, fieldKey, onUpload, onRemove, uploading }) => {
  const fileRef = useRef(null);

  return (
    <div className="admin-form-section" style={{ marginBottom: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>{label}</span>
          {hint && <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.125rem' }}>{hint}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            className="hidden"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.[0]) onUpload(fieldKey, e.target.files[0]);
              e.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="admin-ghost"
            size="sm"
            icon={Upload}
            loading={uploading === fieldKey}
            onClick={() => fileRef.current?.click()}
          >
            {value ? 'Change' : 'Upload'}
          </Button>
          {value && (
            <Button
              type="button"
              variant="admin-danger"
              size="sm"
              icon={X}
              onClick={() => onRemove(fieldKey)}
              title="Remove image"
            />
          )}
        </div>
      </div>

      {value ? (
        <div style={{ position: 'relative', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <img
            src={value}
            alt={label}
            style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
          />
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: '120px',
            border: '2px dashed #CBD5E1',
            borderRadius: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: '#94A3B8',
            cursor: 'pointer',
            background: '#F8FAFC'
          }}
          onClick={() => fileRef.current?.click()}
        >
          <Image size={28} />
          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Click to upload image</span>
        </div>
      )}
    </div>
  );
};

const AdminSettings = () => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState(null); // tracks which image field is uploading

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await siteApi.getSettings();
      if (res.success) {
        const s = res.data?.settings || {};
        setFormData({
          company_name: s.company_name || '',
          tagline: s.tagline || '',
          logo_url: s.logo_url || '',
          address_line: s.address_line || '',
          city: s.city || '',
          email: s.email || '',
          phone: s.phone || '',
          whatsapp: s.whatsapp || '',
          facebook_url: s.facebook_url || '',
          instagram_url: s.instagram_url || '',
          website_url: s.website_url || '',
          map_embed_url: s.map_embed_url || '',
          footer_text: s.footer_text || '',
          hero_image_url: s.hero_image_url || '',
          about_hero_image_url: s.about_hero_image_url || '',
          about_mission_image_url: s.about_mission_image_url || '',
          contact_hero_image_url: s.contact_hero_image_url || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      toast.error('Unable to load site settings. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /** Upload a picked file to Cloudinary and store the returned URL in formData */
  const handleImageUpload = async (fieldKey, file) => {
    try {
      setUploadingField(fieldKey);
      const res = await siteApi.uploadSettingsImage(file);
      if (res.success && res.data?.url) {
        setFormData((prev) => ({ ...prev, [fieldKey]: res.data.url }));
        toast.success('Image uploaded — click Save Settings to apply.');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error(err?.response?.data?.error?.message || 'Image upload failed');
    } finally {
      setUploadingField(null);
    }
  };

  /** Clear a page image URL from the form (save still required to persist) */
  const handleImageRemove = (fieldKey) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: '' }));
    toast('Image removed — click Save Settings to apply.', { icon: '🗑️' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.company_name.trim()) {
      toast.error('Company name is required');
      return;
    }
    try {
      setSaving(true);
      const res = await siteApi.updateSettings(formData);
      if (res.success) {
        toast.success('Site settings updated successfully');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error(err?.response?.data?.error?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Loading site settings...</div>;
  }

  return (
    <div className="admin-management">
      <div className="page-header">
        <div>
          <h1>Site Settings</h1>
          <p>
            This information is shown across the whole site — Navbar, Footer, About, and Contact pages
            all pull from here. Update it once and every page reflects the change automatically.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        <div className="admin-form-section">
          <h3 className="text-sm font-semibold text-slate-600 mb-3">Company Identity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name *"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              placeholder="e.g., Karakurum Silkrute Traders"
              required
            />
            <Input
              label="Tagline"
              name="tagline"
              value={formData.tagline}
              onChange={handleChange}
              placeholder="e.g., Wholesale & Retail Trading - Blankets & Home Items"
            />
            <div className="admin-form-group md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Logo</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <Input
                    label="Logo URL"
                    name="logo_url"
                    value={formData.logo_url}
                    onChange={handleChange}
                    placeholder="https://... (or upload below)"
                    helpText="Leave blank to show the company name as a text logo."
                  />
                </div>
                <div style={{ marginTop: '1.75rem' }}>
                  <ImagePicker
                    label="Upload Logo"
                    hint="PNG, JPG, WebP — will be hosted on Cloudinary"
                    value={formData.logo_url}
                    fieldKey="logo_url"
                    onUpload={handleImageUpload}
                    onRemove={handleImageRemove}
                    uploading={uploadingField}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-form-section">
          <h3 className="text-sm font-semibold text-slate-600 mb-3">Address &amp; Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Address Line"
              name="address_line"
              value={formData.address_line}
              onChange={handleChange}
              placeholder="e.g., Fida Jan Plaza, Baig Market"
              containerClassName="md:col-span-2"
            />
            <Input
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="e.g., Danyore"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g., info@yourcompany.com"
            />
            <Input
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g., +92 3XX XXXXXXX"
            />
            <Input
              label="WhatsApp"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="e.g., +92 3XX XXXXXXX"
            />
          </div>
        </div>

        <div className="admin-form-section">
          <h3 className="text-sm font-semibold text-slate-600 mb-1">🔔 Notification Preferences</h3>
          <p className="text-xs text-slate-500 mb-3">
            Configure where store notifications (new customer orders, delivery alerts) are dispatched.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Admin Notification Email"
              name="notification_email"
              type="email"
              value={formData.notification_email || ''}
              onChange={handleChange}
              placeholder="e.g., orders@yourcompany.com"
              helpText="New order alert emails will be sent here. If blank, system defaults to the main admin account email."
            />
          </div>
        </div>

        <div className="admin-form-section">
          <h3 className="text-sm font-semibold text-slate-600 mb-3">Social &amp; Map</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Facebook URL"
              name="facebook_url"
              value={formData.facebook_url}
              onChange={handleChange}
              placeholder="https://facebook.com/..."
            />
            <Input
              label="Instagram URL"
              name="instagram_url"
              value={formData.instagram_url}
              onChange={handleChange}
              placeholder="https://instagram.com/..."
            />
            <Input
              label="Website URL"
              name="website_url"
              value={formData.website_url}
              onChange={handleChange}
              placeholder="https://yourwebsite.com"
            />
            <div className="admin-form-group md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Google Maps Embed URL</label>
              <textarea
                className="admin-input w-full"
                name="map_embed_url"
                rows={2}
                value={formData.map_embed_url}
                onChange={handleChange}
                placeholder="Paste the Google Maps embed src URL for the Contact page"
              />
            </div>
          </div>
        </div>

        <div className="admin-form-section">
          <h3 className="text-sm font-semibold text-slate-600 mb-3">Footer</h3>
          <div className="admin-form-group">
            <label className="block text-sm font-medium text-slate-700 mb-1">Footer Text</label>
            <textarea
              className="admin-input w-full"
              name="footer_text"
              rows={3}
              value={formData.footer_text}
              onChange={handleChange}
              placeholder="Short line shown at the bottom of every page, e.g. business hours or a tagline"
            />
          </div>
        </div>

        {/* ── Page Images ───────────────────────────────────────────── */}
        <div className="admin-form-section">
          <h3 className="text-sm font-semibold text-slate-600 mb-1">Page Images</h3>
          <p className="text-xs text-slate-400 mb-4">
            Upload or replace the hero / section photos shown on the public pages.
            After uploading, click <strong>Save Settings</strong> to publish the change.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PAGE_IMAGE_FIELDS.map(({ key, label, hint }) => (
              <ImagePicker
                key={key}
                fieldKey={key}
                label={label}
                hint={hint}
                value={formData[key]}
                onUpload={handleImageUpload}
                onRemove={handleImageRemove}
                uploading={uploadingField}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="admin-primary" icon={Save} loading={saving}>
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
