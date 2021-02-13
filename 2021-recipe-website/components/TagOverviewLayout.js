import React from 'react';
import Link from 'next/link';
import { linkResolver } from 'api/prismic-configuration';

function TagOverviewLayout({ tags = [], type, children = 'Tags' }) {
  return (
    <div id="tags_overview" className="container">
      <div className="row">
        <div className="col-12">
          {!!tags.length ? (
            <>
              <h1>{children}</h1>
              {type !== 'season_tag' ? (
                <ul>
                  {tags.map((tag) => (
                    <TagListItem key={tag.id} tag={tag} type={type} />
                  ))}
                </ul>
              ) : (
                <SeasonTags tags={tags} />
              )}
            </>
          ) : (
            <h1>No {children} Found</h1>
          )}
        </div>
      </div>
    </div>
  );
}

function TagListItem({ tag, type }) {
  return (
    <li>
      <Link href={linkResolver(tag)}>
        <a>{tag?.data?.[type]}</a>
      </Link>
    </li>
  );
}

function SeasonTags({ tags }) {
  const seasons = ['fall', 'winter', 'spring', 'summer'];

  const mainSeasons = tags.filter((tag) => seasons.includes(tag.uid));
  const other = tags.filter((tag) => !seasons.includes(tag.uid));

  return (
    <>
      <ul>
        {mainSeasons.map((tag) => (
          <TagListItem key={tag.id} tag={tag} type="season_tag" />
        ))}
      </ul>
      <h3>Other</h3>
      <ul>
        {other.map((tag) => (
          <TagListItem key={tag.id} tag={tag} type="season_tag" />
        ))}
      </ul>
    </>
  );
}

export default TagOverviewLayout;
