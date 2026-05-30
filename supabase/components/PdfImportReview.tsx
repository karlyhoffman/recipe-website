'use client';

import { useState } from 'react';
import type { ImportDraft, IngredientSlice, InstructionSlice } from '@/types';

interface Props {
  draft: ImportDraft;
  onConfirm: (draft: ImportDraft) => void;
  onCancel: () => void;
}

export default function PdfImportReview({ draft, onConfirm, onCancel }: Props) {
  const [title, setTitle] = useState(draft.title ?? '');
  const [ingredients, setIngredients] = useState<IngredientSlice[]>(draft.ingredients);
  const [instructions, setInstructions] = useState<InstructionSlice[]>(draft.instructions);
  const titleEmpty = title.trim() === '';

  function updateIngredientName(index: number, value: string) {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, name: value } : ing)));
  }

  function deleteIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { type: 'ingredient', name: '' }]);
  }

  function updateInstructionText(index: number, value: string) {
    setInstructions((prev) => prev.map((ins, i) => (i === index ? { ...ins, text: value } : ins)));
  }

  function deleteInstruction(index: number) {
    setInstructions((prev) => prev.filter((_, i) => i !== index));
  }

  function addInstruction() {
    setInstructions((prev) => [...prev, { type: 'instruction', text: '' }]);
  }

  function handleConfirm() {
    if (titleEmpty) return;
    onConfirm({ ...draft, title, ingredients, instructions });
  }

  const showIngredientWarning = ingredients.length === 0;
  const showInstructionWarning = instructions.length === 0;

  return (
    <div style={{ maxWidth: '720px', width: '100%' }}>
      <h2>Review Extracted Recipe</h2>

      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="review-title" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>
          Title
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
        />
        {titleEmpty && (
          <p role="alert" style={{ color: '#c00', marginTop: '0.25rem', fontSize: '0.875rem' }}>
            A recipe title is required before saving.
          </p>
        )}
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h3>Ingredients</h3>
        {showIngredientWarning && (
          <p role="alert" style={{ color: '#b45309', marginBottom: '0.5rem' }}>
            No ingredients were extracted. Please add them manually.
          </p>
        )}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {ingredients.map((ing, i) => (
            <li key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={ing.name}
                onChange={(e) => updateIngredientName(i, e.target.value)}
                aria-label={`Ingredient ${i + 1}`}
                style={{ flex: '1 1 200px', padding: '0.375rem' }}
              />
              <button type="button" onClick={() => deleteIngredient(i)} aria-label={`Delete ingredient ${i + 1}`}>
                Delete
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={addIngredient}>Add ingredient</button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h3>Instructions</h3>
        {showInstructionWarning && (
          <p role="alert" style={{ color: '#b45309', marginBottom: '0.5rem' }}>
            No instructions were extracted. Please add them manually.
          </p>
        )}
        <ol style={{ listStyle: 'none', padding: 0 }}>
          {instructions.map((ins, i) => (
            <li key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <textarea
                value={ins.text}
                onChange={(e) => updateInstructionText(i, e.target.value)}
                aria-label={`Instruction step ${i + 1}`}
                rows={2}
                style={{ flex: '1 1 200px', padding: '0.375rem' }}
              />
              <button type="button" onClick={() => deleteInstruction(i)} aria-label={`Delete instruction step ${i + 1}`}>
                Delete
              </button>
            </li>
          ))}
        </ol>
        <button type="button" onClick={addInstruction}>Add step</button>
      </div>

      {draft.uncategorized.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3>Uncategorized Content</h3>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
            The following text could not be classified. You can copy from it manually.
          </p>
          {draft.uncategorized.map((block, i) => (
            <p key={i} style={{ background: '#f5f5f5', padding: '0.5rem', marginBottom: '0.5rem' }}>
              {block}
            </p>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button type="button" onClick={handleConfirm} disabled={titleEmpty}>
          Save Recipe
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
