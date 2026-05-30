'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Row, Column } from '@/components/Grid';
import PdfImportForm from '@/components/PdfImportForm';
import PdfImportReview from '@/components/PdfImportReview';
import type { ImportDraft } from '@/types';

type State = 'idle' | 'loading' | 'review';

export default function ImportPage() {
  const router = useRouter();
  const [state, setState] = useState<State>('idle');
  const [draft, setDraft] = useState<ImportDraft | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  function handleExtracted(extracted: ImportDraft) {
    setDraft(extracted);
    setState('review');
  }

  function handleLoadingChange(loading: boolean) {
    setState((prev) => {
      if (!loading && prev === 'review') return prev;
      return loading ? 'loading' : 'idle';
    });
  }

  async function handleConfirm(confirmed: ImportDraft) {
    setSaveError(null);
    try {
      const res = await fetch('/api/import/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: confirmed.title,
          ingredients: confirmed.ingredients,
          instructions: confirmed.instructions,
          import_source: confirmed.filename,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSaveError((json.error as string) ?? 'Failed to save recipe. Please try again.');
        return;
      }

      router.push(`/recipes/${json.uid as string}`);
    } catch {
      setSaveError('Failed to save recipe. Please try again.');
    }
  }

  function handleCancel() {
    setDraft(null);
    setSaveError(null);
    setExtractError(null);
    setState('idle');
  }

  return (
    <Row>
      <Column>
        <h1 className="h2 highlight">Import Recipe from PDF</h1>
      </Column>

      {state !== 'review' && (
        <Column>
          <PdfImportForm
            onExtracted={(extracted, extractionError) => {
              setExtractError(extractionError ?? null);
              handleExtracted(extracted);
            }}
            isLoading={state === 'loading'}
            onLoadingChange={handleLoadingChange}
          />
        </Column>
      )}

      {state === 'review' && draft && (
        <Column>
          {extractError && (
            <>
              <h2 className="h6 outline error">Extraction Error</h2>
              <p role="alert" className="error">
                <strong>{extractError}</strong>
              </p>
              <br/>
            </>
          )}

          {saveError && (
            <>
              <h2 className="h6 outline error">Saving Error</h2>
              <p role="alert" className="error">
                <strong>{saveError}</strong>
              </p>
              <br/>
            </>
          )}

          <PdfImportReview
            draft={draft}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        </Column>
      )}
    </Row>
  );
}
