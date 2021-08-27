export const labelFormatter = (label: string, value: string) => {
  return label + (value ? `=${value}` : '');
};
