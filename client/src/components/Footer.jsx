import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Mail, Phone, MapPin, Leaf, Globe } from 'lucide-react';
import { FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { getSettings } from '../api/site';
import * as productsApi from '../api/products';

const Footer = () => {
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getSettings().then((response) => setSettings(response.data?.settings || null)).catch(() => {});
    productsApi.getCategories().then((res) => {
      if (res.success) setCategories(res.data?.categories || []);
    }).catch(() => {});
  }, []);

  const companyName = settings?.company_name || 'Karakurum Silkrute Traders';
  const address = [settings?.address_line, settings?.city].filter(Boolean).join(', ') || 'Danyore, Gilgit-Baltistan';

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand Section */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <Leaf className="logo-icon" />
              <span>{companyName}</span>
            </Link>
            <p className="footer-desc">
              {settings?.footer_text || settings?.tagline || 'Wholesale and retail trading for quality goods, sourced and delivered with care.'}
            </p>
            <div className="social-links">
              {settings?.facebook_url && <a href={settings.facebook_url} target="_blank" rel="noreferrer" aria-label="Facebook"><FaFacebook size={20} /></a>}
              {settings?.instagram_url && <a href={settings.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram"><FaInstagram size={20} /></a>}
              {settings?.website_url && <a href={settings.website_url} target="_blank" rel="noreferrer" aria-label="Website"><Globe size={20} /></a>}
              {settings?.whatsapp && <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><FaWhatsapp size={20} /></a>}
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links">
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/shop">All Products</Link></li>
              <li><Link to="/about">Our Story</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/faq">FAQs</Link></li>
            </ul>
          </div>

          {/* Categories - Dynamic from API */}
          <div className="footer-links">
            <h3>Categories</h3>
            <ul>
              {categories.length > 0 ? (
                categories.slice(0, 5).map((cat) => (
                  <li key={cat.id}><Link to={`/shop?category=${cat.slug}`}>{cat.name}</Link></li>
                ))
              ) : (
                <>
                  <li><Link to="/shop">Blankets & Textiles</Link></li>
                  <li><Link to="/shop">Home Items</Link></li>
                  <li><Link to="/shop">Trading Goods</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-contact">
            <h3>Contact Us</h3>
            <div className="contact-item">
              <MapPin size={18} />
              <span>{address}</span>
            </div>
            <div className="contact-item">
              <Phone size={18} />
              <span>{settings?.phone || 'Contact us for details'}</span>
            </div>
            <div className="contact-item">
              <Mail size={18} />
              <span>{settings?.email || 'Email us for details'}</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          <div className="footer-legal">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
