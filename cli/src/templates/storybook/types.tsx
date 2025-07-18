export type StarterPreviewConfig = {
  template?: string;
  dependencies?: { [name: string]: string };
};

export type StarterFile = {
  path: string;
  // TODO this would be better but it's giving errors
  // type: "dir" | "file";
  type: string;
  contents?: string;
}

export type Starter = {
  path: string;
  group: string;
  name: string;
  config?: {
    description?: string;
    defaultDir?: string;
    mainFile?: string;
    preview?: StarterPreviewConfig;
  };
};

export type StarterGroupLookup = {
  [key: string]: Starter[];
};

export type StarterPageParams = {
  group: string;
  title: string;
}
