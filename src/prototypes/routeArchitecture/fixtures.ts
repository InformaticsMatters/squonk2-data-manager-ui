export type Project = { id: string; name: string; productId: string; editors: string[] };

export type Product = {
  id: string;
  unit: { id: string; name: string };
  organisation: { id: string; name: string };
};

const projects = new Map<string, Project>([
  [
    "alpha",
    { id: "alpha", name: "Alpha screening", productId: "product-alpha", editors: ["current-user"] },
  ],
  ["beta", { id: "beta", name: "Beta compounds", productId: "product-beta", editors: [] }],
]);

const products = new Map<string, Product>([
  [
    "product-alpha",
    {
      id: "product-alpha",
      unit: { id: "chemistry", name: "Chemistry" },
      organisation: { id: "acme", name: "Acme Research" },
    },
  ],
  [
    "product-beta",
    {
      id: "product-beta",
      unit: { id: "biology", name: "Biology" },
      organisation: { id: "globex", name: "Globex Labs" },
    },
  ],
]);

export const getProject = async (id: string) => {
  await Promise.resolve();
  const project = projects.get(id);
  if (!project) {
    throw new Error("not-found");
  }
  return project;
};

export const getProduct = async (id: string) => {
  await Promise.resolve();
  const product = products.get(id);
  if (!product) {
    throw new Error("not-found");
  }
  return product;
};

export const currentUser = "current-user";
