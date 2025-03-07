use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

// Export modules
pub mod commands;
pub mod config;
pub mod starter;

// Re-export types for convenience
pub use config::Config;
pub use starter::LocalStarter;
pub use starter::RemoteStarter;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JumpStartInstance {
    pub name: String,
    pub path: PathBuf,
    pub default: Option<bool>,
}

pub type LocalStarterGroupLookup = HashMap<String, Vec<LocalStarter>>;
