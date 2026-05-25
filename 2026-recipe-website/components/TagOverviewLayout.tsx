import Link from 'next/link';
import { Row, Column } from '@/components/Grid';
import PaginationMenu from '@/components/PaginationMenu';
import { highlightStyle, randomColorStart } from '@/utils/highlight';
import type { Tag } from '@/types';

interface Props {
  tags: Tag[];
  tagType: string;
  basePath: string;
  title: string;
  totalCount: number;
  pageSize: number;
  page: number;
}

export default function TagOverviewLayout({ tags, tagType, basePath, title, totalCount, pageSize, page }: Props) {
  const start = randomColorStart();

  if (!tags.length) {
    return (
      <Row>
        <Column>
          <h1 className="h4 outline">{`No ${title} Found`}</h1>
        </Column>
      </Row>
    );
  }

  return (
    <Row>
      <Column>
        <h1 className="h4 outline">{title}</h1>
        {tagType === 'season' ? (
          <SeasonTags tags={tags} basePath={basePath} start={start} />
        ) : (
          <>
            <ul className="recipe-list">
              {tags.map((tag, i) => (
                <li key={tag.id}>
                  <Link href={`${basePath}/${tag.uid}`} className="h5 highlight" style={highlightStyle(i, start)}>
                    {tag.name}
                  </Link>
                </li>
              ))}
            </ul>
            <PaginationMenu totalCount={totalCount} pageSize={pageSize} page={page} />
          </>
        )}
      </Column>
    </Row>
  );
}

function SeasonTags({ tags, basePath, start }: { tags: Tag[]; basePath: string; start: number }) {
  const mainSeasonUids = ['fall', 'winter', 'spring', 'summer'];
  const { mainSeasons, other } = tags.reduce(
    (acc, tag) => {
      mainSeasonUids.includes(tag.uid) ? acc.mainSeasons.push(tag) : acc.other.push(tag);
      return acc;
    },
    { mainSeasons: [] as Tag[], other: [] as Tag[] }
  );

  return (
    <>
      <ul className="recipe-list">
        {mainSeasons.map((tag, i) => (
          <li key={tag.id}>
            <Link href={`${basePath}/${tag.uid}`} className="h5 highlight" style={highlightStyle(i, start)}>
              {tag.name}
            </Link>
          </li>
        ))}
      </ul>
      {other.length > 0 && (
        <>
          <h2 className="h5 outline">Other</h2>
          <ul className="recipe-list">
            {other.map((tag, i) => (
              <li key={tag.id}>
                <Link href={`${basePath}/${tag.uid}`} className="h5 highlight" style={highlightStyle(i, start)}>
                  {tag.name}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
