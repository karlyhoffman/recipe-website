'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import styles from '@/styles/components/pagination-menu.module.scss';

interface Props {
  totalCount: number;
  pageSize: number;
  page: number;
}

function PaginationMenuInner({ totalCount, pageSize, page }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const numOfPages = totalCount && pageSize ? Math.ceil(totalCount / pageSize) : 0;

  if (numOfPages < 2) return null;

  return (
    <ul className={styles.pagination_menu}>
      {[...Array(numOfPages).keys()].map((index) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(index + 1));

        return (
          <li className="h6" key={`page-${index}`}>
            {index + 1 === Number(page) ? (
              <span className="outline">{page}</span>
            ) : (
              <Link href={`${pathname}?${params.toString()}`}>{index + 1}</Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function PaginationMenu(props: Props) {
  return (
    <Suspense>
      <PaginationMenuInner {...props} />
    </Suspense>
  );
}
