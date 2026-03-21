import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { PlayerProvider } from './context/PlayerContext.jsx';
import { ListeningHistoryTracker } from './components/ListeningHistoryTracker.jsx';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Show a setup guide if Clerk key is missing
if (!PUBLISHABLE_KEY) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <SetupGuide />
    </React.StrictMode>
  );
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: '#4d73fd',
            colorBackground: '#0f0f1a',
            colorInputBackground: 'rgba(255, 255, 255, 0.06)',
            colorInputText: '#f1f5f9',
            colorText: '#e2e8f0',
            colorTextSecondary: '#94a3b8',
            borderRadius: '0.75rem',
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <PlayerProvider>
            <ListeningHistoryTracker>
              <App />
            </ListeningHistoryTracker>
          </PlayerProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1e1e35',
                color: '#e2e8f0',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
              },
              success: { iconTheme: { primary: '#4d73fd', secondary: '#0f0f1a' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#0f0f1a' } },
            }}
          />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </ClerkProvider>
    </React.StrictMode>
  );
}

function SetupGuide() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '640px',
        width: '100%',
        background: '#16162a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        padding: '2.5rem',
        color: '#e2e8f0',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #2b4ef7, #a855f7)',
            borderRadius: '16px',
            fontSize: '2rem',
            marginBottom: '1rem',
          }}>
            🎵
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', margin: '0 0 0.5rem' }}>
            Harmoniq Setup Required
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Add your Clerk Publishable Key to get started
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            {
              num: '1',
              title: 'Create a Clerk account',
              desc: 'Go to clerk.com and create a free account + new application',
              action: { label: 'Open Clerk →', href: 'https://clerk.com' },
            },
            {
              num: '2',
              title: 'Copy your Publishable Key',
              desc: 'In Clerk Dashboard → API Keys → copy the "Publishable key" (starts with pk_test_...)',
            },
            {
              num: '3',
              title: 'Create frontend/.env file',
              desc: null,
              code: 'VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx',
            },
            {
              num: '4',
              title: 'Add JWKS URL to backend services',
              desc: 'In each service .env file, set:',
              code: 'CLERK_JWKS_URL=https://YOUR_DOMAIN.clerk.accounts.dev/.well-known/jwks.json',
            },
            {
              num: '5',
              title: 'Restart the dev server',
              desc: null,
              code: 'cd frontend && npm run dev',
            },
          ].map((step) => (
            <div key={step.num} style={{
              display: 'flex',
              gap: '1rem',
              padding: '1rem',
              background: '#1e1e35',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2b4ef7, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'white',
                flexShrink: 0,
              }}>
                {step.num}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: 'white', margin: '0 0 0.25rem', fontSize: '0.9rem' }}>{step.title}</p>
                {step.desc && <p style={{ color: '#94a3b8', margin: '0 0 0.5rem', fontSize: '0.82rem' }}>{step.desc}</p>}
                {step.code && (
                  <code style={{
                    display: 'block',
                    background: '#0f0f1a',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.78rem',
                    color: '#7ca0ff',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                  }}>
                    {step.code}
                  </code>
                )}
                {step.action && (
                  <a href={step.action.href} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-block',
                    marginTop: '0.5rem',
                    padding: '0.35rem 0.85rem',
                    background: '#2b4ef7',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}>
                    {step.action.label}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div style={{
          padding: '1rem',
          background: 'rgba(43, 78, 247, 0.1)',
          border: '1px solid rgba(43, 78, 247, 0.2)',
          borderRadius: '12px',
          fontSize: '0.82rem',
          color: '#7ca0ff',
          lineHeight: 1.5,
        }}>
          💡 <strong>Tip:</strong> Clerk is free for development. The Publishable Key is safe to use in frontend code — it's designed to be public.
        </div>
      </div>
    </div>
  );
}
