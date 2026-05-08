'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ChevronRight, AlertCircle,
  CheckCircle2, BookOpen, Target, Sparkles,
} from 'lucide-react';
import HamburgerButton from '@/components/HamburgerButton';
import { authAxios } from '@/lib/authAxios';

const API = process.env.NEXT_PUBLIC_API_URL;

const STEPS = [
  { n: 1, label: 'Configure' },
  { n: 2, label: 'Upload PDFs' },
  { n: 3, label: 'View Results' },
];

const SUBJECTS = [
  { value: 'english',  label: 'English',  emoji: '📝', desc: 'Essays, comprehension, creative writing' },
  { value: 'math',     label: 'Math',     emoji: '🔢', desc: 'Problems, equations, calculations' },
  { value: 'coding',   label: 'Coding',   emoji: '💻', desc: 'Programming assignments, algorithms' },
  { value: 'urdu',     label: 'Urdu',     emoji: '🌙', desc: 'Urdu essays, insha, grammar' },
  { value: 'science',  label: 'Science',  emoji: '🔬', desc: 'Biology, chemistry, physics, general science' },
  { value: 'other',    label: 'Other',    emoji: '📚', desc: 'Any other subject or custom rubric' },
] as const;

type SubjectValue = (typeof SUBJECTS)[number]['value'];

// Subjects where word limit is not meaningful
const NO_WORD_LIMIT_SUBJECTS: SubjectValue[] = ['math', 'coding'];

