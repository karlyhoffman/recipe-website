'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { applyHighlightColor } from '@/utils/highlight-text';

export default function HighlightColorApplier() {
  const pathname = usePathname();

  useEffect(() => {
    applyHighlightColor();
  }, [pathname]);

  return null;
}
