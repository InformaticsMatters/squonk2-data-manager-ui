export interface OutputValue {
  title: string;
  creates: string;
  type?: 'file' | 'files' | 'directory';
  'mime-types': string[];
}
