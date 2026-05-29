import { PrismicLink } from '@prismicio/react';
import { Row, Column, PaginationMenu } from 'components';

function TagOverviewLayout({ tags = [], type, children: tagName = 'Tags', totalCount, pageSize, page }) {
  if (!tags.length) {
    return (
      <Row>
        <Column>
          <h1 className="h4 outline">{`No ${tagName} Found`}</h1>
        </Column>
      </Row>
    );
  }

  return (
    <Row>
      <Column>
        <h1 className="h4 outline">{tagName}</h1>
        {type === 'season_tag' ? (
          <SeasonTags tags={tags} />
        ) : (
          <>
            <ul className="recipe-list">
              {tags.map((tag) => (
                <TagListItem key={tag.id} tag={tag} type={type} />
              ))}
            </ul>
            <PaginationMenu {...{ totalCount, pageSize, page }} />
          </>
        )}
      </Column>
    </Row>
  );
}

function TagListItem({ tag, type }) {
  return (
    <li>
      <PrismicLink document={tag} className="h5 highlight">
        {tag?.data?.[type]}
      </PrismicLink>
    </li>
  );
}

function SeasonTags({ tags }) {
  const seasons = ['fall', 'winter', 'spring', 'summer'];
  const { mainSeasons, other } = tags.reduce(
    (acc, tag) => {
      seasons.includes(tag.uid) ? acc.mainSeasons.push(tag) : acc.other.push(tag);
      return acc;
    },
    { mainSeasons: [], other: [] }
  );

  return (
    <>
      <ul className="recipe-list">
        {mainSeasons.map((tag) => (
          <TagListItem key={tag.id} tag={tag} type="season_tag" />
        ))}
      </ul>
      <h2 className="h5 outline">Other</h2>
      <ul className="recipe-list">
        {other.map((tag) => (
          <TagListItem key={tag.id} tag={tag} type="season_tag" />
        ))}
      </ul>
    </>
  );
}

export default TagOverviewLayout;
