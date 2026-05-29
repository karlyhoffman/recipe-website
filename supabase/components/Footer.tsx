import styles from '@/styles/components/footer.module.scss';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p>
        Built with{' '}
        <a href="https://nextjs.org/" target="_blank" rel="noreferrer">
          <strong>Next.js</strong>
        </a>{' '}
        and{' '}
        <a href="https://supabase.com/" target="_blank" rel="noreferrer">
          <strong>Supabase</strong>
        </a>
        .
      </p>
    </footer>
  );
}
