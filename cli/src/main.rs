use anyhow::Result;
use clap::{Parser, Subcommand};
use jump_start::{
    commands,
    config::{get_config_path, load_config},
};
use log::{LevelFilter, Log, Metadata, Record, debug, error, set_logger, set_max_level};

#[derive(Parser)]
#[command(version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,

    /// Enable verbose output
    #[arg(short, long)]
    verbose: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// Print path to config file
    #[command()]
    Config {},

    /// Use a starter
    #[command(arg_required_else_help = true)]
    Use {
        starter_identifier: String,
        dest: Option<String>,
    },

    /// Find a starter
    #[command(arg_required_else_help = true)]
    Find {
        search_term: String,
        /// Output results as JSON
        #[arg(long)]
        json: bool,
    },

    /// Storybook commands
    #[command(subcommand)]
    Storybook(StorybookCommands),

    /// Update readme
    #[command()]
    UpdateReadme {
        /// Path to the instance to operate on
        #[arg(long)]
        instance_path: Option<String>,
    },
}

#[derive(Subcommand)]
enum StorybookCommands {
    /// Start Storybook development server
    Dev {
        /// Path to the instance to operate on
        #[arg(long)]
        instance_path: Option<String>,
        /// Port to run Storybook on
        #[arg(short, long, default_value = "6006")]
        port: u16,
    },

    /// Build Storybook for production
    Prod {
        /// Path to the instance to operate on
        #[arg(long)]
        instance_path: Option<String>,
        /// Output directory
        #[arg(short, long, default_value = "storybook-static")]
        output: String,
    },
}

fn setup_logger(verbose: bool) {
    struct SimpleLogger;

    impl Log for SimpleLogger {
        fn enabled(&self, _metadata: &Metadata) -> bool {
            true
        }

        fn log(&self, record: &Record) {
            // Only prefix debug logs, keep everything else clean
            match record.level() {
                log::Level::Debug | log::Level::Trace => println!("[DEBUG] {}", record.args()),
                _ => println!("{}", record.args()),
            }
        }

        fn flush(&self) {}
    }

    static LOGGER: SimpleLogger = SimpleLogger;
    let max_level = if verbose {
        LevelFilter::Debug
    } else {
        LevelFilter::Info
    };

    // We don't need to check result as this only fails if a logger is already set
    let _ = set_logger(&LOGGER);
    set_max_level(max_level);
}

fn handle_command(command: Commands) -> Result<()> {
    match command {
        Commands::Config {} => commands::config::config(),
        _ => {
            let config = load_and_validate_config()?;
            execute_config_dependent_command(command, config)
        }
    }
}

fn load_and_validate_config() -> Result<jump_start::config::Config> {
    let config_path = get_config_path();
    debug!("Using config path: {:?}", config_path);

    let config = load_config(&config_path).map_err(|err| {
        error!("Error reading config file: {}", err);
        err
    })?;

    if config.instances.is_empty() || config.instances[0].name.is_empty() {
        let msg = format!(
            "Config file is missing instances. Add your instances to the file {:?}",
            config_path
        );
        error!("{}", msg);
        return Err(anyhow::anyhow!(msg));
    }

    Ok(config)
}

/// These commands require a valid config to exist
fn execute_config_dependent_command(
    command: Commands,
    config: jump_start::config::Config,
) -> Result<()> {
    match command {
        Commands::Use {
            starter_identifier,
            dest,
        } => commands::r#use::r#use(config, &starter_identifier, dest.as_deref()),
        Commands::Find { search_term, json } => commands::find::find(config, &search_term, json),
        Commands::Storybook(storybook_command) => match storybook_command {
            StorybookCommands::Dev {
                instance_path,
                port,
            } => commands::storybook::dev(config, instance_path.as_deref(), port),
            StorybookCommands::Prod {
                instance_path,
                output,
            } => commands::storybook::prod(config, instance_path.as_deref(), output),
        },
        Commands::UpdateReadme { instance_path } => {
            commands::update_readme::update_readme(config, instance_path.as_deref())
        }
        Commands::Config {} => {
            unreachable!("Config command should be handled separately")
        }
    }
}

fn main() {
    let args = Cli::parse();
    setup_logger(args.verbose);

    if let Err(err) = handle_command(args.command) {
        error!("Error: {}", err);
        std::process::exit(1);
    }
}
