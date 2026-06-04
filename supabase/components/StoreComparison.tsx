import { computePriceComparison } from '@/lib/prices';
import RefreshPricesButton from '@/components/RefreshPricesButton';
import styles from '@/styles/components/store-comparison.module.scss';

interface Props {
  ingredientNames: string[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default async function StoreComparison({ ingredientNames }: Props) {
  const result = await computePriceComparison(ingredientNames);

  if (result.isUnavailable) {
    return (
      <section className={styles.section}>
        <h2 className={`h3 outline ${styles.section__heading}`}>Cheapest Grocery Store</h2>
        <p className={styles.unavailable}>
          Pricing data unavailable — check back later.
        </p>
        <RefreshPricesButton />
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <header className={styles.section__header}>
        <h2 className={`h3 outline ${styles.section__heading}`}>Cheapest Grocery Store</h2>
        <RefreshPricesButton />
      </header>

      <ul className={styles.stores}>
        {result.entries.map((entry, i) => (
          <li key={entry.store.id} className={styles.store}>
            <header className={styles.store__header}>
              <span className={styles.store__rank}>#{i + 1}</span>
              <h3 className={`h5 ${styles.store__name}`}>{entry.store.name}</h3>
              <p className={styles.store__total}>{formatCurrency(entry.totalCost)}</p>
              <p className={styles.store__count}>
                {entry.matchedCount} of {result.totalIngredients} ingredients priced
              </p>
            </header>

            <ul className={styles.ingredients}>
              {entry.matchedIngredients.map((m) => (
                <li key={`m-${m.ingredientName}`} className={styles.ingredient}>
                  <span className={styles.ingredient__name}>{m.ingredientName}</span>
                  <span className={styles.ingredient__price}>
                    {formatCurrency(m.price)}
                    <span className={styles.ingredient__unit}>/{m.unit}</span>
                  </span>
                </li>
              ))}
              {entry.unmatchedIngredients.map((u) => (
                <li
                  key={`u-${u.name}`}
                  className={`${styles.ingredient} ${styles['ingredient--unmatched']}`}
                >
                  <span className={styles.ingredient__name}>{u.name}</span>
                  <span className={styles.ingredient__unavailable}>price not available</span>
                </li>
              ))}
            </ul>

            <footer className={styles.store__footer}>
              <p className={styles.store__updated}>
                prices as of {formatTimestamp(entry.lastUpdated)}
              </p>
              {entry.isStale && (
                <p className={styles.store__stale} role="status">
                  Prices are more than 7 days old — consider refreshing.
                </p>
              )}
            </footer>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StoreComparisonLoading() {
  return (
    <section className={styles.section}>
      <h2 className={`h3 outline ${styles.section__heading}`}>Cheapest Grocery Store</h2>
      <div className={styles.loading} aria-live="polite" aria-busy="true">
        <div className={styles.loading__skeleton} />
        <div className={styles.loading__skeleton} />
      </div>
    </section>
  );
}
