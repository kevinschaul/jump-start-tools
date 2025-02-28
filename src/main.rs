use clap::{Parser, Subcommand};
use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use serde_json;
use std::fs;
use std::io;
use std::path::PathBuf;

mod find;

#[derive(Debug, Serialize, Deserialize)]
struct ConfigInstance {
    name: String,
    path: PathBuf,
    default: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Config {
    instances: Vec<ConfigInstance>,
}

impl ::std::default::Default for Config {
    fn default() -> Self {
        Self {
            instances: vec![ConfigInstance {
                name: "".to_string(),
                path: PathBuf::new(),
                default: Some(true),
            }],
        }
    }
}

#[derive(Parser)]
#[command(version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Find a starter
    #[command(arg_required_else_help = true)]
    Find { search_term: String },
}

fn get_config_path() -> PathBuf {
    let project_dirs =
        ProjectDirs::from("", "", "jump-start").expect("Could not find OS project directory");
    let config_path = project_dirs.config_dir().join("config.json");
    config_path
}

fn load_config(config_path: &PathBuf) -> Result<Config, io::Error> {
    let config_contents = fs::read_to_string(config_path).unwrap_or_else(|_| {
        let default_config = Config::default();
        let json_contents =
            serde_json::to_string_pretty(&default_config).expect("Failed to serialize default config");
        fs::write(config_path, &json_contents).expect("Failed to write default config file");
        json_contents
    });
    let config: Config = serde_json::from_str(&config_contents)?;
    Ok(config)
}

fn main() {
    let args = Cli::parse();

    let config_path = get_config_path();
    let config = load_config(&config_path).expect("Error reading config file: {}");

    // Validate config
    if config.instances.is_empty() || config.instances[0].name == "" {
        panic!("Config file is missing instances. Add your instances to the file {:?}", config_path);
    }

    match args.command {
        Commands::Find { search_term } => {
            find::find(config, search_term);
        }
    }
}
