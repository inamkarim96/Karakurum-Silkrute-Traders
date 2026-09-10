import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Heart, Award, Truck } from "lucide-react";
import { Button, Card } from "../components/ui";
import { getSettings, getTeamMembers } from "../api/site";

const AboutPage = () => {
  const [settings, setSettings] = useState(null);
  const [team, setTeam] = useState([]);

  useEffect(() => {
    Promise.all([getSettings(), getTeamMembers()]).then(([settingsResponse, teamResponse]) => {
      setSettings(settingsResponse.data?.settings || null);
      setTeam(teamResponse.data?.team || []);
    }).catch(() => {});
  }, []);

  const companyName = settings?.company_name || "Karakurum Silkrute Traders";

  const fadeInVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center text-center text-white">
        <div className="absolute inset-0 z-0">
          <img 
            src={settings?.about_hero_image_url || "/images/about_hero.png"} 
            alt="About Hero" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/70 to-primary-dark/80"></div>
        </div>

        <div className="relative z-10 max-w-4xl px-6">
          <motion.h1
            className="text-5xl md:text-7xl font-black mb-6 tracking-tight drop-shadow-2xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Our Story
          </motion.h1>
          <motion.p
            className="text-lg md:text-2xl opacity-90 leading-relaxed font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            {settings?.tagline || "Connecting quality goods, trusted suppliers, and growing businesses."}
          </motion.p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInVariants}
          >
            <div className="space-y-8">
              <div className="relative">
                <h2 className="text-4xl md:text-5xl font-black text-primary leading-tight">Rooted in Nature</h2>
                <div className="absolute -bottom-4 left-0 w-20 h-2 bg-accent rounded-full"></div>
              </div>
              <p className="text-lg text-slate-500 leading-relaxed pt-4">
                At <strong className="text-slate-800">{companyName}</strong>, we connect customers and businesses
                with dependable products, practical sourcing, and responsive service.
              </p>
              <p className="text-lg text-slate-500 leading-relaxed">
                Our work brings together wholesale and retail trade, international sourcing,
                cargo coordination, and customs support from Danyore.
              </p>
            </div>
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/5 rounded-[2.5rem] -rotate-2 group-hover:rotate-0 transition-transform duration-500"></div>
              <img
                src={settings?.about_mission_image_url || "/images/about_mission.png"}
                alt="Sustainability and Nature"
                className="relative z-10 w-full aspect-[4/3] object-cover rounded-[2rem] shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInVariants}
          >
            <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">Our Values</h2>
            <p className="text-slate-500 text-lg font-medium">What drives us every single day to deliver the best for you.</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            <Card as={motion.div} variants={fadeInVariants} className="text-center p-8 hover:shadow-2xl transition-all duration-300 border-none group">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <ShieldCheck size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Quality Assured</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Every product vetted for durability and finish before it reaches you.
              </p>
            </Card>

            <Card as={motion.div} variants={fadeInVariants} className="text-center p-8 hover:shadow-2xl transition-all duration-300 border-none group">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Truck size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Fast Delivery</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Express shipping within 24–48 hours across Pakistan.
              </p>
            </Card>

            <Card as={motion.div} variants={fadeInVariants} className="text-center p-8 hover:shadow-2xl transition-all duration-300 border-none group">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
                <Heart size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Ethical Sourcing</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Fair trade practices that support suppliers and build sustainable partnerships.
              </p>
            </Card>

            <Card as={motion.div} variants={fadeInVariants} className="text-center p-8 hover:shadow-2xl transition-all duration-300 border-none group">
              <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                <Award size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Easy Returns</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Hassle-free 30-day returns on eligible items.
              </p>
            </Card>
          </motion.div>
        </div>
      </section>

      {team.length > 0 && (
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-4xl font-black text-slate-800 mb-4">Leadership</h2>
              <p className="text-slate-500 text-lg">Meet the people guiding our work and partnerships.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {team.map((member) => (
                <Card key={member.id} className="overflow-hidden border-none shadow-lg">
                  {member.photo_url ? (
                    <img src={member.photo_url} alt={member.name} className="w-full aspect-[4/3] object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full aspect-[4/3] bg-primary/10 flex items-center justify-center text-5xl font-black text-primary">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-800">{member.name}</h3>
                    <p className="mt-1 font-semibold text-primary">{member.title}</p>
                    {member.bio && <p className="mt-4 text-sm leading-relaxed text-slate-500">{member.bio}</p>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action Section */}
      <section className="py-24 bg-primary-dark text-white text-center">
        <motion.div
          className="container mx-auto px-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInVariants}
        >
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Work with {companyName}</h2>
          <p className="text-xl opacity-80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Explore our wholesale selection, sourcing services, and cargo solutions.
            Partner with a team that moves quality goods with confidence.
          </p>
          <Button as="a" href="/shop" variant="primary" size="lg" className="px-12 h-16 text-xl shadow-xl shadow-black/20">
            Shop Now
          </Button>
        </motion.div>
      </section>
    </div>
  );
};

export default AboutPage;
