import Anthropic from '@anthropic-ai/sdk';
import type { ImportDraft, IngredientSlice, InstructionSlice } from '@/types';

const client = new Anthropic();

export async function extractRecipe(text: string, filename: string): Promise<ImportDraft> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Extract the recipe from the text below and return only a JSON object with this exact structure:
{
  "title": "Recipe title as a string, or null if not found",
  "ingredients": [
    { "type": "ingredient", "name": "ingredient name", "amount": "quantity or omit", "preparation": "prep note or omit" }
  ],
  "instructions": [
    { "type": "instruction", "text": "step text" }
  ],
  "uncategorized": ["any text blocks you could not classify as title, ingredient, or instruction"]
}

Return only valid JSON with no markdown fences or explanation.

Recipe text:
${text}`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== 'text') {
    return { title: null, ingredients: [], instructions: [], uncategorized: [], filename };
  }

  const jsonText = block.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

  try {
    const parsed = JSON.parse(jsonText) as {
      title: string | null;
      ingredients: IngredientSlice[];
      instructions: InstructionSlice[];
      uncategorized: string[];
    };
    return {
      title: parsed.title ?? null,
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      instructions: Array.isArray(parsed.instructions) ? parsed.instructions : [],
      uncategorized: Array.isArray(parsed.uncategorized) ? parsed.uncategorized : [],
      filename,
    };
  } catch (err) {
    console.error('[extractor] JSON parse failed:', (err as Error).message, '| raw:', jsonText.slice(0, 300));
    return { title: null, ingredients: [], instructions: [], uncategorized: [], filename };
  }
}
