import Link from 'next/link';
import { Row, Column } from '@/components/Grid';
import PaginationMenu from '@/components/PaginationMenu';
import { recipes } from '@/lib/placeholder-data';

const PAGE_SIZE = 100;

export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { search: term = '', page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;

  const results = term
    ? recipes.filter((r) => r.title.toLowerCase().includes(term.toLowerCase()))
    : [];

  const hasResults = !!term && results.length > 0;
  const noResults = !!term && results.length === 0;

  return (
    <Row>
      <Column>
        <h1 className="h4 outline">Search {term && `results for "${term}"`}</h1>

        {hasResults && (
          <>
            <ul className="recipe-list">
              {results.map((recipe) => (
                <li key={recipe.id}>
                  <Link href={`/recipes/${recipe.uid}`} className="h5 highlight">
                    {recipe.title}
                  </Link>
                </li>
              ))}
            </ul>
            <PaginationMenu totalCount={results.length} pageSize={PAGE_SIZE} page={page} />
          </>
        )}

        {noResults && <p>No recipes found.</p>}
        {!term && <p>Use the search bar to find recipes.</p>}
      </Column>
    </Row>
  );
}
