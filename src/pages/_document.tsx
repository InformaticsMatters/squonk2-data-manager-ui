import {
  documentGetInitialProps,
  DocumentHeadTags,
  type DocumentHeadTagsProps,
} from "@mui/material-nextjs/v15-pagesRouter";
import { type DocumentContext, Head, Html, Main, NextScript } from "next/document";

import { withBasePath } from "../utils/app/basePath";

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
