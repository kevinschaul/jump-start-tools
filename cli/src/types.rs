use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JumpStartInstance {
    pub name: String,
    pub path: PathBuf,
    pub default: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StarterPreviewConfig {
    template: Option<String>,
    dependencies: Option<HashMap<String, String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Starter {
    /// Full path identifier (group/name)
    pub path: String,
    /// Group or category this starter belongs to
    pub group: String,
    /// Name of this starter within its group
    pub name: String,
    pub description: Option<String>,
    pub default_dir: Option<String>,
    pub main_file: Option<String>,
    pub preview: Option<StarterPreviewConfig>,
    pub files: Option<Vec<StarterFile>>,
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
            description: None,
            default_dir: None,
            main_file: None,
            preview: None,
            files: None,
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
