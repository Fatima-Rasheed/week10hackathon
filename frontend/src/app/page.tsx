'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authAxios } from '@/lib/authAxios';
import {
  Plus, Upload, BarChart3, Trash2, Clock,
  BookOpen, TrendingUp, Search, Zap, Target, ArrowRight,
} from 'lucide-react';
import HamburgerButton from '@/components/HamburgerButton';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Assignment {
  _id: string;
  title: string;
  instructions: string;
  wordLimit: number;
  markingMode: string;
  totalMarks: number;
  createdAt: string;
}

export default function HomePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchAssignments(); }, []);

  const fetchAssignments = async () => {
    try {
      const res = await authAxios().get(`${API}/assignments`);
      setAssignments(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm('Delete this assignment and all its submissions?')) return;
    setDeletingId(id);
    try {
      await authAxios().delete(`${API}/assignments/${id}`);
      setAssignments(prev => prev.filter(a => a._id !== id));
    } catch { alert('Failed to delete'); }
    finally { setDeletingId(null); }
  };

  const filtered = assignments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <HamburgerButton />
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Dashboard</h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
              Manage and evaluate student assignments
            </p>
          </div>
        </div>
      </div>

      <div className="page-content fade-up">

        {/* Hero — empty state only */}
        {!loading && assignments.length === 0 && (
          <div style={{
            borderRadius: 14, marginBottom: 24, overflow: 'hidden',
            background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
            padding: '32px 36px', position: 'relative',
            border: '1px solid #065f46',
          }} className="hero-banner">
            <div style={{
              position: 'absolute', top: -60, right: -40,
              width: 240, height: 240, borderRadius: '50%',
              background: 'rgba(255,255,255,0.03)', pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(16,185,129,.2)', borderRadius: 99,
                padding: '4px 12px', marginBottom: 14,
                fontSize: 12, fontWeight: 500, color: '#6ee7b7',
                border: '1px solid rgba(16,185,129,.3)',
              }}>
                <Zap size={11} />
                AI-Powered Grading
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.3 }}>
                Welcome to GradeAI
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', marginBottom: 24, maxWidth: 380, lineHeight: 1.65 }}>
                Create your first assignment and let AI evaluate student submissions in seconds.
              </p>
              <Link href="/setup">
                <button style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '9px 18px', borderRadius: 8,
                  background: '#10b981', color: '#fff',
                  fontWeight: 600, fontSize: 13.5, border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'background .15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#059669'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#10b981'}
                >
                  <Plus size={14} />
                  Create First Assignment
                  <ArrowRight size={13} />
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }} className="stats-grid-3">
          {[
            {
              icon: BookOpen, label: 'Total Assignments',
              value: loading ? '—' : assignments.length,
              color: '#10b981', bg: 'rgba(16,185,129,.1)',
            },
            {
              icon: Target, label: 'Strict Mode',
              value: loading ? '—' : assignments.filter(a => a.markingMode === 'strict').length,
              color: '#f04438', bg: 'rgba(240,68,56,.1)',
            },
            {
              icon: TrendingUp, label: 'Lenient Mode',
              value: loading ? '—' : assignments.filter(a => a.markingMode === 'loose').length,
              color: '#2e90fa', bg: 'rgba(46,144,250,.1)',
            },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: s.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <s.icon size={18} color={s.color} strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-header">
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Assignments
              {!loading && (
                <span style={{
                  padding: '1px 8px', borderRadius: 99,
                  background: 'var(--accent-dim)',
                  color: 'var(--accent-dark)', fontSize: 11, fontWeight: 600,
                  border: '1px solid var(--accent-light)',
                }}>
                  {assignments.length}
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }} />
              <input
                className="field-input"
                style={{ paddingLeft: 30, width: 200, fontSize: 13, height: 34 }}
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '56px 0', textAlign: 'center' }}>
              <div style={{
                width: 26, height: 26,
                border: '2px solid var(--border)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                margin: '0 auto 12px',
                animation: 'spin .7s linear infinite',
              }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <BookOpen size={22} color="var(--accent)" strokeWidth={1.8} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                {search ? 'No results found' : 'No assignments yet'}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 260, lineHeight: 1.6 }}>
                {search ? `Nothing matches "${search}"` : 'Create your first assignment to get started'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Mode</th>
                    <th>Word Limit</th>
                    <th>Marks</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a._id}>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
                          {a.title}
                        </div>
                        <div style={{
                          fontSize: 12, color: 'var(--text-muted)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          maxWidth: 280,
                        }}>
                          {a.instructions}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${a.markingMode === 'strict' ? 'chip-rose' : 'chip-green'}`}>
                          {a.markingMode === 'strict' ? '🎯 Strict' : '🤝 Lenient'}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 12.5, color: 'var(--text-secondary)',
                          background: 'var(--bg)', padding: '2px 8px', borderRadius: 5,
                          border: '1px solid var(--border)',
                        }}>
                          {a.wordLimit.toLocaleString()} words
                        </span>
                      </td>
                      <td>
                        <span className="chip-brand" style={{
                          fontSize: 12.5, fontWeight: 600,
                          padding: '2px 8px', borderRadius: 5, display: 'inline-block',
                        }}>
                          {a.totalMarks} pts
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={11} />
                          {new Date(a.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                          <Link href={`/upload?id=${a._id}`}>
                            <button className="btn btn-secondary btn-sm">
                              <Upload size={11} />
                              Upload
                            </button>
                          </Link>
                          <Link href={`/results?id=${a._id}`}>
                            <button className="btn btn-secondary btn-sm">
                              <BarChart3 size={11} />
                              Results
                            </button>
                          </Link>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteAssignment(a._id)}
                            disabled={deletingId === a._id}
                            style={{ padding: '5px 8px' }}
                          >
                            {deletingId === a._id ? (
                              <span style={{
                                width: 11, height: 11, border: '2px solid var(--danger)',
                                borderTopColor: 'transparent', borderRadius: '50%',
                                display: 'block', animation: 'spin .7s linear infinite',
                              }} />
                            ) : <Trash2 size={11} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* How it works */}
        {assignments.length === 0 && !loading && (
          <div className="card" style={{ marginTop: 16, padding: 24 }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 18 }}>
              How it works
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }} className="how-grid">
              {[
                { n: 1, title: 'Create Assignment', desc: 'Set title, instructions, word limit, and marking mode.', color: '#10b981' },
                { n: 2, title: 'Upload PDFs', desc: 'Batch upload student submission PDFs for AI evaluation.', color: '#2e90fa' },
                { n: 3, title: 'Download Results', desc: 'Get a full marks sheet with scores, grades, and remarks.', color: '#7f56d9' },
              ].map(step => (
                <div key={step.n} style={{
                  display: 'flex', gap: 12, padding: 16,
                  borderRadius: 10, background: 'var(--bg)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: step.color,
                    color: 'white', fontWeight: 700, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {step.n}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
