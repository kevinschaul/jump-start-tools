use clap::{Parser, Subcommand};
use jump_start::{
    commands,
    config::{get_config_path, load_config},
};

#[derive(Parser)]
#[command(version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Print path to config file
    #[command()]
    Config {},

    /// Find a starter
    #[command(arg_required_else_help = true)]
    Find { search_term: String },

    /// Storybook commands
    #[command(subcommand)]
    Storybook(StorybookCommands),

    /// Update readme
    #[command()]
    UpdateReadme {},
}

#[derive(Subcommand)]
enum StorybookCommands {
    /// Start Storybook development server
    Dev {
        /// Port to run Storybook on
        #[arg(short, long, default_value = "6006")]
        port: u16,
    },

    /// Build Storybook for production
    Prod {
        /// Output directory
        #[arg(short, long, default_value = "storybook-static")]
        output: String,
    },
}

fn main() {
    let args = Cli::parse();

    let config_path = get_config_path();
    let config = load_config(&config_path).expect("Error reading config file: {}");

    // Validate config
    if config.instances.is_empty() || config.instances[0].name == "" {
        panic!(
            "Config file is missing instances. Add your instances to the file {:?}",
            config_path
        );
    }

    match args.command {
        Commands::Config {} => {
            commands::config::config(config);
        }
        Commands::Find { search_term } => {
            commands::find::find(config, search_term);
        }
        Commands::Storybook(storybook_command) => match storybook_command {
            StorybookCommands::Dev { port } => {
                commands::storybook::dev(config, port);
            }
            StorybookCommands::Prod { output } => {
                commands::storybook::prod(config, output);
            }
        },
        Commands::UpdateReadme {} => {
            // TODO why does this require a return but the other commands do not?
            let _ = commands::update_readme::update_readme(config);
        }
    }
}
