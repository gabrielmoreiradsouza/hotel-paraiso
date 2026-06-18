/* eslint-disable */
// @ts-nocheck — Payload CMS generates layout at runtime
import { RootLayout } from '@payloadcms/next/layouts';
import config from '../../payload.config.js';

type Args = {
  children: React.ReactNode;
};

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={{}}>
    {children}
  </RootLayout>
);

export default Layout;
