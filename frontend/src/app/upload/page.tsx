'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Upload, FileText, X, CheckCircle2, AlertCircle,
  ArrowLeft, CloudUpload, Zap, Info, BarChart3,
} from 'lucide-react';
import { authAxios } from '@/lib/authAxios';
import Link from 'next/link';
import HamburgerButton from '@/components/HamburgerButton';

const API = process.env.NEXT_PUBLIC_API_URL;

interface UploadResult {
  processed: number;
  failed: number;
  errors: { fileName: string; error: string }[];
}

const STEPS = [
  { n: 1, label: 'Configure', done: true, active: false },
  { n: 2, label: 'Upload PDFs', done: false, active: true },
  { n: 3, label: 'View Results', done: false, active: false },
];

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get('id');

  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');
  const [assignment, setAssignment] = useState<any>(null);

  useEffect(() => {
    if (assignmentId) {
      authAxios().get(`${API}/assignments/${assignmentId}`)
        .then(res => setAssignment(res.data.data))
        .catch(() => {});
    }
  }, [assignmentId]);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const pdfs = Array.from(incoming).filter(f => f.type === 'application/pdf');
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...pdfs.filter(f => !existing.has(f.name))];
    });
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const removeFile = (name: string) => setFiles(prev => prev.filter(f => f.name !== name));

  const handleUpload = async () => {
    if (!assignmentId || files.length === 0) return;
    setUploading(true);
    setError('');
    setProgress(0);
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    try {
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + Math.random() * 6, 88));
      }, 700);
      const res = await authAxios().post(
        `${API}/submissions/upload/${assignmentId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      clearInterval(interval);
      setProgress(100);
      setResult(res.data);
      setTimeout(() => router.push(`/results?id=${assignmentId}`), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  if (!assignmentId) {
    return (
      <>
        <div className="topbar">
          <h1 style={{ fontSize: 15, fontWeight: 600 }}>Upload Submissions</h1>
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
          <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Upload Submissions</h1>
          {assignment && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assignment.title}</p>
          )}
        </div>
        {assignment && (
          <Link href={`/results?id=${assignmentId}`} style={{ flexShrink: 0 }}>
            <button className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
              <BarChart3 size={12} />
              View Results
            </button>
          </Link>
        )}
      </div>

      <div className="page-content fade-up" style={{ maxWidth: 680 }}>

        {/* Steps */}
        <div className="step-bar">
          {STEPS.map((step, i) => (
            <div key={step.n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: step.active ? 'var(--accent)' : step.done ? 'var(--accent-dark)' : 'var(--border)',
                  color: step.active || step.done ? 'white' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                }}>
                  {step.done ? <CheckCircle2 size={13} /> : step.n}
                </div>
                <span style={{
                  fontSize: 12.5, fontWeight: step.active ? 600 : 400,
                  color: step.active ? 'var(--text-primary)' : step.done ? 'var(--accent)' : 'var(--text-muted)',
                }}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`step-connector ${step.done ? 'done' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* Assignment info */}
        {assignment && (
          <div className="card surface-green" style={{
            padding: '12px 16px', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: 'rgba(16,185,129,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <FileText size={16} color="var(--accent)" strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {assignment.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {assignment.wordLimit > 0 ? `${assignment.wordLimit} words · ` : ''}{assignment.markingMode} marking · {assignment.totalMarks} marks
              </div>
            </div>
          </div>
        )}

        {/* Drop zone */}
        <div className="card" style={{ padding: 20, marginBottom: 14 }}>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById('file-input')?.click()}
            className="drop-zone"
            style={{
              border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 10, padding: '36px 24px', textAlign: 'center',
              cursor: 'pointer', transition: 'all .18s',
              background: dragging ? 'var(--accent-dim)' : 'var(--bg)',
              marginBottom: 14,
            }}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              multiple
              style={{ display: 'none' }}
              onChange={e => addFiles(e.target.files)}
            />
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: dragging ? 'var(--accent)' : 'var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
              transition: 'all .18s',
            }}>
              <CloudUpload size={22} color={dragging ? 'white' : 'var(--text-muted)'} />
            </div>
            <p style={{
              fontWeight: 600, fontSize: 14,
              color: dragging ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 5,
            }}>
              {dragging ? 'Release to add files' : 'Drop PDF files here'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              or <span style={{ color: 'var(--accent)', fontWeight: 500 }}>click to browse</span> · Multiple PDFs supported
            </p>
          </div>

          {/* Format hint */}
          <div className="info-box" style={{ marginBottom: files.length > 0 ? 14 : 0 }}>
            <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ lineHeight: 1.6 }}>
              <strong>PDF Format:</strong>{' '}
              Line 1 = <code>Name: Ali Ahmed</code>{' '}
              · Line 2 = <code>Roll No: 2023-CS-01</code>{' '}
              · Then assignment text
            </p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 10,
              }}>
                <span style={{
                  fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{
                    background: 'var(--accent)', color: 'white',
                    borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700,
                  }}>
                    {files.length}
                  </span>
                  file{files.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setFiles([])}
                  style={{
                    fontSize: 12, color: 'var(--danger)', background: 'none',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                  }}
                >
                  Clear all
                </button>
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {files.map(f => (
                  <div key={f.name} className="file-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                      <div className="chip-rose" style={{
                        width: 28, height: 28, borderRadius: 7,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <FileText size={12} />
                      </div>
                      <span style={{
                        fontSize: 13, color: 'var(--text-primary)', fontWeight: 400,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {f.name}
                      </span>
                      <span style={{
                        fontSize: 11, color: 'var(--text-muted)', flexShrink: 0,
                        background: 'var(--border)', padding: '1px 6px', borderRadius: 4,
                      }}>
                        {(f.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); removeFile(f.name); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: 4, marginLeft: 8, flexShrink: 0,
                        borderRadius: 5, color: 'var(--text-muted)',
                        transition: 'color .12s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress */}
        {uploading && (
          <div className="upload-progress-card">
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 10,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                fontSize: 13, color: 'var(--accent)', fontWeight: 500,
              }}>
                <Zap size={13} />
                AI evaluating submissions...
              </div>
              <span className="chip-green" style={{ fontSize: 12.5, fontWeight: 700, padding: '2px 9px', borderRadius: 99 }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Success */}
        {result && (
          <div className="success-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <CheckCircle2 size={15} color="var(--accent)" />
              <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--accent-dark)' }}>
                {result.processed} submission{result.processed !== 1 ? 's' : ''} evaluated successfully!
              </span>
            </div>
            {result.failed > 0 && (
              <p style={{ fontSize: 12.5, color: 'var(--warn)', marginBottom: 4 }}>
                ⚠ {result.failed} file{result.failed !== 1 ? 's' : ''} failed to process
              </p>
            )}
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Redirecting to results...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-banner">
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="btn btn-primary btn-lg"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {uploading ? (
            <>
              <span style={{
                width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)',
                borderTopColor: 'white', borderRadius: '50%',
                animation: 'spin .7s linear infinite',
              }} />
              Processing {files.length} submission{files.length !== 1 ? 's' : ''}...
            </>
          ) : (
            <>
              <Zap size={15} />
              Evaluate {files.length || 0} PDF{files.length !== 1 ? 's' : ''} with AI
            </>
          )}
        </button>
      </div>
    </>
  );
}
