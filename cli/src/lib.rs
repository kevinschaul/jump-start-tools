pub mod commands;
pub mod utils;
pub mod types;

pub use types::*;

use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub instances: Vec<JumpStartInstance>,
}

impl ::std::default::Default for Config {
    fn default() -> Self {
        Self {
            instances: vec![JumpStartInstance {
                name: "".to_string(),
                path: PathBuf::new(),
                default: Some(true),
            }],
        }
    }
}

// Re-export the utility functions for testing
pub fn get_config_path() -> PathBuf {
    let project_dirs =
        ProjectDirs::from("", "", "jump-start").expect("Could not find OS project directory");
    let config_path = project_dirs.config_dir().join("config.json");
    config_path
}

pub fn load_config(config_path: &PathBuf) -> Result<Config, io::Error> {
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let config_contents = fs::read_to_string(config_path).unwrap_or_else(|_| {
        let default_config = Config::default();
        let json_contents = serde_json::to_string_pretty(&default_config)
            .expect("Failed to serialize default config");
        fs::write(config_path, &json_contents).expect("Failed to write default config file");
        json_contents
    });
    let config: Config = serde_json::from_str(&config_contents)?;
    Ok(config)
}