use crate::LocalStarterGroupLookup;
use glob::glob;
use log::error;
use serde::{Deserialize, Serialize};
use serde_yaml;
use std::collections::HashMap;
use std::fs;
use std::io;
use std::path::Path;
use std::path::PathBuf;
use std::str::FromStr;

#[derive(Debug, Serialize, Deserialize)]
pub struct PreviewConfig {
    pub template: Option<String>,
    pub dependencies: Option<HashMap<String, String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StarterConfig {
    pub description: Option<String>,
    #[serde(rename = "defaultDir")]
    pub default_dir: Option<PathBuf>,
    #[serde(rename = "mainFile")]
    pub main_file: Option<String>,
    pub preview: Option<PreviewConfig>,
}

impl FromStr for StarterConfig {
    type Err = serde_yaml::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        serde_yaml::from_str(s)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LocalStarterFile {
    pub path: String,
    pub contents: String,
}

/// A string idenfitying a starter. Takes the form "[INSTANCE]/GROUP/NAME", where INSTANCE, if
/// unspecified, defaults to the default instance.
// pub type StarterIdentifier = String;
#[derive(Debug, Serialize, Deserialize)]
pub struct RemoteStarter {
    pub github_username: String,
    pub github_repo: String,
    pub group: String,
    pub name: String,
}

impl RemoteStarter {
    pub fn new(github_username: &str, github_repo: &str, group: &str, name: &str) -> Self {
        Self {
            github_username: github_username.to_string(),
            github_repo: github_repo.to_string(),
            group: group.to_string(),
            name: name.to_string(),
        }
    }

