import {
  documentGetInitialProps,
  DocumentHeadTags,
  type DocumentHeadTagsProps,
} from "@mui/material-nextjs/v15-pagesRouter";
import { type DocumentContext, Head, Html, Main, NextScript } from "next/document";

import {
  MAX_RECENT_PROJECTS,
  RECENT_PROJECTS_ATTRIBUTE,
  RECENT_PROJECTS_STORAGE_KEY,
} from "../projects/recentProjects";
import { withBasePath } from "../utils/app/basePath";

// Run before the first paint, so Home's server render can reserve the recent-projects section, at
// the number of cards it will hold, for a browser that remembers some: only the browser can read
// its own storage. The count is the one `parseRecentProjectIds` arrives at: distinct non-empty
// strings, at most the number Home shows.
const markRecentProjects = `try{var n=Math.min(new Set(JSON.parse(localStorage.getItem(${JSON.stringify(
  RECENT_PROJECTS_STORAGE_KEY,
)})).filter((id)=>typeof id==="string"&&id)).size,${MAX_RECENT_PROJECTS});if(n)document.documentElement.setAttribute(${JSON.stringify(
  RECENT_PROJECTS_ATTRIBUTE,
)},String(n))}catch{}`;

type DocumentProps = DocumentHeadTagsProps;

const MyDocument = (props: DocumentProps) => {
  return (
    <Html lang="en">
      <Head>
        <DocumentHeadTags {...props} />
        {/* Declared rather than left to the browser, which would ask the host's root for
            /favicon.ico rather than this app's base path. */}
        <link href={withBasePath("/favicon.ico")} rel="icon" sizes="32x32" />
        <link href={withBasePath("/icon.svg")} rel="icon" type="image/svg+xml" />
        <link href={withBasePath("/apple-touch-icon.png")} rel="apple-touch-icon" />
        {/* eslint-disable-next-line react/no-danger -- a fixed script of this module's own */}
        <script dangerouslySetInnerHTML={{ __html: markRecentProjects }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
  const finalProps = await documentGetInitialProps(ctx);
  return finalProps;
};

export default MyDocument;
