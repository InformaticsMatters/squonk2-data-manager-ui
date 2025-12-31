import { type Ketcher } from "ketcher-core";

// Need to add ketcher type as it abuses the window
declare global {
  // eslint-disable-next-line vars-on-top
  var ketcher: Ketcher | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type Resolve<T> = T extends Function ? T : { [K in keyof T]: T[K] };
