export const applyHighlightColor = () => {
  const elements = [...document.querySelectorAll('a.highlight')];
  const numOfColors = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--color-list-length'));

  elements.forEach((el, i) => el.classList.add(`color-${(i % numOfColors) + 1}`));
};
