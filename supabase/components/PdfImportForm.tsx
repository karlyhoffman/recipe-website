'use client';

import { useState, useRef } from 'react';
import type { ImportDraft } from '@/types';
import classNames from 'classnames';
import styles from '@/styles/components/form.module.scss';

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const HINT_ID = 'pdf-upload-hint';

interface Props {
  onExtracted: (draft: ImportDraft, extractError?: string) => void;
  isLoading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

export default function PdfImportForm({ onExtracted, isLoading, onLoadingChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [hasFile, setHasFile] = useState(false);
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
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles['form__field-group']}>
        <label htmlFor="pdf-file" className="h6">Upload Recipe PDF</label>

        <input
          id="pdf-file"
          ref={inputRef}
          type="file"
          accept="application/pdf"
          aria-describedby={HINT_ID}
          disabled={isLoading}
          onChange={(e) => setHasFile(!!e.target.files?.length)}
        />

        <p id={HINT_ID} className={classNames(styles.hint, 'hint')}>
          Accepted file types: PDF. Maximum size: 10 MB.
        </p>
      </div>

      {error && (
        <p role="alert" className={classNames(styles.error, 'error')}>
          <strong>{error}</strong>
        </p>
      )}

      {isLoading && (
        <p role="status" className={classNames(styles.status, 'status')}>
          Extracting recipe…
        </p>
      )}

      <button type="submit" disabled={isLoading || !hasFile}>
        {isLoading ? 'Extracting…' : 'Import PDF'}
      </button>
    </form>
  );
}
