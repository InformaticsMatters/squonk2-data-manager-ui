import {
  documentGetInitialProps,
  DocumentHeadTags,
  type DocumentHeadTagsProps,
} from "@mui/material-nextjs/v15-pagesRouter";
import { type DocumentContext, Head, Html, Main, NextScript } from "next/document";

type DocumentProps = DocumentHeadTagsProps;

const MyDocument = (props: DocumentProps) => {
  return (
    <Html lang="en">
      <Head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script crossOrigin="anonymous" src="//unpkg.com/react-scan/dist/auto.global.js" />
        <DocumentHeadTags {...props} />
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
