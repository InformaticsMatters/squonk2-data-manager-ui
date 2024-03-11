import { Fragment } from "react";
import type { PlotParams } from "react-plotly.js";

import { Box, CircularProgress, Tooltip, Typography } from "@mui/material";
import dynamic from "next/dynamic";

import type { UsageChartData } from "./types";

const Plot = dynamic<PlotParams>(
  () => import("../../components/viz/Plot").then((mod) => mod.Plot),
  {
    ssr: false, // Plotly only works when browser APIs are in scope
    loading: () => <CircularProgress size="1rem" />,
  },
);

export interface UsageChartProps {
  chartData: UsageChartData[];
  unitCost: number;
}

/**
 * Returns the number of decimal places values should display. This prevents rounding error when
 * doing calculations (e.g. the 'Available' field). The amount of decimal points is derived from the
 * `unit_cost` each product has.
 */
const getDecimalPoints = (unitCost: number) => {
  const cost = String(unitCost);
  const decimalPart = cost.split(".").at(1);
  const decimalPoints = decimalPart !== undefined ? decimalPart.length : 0;
  return decimalPoints;
};

export const UsageChart = ({ chartData, unitCost }: UsageChartProps) => {
  const valuesSummed = chartData
    .map((data) => data.value)
    .reduce((prevValue, nextValue) => prevValue + nextValue);

  const decimalPoints = getDecimalPoints(unitCost);

  return (
    <Tooltip
      title={
        <Box
          alignItems="center"
          columnGap={4}
          display="grid"
          gridTemplateColumns="repeat(5, auto)"
          rowGap={1}
        >
          {chartData.map((item) => {
            return (
              <Fragment key={item.type}>
                {/* Colour icon box */}
                <Box
                  bgcolor={item.color}
                  border={1}
                  borderColor="white"
                  display="inline-block"
                  height={14}
                  width={14}
                />
                <Typography component="span" variant="body2">
                  {item.type}
                </Typography>
                <Typography component="span" sx={{ justifySelf: "end" }} variant="body2">
                  {item.value.toFixed(decimalPoints)}
                </Typography>
                <Typography component="span" variant="body2">
                  /
                </Typography>
                <Typography noWrap component="span" sx={{ justifySelf: "end" }} variant="body2">
                  {((item.value / valuesSummed) * 100).toFixed(2)} %
                </Typography>
              </Fragment>
            );
          })}
        </Box>
      }
    >
      <Box alignItems="center" display="flex" height={24} justifyContent="center" width="100%">
        {/**
         * `useResizeHandler` makes the chart responsive, see 'Note' in 'Basic Props' (API
         * Reference) in react-plotly's README here https://github.com/plotly/react-plotly.js/
         */}
        <Plot
          useResizeHandler
          config={{ displayModeBar: false }}
          data={chartData.map((item) => ({
            x: [item.value],
            orientation: "h",
            marker: { color: item.color },
            type: "bar",
            xgap: 0,
          }))}
          layout={{
            hovermode: false,
            showlegend: false,
            autosize: true,
            margin: { b: 0, t: 0, l: 0, r: 0 },
            barmode: "stack",
            xaxis: {
              range: [0, valuesSummed],
              showgrid: false,
              zeroline: false,
              visible: false,
              fixedrange: true,
            },
            yaxis: {
              // This range zooms into the chart on the Y axis which makes the bars fill the whole
              // chart container
              range: [0, 0.1],
              showgrid: false,
              zeroline: false,
              visible: false,
              fixedrange: true,
            },
          }}
          style={{ width: "100%", height: "100%" }}
        />
      </Box>
    </Tooltip>
  );
};
