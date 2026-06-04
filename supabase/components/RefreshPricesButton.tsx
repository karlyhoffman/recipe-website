'use client';

import { useRef, useState, useTransition } from 'react';
import { refreshPricesAction } from '@/app/(utils)/groceries/actions';
import styles from '@/styles/components/store-comparison.module.scss';

export default function RefreshPricesButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Ref guard against rapid double-click: React's isPending update is async,
  // so a synchronous double-tap can dispatch two actions before the disabled
  // attribute commits. The ref flips synchronously inside the handler.
  const inFlight = useRef(false);

  function handleClick() {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    startTransition(async () => {
      try {
        const result = await refreshPricesAction();
        if (!result.ok) {
          setError('Refresh failed — try again');
        }
      } finally {
        inFlight.current = false;
      }
    });
  }

  return (
    <div className={styles.refresh}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={styles.refresh__button}
      >
        {isPending ? 'Refreshing…' : 'Refresh prices'}
      </button>
      {error && (
        <p role="alert" className={styles.refresh__error}>
          {error}
        </p>
      )}
    </div>
  );
}
