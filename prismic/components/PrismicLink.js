import Link from 'next/link';
import { PrismicLink as BasePrismicLink } from '@prismicio/react';

function InternalLink(props) {
  return <Link {...props} />;
}

function PrismicLink(props) {
  return <BasePrismicLink internalComponent={InternalLink} {...props} />;
}

export default PrismicLink;
