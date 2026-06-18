/* eslint-disable */
// @ts-nocheck — Payload CMS generates these files at runtime
import { NotFoundPage } from '@payloadcms/next/views';
import { importMap } from '../importMap.js';

export { generatePageMetadata as generateMetadata } from '@payloadcms/next/views';

const NotFound = (props) => NotFoundPage({ ...props, importMap });

export default NotFound;
