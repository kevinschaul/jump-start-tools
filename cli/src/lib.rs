use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::collections::HashMap;

// Export modules
pub mod commands;
pub mod config;
pub mod starter;

// Re-export types for convenience
pub use config::Config;
pub use starter::Starter;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JumpStartInstance {
    pub name: String,
    pub path: PathBuf,
    pub default: Option<bool>,
}

pub type StarterGroupLookup = HashMap<String, Vec<Starter>>;
