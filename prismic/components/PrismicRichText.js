import Link from 'next/link';
import { PrismicRichText as BasePrismicRichText } from '@prismicio/react';

function InternalLink(props) {
  return <Link {...props} />;
}

function PrismicRichText(props) {
  return <BasePrismicRichText internalLinkComponent={InternalLink} {...props} />;
}

export default PrismicRichText;
