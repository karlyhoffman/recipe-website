import LoginForm from '@/components/LoginForm';
import { Row, Column } from '@/components/Grid';

export const metadata = { title: 'Sign In' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string; returnUrl?: string }>;
}) {
  const { expired, returnUrl } = await searchParams;

  return (
    <Row>
      <Column>
      <h1 className="h2 highlight">Sign In</h1>
      <LoginForm expired={!!expired} returnUrl={returnUrl} />
    </Column>
  </Row>
  );
}
