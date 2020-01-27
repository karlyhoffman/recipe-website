import React, { Children, useState } from 'react';

export default ({ ingredients }) => {
  const ingredientList = ingredients.map(ingredient => ingredient[0].text);
  const [groceries, setGroceries] = useState(ingredientList);

  const updateTodoAtIndex = (e, i) => {
    const newItems = [...groceries];
    newItems[i] = e.target.value;
    setGroceries(newItems);
  };

  const removeItemAtIndex = i => {
    if (i === 0 && groceries.length === 1) return;
    setGroceries(
      groceries.slice(0, i).concat(groceries.slice(i + 1, groceries.length))
    );
  };

  return (
    <form id="grocery-list">
      <ul>
        {Children.toArray(
          groceries.map((grocery, i) => (
            <li className="list-item">
              <input
                type="text"
                value={grocery}
                onChange={e => updateTodoAtIndex(e, i)}
              />
              <button
                className="remove"
                onClick={() => removeItemAtIndex(i)}
                type="button"
                aria-label="Close"
              />
            </li>
          ))
        )}
      </ul>
    </form>
  );
};
