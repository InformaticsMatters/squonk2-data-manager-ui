import { type ComponentProps } from "react";

import { styled } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import { useWasSeen } from "../../hooks/useWasSeen";

export interface DepictParametersBase {
  width: number;
  height: number;
  margin: number;
  expand: boolean;
  background: string;
  colorScheme: string;
  explicitHOnly: boolean;
  highlightAtoms: number[];
  highlightColor: string;
  outerGlow: boolean;
  mcs: string;
  mcsColor: string;
  noStereo: boolean;
}

export interface DepictParameters extends Partial<DepictParametersBase> {
  depictURL: string;
}

interface DepictMoleculePropsBase {
  alt?: string;
}

export type DepictVariants =
  | { variant: "molFile"; molFile: string }
  | { variant: "smiles"; smiles: string };

export type DepictMoleculeProps = DepictMoleculePropsBase &
  DepictVariants & { depictParams: DepictParameters };

type ImageProps = Omit<ComponentProps<"img">, "src">;

export const DepictMolecule = (props: DepictMoleculeProps) => {
  // const {
  //   width,
  //   height,
  //   margin = 0,
  //   expand = true,
  //   noStereo = false,
  //   mcs = "",
  //   mcsColor = "0xFFAAAAAA",
  // } = props;

  switch (props.variant) {
    case "molFile":
      return <LazyMolFileImage depictParams={props.depictParams} molFile={props.molFile} />;
    case "smiles":
      return <SmilesImage depictParams={props.depictParams} smiles={props.smiles} />;
    default:
      return null;
  }
};

const Img = styled("img")({
  overflow: "hidden",
  display: "inline-block",
  maxWidth: "100%",
  height: "auto",
});

const depictParameters = (params: Partial<DepictParametersBase>) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    acc.set(key, String(value));
    return acc;
  }, new URLSearchParams());

const imageSourceFromSVG = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

const getImage = async (molFile: string, { depictURL, ...depictParams }: DepictParameters) => {
  const url = new URL(depictURL);
  const queryParameters = depictParameters(depictParams);
  queryParameters.set("format", "mol");
  url.search = queryParameters.toString();

  const response = await fetch(url, { method: "POST", body: molFile });

  return response.text();
};

const useGetImage = (molFile: string, depictParams: DepictParameters) =>
  useQuery({
    queryKey: [`depict-mol-${molFile}-${Object.values(depictParams).join(",")}`],
    queryFn: () => getImage(molFile, depictParams),
    refetchOnWindowFocus: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

const LazyMolFileImage = (props: Parameters<typeof MolFileImage>[0]) => {
  const [wasSeen, ref] = useWasSeen();

  return <div ref={ref}>{!!wasSeen && <MolFileImage {...props} />}</div>;
};

const SmilesImage = (props: ImageProps & { smiles: string; depictParams: DepictParameters }) => {
  const { smiles, depictParams, ...imageProps } = props;
  const { depictURL, ...params } = depictParams;
  const url = new URL(depictURL);
  const queryParameters = depictParameters(params);
  queryParameters.set("mol", smiles);

  url.search = queryParameters.toString();

  return <Img {...imageProps} loading="lazy" src={url.toString()} />;
};

const MolFileImage = (props: ImageProps & { molFile: string; depictParams: DepictParameters }) => {
  const { molFile, depictParams, ...rest } = props;

  const { data: svg } = useGetImage(molFile, depictParams);

  return (
    <Img
      {...rest}
      src={svg ? imageSourceFromSVG(svg) : undefined}
      // height={height}
      // width={width}
    />
  );
};
