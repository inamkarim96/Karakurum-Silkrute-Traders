import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

import { getSettings } from '../api/site';

const LandingPage = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSettings().then((res) => setSettings(res.data?.settings || null)).catch(() => {});
  }, []);

  const features = [
    { icon: <ShieldCheck size={32} />, title: 'Quality Assured', desc: 'Every product vetted for durability and finish before it reaches you.' },
    { icon: <Truck size={32} />, title: 'Fast Delivery', desc: 'Express shipping within 24–48 hours across Pakistan.' },
    { icon: <RefreshCcw size={32} />, title: 'Easy Returns', desc: 'Hassle-free 30-day returns on eligible items.' },
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section
        className="hero"
        style={settings?.hero_image_url ? {
          backgroundImage: `url('${settings.hero_image_url}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : undefined}
      >
        <div className="hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Quality goods <br /><span>moved with confidence</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {settings?.tagline || 'Wholesale, retail, sourcing, cargo & customs support — all from Danyore.'}
          </motion.p>
          <motion.div
            className="hero-btns flex gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Button as={Link} to="/shop" variant="primary" size="lg" icon={ArrowRight}>
              Shop Now
            </Button>
            <Button as={Link} to="/about" variant="admin-outline" size="lg" className="border-white text-white hover:bg-white/10">
              Our Story
            </Button>
          </motion.div>
        </div>
        <div className="hero-overlay"></div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



    </div>
  );
};

export default LandingPage;
