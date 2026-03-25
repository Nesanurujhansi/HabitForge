import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Users, Trophy, BarChart2, ShieldCheck, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      title: 'Habit Tracking',
      desc: 'Build consistency with our intuitive daily tracker and reminder system.',
      icon: <CheckCircle2 className="text-primary" size={24} />
    },
    {
      title: 'Social Accountability',
      desc: 'Join groups and share your progress with friends to stay motivated.',
      icon: <Users className="text-secondary" size={24} />
    },
    {
      title: 'Habit Challenges',
      desc: 'Participate in community challenges and earn exclusive digital badges.',
      icon: <Trophy className="text-warning" size={24} />
    },
    {
      title: 'Progress Analytics',
      desc: 'Visualize your journey with beautiful charts and consistency scores.',
      icon: <BarChart2 className="text-success" size={24} />
    },
    {
      title: 'Gamification Rewards',
      desc: 'Level up your profile and unlock rewards as you hit your habit streaks.',
      icon: <ShieldCheck className="text-primary" size={24} />
    }
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold text-primary font-heading">HabitForge</div>
        <div className="hidden md:flex items-center space-x-8 text-text-secondary font-medium">
          <a href="#features" className="hover:text-primary">Features</a>
          <a href="#how-it-works" className="hover:text-primary">How It Works</a>
          <Link to="/login" className="hover:text-primary">Login</Link>
          <Link to="/register" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-20 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl font-bold font-heading mb-6 tracking-tight">
            Forge Better Habits, <span className="text-primary">Together.</span>
          </h1>
          <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
            HabitForge is the social accountability platform that turns your personal goals into shared triumphs. Track progress, join challenges, and level up with a community of achievers.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="btn-primary py-4 px-8 text-lg flex items-center justify-center gap-2">
              Start Your Journey <ArrowRight size={20} />
            </Link>
            <a href="#features" className="bg-white border border-border text-text-primary py-4 px-8 rounded-lg font-medium hover:bg-gray-50 transition-all flex items-center justify-center">
              Learn More
            </a>
          </div>
        </motion.div>
        
        <motion.div 
          className="mt-16 rounded-2xl shadow-2xl border border-border overflow-hidden bg-white max-w-5xl mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <img src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80" alt="Dashboard Preview" className="w-full h-auto opacity-80" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-heading mb-4">Built for Consistency</h2>
            <p className="text-text-secondary max-w-xl mx-auto">Everything you need to build lasting habits and achieve your most ambitious goals.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="p-8 rounded-2xl border border-border bg-background hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="bg-primary rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32"></div>
            
            <h2 className="text-4xl font-bold font-heading mb-6 relative z-10">Ready to forge your future?</h2>
            <p className="text-blue-100 mb-10 max-w-xl mx-auto relative z-10 text-lg">Join thousands of others building better lives one daily habit at a time.</p>
            <Link to="/register" className="bg-white text-primary py-4 px-10 rounded-xl font-bold hover:bg-blue-50 transition-all inline-block relative z-10">
              Create My Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-text-secondary">
          <div className="text-xl font-bold text-primary font-heading mb-4 md:mb-0">HabitForge</div>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="hover:text-primary">Privacy Policy</a>
            <a href="#" className="hover:text-primary">Terms of Service</a>
            <a href="#" className="hover:text-primary">Twitter</a>
            <a href="#" className="hover:text-primary">GitHub</a>
          </div>
          <p className="text-sm mt-4 md:mt-0">© 2026 HabitForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
