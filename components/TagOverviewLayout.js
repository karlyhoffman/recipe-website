import React from 'react';
import Link from 'next/link';
import { RichText } from 'prismic-reactjs';
import { linkResolver } from '../utils/prismic';
import styles from '../styles/pages/tags-overview.scss';

export default ({ tags, label = 'Tags', titleKey, seasonTags }) => {
  const seasons = ['fall', 'winter', 'spring', 'summer'];

  const renderSeasonTags = arr => {
    const mainSeasons = arr.filter(tag => seasons.includes(tag.uid));
    const other = arr.filter(tag => !seasons.includes(tag.uid));

    return (
      <>
        <ul>
          {mainSeasons.map(tag => (
            <li key={tag.id}>
              <Link {...linkResolver(tag)}>
                <a>
                  {titleKey
                    ? tag.data[titleKey]
                    : RichText.asText(tag.data.title)}
                </a>
              </Link>
            </li>
          ))}
        </ul>
        <h3>Other</h3>
        <ul>
          {other.map(tag => (
            <li key={tag.id}>
              <Link {...linkResolver(tag)}>
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
    );
  };

  return (
    <div id="tags-overview" className="container">
      <div className="row">
        <div className="col-12">
          {tags.length ? (
            <>
              <h1>{label}</h1>
              {!seasonTags ? (
                <ul>
                  {tags.map(tag => (
                    <li key={tag.id}>
                      <Link {...linkResolver(tag)}>
                        <a>
                          {titleKey
                            ? tag.data[titleKey]
                            : RichText.asText(tag.data.title)}
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                renderSeasonTags(tags)
              )}
            </>
          ) : (
            <h1>No {label} Found</h1>
          )}
        </div>
      </div>
      <style jsx>{styles}</style>
    </div>
  );
};
