import type { AdminViewProps } from 'payload';
import { NotFoundPage } from '@payloadcms/next/views';
import { importMap } from '../importMap.js';

export { generatePageMetadata as generateMetadata } from '@payloadcms/next/views';

const NotFound = ({ params, searchParams }: AdminViewProps) =>
  NotFoundPage({ importMap, params, searchParams });

export default NotFound;
