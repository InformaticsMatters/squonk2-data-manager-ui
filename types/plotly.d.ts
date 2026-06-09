// `plotly.js-basic-dist` ships JavaScript only (no bundled types), so map it to the
// full `@types/plotly.js` definitions for the subset of the API the basic bundle exposes.
declare module "plotly.js-basic-dist" {
  import * as Plotly from "plotly.js";

  export = Plotly;
}
