import { useState, useEffect } from 'react';
import { SearchBar } from 'components';
import styles from 'styles/components/footer.module.scss';

function Footer() {
  const [isMobile, setIsMobile] = useState();

  useEffect(() => {
    setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    );
  }, []);

  if (!isMobile) return null;

  return (
    <footer id={styles.footer}>
      <SearchBar />
    </footer>
  );
}

export default Footer;
