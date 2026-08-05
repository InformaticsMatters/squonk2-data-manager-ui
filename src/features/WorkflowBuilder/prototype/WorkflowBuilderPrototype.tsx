/**
 * PROTOTYPE — THROWAWAY CODE.
 *
 * Three variants of the workflow builder, switchable via `?variant=` on the existing
 * `/workflow-builder` route. Fold the winner into real code and move this whole folder onto a
 * throwaway branch — see docs/workflow-builder-plan.md.
 *
 * The URL param is written with `history.replaceState` rather than the Next router because
 * `nextjs-routes` types static routes as having no query, and fighting that is not worth it in
 * throwaway code. The URL is still shareable and reload-stable.
 */

import { useEffect, useState } from "react";

import { PrototypeSwitcher } from "./PrototypeSwitcher";
import { INITIAL_WORKFLOW } from "./stubData";
import { VARIANT_A_NAME, VariantA } from "./VariantA";
import { VARIANT_B_NAME, VariantB } from "./VariantB";
import { VARIANT_C_NAME, VariantC } from "./VariantC";

const VARIANTS = [
  { key: "A", name: VARIANT_A_NAME },
  { key: "B", name: VARIANT_B_NAME },
  { key: "C", name: VARIANT_C_NAME },
];

export const WorkflowBuilderPrototype = () => {
  const [variant, setVariant] = useState("A");

  useEffect(() => {
    const fromUrl = new URLSearchParams(globalThis.location.search).get("variant");
    if (fromUrl && VARIANTS.some((v) => v.key === fromUrl)) {
      setVariant(fromUrl);
    }
  }, []);

  const changeVariant = (key: string) => {
    setVariant(key);
    const url = new URL(globalThis.location.href);
    url.searchParams.set("variant", key);
    globalThis.history.replaceState(null, "", url.toString());
  };

  return (
    <>
      {variant === "A" && <VariantA model={INITIAL_WORKFLOW} />}
      {variant === "B" && <VariantB model={INITIAL_WORKFLOW} />}
      {variant === "C" && <VariantC model={INITIAL_WORKFLOW} />}
      <PrototypeSwitcher current={variant} variants={VARIANTS} onChange={changeVariant} />
    </>
  );
};
