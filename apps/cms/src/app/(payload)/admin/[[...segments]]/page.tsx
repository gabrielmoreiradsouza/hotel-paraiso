import type { AdminViewProps } from 'payload';
import { DefaultTemplate } from '@payloadcms/next/templates';
import { importMap } from '../importMap.js';

export { generatePageMetadata as generateMetadata } from '@payloadcms/next/views';

const Page = ({ params, searchParams }: AdminViewProps) =>
  DefaultTemplate({ importMap, params, searchParams });

export default Page;
