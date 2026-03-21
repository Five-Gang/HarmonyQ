import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  Music2, ListMusic, Star, Headphones, Sparkles, Play,
  ChevronRight, Zap, Users, Radio, Disc3, AudioWaveform
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

/* ─── Animated gradient orbs background ─── */
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-brand-600/8 blur-[120px] animate-orb-1" />
      <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-accent-500/8 blur-[100px] animate-orb-2" />
      <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full bg-emerald-500/6 blur-[100px] animate-orb-3" />
    </div>
  );
}

/* ─── Visualizer bars animation ─── */
function VisualizerBars({ count = 40 }) {
  return (
    <div className="flex items-end justify-center gap-[3px] h-20 opacity-60">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-brand-500 to-accent-400"
          style={{
            animation: `equalizerBounce ${0.4 + Math.random() * 0.6}s ease-in-out ${Math.random() * 0.5}s infinite alternate`,
            height: `${12 + Math.random() * 60}%`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Floating music cards ─── */
function FloatingCard({ title, artist, gradient, delay, className }) {
  return (
    <div
      className={`absolute glass rounded-2xl p-4 shadow-card animate-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center mb-2`}>
        <Music2 className="w-5 h-5 text-white" />
      </div>
      <p className="text-sm font-semibold text-white truncate">{title}</p>
      <p className="text-xs text-slate-400">{artist}</p>
    </div>
  );
}

/* ─── Feature card ─── */
function FeatureCard({ icon: Icon, title, description, gradient, delay }) {
  return (
    <div
      className="group relative rounded-2xl bg-surface-1 border border-white/5 p-6 transition-all duration-500 hover:border-white/10 hover:-translate-y-1 hover:shadow-glow animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

/* ─── Stat counter ─── */
function StatCounter({ value, label }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const end = parseInt(value.replace(/\D/g, ''));
    const suffix = value.replace(/[\d]/g, '');
    const duration = 1500;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { start = end; clearInterval(timer); }
      setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [visible, value]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">
        {count.toLocaleString()}{value.replace(/[\d,]/g, '')}
      </p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
    </div>
  );
}

/* ─── Genre pill ─── */
const genres = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Jazz', 'R&B', 'Classical', 'Indie', 'K-Pop', 'Latin', 'Country', 'Metal'];
function GenreCarousel() {
  return (
    <div className="flex flex-wrap justify-center gap-3 animate-fade-in" style={{ animationDelay: '600ms' }}>
      {genres.map((g, i) => (
        <span
          key={g}
          className="px-4 py-2 rounded-full text-sm font-medium border transition-all duration-300 cursor-default hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${['#2b4ef7','#a855f7','#059669','#e11d48','#d97706','#06b6d4','#7c3aed','#ec4899','#f59e0b','#14b8a6','#f97316','#6366f1'][i]}15, transparent)`,
            borderColor: `${['#2b4ef7','#a855f7','#059669','#e11d48','#d97706','#06b6d4','#7c3aed','#ec4899','#f59e0b','#14b8a6','#f97316','#6366f1'][i]}30`,
            color: ['#7ca0ff','#c084fc','#34d399','#fb7185','#fbbf24','#22d3ee','#a78bfa','#f472b6','#fbbf24','#2dd4bf','#fb923c','#818cf8'][i],
          }}
        >
          {g}
        </span>
      ))}
    </div>
  );
}

/* ─── Main landing page ─── */
export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-surface text-slate-200 overflow-x-hidden">
      <FloatingOrbs />

      {/* ─── NAV ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollY > 40 ? 'bg-surface/80 backdrop-blur-xl border-b border-white/5 shadow-lg' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Harmoniq</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#genres" className="hover:text-white transition-colors">Genres</a>
            <a href="#stats" className="hover:text-white transition-colors">Community</a>
          </div>

          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <Link to="/dashboard" className="btn-primary text-sm">
                Go to Dashboard <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/sign-in" className="hidden sm:inline-flex btn-ghost text-sm">
                  Log in
                </Link>
                <Link to="/sign-up" className="btn-primary text-sm">
                  Get started free <ChevronRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Text */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              AI-Powered Music Discovery
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6 animate-fade-in-up">
              <span className="text-white">Your music,</span>
              <br />
              <span className="bg-gradient-to-r from-brand-400 via-accent-400 to-emerald-400 bg-clip-text text-transparent">
                reimagined.
              </span>
            </h1>

            <p className="text-lg text-slate-400 max-w-xl leading-relaxed mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              Create stunning playlists, discover hidden gems, and let our AI recommend tracks tailored to your taste. Your personal DJ, powered by intelligence.
            </p>

            <div className="flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <Link
                to={isSignedIn ? '/dashboard' : '/sign-up'}
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:shadow-glow hover:scale-[1.02] active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Listening Free
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20 transition-all duration-300"
              >
                Learn More
              </a>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-6 mt-10 text-sm text-slate-500 animate-fade-in" style={{ animationDelay: '600ms' }}>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Free to use
              </span>
              <span>•</span>
              <span>No credit card</span>
              <span>•</span>
              <span>Instant setup</span>
            </div>
          </div>

          {/* Right — Visual */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Main player card */}
              <div className="relative glass rounded-3xl p-6 shadow-2xl border border-white/10 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                {/* Album art */}
                <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-brand-900 via-surface-2 to-accent-900/40 mb-5 flex items-center justify-center overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent" />
                  <Disc3 className="w-32 h-32 text-brand-500/30 animate-spin-slow" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <VisualizerBars count={50} />
                  </div>
                </div>

                {/* Track info */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white font-bold text-lg">Neon Dreams</p>
                    <p className="text-slate-400 text-sm">SynthWave Artist</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition">
                      <Star className="w-4 h-4 text-accent-400" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative h-1 rounded-full bg-white/10 mb-3">
                  <div className="absolute h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 w-[65%]" />
                  <div className="absolute h-3 w-3 rounded-full bg-white shadow-lg top-1/2 -translate-y-1/2 left-[65%] -translate-x-1/2" />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>2:34</span>
                  <span>3:52</span>
                </div>
              </div>

              {/* Floating cards */}
              <FloatingCard
                title="Midnight City"
                artist="M83"
                gradient="bg-gradient-to-br from-violet-600 to-fuchsia-500"
                delay={0}
                className="top-8 -left-16 w-44 hidden xl:block"
              />
              <FloatingCard
                title="Starboy"
                artist="The Weeknd"
                gradient="bg-gradient-to-br from-amber-500 to-rose-500"
                delay={1.5}
                className="-bottom-4 -right-12 w-44 hidden xl:block"
              />
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce text-slate-500">
          <span className="text-xs">Scroll</span>
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1">
            <div className="w-1.5 h-2.5 rounded-full bg-brand-400 animate-scroll-dot" />
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="relative py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-brand-400 font-semibold text-sm tracking-wider uppercase mb-3">Why Harmoniq?</p>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
              Everything you need to
              <span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent"> feel the music</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Powered by smart recommendations and a beautiful interface, Harmoniq transforms how you discover, organize, and enjoy your music.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Sparkles}
              title="AI Recommendations"
              description="Our intelligent engine learns your taste and serves up personalized tracks you'll love — no more endless scrolling."
              gradient="bg-gradient-to-br from-brand-500 to-brand-700"
              delay={0}
            />
            <FeatureCard
              icon={ListMusic}
              title="Smart Playlists"
              description="Create, organize, and share playlists effortlessly. Drag, reorder, and curate your perfect vibe for every moment."
              gradient="bg-gradient-to-br from-accent-500 to-accent-700"
              delay={100}
            />
            <FeatureCard
              icon={Radio}
              title="Vast Catalog"
              description="Browse thousands of songs across every genre imaginable. Filter, search, and discover music from all corners of the world."
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
              delay={200}
            />
            <FeatureCard
              icon={Users}
              title="Social Profiles"
              description="Build your music identity. Share your taste, view listening stats, and connect over shared favorites."
              gradient="bg-gradient-to-br from-rose-500 to-rose-700"
              delay={300}
            />
            <FeatureCard
              icon={Zap}
              title="Lightning Fast"
              description="Built on microservices architecture for blazing speed. Every interaction is instant, every page loads in milliseconds."
              gradient="bg-gradient-to-br from-amber-500 to-amber-700"
              delay={400}
            />
            <FeatureCard
              icon={Headphones}
              title="Personalized Experience"
              description="From your dashboard to recommendations, everything is tailored to you. Your music, your way."
              gradient="bg-gradient-to-br from-cyan-500 to-cyan-700"
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* ─── GENRES ─── */}
      <section id="genres" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-900/5 to-transparent" />
        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="text-center mb-12">
            <p className="text-accent-400 font-semibold text-sm tracking-wider uppercase mb-3">Explore</p>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">Every genre, one place</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Whether you're into chart-toppers or underground indie — we've got the sounds you crave.
            </p>
          </div>
          <GenreCarousel />
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section id="stats" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="glass rounded-3xl p-10 lg:p-16 border border-white/5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCounter value="10000+" label="Songs Available" />
              <StatCounter value="5000+" label="Playlists Created" />
              <StatCounter value="1200+" label="Active Users" />
              <StatCounter value="99+" label="Genres Covered" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="relative rounded-3xl bg-gradient-to-br from-brand-900/50 via-surface-1 to-accent-900/20 p-12 lg:p-16 border border-white/5 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-brand-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent-500/10 rounded-full blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 mb-6 shadow-glow-accent">
                <AudioWaveform className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-4">
                Ready to feel the beat?
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto mb-8 text-lg">
                Join Harmoniq today and unlock a world of personalized music discovery. It's free, it's fast, and it's waiting for you.
              </p>
              <Link
                to={isSignedIn ? '/dashboard' : '/sign-up'}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-600 hover:to-accent-600 text-white font-bold px-10 py-4 rounded-2xl text-lg transition-all duration-300 hover:shadow-glow-accent hover:scale-[1.02] active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                {isSignedIn ? 'Go to Dashboard' : 'Get Started — It\'s Free'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <Music2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">Harmoniq</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#genres" className="hover:text-white transition-colors">Genres</a>
            <Link to="/sign-in" className="hover:text-white transition-colors">Sign In</Link>
          </div>
          <p className="text-xs text-slate-600">
            © 2026 Harmoniq. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
