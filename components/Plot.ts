import createPlotlyComponent from 'react-plotly.js/factory';

import Plotly from 'plotly.js-basic-dist';

/**
 * Exports react-plotly's Plot component using a smaller plotly bundle.
 * WARNING: Always dynamically load this component without SSR. Plotly only works when browser
 * APIs are in scope and will throw an error otherwise.
 */
export const Plot = createPlotlyComponent(Plotly);
