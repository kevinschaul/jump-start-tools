use clap::{Parser, Subcommand};
use serde::{Deserialize, Serialize};
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

fn main() {
    let args = Cli::parse();
    let config: Config = confy::load("jump-start", "config").expect("Error loading config");

    // Validate config
    // TODO don't use confy because it doesn't say where config gets saved
    if config.instances.is_empty() || config.instances[0].name == "" {
        panic!("Config is missing instances");
    }
    println!("{:?}", config.instances);

    match args.command {
        Commands::Find { search_term } => {
            find::find(config, search_term);
        }
    }
}
