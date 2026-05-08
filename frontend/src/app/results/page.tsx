'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authAxios } from '@/lib/authAxios';
import {
  ArrowLeft, BarChart3, Users, TrendingUp,
  Award, FileSpreadsheet, Upload,
  CheckCircle2, XCircle, Trash2, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import HamburgerButton from '@/components/HamburgerButton';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Submission {
  _id: string;
  studentName: string;
  rollNumber: string;
  wordCount: number;
  score: number;
  remarks: string;
  status: string;
}

interface Assignment {
  _id: string;
  title: string;
  subject: string;
  totalMarks: number;
  passingMarks: number;
  markingMode: string;
}

const SUBJECT_EMOJI: Record<string, string> = {
  english: '📝',
  math: '🔢',
  coding: '💻',
  urdu: '🌙',
  science: '🔬',
  other: '📚',
};

function getGrade(score: number, total: number, passingMarks: number): string {
  const pct = (score / total) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (score >= passingMarks) return 'D';
  return 'F';
}

function getChipClass(score: number, total: number, passing: number) {
  if (score >= passing) return (score / total) * 100 >= 80 ? 'chip-green' : 'chip-amber';
  return 'chip-rose';
}

function getScoreColor(score: number, total: number, passing: number) {
  if (score >= passing) return (score / total) * 100 >= 80 ? 'var(--accent)' : 'var(--warn)';
  return 'var(--danger)';
}

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get('id');

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (assignmentId) {
      Promise.all([
        authAxios().get(`${API}/assignments/${assignmentId}`),
        authAxios().get(`${API}/submissions/assignment/${assignmentId}`),
      ])
        .then(([aRes, sRes]) => {
          setAssignment(aRes.data.data);
          setSubmissions(sRes.data.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [assignmentId]);

  const downloadExcel = async () => {
    setDownloading(true);
    try {
      const res = await authAxios().get(`${API}/exports/excel/${assignmentId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `marks-sheet-${assignmentId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { alert('Download failed'); }
    finally { setDownloading(false); }
  };

  const deleteSubmission = async (id: string, name: string) => {
    if (!confirm(`Delete result for "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await authAxios().delete(`${API}/submissions/${id}`);
      setSubmissions(prev => prev.filter(s => s._id !== id));
    } catch { alert('Failed to delete submission.'); }
    finally { setDeletingId(null); }
  };

  const total = assignment?.totalMarks || 100;
  const passing = assignment?.passingMarks || 50;
  const avg = submissions.length
    ? (submissions.reduce((s, x) => s + x.score, 0) / submissions.length).toFixed(1)
    : '0';
  const highest = submissions.length ? Math.max(...submissions.map(s => s.score)) : 0;
  const passed = submissions.filter(s => s.score >= passing).length;
  const passRate = submissions.length ? Math.round((passed / submissions.length) * 100) : 0;

  if (!assignmentId) {
    return (
      <>
        <div className="topbar">
          <h1 style={{ fontSize: 15, fontWeight: 600 }}>Results</h1>
        </div>
        <div className="page-content">
          <div className="empty-state">
            <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>No assignment selected.</p>
            <Link href="/"><button className="btn btn-secondary">← Go back</button></Link>
          </div>
        </div>
      </>
    );
  }

  const stats = [
    { icon: Users,     label: 'Total Students', value: submissions.length, color: '#2e90fa', bg: 'rgba(46,144,250,.1)' },
    { icon: TrendingUp,label: 'Average Score',  value: avg,                color: '#f79009', bg: 'rgba(247,144,9,.1)' },
    { icon: Award,     label: 'Highest Score',  value: highest,            color: '#10b981', bg: 'rgba(16,185,129,.1)' },
    { icon: BarChart3, label: 'Pass Rate',       value: `${passRate}%`,    color: '#7f56d9', bg: 'rgba(127,86,217,.1)' },
  ];

  return (
    <>
      {/* Topbar */}
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
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {assignment?.title || 'Results'}
          </h1>
          {assignment && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <Sparkles size={10} color="var(--accent)" />
              {SUBJECT_EMOJI[assignment.subject] || '📚'}{' '}
              <span style={{ fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                {assignment.subject || 'general'}
              </span>
              {' · '}
              {submissions.length} student{submissions.length !== 1 ? 's' : ''} evaluated ·{' '}
              <span style={{ color: assignment.markingMode === 'strict' ? 'var(--danger)' : 'var(--accent)', fontWeight: 500 }}>
                {assignment.markingMode} marking
              </span>
              {' · '}
              <span style={{ color: 'var(--warn)', fontWeight: 500 }}>
                passing: {assignment.passingMarks}/{assignment.totalMarks}
              </span>
            </p>
          )}
        </div>
        <div className="topbar-actions" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Link href={`/upload?id=${assignmentId}`}>
            <button className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
              <Upload size={12} />
              Upload More
            </button>
          </Link>
          <button
            onClick={downloadExcel}
            disabled={downloading || submissions.length === 0}
            className="btn btn-success btn-sm"
            style={{ whiteSpace: 'nowrap' }}
          >
            {downloading ? (
              <span style={{
                width: 12, height: 12, border: '2px solid rgba(255,255,255,.4)',
                borderTopColor: 'white', borderRadius: '50%',
                animation: 'spin .7s linear infinite',
              }} />
            ) : <FileSpreadsheet size={12} />}
            Download Excel
          </button>
        </div>
      </div>

      <div className="page-content fade-up" style={{ maxWidth: 1160 }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }} className="stats-grid-4">
          {stats.map((s, i) => (
            <div key={i} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: s.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <s.icon size={17} color={s.color} strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="card" style={{ padding: '56px 0', textAlign: 'center' }}>
            <div style={{
              width: 26, height: 26,
              border: '2px solid var(--border)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              margin: '0 auto 12px',
              animation: 'spin .7s linear infinite',
            }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading results...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">
                <BarChart3 size={22} color="var(--accent)" strokeWidth={1.8} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                No submissions yet
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, maxWidth: 260, lineHeight: 1.6 }}>
                Upload student PDFs to see AI-evaluated results here
              </p>
              <Link href={`/upload?id=${assignmentId}`}>
                <button className="btn btn-primary">
                  <Upload size={13} />
                  Upload Submissions
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-header">
              <div style={{
                fontWeight: 600, fontSize: 14, color: 'var(--text-primary)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                Student Results
                <span style={{
                  padding: '1px 8px', borderRadius: 99,
                  background: 'var(--accent-dim)',
                  color: 'var(--accent-dark)', fontSize: 11, fontWeight: 600,
                  border: '1px solid var(--accent-light)',
                }}>
                  {submissions.length}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
                <span style={{ color: 'var(--text-muted)' }}>Out of {total} marks</span>
                <span className="chip-amber" style={{ padding: '2px 10px', borderRadius: 99, fontWeight: 600, fontSize: 12 }}>
                  Pass ≥ {passing}
                </span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student Name</th>
                    <th>Roll No.</th>
                    <th>Words</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Status</th>
                    <th>Remarks</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub, i) => {
                    const chipClass = getChipClass(sub.score, total, passing);
                    const scoreColor = getScoreColor(sub.score, total, passing);
                    const grade = getGrade(sub.score, total, passing);
                    const hasPassed = sub.score >= passing;
                    return (
                      <tr key={sub._id}>
                        <td style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 12 }}>
                          {i + 1}
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                            {sub.studentName}
                          </div>
                        </td>
                        <td>
                          <span className="chip-brand" style={{
                            fontFamily: 'monospace', fontSize: 12,
                            padding: '2px 8px', borderRadius: 5, fontWeight: 600,
                            display: 'inline-block',
                          }}>
                            {sub.rollNumber}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontSize: 12.5, color: 'var(--text-muted)',
                            background: 'var(--bg)', padding: '2px 7px', borderRadius: 4,
                            border: '1px solid var(--border)',
                          }}>
                            {sub.wordCount}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 5 }}>
                            <span style={{ fontWeight: 700, fontSize: 15, color: scoreColor }}>
                              {sub.score}
                            </span>
                            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>/ {total}</span>
                          </div>
                          <div style={{
                            width: 56, height: 3, background: 'var(--border)',
                            borderRadius: 99, overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${(sub.score / total) * 100}%`, height: '100%',
                              background: scoreColor, borderRadius: 99,
                            }} />
                          </div>
                        </td>
                        <td>
                          <span className={chipClass} style={{
                            padding: '3px 9px', borderRadius: 6,
                            fontWeight: 700, fontSize: 12.5, display: 'inline-block',
                          }}>
                            {grade}
                          </span>
                        </td>
                        <td>
                          <div className={hasPassed ? 'chip-green' : 'chip-rose'} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 9px', borderRadius: 99,
                          }}>
                            {hasPassed ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                            <span style={{ fontSize: 12, fontWeight: 600 }}>
                              {hasPassed ? 'Pass' : 'Fail'}
                            </span>
                          </div>
                        </td>
                        <td style={{ maxWidth: 260 }}>
                          <span
                            title={sub.remarks}
                            style={{
                              display: '-webkit-box', WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical', overflow: 'hidden',
                              fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5,
                            }}
                          >
                            {sub.remarks}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => deleteSubmission(sub._id, sub.studentName)}
                            disabled={deletingId === sub._id}
                            title="Delete result"
                            className="chip-rose"
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: 28, height: 28, borderRadius: 6,
                              cursor: deletingId === sub._id ? 'not-allowed' : 'pointer',
                              opacity: deletingId === sub._id ? 0.5 : 1,
                              background: 'transparent',
                              transition: 'opacity .15s',
                            }}
                          >
                            {deletingId === sub._id ? (
                              <span style={{
                                width: 11, height: 11,
                                border: '2px solid var(--danger)',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                animation: 'spin .7s linear infinite',
                                display: 'inline-block',
                              }} />
                            ) : <Trash2 size={12} />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
