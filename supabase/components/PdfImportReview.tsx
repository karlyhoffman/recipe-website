'use client';

import { useState } from 'react';
import type { ImportDraft, IngredientSlice, InstructionSlice } from '@/types';
import styles from '@/styles/components/pdf-import.module.scss';

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
    <div className={styles.review}>
      <h2 className="h3">Review Extracted Recipe</h2>

      <div className={styles.section}>
        <label htmlFor="review-title" className="h5 outline">Title</label>

        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={styles.titleInput}
        />

        {titleEmpty && (
          <p role="alert" className="error">
            <strong>A recipe title is required before saving.</strong>
          </p>
        )}
      </div>

      <div className={styles.section}>
        <h3 className="h5 outline">Ingredients</h3>

        {showIngredientWarning && (
          <p role="alert" className="error">
            <strong>No ingredients were extracted. Please add them manually.</strong>
          </p>
        )}

        <ul className={styles.list}>
          {ingredients.map((ing, i) => (
            <li key={i}>
              {/* TODO: show other ingredient properties: amount and preparation */}
              <input
                type="text"
                value={ing.name}
                onChange={(e) => updateIngredientName(i, e.target.value)}
                aria-label={`Ingredient ${i + 1}`}
                className={styles.inlineInput}
              />
              <button
                type="button"
                onClick={() => deleteIngredient(i)}
                aria-label={`Delete ingredient ${i + 1}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>

        <button type="button" onClick={addIngredient}>Add Ingredient</button>
      </div>

      <div className={styles.section}>
        <h3 className="h5 outline">Instructions</h3>

        {showInstructionWarning && (
          <p role="alert" className="error">
            <strong>No instructions were extracted. Please add them manually.</strong>
          </p>
        )}

        <ol className={styles.list}>
          {instructions.map((ins, i) => (
            <li key={i}>
              <textarea
                value={ins.text}
                onChange={(e) => updateInstructionText(i, e.target.value)}
                aria-label={`Instruction step ${i + 1}`}
                rows={1}
                className={styles.inlineInput}
              />

              <button
                type="button"
                onClick={() => deleteInstruction(i)}
                aria-label={`Delete instruction step ${i + 1}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ol>

        <button type="button" onClick={addInstruction}>Add Step</button>
      </div>

      {!!draft.uncategorized.length && (
        <div className={styles.section}>
          <h3 className="h5 outline">Uncategorized Content</h3>

          <p className="hint">
            <strong>The following text could not be classified. You can copy from it manually.</strong>
          </p>

          <br/>

          {draft.uncategorized.map((block, i) => (
            <p key={i}>{block}</p>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={titleEmpty}
        >
          Save Recipe
        </button>

        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
