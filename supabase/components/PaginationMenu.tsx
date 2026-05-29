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
      {Array.from({ length: numOfPages }, (_, i) => i + 1).map((pageNum) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(pageNum));

        return (
          <li className="h6" key={`page-${pageNum}`}>
            {pageNum === Number(page) ? (
              <span className="outline">{pageNum}</span>
            ) : (
              <Link href={`${pathname}?${params.toString()}`}>{pageNum}</Link>
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