    /// A string idenfitying a starter. Takes the following form:
    /// @GITHUB_USERNAME/[GITHUB_REPO]/GROUP/NAME
    ///
    /// # Examples
    ///
    /// When left unspecified, `GITHUB_REPO` defaults to "jump-start"
    ///
    /// ```
    /// use jump_start::RemoteStarter;
    /// let starter = RemoteStarter::from_path("@kevinschaul/react-d3/Chart").unwrap();
    /// assert_eq!(starter.github_username, "kevinschaul");
    /// assert_eq!(starter.github_repo, "jump-start");
    /// assert_eq!(starter.group, "react-d3");
    /// assert_eq!(starter.name, "Chart");
    /// ```
    ///
    /// ```
    /// use jump_start::RemoteStarter;
    /// let starter = RemoteStarter::from_path("@kevinschaul/starters/react-d3/Chart").unwrap();
    /// assert_eq!(starter.github_username, "kevinschaul");
    /// assert_eq!(starter.github_repo, "starters");
    /// assert_eq!(starter.group, "react-d3");
    /// assert_eq!(starter.name, "Chart");
    /// ```
    ///
    /// ```should_panic
    /// use jump_start::RemoteStarter;
    /// let starter = RemoteStarter::from_path("react-d3/Chart").unwrap();
    /// ```
    ///
    /// ```should_panic
    /// use jump_start::RemoteStarter;
    /// let starter = RemoteStarter::from_path("@kevinschaul/Chart").unwrap();
    /// ```
    pub fn from_path(path: &str) -> Option<Self> {
        let parts: Vec<&str> = path.split('/').collect();
        // Trim off the leading '@' character
        let github_username = &parts[0][1..];

        match parts.len() {
            3 => {
                let github_repo = "jump-start";
                Some(Self::new(github_username, github_repo, parts[1], parts[2]))
            }
            4 => {
                let github_repo = parts[1];
                Some(Self::new(github_username, github_repo, parts[2], parts[3]))
            }
            _ => panic!("Could not parse remote starter from string {:?}", path),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LocalStarter {
    /// Full path identifier (group/name)
    pub path: String,
    /// Group or category this starter belongs to
    pub group: String,
    /// Name of this starter within its group
    pub name: String,
    /// Configuration stored in the starter's jump-start.yaml file
    pub config: Option<StarterConfig>,
}

impl LocalStarter {
    pub fn new(group: &str, name: &str) -> Self {
        let path = format!("{}/{}", group, name);

        Self {
            group: group.to_string(),
            name: name.to_string(),
            path,
            config: None,
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

pub fn parse_starters(path: &Path) -> io::Result<LocalStarterGroupLookup> {
    let mut groups: LocalStarterGroupLookup = HashMap::new();

    // Define the glob pattern
    let pattern = format!("{}/**/*jump-start.yaml", path.display());

    // Use glob to find all matching files
    for entry in glob(&pattern).expect("Failed to read glob pattern") {
        match entry {
            Ok(path) => {
                // Skip files in node_modules and jump-start-tools
                let path_str = path.to_string_lossy();
                if path_str.contains("node_modules") || path_str.contains("jump-start-tools") {
                    continue;
                }

                // Read and parse the YAML file
                let file_content = fs::read_to_string(&path)?;
                println!("Parsing YAML file: {}", path.display());
                println!("Content: {}", file_content);

                let starter_config = match file_content.parse::<StarterConfig>() {
                    Ok(config) => config,
                    Err(e) => {
                        error!("Error parsing yaml for {}: {}", path.display(), e);
                        continue;
                    }
                };

                let current_dir = path.parent().unwrap();
                let name = current_dir
                    .file_name()
                    .unwrap()
                    .to_string_lossy()
                    .to_string();
                let group = current_dir
                    .parent()
                    .unwrap()
                    .file_name()
                    .unwrap()
                    .to_string_lossy()
                    .to_string();

                let starter = LocalStarter {
                    name: name.clone(),
                    group: group.clone(),
                    path: format!("{}/{}", group, name),
                    config: Some(starter_config),
                };

                groups.entry(group).or_default().push(starter);
            }
            Err(e) => eprintln!("Error processing glob entry: {}", e),
        }
    }

    Ok(groups)
}

// Get files for a starter using the instance directory as the base path
pub fn get_starter_files(
    starter: &LocalStarter,
    instance_dir: &Path,
) -> io::Result<Vec<LocalStarterFile>> {
    let mut out = Vec::new();
    let excluded_files = ["jump-start.yaml", "degit.json"];

    // Get the full path to the starter directory using the instance dir as base
    let starter_dir = instance_dir.join(&starter.group).join(&starter.name);

    if starter_dir.exists() && starter_dir.is_dir() {
        // Walk the directory recursively
        visit_dirs(
            &starter_dir,
            &mut out,
            &excluded_files,
            &starter_dir.to_string_lossy(),
        )?;
        println!(
            "Found {} files for starter {}/{}",
            out.len(),
            starter.group,
            starter.name
        );
    } else {
        eprintln!("Warning: Starter directory not found: {:?}", starter_dir);
        // Add a sample file if no files are found, so that the UI works
        out.push(LocalStarterFile {
            path: "example.file".to_string(),
            contents: "// This is a sample file content\nconsole.log('Hello world');\n".to_string(),
        });
    }

    Ok(out)
}

fn visit_dirs(
    dir: &Path,
    files: &mut Vec<LocalStarterFile>,
    excluded_files: &[&str],
    base_path: &str,
) -> io::Result<()> {
    if dir.is_dir() {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_dir() {
                visit_dirs(&path, files, excluded_files, base_path)?;
            } else if let Some(file_name) = path.file_name() {
                let file_name_str = file_name.to_string_lossy();

                if !excluded_files.contains(&file_name_str.as_ref()) {
                    // Get relative path
                    let base = Path::new(base_path);
                    let rel_path = match path.strip_prefix(base) {
                        Ok(rel) => rel.to_string_lossy().to_string(),
                        Err(_) => path.to_string_lossy().to_string(),
                    };

                    // Try to read file contents
                    match fs::read_to_string(&path) {
                        Ok(contents) => {
                            // Create and push StarterFile
                            files.push(LocalStarterFile {
                                path: rel_path,
                                contents,
                            });
                        }
                        Err(e) => {
                            eprintln!("Warning: Could not read file {:?}: {}", path, e);
                            // Try to handle binary files by reading as bytes
                            // but for now just skip them
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

pub fn get_starter_command(
    starter: &LocalStarter,
    github_username: &str,
    github_repo: &str,
    degit_mode: &str,
) -> String {
    if degit_mode == "true" {
        format!(
            "npx degit {}/{}#{}/{} {}",
            github_username, github_repo, starter.group, starter.name, starter.name
        )
    } else {
        format!("jump-start add {}/{}", starter.group, starter.name)
    }
}
