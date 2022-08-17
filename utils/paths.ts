export const pathFromQuery = (query: string | string[]) => {
  if (query.length === 0) {
    return "/";
  } else if (typeof query === "string") {
    return "/" + query;
  }
  return "/" + query.join("/");
};
