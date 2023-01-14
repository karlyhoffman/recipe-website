import styles from 'styles/components/footer.module.scss';

function Footer() {
  return (
    <footer className={styles.footer}>
      <p>
        Built with{' '}
        <a href="https://nextjs.org/" target="_blank" rel="noreferrer">
          <strong>Next.js</strong>
        </a>{' '}
        and{' '}
        <a href="https://prismic.io/" target="_blank" rel="noreferrer">
          <strong>Prismic</strong>
        </a>{' '}
        by{' '}
        <a href="https://karlyhoffman.com/" target="_blank" rel="noreferrer">
          <strong>Karly Hoffman</strong>
        </a>
        . <br className="d-mobile" />
        View the code{' '}
        <a
          href="https://github.com/karlyhoffman/recipe-website/tree/master/2023-recipe-website"
          target="_blank"
          rel="noreferrer"
        >
          <strong>here</strong>
        </a>
        .
      </p>
    </footer>
  );
}

export default Footer;
