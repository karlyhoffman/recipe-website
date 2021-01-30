/* eslint-disable prefer-object-spread */
import React from 'react';
import { RichText, Elements } from 'prismic-reactjs';
import { linkResolver } from './api';

// -- Function to add unique key to props
const propsWithUniqueKey = (props, key) => {
  return Object.assign(props || {}, { key });
};

// -- HTML Serializer
export const htmlSerializer = (type, element, content, children, key) => {
  let props = {};

  switch (type) {
    case Elements.hyperlink: {
      const targetAttr = element.data.target
        ? { target: element.data.target }
        : {};

      const relAttr = element.data.target ? { rel: 'noopener' } : {};

      props = Object.assign(
        { href: element.data.url || linkResolver(element.data).as },
        targetAttr,
        relAttr
      );

      return React.createElement('a', propsWithUniqueKey(props, key), children);
    }

    // Return null to stick with the default behavior
    default:
      return null;
  }
};

export { htmlSerializer as default };
