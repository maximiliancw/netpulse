import { NetworkGraph } from '../../components';
import { Layout } from '../../components/layout';

export function Dashboard() {
  return (
    <Layout>
      <div className="w-full space-y-6">
        <NetworkGraph />
      </div>
    </Layout>
  );
}