export default function SetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    instructions: '',
    subject: 'english' as SubjectValue,
    wordLimit: 500,
    markingMode: 'loose' as 'strict' | 'loose',
    totalMarks: 100,
    passingMarks: 50,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
    }
  }, [router]);

  const set = (key: string, value: string | number) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const showWordLimit = !NO_WORD_LIMIT_SUBJECTS.includes(form.subject);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.instructions.trim()) {
      setError('Title and instructions are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        wordLimit: showWordLimit ? form.wordLimit : 0,
      };
      const res = await authAxios().post(`${API}/assignments`, payload);
      router.push(`/upload?id=${res.data.data._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const passPct = form.totalMarks > 0
    ? Math.round((form.passingMarks / form.totalMarks) * 100)
    : 0;

  const selectedSubject = SUBJECTS.find(s => s.value === form.subject)!;

  return (
    <>
      <div className="topbar">
        <HamburgerButton />
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          textDecoration: 'none', color: 'var(--text-muted)', fontSize: 13,
          transition: 'color .15s', flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={14} />
          Back
        </Link>
        <div style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0 }} />
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>New Assignment</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Configure AI evaluation settings</p>
        </div>
      </div>

      <div className="page-content fade-up" style={{ maxWidth: 680 }}>

        {/* Steps */}
        <div className="step-bar">
          {STEPS.map((step, i) => {
            const active = step.n === 1;
            return (
              <div key={step.n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: active ? 'var(--accent)' : 'var(--border)',
                    color: active ? 'white' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {step.n}
                  </div>
                  <span style={{
                    fontSize: 12.5, fontWeight: active ? 600 : 400,
                    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && <div className="step-connector" />}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>

          {/* Subject Selector */}
          <div className="card" style={{ padding: 24, marginBottom: 14 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 20, paddingBottom: 16,
              borderBottom: '1px solid var(--border-soft)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: 'rgba(127,86,217,.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {selectedSubject.emoji}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                  Subject
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                  Choose the subject — the AI will use a tailored rubric
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
            }} className="subject-grid">
              {SUBJECTS.map(sub => {
                const selected = form.subject === sub.value;
                return (
                  <button
                    key={sub.value}
                    type="button"
                    onClick={() => set('subject', sub.value)}
                    className={`mode-card ${selected ? 'selected-green' : ''}`}
                    style={{ textAlign: 'left' }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', marginBottom: 4,
                    }}>
                      <span style={{
                        fontWeight: 600, fontSize: 13,
                        color: selected ? 'var(--accent)' : 'var(--text-primary)',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <span style={{ fontSize: 16 }}>{sub.emoji}</span>
                        {sub.label}
                      </span>
                      {selected && <CheckCircle2 size={14} color="var(--accent)" />}
                    </div>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {sub.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assignment Details */}
          <div className="card" style={{ padding: 24, marginBottom: 14 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 20, paddingBottom: 16,
              borderBottom: '1px solid var(--border-soft)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: 'rgba(16,185,129,.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BookOpen size={16} color="var(--accent)" strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                  Assignment Details
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                  Basic information about this assignment
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="field-label">
                Assignment Title <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                className="field-input"
                placeholder={
                  form.subject === 'math'    ? 'e.g. Chapter 3 — Algebra Problems' :
                  form.subject === 'coding'  ? 'e.g. Linked List Implementation in Python' :
                  form.subject === 'urdu'    ? 'e.g. Mera Pasandida Mausam — Insha' :
                  form.subject === 'science' ? 'e.g. Photosynthesis — Short Answer Questions' :
                  'e.g. Chapter 5 Essay — Climate Change'
                }
                value={form.title}
                onChange={e => set('title', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="field-label">
                Marking Instructions <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                className="field-input"
                style={{ resize: 'vertical', minHeight: 120, lineHeight: 1.65 }}
                placeholder={
                  form.subject === 'math'
                    ? 'Describe which formulas/methods are expected, whether working must be shown, and how marks are split across questions...'
                    : form.subject === 'coding'
                    ? 'Describe the required features, expected inputs/outputs, language, and any specific requirements like error handling or comments...'
                    : form.subject === 'urdu'
                    ? 'Describe what the student should write about, key points to cover, and how marks are distributed...'
                    : 'Describe what students should cover, key points to look for, and how marks should be distributed...'
                }
                value={form.instructions}
                onChange={e => set('instructions', e.target.value)}
                required
              />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Sparkles size={11} color="var(--accent)" />
                The AI uses these instructions to evaluate each submission.
              </p>
            </div>
          </div>

          {/* Scoring */}
          <div className="card" style={{ padding: 24, marginBottom: 14 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 20, paddingBottom: 16,
              borderBottom: '1px solid var(--border-soft)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: 'rgba(46,144,250,.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Target size={16} color="var(--info)" strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                  Scoring Settings
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                  Configure marks{showWordLimit ? ' and word requirements' : ''}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: showWordLimit ? '1fr 1fr 1fr' : '1fr 1fr',
                gap: 14,
                marginBottom: 20,
              }}
              className="scoring-grid"
            >
              {showWordLimit && (
                <div>
                  <label className="field-label">Word Limit</label>
                  <input
                    type="number"
                    className="field-input"
                    min={50} max={10000}
                    value={form.wordLimit}
                    onChange={e => set('wordLimit', parseInt(e.target.value) || 50)}
                  />
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 5 }}>50 – 10,000 words</p>
                </div>
              )}
              {[
                { label: 'Total Marks', key: 'totalMarks', value: form.totalMarks, min: 1, max: 100, hint: '1 – 100 marks' },
                { label: 'Passing Marks', key: 'passingMarks', value: form.passingMarks, min: 1, max: form.totalMarks, hint: `Min to pass (${passPct}%)` },
              ].map(field => (
                <div key={field.key}>
                  <label className="field-label">{field.label}</label>
                  <input
                    type="number"
                    className="field-input"
                    min={field.min} max={field.max}
                    value={field.value}
                    onChange={e => set(field.key, parseInt(e.target.value) || field.min)}
                  />
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 5 }}>{field.hint}</p>
                </div>
              ))}
            </div>

            {/* Pass bar */}
            <div className="pass-bar-wrap">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12.5 }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Pass threshold</span>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  {form.passingMarks} / {form.totalMarks} marks ({passPct}%)
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${passPct}%` }} />
              </div>
            </div>

            {/* Marking mode */}
            <div>
              <label className="field-label" style={{ marginBottom: 10 }}>Marking Mode</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="mode-grid">
                {[
                  {
                    value: 'loose', label: 'Lenient', icon: '🤝',
                    desc: 'Rewards effort and partial answers. Good for formative assessments.',
                    color: 'var(--accent)', selectedClass: 'selected-green',
                  },
                  {
                    value: 'strict', label: 'Strict', icon: '🎯',
                    desc: 'Requires precise, complete answers. Best for final exams.',
                    color: 'var(--danger)', selectedClass: 'selected-rose',
                  },
                ].map(mode => {
                  const selected = form.markingMode === mode.value;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => set('markingMode', mode.value)}
                      className={`mode-card ${selected ? mode.selectedClass : ''}`}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', marginBottom: 6,
                      }}>
                        <span style={{
                          fontWeight: 600, fontSize: 13.5,
                          color: selected ? mode.color : 'var(--text-primary)',
                        }}>
                          {mode.icon} {mode.label}
                        </span>
                        {selected && (
                          <CheckCircle2 size={15} color={mode.color} />
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                        {mode.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <div className="error-banner">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {submitting ? (
              <>
                <span style={{
                  width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)',
                  borderTopColor: 'white', borderRadius: '50%',
                  animation: 'spin .7s linear infinite',
                }} />
                Creating assignment...
              </>
            ) : (
              <>
                Create & Continue to Upload
                <ChevronRight size={15} />
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
}
