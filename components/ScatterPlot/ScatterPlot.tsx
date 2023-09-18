import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import type { PlotParams } from "react-plotly.js";

import {
  Box,
  CircularProgress,
  MenuItem,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import dynamic from "next/dynamic";
import type { PlotDatum } from "plotly.js-basic-dist";

import type { Molecule } from "../../features/SDFViewer";

const Plot = dynamic<PlotParams>(
  () => import("../../components/viz/Plot").then((mod) => mod.Plot),
  {
    ssr: false, // Plotly only works when browser APIs are in scope
    loading: () => <CircularProgress size="1rem" />,
  },
);

// Utils

export const isNumber = (x: unknown): x is number => typeof x === "number";

const getPropArrayFromMolecules = (molecules: Molecule[], prop: string | null) => {
  if (prop === "id") {
    return molecules.map((molecule) => molecule.id);
  }
  return molecules.map((molecule) => (prop ? molecule.properties[prop] ?? null : null));
};

type AxisSeries = ReturnType<typeof getPropArrayFromMolecules>;

const scaleToSize = (sizeaxis: AxisSeries) => {
  const sx = sizeaxis
    .filter((value): value is string => value !== null)
    .map((value) => Number.parseFloat(value));
  const min = Math.min(...sx);
  const max = Math.max(...sx);

  const scaledSizes = sx.map((v) => (45 * (v - min)) / max + 5);

  if (min >= max) {
    return { sizes: 10 };
  }

  return { sizes: scaledSizes, min, max };
};

const validateColours = (colouraxis: AxisSeries) => {
  const cx = colouraxis
    .filter((value): value is string => value !== null)
    .map((value) => Number.parseFloat(value));

  const min = Math.min(...cx);
  const max = Math.max(...cx);

  if (min >= max) {
    return { colours: 1 };
  }

  return { colours: colouraxis, min, max };
};

export interface ScatterPlotProps {
  molecules: Molecule[];
  properties: string[];
  selectPoints: (ids: string[]) => void;
  width: number;
}

export const ScatterPlot = ({ molecules, properties, selectPoints, width }: ScatterPlotProps) => {
  // const selectedPoints = selection.map((id) => molecules.findIndex((m) => m.id === id));

  const [showColourBar, setShowColourBar] = useState(true);

  const [xprop, setXprop] = useState(properties[0]);
  const [yprop, setYprop] = useState(properties[1]);
  const [cprop, setCprop] = useState(properties[2]);
  const [sprop, setSprop] = useState(properties[3]);

  const xaxis = getPropArrayFromMolecules(molecules, xprop);
  const yaxis = getPropArrayFromMolecules(molecules, yprop);

  const colouraxis = getPropArrayFromMolecules(molecules, cprop);
  const sizeaxis = getPropArrayFromMolecules(molecules, sprop);

  const { sizes, ...sizeExtent } = scaleToSize(sizeaxis);
  const { colours } = validateColours(colouraxis);

  return (
    <>
      <Plot
        config={{
          modeBarButtonsToRemove: [
            "resetScale2d",
            "hoverClosestCartesian",
            "hoverCompareCartesian",
            "toImage",
            "toggleSpikelines",
          ],
        }}
        data={[
          {
            x: xaxis,
            y: yaxis,
            customdata: molecules.map((m) => m.id), // Add custom data for use in selection
            // selectedpoints: selectedPoints.length ? selectedPoints : undefined, // null or undefined?
            type: "scatter",
            mode: "markers",
            marker: {
              color: colours,
              size: sizes,
              colorscale: "Bluered",
              colorbar: showColourBar ? {} : undefined,
            },
          },
        ]}
        layout={{
          width,
          height: width,
          margin: { t: 10, r: 10, b: 50, l: 50 },
          dragmode: "select",
          selectionrevision: 1,
          hovermode: "closest",
          xaxis: { title: xprop },
          yaxis: { title: yprop },
        }}
        onDeselect={() => selectPoints([])}
        onSelected={(event) => {
          // @types is wrong here, we need `?.` as points can be undefined (double click event)
          const points = event.points as PlotDatum[] | undefined;
          points?.length && selectPoints(points.map((p) => p.customdata) as string[]);
        }}
      />
      <Box display="flex" gap={2}>
        <div>
          <Typography gutterBottom component="label" display="block" variant="h5">
            x-axis
          </Typography>
          <AxisSelector prop={xprop} properties={properties} onPropChange={setXprop} />
        </div>
        <div>
          <Typography gutterBottom component="label" display="block" variant="h5">
            y-axis
          </Typography>
          <AxisSelector prop={yprop} properties={properties} onPropChange={setYprop} />
        </div>
        <div>
          <Typography gutterBottom component="label" display="block" variant="h5">
            colour-axis
          </Typography>
          <AxisSelector prop={cprop} properties={properties} onPropChange={setCprop} />
          <Tooltip arrow title="Toggle the colour bar">
            <Switch checked={showColourBar} onChange={() => setShowColourBar(!showColourBar)} />
          </Tooltip>
          {/* <div>
            <em>({colourExtent.min !== undefined && `${colourExtent.min}–${colourExtent.max}`})</em>
          </div> */}
        </div>
        <div>
          <Typography gutterBottom component="label" display="block" variant="h5">
            size-axis
          </Typography>
          <AxisSelector prop={sprop} properties={properties} onPropChange={setSprop} />
          <div>
            <em>({sizeExtent.min !== undefined && `${sizeExtent.min}–${sizeExtent.max}`})</em>
          </div>
        </div>
      </Box>
    </>
  );
};

interface AxisSelectorProps {
  properties: string[];
  prop: string;
  onPropChange: Dispatch<SetStateAction<string>>;
}

const AxisSelector = ({ properties, prop = "", onPropChange }: AxisSelectorProps) => {
  return (
    <TextField select value={prop} onChange={(event) => onPropChange(event.target.value)}>
      {properties.map((property) => (
        <MenuItem key={property} value={property}>
          {property}
        </MenuItem>
      ))}
    </TextField>
  );
};
