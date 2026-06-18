/* eslint-disable */
// @ts-nocheck — Payload CMS generates these files at runtime
import { DefaultTemplate } from '@payloadcms/next/templates';
import { importMap } from '../importMap.js';

export { generatePageMetadata as generateMetadata } from '@payloadcms/next/views';

const Page = (props) => DefaultTemplate({ ...props, importMap });

export default Page;
