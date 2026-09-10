import { useEffect, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Boxes, Plane, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getServices } from '../api/site';

const iconMap = {
  trade: BriefcaseBusiness,
  sourcing: Boxes,
  cargo: Plane,
  customs: ShieldCheck
};

const ServicesPage = () => {
  const [services, setServices] = useState([]);

  useEffect(() => {
    let mounted = true;
    getServices()
      .then((response) => {
        if (mounted) setServices(response.data?.services || []);
      })
      .catch(() => {
        if (mounted) setServices([]);
      });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <section className="relative overflow-hidden bg-primary-dark px-6 py-24 text-white md:py-32">
        <div className="container relative z-10 mx-auto max-w-5xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-emerald-300">What we do</p>
          <h1 className="max-w-3xl text-5xl font-black tracking-tight md:text-7xl">Trade made simpler.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-emerald-50/80 md:text-xl">
            From sourcing to delivery, we help businesses move quality goods with confidence.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-6 py-16">
        {services.length === 0 ? (
          <p className="py-16 text-center text-slate-500">Our services are being updated. Please check back soon.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {services.map((service, index) => {
              const Icon = iconMap[service.icon?.toLowerCase()] || BriefcaseBusiness;
              return (
                <motion.article
                  key={service.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-primary">
                    <Icon size={28} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{service.title}</h2>
                  <p className="mt-3 min-h-14 leading-relaxed text-slate-500">{service.description || 'Talk to our team about how we can help.'}</p>
                  <Link to="/contact" className="mt-8 inline-flex items-center gap-2 font-bold text-primary">
                    Talk to us <ArrowRight size={17} className="transition group-hover:translate-x-1" />
                  </Link>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ServicesPage;
