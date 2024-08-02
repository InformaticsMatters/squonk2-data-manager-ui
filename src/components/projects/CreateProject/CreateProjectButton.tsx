import { useState } from "react";

import { type ProductDetail, type UnitAllDetail } from "@squonk/account-server-client";

import { Button } from "@mui/material";

import { CreateProjectForm } from "./CreateProjectForm";

export interface CreateProjectButtonProps {
  unitId: UnitAllDetail["id"];
  unitDefaultProductPrivacy: UnitAllDetail["default_product_privacy"];
  product?: ProductDetail;
  buttonText?: string;
}

/**
 * Button which allows user to create a new project.
 */
export const CreateProjectButton = ({
  unitId,
  unitDefaultProductPrivacy,
  product,
  buttonText = "Create",
}: CreateProjectButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="small" variant="outlined" onClick={() => setOpen(true)}>
        {buttonText}
      </Button>

      <CreateProjectForm
        defaultPrivacy={unitDefaultProductPrivacy}
        modal={{
          id: "create-project",
          title: "Create Project",
          submitText: "Create",
          open,
          onClose: () => setOpen(false),
        }}
        product={product}
        unitId={unitId}
      />
    </>
  );
};
