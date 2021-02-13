import Link from 'next/link';
import { RichText } from 'prismic-reactjs';
import { linkResolver } from 'api/prismic-configuration';

function TagsDetailLayout({ recipes = [], children }) {
  const headline = children ? `${children} Recipes` : 'Recipes by Tag';

  return (
    <div id="tag_detail" className="container">
      <div className="row">
        <div className="col-12">
          <h1>{headline}</h1>
          {!!recipes.length ? (
            <ul>
              {recipes.map((recipe) => (
                <li key={recipe?.id}>
                  <Link href={linkResolver(recipe)}>
                    <a>{RichText.asText(recipe?.data?.title)}</a>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              <strong>No recipes found.</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TagsDetailLayout;
