import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Send, Globe } from 'lucide-react';
import { FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { Button, Input, Card } from '../components/ui';
import { getSettings } from '../api/site';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSettings().then((response) => setSettings(response.data?.settings || null)).catch(() => {});
  }, []);

  const address = [settings?.address_line, settings?.city].filter(Boolean).join(', ') || 'Danyore, Gilgit-Baltistan';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call for form submission
    setTimeout(() => {
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 1000);
  };

  const fadeInVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Hero Section */}
      <section className="relative h-[45vh] min-h-[350px] flex items-center justify-center text-center text-white mb-[-4rem]">
        <div className="absolute inset-0 z-0">
          <img
            src={settings?.contact_hero_image_url || "/images/contact_hero.png"}
            alt="Contact Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary-dark/90"></div>
        </div>

        <div className="relative z-10 max-w-3xl px-6">
          <motion.h1
            className="text-5xl md:text-6xl font-black mb-6 tracking-tight drop-shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Get in Touch
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl opacity-90 leading-relaxed font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            We'd love to hear from you. Whether you have a question about our products, sourcing, or just want to say hello, we're here.
          </motion.p>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="container mx-auto px-6 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-12">

          {/* Contact Information */}
          <motion.div
            className="lg:col-span-5 bg-primary-dark text-white p-8 md:p-12 rounded-[2rem] shadow-2xl"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInVariants} className="mb-12">
              <h2 className="text-3xl font-black mb-4">Contact Information</h2>
              <p className="text-emerald-100/70 text-lg">Reach out to us directly through any of the channels below.</p>
            </motion.div>

            <div className="space-y-10">
              <motion.div variants={fadeInVariants} className="flex items-start gap-6 group">
                <div className="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                  <MapPin size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Our Store</h3>
                  <p className="text-emerald-100/60 leading-relaxed">{address}</p>
                </div>
              </motion.div>

              <motion.div variants={fadeInVariants} className="flex items-start gap-6 group">
                <div className="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                  <Phone size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Call Us</h3>
                  <p className="text-emerald-100/60 leading-relaxed">{settings?.phone || 'Contact us for details'}</p>
                </div>
              </motion.div>

              <motion.div variants={fadeInVariants} className="flex items-start gap-6 group">
                <div className="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                  <Mail size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Email Us</h3>
                  <p className="text-emerald-100/60 leading-relaxed">{settings?.email || 'Email us for details'}</p>
                </div>
              </motion.div>

              {settings?.facebook_url && (
                <motion.div variants={fadeInVariants} className="flex items-start gap-6 group">
                  <div className="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    <FaFacebook size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Facebook</h3>
                    <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="text-emerald-100/60 hover:text-white transition-colors underline">{settings.facebook_url}</a>
                  </div>
                </motion.div>
              )}

              {settings?.instagram_url && (
                <motion.div variants={fadeInVariants} className="flex items-start gap-6 group">
                  <div className="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    <FaInstagram size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Instagram</h3>
                    <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="text-emerald-100/60 hover:text-white transition-colors underline">{settings.instagram_url}</a>
                  </div>
                </motion.div>
              )}

              {settings?.website_url && (
                <motion.div variants={fadeInVariants} className="flex items-start gap-6 group">
                  <div className="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    <Globe size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Website</h3>
                    <a href={settings.website_url} target="_blank" rel="noreferrer" className="text-emerald-100/60 hover:text-white transition-colors underline">{settings.website_url}</a>
                  </div>
                </motion.div>
              )}

              {settings?.whatsapp && (
                <motion.div variants={fadeInVariants} className="flex items-start gap-6 group">
                  <div className="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    <FaWhatsapp size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">WhatsApp</h3>
                    <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-100/60 hover:text-white transition-colors underline">Chat on WhatsApp</a>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Contact Form */}
          <Card
            as={motion.div}
            className="lg:col-span-6 p-8 md:p-12 border-none shadow-xl bg-white"
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
          >
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-800 mb-2">Send a Message</h2>
              <p className="text-slate-500">Fill out the form below and we will get back to you within 24 hours.</p>
            </div>

            {isSubmitted && (
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl mb-8 font-bold border border-emerald-100 animate-in fade-in slide-in-from-top-4 duration-500">
                ✨ Thank you! Your message has been successfully sent.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Jane Doe"
                  containerClassName="mb-0"
                />

                <Input
                  label="Email Address"
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="jane@example.com"
                  containerClassName="mb-0"
                />
              </div>

              <Input
                label="Subject"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="How can we help?"
                containerClassName="mb-0"
              />

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Write your message here..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none min-h-[150px] resize-none font-medium text-slate-800"
                ></textarea>
              </div>

              <Button type="submit" variant="primary" icon={Send} className="w-full h-14 text-lg">
                Send Message
              </Button>
            </form>
          </Card>

        </div>
        {settings?.map_embed_url && (
          <div className="mt-12 overflow-hidden rounded-[2rem] bg-white shadow-xl">
            <iframe
              title="Company location"
              src={settings.map_embed_url}
              className="h-80 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </section>
    </div>
  );
};

export default ContactPage;
