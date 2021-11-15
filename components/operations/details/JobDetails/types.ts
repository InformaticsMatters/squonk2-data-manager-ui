export interface OutputValue {
  title: string;
  creates: string;
  type?: 'file' | 'directory';
  'mime-types': string[];
}
