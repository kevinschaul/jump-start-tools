export type StarterPreviewConfig = {
  template?: string;
  dependencies?: { [name: string]: [version: string] };
};

export type StarterFile = {
  path: string;
  // TODO this would be better but it's giving errors
  // type: "dir" | "file";
  type: string;
  contents?: string;
}

export type Starter = {
  dir: string;
  group: string;
  title: string;
  description?: string;
  tags?: string[];
  defaultDir?: string;
  mainFile?: string;
  preview?: StarterPreviewConfig;
  files?: StarterFile[];
};

export type StarterGroupLookup = {
  [key: string]: Starter[];
};

export type StarterPageParams = {
  group: string;
  title: string;
}
