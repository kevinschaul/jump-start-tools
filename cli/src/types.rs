use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JumpStartInstance {
    pub name: String,
    pub path: PathBuf,
    pub default: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Starter {
    /// Group or category this starter belongs to
    pub group: String,

    /// Name of this starter within its group
    pub name: String,

    /// Full path identifier (group/name)
    pub path: String,

    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StarterFile {
    pub path: String,
    pub contents: String,
}

impl Starter {
    pub fn new(group: &str, name: &str) -> Self {
        let path = format!("{}/{}", group, name);

        Self {
            group: group.to_string(),
            name: name.to_string(),
            path,
            description: String::new(),
        }
    }

    /// Parse a path (group/name) into a Starter
    pub fn from_path(path: &str) -> Option<Self> {
        let parts: Vec<&str> = path.split('/').collect();
        if parts.len() != 2 {
            return None;
        }

        Some(Self::new(parts[0], parts[1]))
    }
}
