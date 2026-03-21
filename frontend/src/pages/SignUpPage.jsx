import { SignUp } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { Link } from 'react-router-dom';
import { Music2, Disc3, ListMusic, Star, Zap, Users } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#0d1033] to-brand-900" />

        {/* Animated gradient orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent-500/20 blur-[100px] animate-orb-2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-brand-600/15 blur-[80px] animate-orb-1" />
        <div className="absolute top-1/3 left-1/3 w-[350px] h-[350px] rounded-full bg-emerald-500/8 blur-[70px] animate-orb-3" />

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
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <Music2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Harmoniq</span>
          </Link>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            {/* Spinning disc */}
            <div className="mb-8">
              <div className="relative w-32 h-32">
                <Disc3 className="w-32 h-32 text-accent-500/20 animate-spin-slow" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-500 to-brand-500 flex items-center justify-center shadow-glow-accent">
                    <Music2 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-5">
              Start your<br />
              <span className="bg-gradient-to-r from-accent-400 via-brand-400 to-emerald-400 bg-clip-text text-transparent">
                music journey.
              </span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed mb-8">
              Join thousands of music lovers. Create playlists, discover new tracks, and let AI curate your perfect soundtrack.
            </p>

            {/* Benefits */}
            <div className="space-y-4">
              {[
                { icon: Star, label: 'AI-powered recommendations tailored to your taste', color: 'text-amber-400' },
                { icon: ListMusic, label: 'Unlimited playlist creation and curation', color: 'text-brand-400' },
                { icon: Zap, label: 'Lightning-fast, always-on microservices', color: 'text-emerald-400' },
                { icon: Users, label: 'Connect and share with other music lovers', color: 'text-accent-400' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <p className="text-sm text-slate-300">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {['#3b82f6', '#a855f7', '#059669', '#f59e0b', '#ef4444'].map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-[#0d1033] flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: color, zIndex: 5 - i }}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium text-white">1,200+ music lovers</p>
              <p className="text-xs text-slate-500">already on Harmoniq</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Sign Up Form */}
      <div className="flex-1 flex items-center justify-center relative px-6 py-12">
        {/* Subtle background with more color */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f23] via-[#141428] to-[#0f0f23]" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-accent-500/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-600/8 rounded-full blur-[100px]" />

        <div className="relative z-10 w-full max-w-[440px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-glow">
                <Music2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Harmoniq</span>
            </Link>
          </div>

          {/* Card wrapper for the form */}
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
            {/* Header */}
            <div className="mb-7">
              <h1 className="text-3xl font-extrabold text-white mb-2">Create account</h1>
              <p className="text-slate-400 text-sm">
                Already have an account?{' '}
                <Link to="/sign-in" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                  Sign in →
                </Link>
              </p>
            </div>

            {/* Clerk Sign Up — using dark base theme */}
            <SignUp
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
              signInUrl="/sign-in"
              afterSignUpUrl="/dashboard"
            />
          </div>

          {/* Bottom */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-600">
              By creating an account, you agree to Harmoniq's Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
