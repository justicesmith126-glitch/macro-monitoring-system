import React, { useState } from 'react';
import IntakeForm from './components/IntakeForm';
import OnboardingDashboard from './components/OnboardingDashboard';

export default function App() {
  const [view, setView] = useState('intake');

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <div className="brand">
          <span style={{ fontSize: 22 }}>📊</span>
          Financial Planning Client Portal
          <span>CFP Best Practice Edition</span>
        </div>
        <div className="nav-tabs">
          <button
            className={`nav-tab ${view === 'intake' ? 'active' : ''}`}
            onClick={() => setView('intake')}
          >
            Client Intake Form
          </button>
          <button
            className={`nav-tab ${view === 'onboarding' ? 'active' : ''}`}
            onClick={() => setView('onboarding')}
          >
            Onboarding Dashboard
          </button>
        </div>
      </nav>

      <main className="main-content">
        {view === 'intake' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>
                New Client Financial Planning Questionnaire
              </h1>
              <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
                This comprehensive intake form follows CFP Board practice standards and Kitces/NAPFA best practices.
                All information is confidential and used solely for your financial planning engagement.
                The form auto-saves as you move between steps — you can complete it in multiple sessions.
              </p>
            </div>
            <IntakeForm />
          </>
        )}

        {view === 'onboarding' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>
                Client Onboarding Dashboard
              </h1>
              <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
                6-phase onboarding workflow based on Kitces, CFP Board, and industry best practices.
                Track progress, manage tasks, and access discovery meeting question banks.
              </p>
            </div>
            <OnboardingDashboard />
          </>
        )}
      </main>

      <footer style={{
        textAlign: 'center', padding: '16px', fontSize: 12,
        color: 'var(--gray-400)', borderTop: '1px solid var(--gray-100)',
        background: '#fff',
      }}>
        Built on CFP Board Practice Standards · Kitces.com Research · NAPFA Best Practices · FPA Risk Tolerance Framework
      </footer>
    </div>
  );
}
