import React from 'react';
import Link from 'next/link';
import { RichText } from 'prismic-reactjs';
import { linkResolver } from '../utils/prismic';
import '../styles/pages/tags-overview.scss';

export default ({ tags, label = 'Tags', titleKey }) => {
  return (
    <div id="tags-overview" className="container">
      <div className="row">
        <div className="col-12">
          {tags.length ? (
            <>
              <h1>{label} </h1>
              <ul>
                {tags.map(tag => (
                  <li key={tag.id}>
                    <Link href={linkResolver(tag)}>
                      <a>
                        {titleKey
                          ? tag.data[titleKey]
                          : RichText.asText(tag.data.title)}
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <h1>No {label} Found</h1>
          )}
        </div>
      </div>
    </div>
  );
};
