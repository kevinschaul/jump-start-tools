import { homedir } from "os";
import { join } from "path";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";

export interface Instance {
  username: string;
  path: string;
}

export interface Settings {
  instances: Instance[];
}

const defaultSettings: Settings = {
  instances: [
    {
      username: "",
      path: "",
    },
  ],
};

export class Config {
  private readonly configPath: string;
  private readonly configFile: string;

  constructor(private readonly toolName: string) {
    this.configPath = this.getConfigPath();
    this.configFile = join(this.configPath, `${toolName}.config.json`);
    this.ensureConfigDir();
  }

  private getConfigPath(): string {
    switch (process.platform) {
      case "linux":
        const xdgConfigHome =
          process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
        return join(xdgConfigHome, this.toolName);

      default:
        return join(homedir(), `.${this.toolName}`);
    }
  }

  private ensureConfigDir(): void {
    try {
      mkdirSync(this.configPath, { recursive: true });
    } catch (error) {
      throw new Error(
        `Failed to create config directory: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Save settings to `toolName`.config.json
   * @param settings - The settings object to save
   * @throws Error if writing fails
   */
  save(settings: Settings): void {
    try {
      writeFileSync(this.configFile, JSON.stringify(settings, null, 2), {
        encoding: "utf8",
      });
    } catch (error) {
      throw new Error(`Failed to save settings: ${(error as Error).message}`);
    }
  }

  /**
   * Load settings from `toolName`.config.json
   * @returns The parsed settings object or empty object if file doesn't exist
   * @throws Error if reading or parsing fails
   */
  load(): Settings {
    try {
      if (!existsSync(this.configFile)) {
        this.save(defaultSettings);
        return defaultSettings;
      }
      const data = readFileSync(this.configFile, { encoding: "utf8" });
      return JSON.parse(data) as Settings;
    } catch (error) {
      throw new Error(`Failed to load settings: ${(error as Error).message}`);
    }
  }
}
