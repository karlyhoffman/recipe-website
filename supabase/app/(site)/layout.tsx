import styles from '@/styles/components/layout.module.scss';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.siteLayout}>{children}</div>;
}
