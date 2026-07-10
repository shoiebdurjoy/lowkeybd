'use client';

import React, { useState } from 'react';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
}

const REPORT_REASONS = [
  'Spam or misleading',
  'Harassment or bullying',
  'Hate speech',
  'Inappropriate content',
  'Misinformation',
  'Copyright violation',
  'Other',
];

export default function ReportDialog({ isOpen, onClose, targetType, targetId }: ReportDialogProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3001/api/v1/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetType, targetId, reason, details: details || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to submit report');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setReason('');
        setDetails('');
        onClose();
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .report-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: reportFadeIn 0.2s ease;
        }

        @keyframes reportFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes reportSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .report-dialog {
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 480px;
          width: 90%;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15);
          animation: reportSlideIn 0.25s ease;
        }

        .report-dialog h2 {
          font-size: 1.3rem;
          font-weight: 800;
          color: #1a202c;
          margin: 0 0 4px 0;
        }

        .report-dialog .report-subtitle {
          font-size: 0.88rem;
          color: #718096;
          margin-bottom: 24px;
        }

        .report-dialog label {
          display: block;
          font-size: 0.85rem;
          font-weight: 700;
          color: #4a5568;
          margin-bottom: 8px;
        }

        .report-reasons {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .reason-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 0.88rem;
          font-weight: 600;
          color: #4a5568;
        }

        .reason-option:hover {
          border-color: #FF416C;
          background: rgba(255, 65, 108, 0.03);
        }

        .reason-option.selected {
          border-color: #FF416C;
          background: rgba(255, 65, 108, 0.06);
          color: #FF416C;
        }

        .reason-option input[type="radio"] {
          accent-color: #FF416C;
        }

        .report-details-area {
          width: 100%;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          font-size: 0.88rem;
          font-family: inherit;
          resize: vertical;
          min-height: 80px;
          outline: none;
          transition: border-color 0.2s;
        }

        .report-details-area:focus {
          border-color: #FF416C;
          box-shadow: 0 0 0 3px rgba(255, 65, 108, 0.1);
        }

        .report-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }

        .btn-report-cancel {
          padding: 10px 20px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #718096;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-report-cancel:hover {
          background: #f7fafc;
        }

        .btn-report-submit {
          padding: 10px 24px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
          color: white;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-report-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 65, 108, 0.25);
        }

        .btn-report-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .report-success {
          text-align: center;
          padding: 20px 0;
        }

        .report-success .check-icon {
          font-size: 2.5rem;
          margin-bottom: 12px;
        }

        .report-success p {
          font-size: 1rem;
          font-weight: 700;
          color: #38a169;
        }

        .report-error {
          background: #fff5f5;
          color: #c53030;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .dark {
          .report-dialog {
            background: #111;
            border: 1px solid #222;
          }
          .report-dialog h2 { color: #e2e8f0; }
          .report-dialog .report-subtitle { color: #a0aec0; }
          .report-dialog label { color: #a0aec0; }
          .reason-option {
            border-color: #2d3748;
            color: #a0aec0;
          }
          .reason-option:hover {
            border-color: #FF416C;
            background: rgba(255, 65, 108, 0.08);
          }
          .reason-option.selected {
            border-color: #FF416C;
            background: rgba(255, 65, 108, 0.12);
            color: #FF416C;
          }
          .report-details-area {
            background: #0a0a0a;
            border-color: #2d3748;
            color: #e2e8f0;
          }
          .report-details-area:focus {
            border-color: #FF416C;
          }
          .btn-report-cancel {
            background: #1a1a1a;
            border-color: #2d3748;
            color: #a0aec0;
          }
          .btn-report-cancel:hover {
            background: #222;
          }
          .report-error {
            background: rgba(229, 62, 62, 0.1);
            color: #fc8181;
          }
        }
      `}} />
      <div className="report-overlay" onClick={onClose}>
        <div className="report-dialog" onClick={(e) => e.stopPropagation()}>
          {success ? (
            <div className="report-success">
              <div className="check-icon">✅</div>
              <p>Report submitted successfully!</p>
            </div>
          ) : (
            <>
              <h2>🚩 Report {targetType === 'post' ? 'Post' : targetType === 'comment' ? 'Comment' : 'User'}</h2>
              <p className="report-subtitle">Help us keep the community safe by reporting inappropriate content.</p>

              {error && <div className="report-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <label>What&apos;s the issue?</label>
                <div className="report-reasons">
                  {REPORT_REASONS.map((r) => (
                    <div
                      key={r}
                      className={`reason-option ${reason === r ? 'selected' : ''}`}
                      onClick={() => setReason(r)}
                    >
                      <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} />
                      {r}
                    </div>
                  ))}
                </div>

                <label>Additional details (optional)</label>
                <textarea
                  className="report-details-area"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide more context about this report..."
                  maxLength={2000}
                />

                <div className="report-actions">
                  <button type="button" className="btn-report-cancel" onClick={onClose}>Cancel</button>
                  <button type="submit" className="btn-report-submit" disabled={!reason || isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
