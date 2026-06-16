import { RootLayout } from '@payloadcms/next/layouts';
import config from '../../payload.config.js';

import './custom.scss';

type Args = {
  children: React.ReactNode;
};

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={{}}>
    {children}
  </RootLayout>
);

export default Layout;
