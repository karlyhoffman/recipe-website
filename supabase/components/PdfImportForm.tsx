'use client';

import { useState, useRef } from 'react';
import type { ImportDraft } from '@/types';

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const HINT_ID = 'pdf-upload-hint';

interface Props {
  onExtracted: (draft: ImportDraft, extractError?: string) => void;
  isLoading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

export default function PdfImportForm({ onExtracted, isLoading, onLoadingChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError('Please select a PDF file.');
      return;
    }

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError('File exceeds the 10 MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    onLoadingChange(true);
    try {
      const res = await fetch('/api/import/extract', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 422) {
          onExtracted(
            { title: null, ingredients: [], instructions: [], uncategorized: [], filename: file.name },
            json.error as string
          );
        } else {
          setError((json.error as string) ?? 'An error occurred. Please try again.');
        }
        return;
      }

      onExtracted(json as ImportDraft);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      onLoadingChange(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '480px', width: '100%' }}>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="pdf-file" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Upload Recipe PDF
        </label>
        <input
          id="pdf-file"
          ref={inputRef}
          type="file"
          accept="application/pdf"
          aria-describedby={HINT_ID}
          disabled={isLoading}
          style={{ display: 'block', width: '100%' }}
        />
        <p id={HINT_ID} style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: '#666' }}>
          Accepted file types: PDF. Maximum size: 10 MB.
        </p>
      </div>

      {error && (
        <p role="alert" style={{ color: '#c00', marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      {isLoading && (
        <p role="status" style={{ marginBottom: '1rem' }}>
          Extracting recipe…
        </p>
      )}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Extracting…' : 'Import PDF'}
      </button>
    </form>
  );
}
