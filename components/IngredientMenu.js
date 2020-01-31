import React, { useState, useEffect, useRef } from 'react';
import '../styles/components/ingredient-menu.scss';

export default ({ parentContainer, sibling, className, children }) => {
  const menu = useRef(null);
  const [stickyClass, setStickyClass] = useState('above');

  const checkScrollPosition = () => {
    const elmt = menu.current;
    const parentElmt = parentContainer.current;
    const siblingElmt = sibling.current;
    const isDesktop = window && window.innerWidth > 768;

    if (isDesktop) {
      if (elmt && siblingElmt && parentElmt) {
        const { height } = elmt.getBoundingClientRect();
        const { height: siblingHeight } = siblingElmt.getBoundingClientRect();
        const {
          top: parentTop,
          bottom: parentBottom
        } = parentElmt.getBoundingClientRect();

        const navbarHeight = 60;

        if (height < siblingHeight) {
          if (parentTop > navbarHeight) {
            // if top of section is above top of viewport (navbar in this case)
            if (stickyClass !== 'above') setStickyClass('above');
          } else if (
            parentTop === navbarHeight ||
            parentBottom - 100 > height
          ) {
            // if top of section is at the navbar
            // or if bottom of element is above bottom of section (-margin and padding)
            if (stickyClass !== 'fixed') setStickyClass('fixed');
          } else if (parentBottom - 100 <= height) {
            // if bottom of section (-margin and padding) is at or above bottom of viewport
            if (stickyClass !== 'below') setStickyClass('below');
          }
        }
      }
    } else if (stickyClass !== '') setStickyClass('');
  };

  useEffect(() => {
    // componentDidMount + componentDidUpdate
    checkScrollPosition();
    window.addEventListener('scroll', checkScrollPosition);
    window.addEventListener('resize', checkScrollPosition);

    // componentWillUnmount
    return () => {
      window.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  });

  return (
    <div
      ref={menu}
      className={`ingredient-menu ${stickyClass}${
        className ? ` ${className}` : ''
      }`}
      style={{
        maxHeight:
          stickyClass === 'fixed' && window ? window.innerHeight - 90 : '100%'
      }}
    >
      {children}
    </div>
  );
};
