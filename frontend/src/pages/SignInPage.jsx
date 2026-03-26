import { SignIn } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { Link } from 'react-router-dom';
import { Music2, Disc3, Headphones, Sparkles } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-[#0d1033] to-[#1a0a2e]" />

        {/* Animated gradient orbs */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-brand-600/20 blur-[100px] animate-orb-1" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent-500/15 blur-[80px] animate-orb-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-emerald-500/10 blur-[60px] animate-orb-3" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo.svg" alt="Harmoniq" className="w-12 h-12 group-hover:scale-105 transition-transform" />
            <span className="text-xl font-bold text-white tracking-tight">Harmoniq</span>
          </Link>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            {/* Floating music visualization */}
            <div className="mb-10">
              <div className="flex items-end gap-[3px] h-16 mb-8 opacity-50">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[4px] rounded-full bg-gradient-to-t from-brand-500 to-accent-400"
                    style={{
                      animation: `equalizerBounce ${0.4 + Math.random() * 0.6}s ease-in-out ${Math.random() * 0.5}s infinite alternate`,
                      height: `${15 + Math.random() * 70}%`,
                    }}
                  />
                ))}
              </div>
            </div>

            <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-5">
              Welcome back to<br />
              <span className="bg-gradient-to-r from-brand-400 via-accent-400 to-emerald-400 bg-clip-text text-transparent">
                your music.
              </span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed mb-8">
              Sign in to access your playlists, discover personalized recommendations, and continue your musical journey.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Disc3, label: 'Your Playlists' },
                { icon: Sparkles, label: 'AI Picks' },
                { icon: Headphones, label: 'Personalized' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300">
                  <Icon className="w-4 h-4 text-brand-400" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom testimonial */}
          <div className="glass rounded-2xl p-5 max-w-md">
            <p className="text-sm text-slate-300 italic leading-relaxed mb-3">
              "Harmoniq completely changed how I discover music. The AI recommendations are spot on!"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-sm font-bold text-white">
                A
              </div>
              <div>
                <p className="text-sm font-medium text-white">Alex M.</p>
                <p className="text-xs text-slate-500">Music enthusiast</p>
              </div>
              <div className="ml-auto flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Sign In Form */}
      <div className="flex-1 flex items-center justify-center relative px-6 py-12">
        {/* Subtle background with more color */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f23] via-[#141428] to-[#0f0f23]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/6 rounded-full blur-[100px]" />

        <div className="relative z-10 w-full max-w-[440px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex flex-col items-center gap-3">
              <img src="/logo.svg" alt="Harmoniq" className="w-14 h-14" />
              <span className="text-2xl font-bold text-white">Harmoniq</span>
            </Link>
          </div>

          {/* Card wrapper for the form */}
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
            {/* Header */}
            <div className="mb-7">
              <h1 className="text-3xl font-extrabold text-white mb-2">Sign in</h1>
              <p className="text-slate-400 text-sm">
                Don't have an account?{' '}
                <Link to="/sign-up" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                  Sign up free →
                </Link>
              </p>
            </div>

            {/* Clerk Sign In — using dark base theme */}
            <SignIn
              appearance={{
                baseTheme: dark,
                variables: {
                  colorPrimary: '#4d73fd',
                  colorBackground: 'transparent',
                  colorInputBackground: 'rgba(255, 255, 255, 0.05)',
                  colorInputText: '#f1f5f9',
                  colorTextOnPrimaryBackground: '#ffffff',
                  colorText: '#e2e8f0',
                  colorTextSecondary: '#94a3b8',
                  colorDanger: '#f87171',
                  borderRadius: '0.75rem',
                  fontFamily: 'inherit',
                },
                elements: {
                  rootBox: 'w-full',
                  card: '!shadow-none !bg-transparent !border-0 !p-0 !m-0',
                  headerTitle: '!hidden',
                  headerSubtitle: '!hidden',
                  socialButtonsBlockButton: 'clerk-social-btn',
                  socialButtonsBlockButtonText: '!text-slate-200 !font-medium',
                  socialButtonsProviderIcon: '!w-5 !h-5',
                  dividerLine: '!bg-white/[0.08]',
                  dividerText: '!text-slate-500 !text-xs',
                  formFieldLabel: '!text-slate-300 !font-medium !text-sm',
                  formFieldInput: 'clerk-input',
                  formButtonPrimary: 'clerk-primary-btn',
                  footerActionLink: '!text-brand-400 hover:!text-brand-300 !font-medium',
                  footerActionText: '!text-slate-500 !text-sm',
                  identityPreviewEditButton: '!text-brand-400',
                  identityPreview: '!bg-white/[0.04] !border !border-white/[0.08] !rounded-xl',
                  identityPreviewText: '!text-slate-200',
                  formFieldAction: '!text-brand-400 hover:!text-brand-300 !text-sm',
                  card__main: '!gap-5',
                  footer: '!bg-transparent !border-0 !pb-0',
                  footerAction: '!bg-transparent',
                  otpCodeFieldInput: '!bg-white/[0.05] !border-white/[0.1] !rounded-lg !text-white',
                  alert: '!bg-red-500/10 !border !border-red-500/20 !rounded-xl',
                  alertText: '!text-red-300',
                  formFieldInputShowPasswordButton: '!text-slate-400 hover:!text-white',
                  formResendCodeLink: '!text-brand-400',
                },
                layout: {
                  socialButtonsPlacement: 'top',
                  showOptionalFields: false,
                },
              }}
              redirectUrl="/dashboard"
              signUpUrl="/sign-up"
            />
          </div>

          {/* Bottom decoration */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-600">
              By continuing, you agree to Harmoniq's Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
