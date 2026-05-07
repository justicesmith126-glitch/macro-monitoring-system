import React, { useState } from 'react';
import { ONBOARDING_PHASES } from '../data/onboardingPhases';

const DISCOVERY_QUESTIONS = [
  { category: 'Life & Values', questions: [
    '"What is most important to you about money?"',
    '"What do you want your money to do for you over the next 5–10 years?"',
    '"Describe your ideal retirement in as much detail as possible."',
    '"What does financial success look like for you personally?"',
    '"Are there causes or values you want your financial plan to reflect?"',
  ]},
  { category: 'Goals & Priorities', questions: [
    '"What are the three financial goals you most want to accomplish in the next 5 years?"',
    '"If you could only focus on one financial goal right now, what would it be?"',
    '"Are there major life events you\'re anticipating — career change, inheritance, health challenge?"',
  ]},
  { category: 'Fears & Concerns', questions: [
    '"What financial situation or outcome scares you most?"',
    '"What keeps you up at night financially?"',
    '"Have you experienced a major financial setback? How did it affect you?"',
    '"If your income suddenly stopped for 6 months, what would happen?"',
  ]},
  { category: 'Life Planning (Kinder Framework)', questions: [
    '"If you had all the money you needed, what would you do with your life?"',
    '"If your doctor told you had 5–10 years to live, what would you do differently?"',
    '"What have you not yet done that you would deeply regret missing?"',
  ]},
  { category: 'Relationship & Advisor Fit', questions: [
    '"How do you and your partner make financial decisions together?"',
    '"What has worked well with previous advisors — and what hasn\'t?"',
    '"What qualities are most important to you in a financial advisor?"',
    '"What would make you feel this relationship was a success?"',
  ]},
];

function PhaseCard({ phase, isSelected, completedCount, onSelect }) {
  const total = phase.tasks.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  return (
    <div
      className={`phase-card ${isSelected ? 'selected' : ''}`}
      style={{ borderColor: isSelected ? phase.color : 'var(--gray-200)' }}
      onClick={() => onSelect(phase.id)}
    >
      <div className="phase-num" style={{ background: phase.color }}>
        {pct === 100 ? '✓' : phase.phase}
      </div>
      <h3 style={{ color: isSelected ? phase.color : 'var(--gray-900)' }}>{phase.title}</h3>
      <div className="subtitle">{phase.subtitle}</div>
      <div className="phase-progress">
        <div className="phase-progress-bar">
          <div className="phase-progress-fill" style={{ width: `${pct}%`, background: phase.color }} />
        </div>
        <span>{completedCount}/{total}</span>
      </div>
    </div>
  );
}

function TaskItem({ task, isCompleted, onToggle }) {
  return (
    <div className={`task-item ${isCompleted ? 'completed' : ''}`}>
      <input
        type="checkbox"
        className="task-checkbox"
        checked={isCompleted}
        onChange={() => onToggle(task.id)}
      />
      <div className="task-content">
        <div className="task-title">{task.title}</div>
        <div className="task-desc">{task.description}</div>
        <div className="task-meta">
          <span className={`owner-badge owner-${task.owner}`}>{task.owner}</span>
          {task.required && <span className="required-badge">required</span>}
        </div>
      </div>
    </div>
  );
}

