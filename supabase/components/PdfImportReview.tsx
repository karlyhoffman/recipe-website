'use client';

import { useState } from 'react';
import type { ImportDraft, IngredientSlice, InstructionSlice, Tag } from '@/types';
import type { TagOption } from '@/app/api/tags/route';
import { AISLES } from '@/utils/aisles';
import styles from '@/styles/components/pdf-import.module.scss';
import { Column, Row } from './Grid';

const TAG_CATEGORY_LABELS: Record<TagOption['category'], string> = {
  cuisine: 'Cuisine',
  type: 'Type',
  season: 'Season',
  ingredient: 'Ingredient',
};

interface Props {
  draft: ImportDraft;
  allTags: TagOption[];
  onConfirm: (draft: ImportDraft) => void;
  onCancel: () => void;
}

export default function PdfImportReview({ draft, allTags, onConfirm, onCancel }: Props) {
  const [title, setTitle] = useState(draft.title ?? '');
  const [prepMinutes, setPrepMinutes] = useState<number | ''>(draft.prep_minutes ?? '');
  const [totalMinutes, setTotalMinutes] = useState<number | ''>(draft.total_minutes ?? '');
  const [servings, setServings] = useState<number | ''>(draft.servings ?? '');
  const [notes, setNotes] = useState(draft.notes ?? '');
  const [ingredients, setIngredients] = useState<IngredientSlice[]>(draft.ingredients);
  const [instructions, setInstructions] = useState<InstructionSlice[]>(draft.instructions);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
    new Set(draft.recipe_tags?.map((t) => t.id) ?? [])
  );
  const titleEmpty = title.trim() === '';

  function updateIngredient(index: number, field: keyof IngredientSlice, value: string) {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)));
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

  function toggleTag(id: string) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    if (titleEmpty) return;
    const tagMap = new Map(allTags.map((t) => [t.id, t]));
    const recipe_tags: Tag[] = Array.from(selectedTagIds)
      .map((id) => tagMap.get(id))
      .filter((t): t is TagOption => !!t)
      .map(({ id, uid, name }) => ({ id, uid, name }));

    onConfirm({
      ...draft,
      title,
      ingredients,
      instructions,
      prep_minutes: prepMinutes === '' ? undefined : prepMinutes,
      total_minutes: totalMinutes === '' ? undefined : totalMinutes,
      servings: servings === '' ? undefined : servings,
      notes: notes.trim() || undefined,
      recipe_tags,
    });
  }

  const showIngredientWarning = ingredients.length === 0;
  const showInstructionWarning = instructions.length === 0;

  const tagCategories = (['cuisine', 'type', 'season', 'ingredient'] as const).map((cat) => ({
    category: cat,
    label: TAG_CATEGORY_LABELS[cat],
    tags: allTags.filter((t) => t.category === cat),
  })).filter((g) => g.tags.length > 0);

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
        <h3 className="h5 outline">Recipe Details</h3>

        <div className={styles.section__meta}>
          <fieldset>
            <label htmlFor="review-prep">Prep Time (min)</label>
            <input
              id="review-prep"
              type="number"
              min="0"
              value={prepMinutes}
              onChange={(e) => setPrepMinutes(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </fieldset>

          <fieldset>
            <label htmlFor="review-total">Total Time (min)</label>
            <input
              id="review-total"
              type="number"
              min="0"
              value={totalMinutes}
              onChange={(e) => setTotalMinutes(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </fieldset>

          <fieldset>
            <label htmlFor="review-servings">Servings</label>
            <input
              id="review-servings"
              type="number"
              min="0"
              value={servings}
              onChange={(e) => setServings(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </fieldset>

          <fieldset className={styles.notes}>
            <label htmlFor="review-notes">Notes</label>
            <textarea
              id="review-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </fieldset>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className="h5 outline">Ingredients</h3>

        {showIngredientWarning && (
          <p role="alert" className="error">
            <strong>No ingredients were extracted. Please add them manually.</strong>
          </p>
        )}

        <ul className={styles.ingredients}>
          {ingredients.map((ing, i) => (
            <li key={i}>
              <fieldset data-ingredient-name>
                <label htmlFor={`ingredient-name-${i}`}>Name</label>
                <input
                  type="text"
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                  aria-label={`Ingredient ${i + 1} name`}
                />
              </fieldset>

              <fieldset>
                <label htmlFor={`ingredient-amount-${i}`}>Amount</label>
                <input
                  type="text"
                  value={ing.amount ?? ''}
                  onChange={(e) => updateIngredient(i, 'amount', e.target.value)}
                  aria-label={`Ingredient ${i + 1} amount`}
                  data-ingredient-amount
                />
              </fieldset>

              <fieldset>
                <label htmlFor={`ingredient-preparation-${i}`}>Preparation</label>
                <input
                  type="text"
                  value={ing.preparation ?? ''}
                  onChange={(e) => updateIngredient(i, 'preparation', e.target.value)}
                  aria-label={`Ingredient ${i + 1} preparation`}
                  data-ingredient-preparation
                />
              </fieldset>

              <fieldset data-ingredient-aisle>
                <label htmlFor={`ingredient-aisle-${i}`}>Aisle</label>
                <select
                  id={`ingredient-aisle-${i}`}
                  value={ing.aisle ?? ''}
                  onChange={(e) => updateIngredient(i, 'aisle', e.target.value)}
                  aria-label={`Ingredient ${i + 1} aisle`}
                >
                  <option value="">—</option>
                  {[...AISLES].sort().map((aisle) => (
                    <option key={aisle} value={aisle}>{aisle}</option>
                  ))}
                </select>
              </fieldset>

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
                rows={2}
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

      {!!tagCategories.length && (
        <div className={styles.section}>
          <h3 className="h5 outline">Tags</h3>

          <div className={styles.tags}>
            {tagCategories.map(({ category, label, tags }) => (
              <div key={category} className={styles.tags__item}>
                <h4 className="h6">{label}</h4>
                <ul>
                  {tags.map((tag) => (
                    <li key={tag.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedTagIds.has(tag.id)}
                          onChange={() => toggleTag(tag.id)}
                        />
                        {tag.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

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
