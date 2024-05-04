export interface OutputValue {
  title: string;
  creates: string;
  type?: "directory" | "file" | "files";
  "mime-types": string[];
}
