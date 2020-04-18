import React, { useState, useEffect, useRef } from 'react';
import '../styles/components/ingredient-menu.scss';

export default ({ parentContainer, sibling, className, children }) => {
  const menu = useRef(null);
  const [fontSize, setFontSize] = useState(false);
  const [stickyClass, setStickyClass] = useState('above');

  const checkScrollPosition = () => {
    const el = menu.current;
    const parentEl = parentContainer.current;
    const siblingEl = sibling.current;
    const isDesktop = window && window.innerWidth > 768;

    if (isDesktop) {
      if (el && siblingEl && parentEl) {
        const { height } = el.getBoundingClientRect();
        const { height: siblingHeight } = siblingEl.getBoundingClientRect();
        const {
          top: parentTop,
          bottom: parentBottom
        } = parentEl.getBoundingClientRect();

        const navbarHeight = 27;
        const bottomPadding = 70;

        // If menu is shorter than instructions
        if (height < siblingHeight + navbarHeight) {
          // if top of section is above top of viewport (navbar in this case)
          if (parentTop > navbarHeight) {
            setFontSize(false);
            if (stickyClass !== 'above') setStickyClass('above');
          }
          // if top of section is at the navbar
          // or if bottom of element is above bottom of section (-margin and padding)
          else if (
            parentTop === navbarHeight ||
            parentBottom - bottomPadding > height
          ) {
            if (stickyClass !== 'fixed') {
              if (height > window.innerHeight - 90) setFontSize(true);
              setStickyClass('fixed');
            }
          }
          // else make positioned at bottom of section
          else if (stickyClass !== 'below') {
            setStickyClass('below');
          }
        }
      }
    } else if (stickyClass !== '') setStickyClass('');
  };

  // useEffect(() => {
  //   // componentDidMount + componentDidUpdate
  //   checkScrollPosition();
  //   window.addEventListener('scroll', checkScrollPosition);
  //   window.addEventListener('resize', checkScrollPosition);

  //   // componentWillUnmount
  //   return () => {
  //     window.removeEventListener('scroll', checkScrollPosition);
  //     window.removeEventListener('resize', checkScrollPosition);
  //   };
  // });

  return (
    <div
      ref={menu}
      className={`ingredient-menu ${stickyClass}${
        className ? ` ${className}` : ''
      }${fontSize ? ' font-sm' : ''}`}
    >
      {children}
    </div>
  );
};
