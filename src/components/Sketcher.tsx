import { useEffect } from "react";

import { captureException } from "@sentry/nextjs";
import { type Ketcher } from "ketcher-core";
import { Editor } from "ketcher-react";
import { StandaloneStructServiceProvider } from "ketcher-standalone";

import { useEnqueueError } from "../hooks/useEnqueueStackError";

import "ketcher-react/dist/index.css";

export interface SketcherProps {
  smiles: string;
}

export const allButtons = {
  // top
  layout: false,
  clean: false,
  arom: true,
  dearom: true,
  cip: false,
  check: true,
  analyse: true,
  recognize: false,
  miew: false,
  settings: true,
  help: false,
  about: true,
  fullscreen: false,
  // left
  // sgroup group
  sgroup: false,
  "sgroup-data": false,
  // reaction
  // plus
  "reaction-plus": false,
  // arrows
  arrows: false,
  "reaction-arrow-open-angle": true,
  "reaction-arrow-filled-triangle": true,
  "reaction-arrow-filled-bow": true,
  "reaction-arrow-dashed-open-angle": true,
  "reaction-arrow-failed": true,
  "reaction-arrow-both-ends-filled-triangle": true,
  "reaction-arrow-equilibrium-filled-half-bow": true,
  "reaction-arrow-equilibrium-filled-triangle": true,
  "reaction-arrow-equilibrium-open-angle": true,
  "reaction-arrow-unbalanced-equilibrium-filled-half-bow": true,
  "reaction-arrow-unbalanced-equilibrium-open-half-angle": true,
  "reaction-arrow-unbalanced-equilibrium-large-filled-half-bow": true,
  "reaction-arrow-unbalanced-equilibrium-filled-half-triangle": true,
  "reaction-arrow-elliptical-arc-arrow-filled-bow": true,
  "reaction-arrow-elliptical-arc-arrow-filled-triangle": true,
  "reaction-arrow-elliptical-arc-arrow-open-angle": true,
  "reaction-arrow-elliptical-arc-arrow-open-half-angle": true,
  // mapping
  "reaction-mapping-tools": true,
  "reaction-automap": true,
  "reaction-map": true,
  "reaction-unmap": true,
  // rgroup group
  rgroup: false,
  "rgroup-label": false,
  "rgroup-fragment": false,
  "rgroup-attpoints": false,
  // shape group
  shape: false,
  "shape-ellipse": false,
  "shape-rectangle": false,
  "shape-line": false,
  // text group
  text: false,
  // right
  "enhanced-stereo": false,
};

export const Sketcher = ({ smiles }: SketcherProps) => {
  const { enqueueError } = useEnqueueError();

  // Synchronise the react state to the component
  useEffect(() => {
    void globalThis.ketcher?.setMolecule(smiles);
  }, [smiles]);

  return (
    <Editor
      buttons={Object.fromEntries(
        Object.entries(allButtons).map(([name, hidden]) => [name, { hidden }]),
      )}
      errorHandler={(message) => {
        if (message) {
          captureException(message);
          enqueueError(message);
        }
      }}
      staticResourcesUrl="./" // TODO: Config for subpaths
      structServiceProvider={new StandaloneStructServiceProvider()}
      onInit={(ketcher: Ketcher) => {
        globalThis.ketcher = ketcher;
        void ketcher.setMolecule(smiles);
        window.parent.postMessage({ eventType: "init" }, "*");
      }}
    />
  );
};
