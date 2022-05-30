export interface OutputValue {
  title: string;
  creates: string;
  type?: "file" | "files" | "directory";
  "mime-types": string[];
}

export interface CommonDetailsProps {
  /**
   * Whether to poll the instance regularly for updates
   */
  poll?: boolean;
}
