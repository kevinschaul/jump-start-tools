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

    /// Use a starter
    #[command(arg_required_else_help = true)]
    Use { starter_identifier: String },

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

    let config = match load_config(&config_path) {
        Ok(cfg) => cfg,
        Err(err) => {
            eprintln!("Error reading config file: {}", err);
            std::process::exit(1);
        }
    };

    // Validate config
    if config.instances.is_empty() || config.instances[0].name.is_empty() {
        eprintln!(
            "Config file is missing instances. Add your instances to the file {:?}",
            config_path
        );
        std::process::exit(1);
    }

    let result = match args.command {
        Commands::Config {} => commands::config::config(config),
        Commands::Use { starter_identifier } => commands::r#use::r#use(config, &starter_identifier),
        Commands::Find { search_term } => commands::find::find(config, &search_term),
        Commands::Storybook(storybook_command) => match storybook_command {
            StorybookCommands::Dev { port } => commands::storybook::dev(config, port),
            StorybookCommands::Prod { output } => commands::storybook::prod(config, output),
        },
        Commands::UpdateReadme {} => commands::update_readme::update_readme(config),
    };

    // Handle any errors from commands
    if let Err(err) = result {
        eprintln!("Error: {}", err);
        std::process::exit(1);
    }
}