function DiscoveryQuestionsPanel() {
  const [openCat, setOpenCat] = useState(null);
  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div className="card-header">
        <h2>💬 Discovery Meeting Question Bank</h2>
        <p>Kitces 5-step framework + CFP Board + Kinder life planning questions. Use these to deepen client conversations.</p>
      </div>
      <div className="card-body">
        {DISCOVERY_QUESTIONS.map(cat => (
          <div key={cat.category} style={{ marginBottom: 8 }}>
            <button
              onClick={() => setOpenCat(openCat === cat.category ? null : cat.category)}
              style={{
                width: '100%', textAlign: 'left', padding: '12px 16px',
                background: openCat === cat.category ? 'var(--primary-light)' : 'var(--gray-50)',
                border: '1px solid var(--gray-200)', borderRadius: 8,
                cursor: 'pointer', fontWeight: 600, fontSize: 14,
                color: openCat === cat.category ? 'var(--primary)' : 'var(--gray-700)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              {cat.category}
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--gray-400)' }}>
                {cat.questions.length} questions {openCat === cat.category ? '▲' : '▼'}
              </span>
            </button>
            {openCat === cat.category && (
              <div className="discovery-callout" style={{ margin: '0', borderRadius: '0 0 8px 8px', borderTop: 'none' }}>
                <ul>
                  {cat.questions.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressSummary({ phases, completedTasks }) {
  const totalTasks = phases.reduce((sum, p) => sum + p.tasks.length, 0);
  const totalCompleted = Object.values(completedTasks).filter(Boolean).length;
  const pct = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  const currentPhaseIndex = phases.findIndex(p =>
    p.tasks.some(t => !completedTasks[t.id])
  );
  const currentPhase = currentPhaseIndex >= 0 ? phases[currentPhaseIndex] : phases[phases.length - 1];

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--primary-dark), #6366f1)',
      borderRadius: 12, padding: 24, color: '#fff', marginBottom: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, opacity: .75, marginBottom: 4 }}>Overall Onboarding Progress</div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{pct}%</div>
          <div style={{ fontSize: 13, opacity: .75 }}>{totalCompleted} of {totalTasks} tasks complete</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, opacity: .75, marginBottom: 4 }}>Current Phase</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            Phase {currentPhase.phase}: {currentPhase.title}
          </div>
          <div style={{ fontSize: 13, opacity: .75 }}>{currentPhase.subtitle}</div>
        </div>
      </div>
      <div style={{ background: 'rgba(255,255,255,.2)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#fff', borderRadius: 99, width: `${pct}%`, transition: 'width .4s ease' }} />
      </div>
    </div>
  );
}

export default function OnboardingDashboard() {
  const [selectedPhaseId, setSelectedPhaseId] = useState(ONBOARDING_PHASES[0].id);
  const [completedTasks, setCompletedTasks] = useState({});
  const [activeTab, setActiveTab] = useState('phases'); // 'phases' | 'discovery'

  const selectedPhase = ONBOARDING_PHASES.find(p => p.id === selectedPhaseId);

  function toggleTask(taskId) {
    setCompletedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  }

  function getCompletedCount(phase) {
    return phase.tasks.filter(t => completedTasks[t.id]).length;
  }

  function markAllInPhase(phase, done) {
    const updates = {};
    phase.tasks.forEach(t => { updates[t.id] = done; });
    setCompletedTasks(prev => ({ ...prev, ...updates }));
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn ${activeTab === 'phases' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('phases')}>
          Onboarding Checklist
        </button>
        <button className={`btn ${activeTab === 'discovery' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('discovery')}>
          Discovery Questions
        </button>
      </div>

      {activeTab === 'phases' ? (
        <>
          <ProgressSummary phases={ONBOARDING_PHASES} completedTasks={completedTasks} />

          <div className="phases-grid">
            {ONBOARDING_PHASES.map(phase => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                isSelected={selectedPhaseId === phase.id}
                completedCount={getCompletedCount(phase)}
                onSelect={setSelectedPhaseId}
              />
            ))}
          </div>

          {selectedPhase && (
            <div className="card">
              <div className="card-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ color: selectedPhase.color }}>
                      Phase {selectedPhase.phase}: {selectedPhase.title}
                    </h2>
                    <p>{selectedPhase.subtitle} — {selectedPhase.description}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button className="btn btn-sm btn-secondary"
                      onClick={() => markAllInPhase(selectedPhase, false)}>
                      Clear All
                    </button>
                    <button className="btn btn-sm btn-success"
                      onClick={() => markAllInPhase(selectedPhase, true)}>
                      Mark All Done
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 50, background: '#5b21b6', display: 'inline-block' }} />
                    Advisor tasks
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 50, background: '#166534', display: 'inline-block' }} />
                    Client tasks
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="required-badge">required</span>
                    = must complete
                  </div>
                </div>
                {selectedPhase.tasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    isCompleted={!!completedTasks[task.id]}
                    onToggle={toggleTask}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <DiscoveryQuestionsPanel />
      )}
    </div>
  );
}
