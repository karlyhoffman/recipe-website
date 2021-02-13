import { useState } from 'react';
import classNames from 'classnames';
import styles from 'styles/pages/groceries.module.scss';

function GroceryList({ ingredients = [], isEditing = false }) {
  const ingredientList = ingredients.map((ingredient) => ingredient[0].text);
  const [groceries, setGroceries] = useState(ingredientList);

  const updateTodoAtIndex = (e, i) => {
    const newItems = [...groceries];
    newItems[i] = e.target.value;
    setGroceries(newItems);
  };

  const removeItemAtIndex = (i) => {
    if (i === 0 && groceries.length === 1) return;
    setGroceries(
      groceries.slice(0, i).concat(groceries.slice(i + 1, groceries.length))
    );
  };

  return (
    <form
      id={styles.grocery_list}
      className={classNames({ [styles.editing]: isEditing })}
    >
      <ul>
        {groceries.map((grocery, i) => (
          <li className={styles.list_item} key={'grocery-item' + grocery + i}>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={grocery}
                  onChange={(e) => updateTodoAtIndex(e, i)}
                />
                <button
                  className={styles.remove}
                  onClick={() => removeItemAtIndex(i)}
                  type="button"
                  aria-label="Close"
                />
              </>
            ) : (
              grocery
            )}
          </li>
        ))}
      </ul>
    </form>
  );
}

export default GroceryList;
