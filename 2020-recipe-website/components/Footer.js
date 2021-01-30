import React from 'react';
import SearchBar from './SearchBar';
import { MobileDetect } from '../utils/MobileDetect';
import '../styles/components/footer.scss';

export default () => {
  const isMobile = MobileDetect();

  if (!isMobile) return null;

  return (
    <footer>
      <SearchBar />
    </footer>
  );
};
