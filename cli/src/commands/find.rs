use crate::JumpStartInstance;
use crate::{Config, LocalStarter, starter::parse_starters};
use anyhow::{Context, Result};
use log::debug;
use regex::Regex;
use serde_json::json;
use std::collections::HashMap;
use std::fs::read_to_string;
use std::path::PathBuf;

pub fn find(config: Config, search_term: &str, json: bool) -> Result<()> {
    debug!("Finding {search_term}");

    let pattern = make_pattern(&search_term)?;

    for instance in config.instances {
        debug!("Searching instance {:?}", instance.name);
        let matches = search_instance(instance.path.clone(), &pattern)?;
        for starter in matches {
            println!("{}", format_result(&instance, &starter, json)?);
        }
    }

    Ok(())
}

/// Formats a result as either a JSON string or a human-readable string based on the `json` parameter.
///
/// # Examples
///
/// ## JSON output format
///
/// ```
/// use jump_start::JumpStartInstance;
/// use jump_start::starter::{LocalStarter, StarterConfig};
/// use jump_start::commands::find::format_result;
/// use std::path::PathBuf;
///
/// // Create test instances
/// let instance = JumpStartInstance {
///     path: PathBuf::from("/home/user/projects/my-app"),
///     name: "my-app".to_string(),
///     default: None,
/// };
///
/// let starter = LocalStarter {
///     path: "react/component".to_string(),
///     group: "react".to_string(),
///     name: "component".to_string(),
///     config: Some(StarterConfig {
///         main_file: Some("index.js".to_string()),
///         description: Some("A React component".to_string()),
///         default_dir: None,
///         preview: None,
///     }),
/// };
///
/// let result = format_result(&instance, &starter, true).unwrap();
///
/// // Verify the JSON structure contains expected fields
/// let json: serde_json::Value = serde_json::from_str(&result).unwrap();
/// assert_eq!(json["instance"]["path"], "/home/user/projects/my-app");
/// assert_eq!(json["instance"]["name"], "my-app");
/// assert_eq!(json["starter"]["group"], "react");
/// assert_eq!(json["starter"]["name"], "component");
/// assert_eq!(json["starter"]["main_file"], "index.js");
/// ```
///
/// ## Human-readable output format
///
/// ```
/// use jump_start::JumpStartInstance;
/// use jump_start::starter::{LocalStarter, StarterConfig};
/// use jump_start::commands::find::format_result;
/// use std::path::PathBuf;
///
/// // Create test instances
/// let instance = JumpStartInstance {
///     path: PathBuf::from("/home/user/projects/my-app"),
///     name: "my-app".to_string(),
///     default: None,
/// };
///
/// let starter = LocalStarter {
///     path: "react/component".to_string(),
///     group: "react".to_string(),
///     name: "component".to_string(),
///     config: None,
/// };
///
/// let result = format_result(&instance, &starter, false).unwrap();
///
/// // Verify the string format is as expected
/// assert_eq!(result, "/home/user/projects/my-appreact/component");
/// ```
pub fn format_result(
    instance: &JumpStartInstance,
    starter: &LocalStarter,
    json: bool,
) -> Result<String> {
    if json {
        let result_json = json!({
            "instance": {
                "path": instance.path,
                "name": instance.name,
            },
            "starter": {
                "group": starter.group,
                "name": starter.name,
                "main_file": starter.config.as_ref().and_then(|c| c.main_file.as_ref()),
            }
        });
        Ok(serde_json::to_string(&result_json)?)
    } else {
        Ok(format!(
            "{}{}",
            instance.path.to_string_lossy(),
            starter.path
        ))
    }
}

pub fn make_pattern(search_term: &str) -> Result<Regex> {
    let pattern = Regex::new(search_term)?;
    Ok(pattern)
}

pub fn search_instance(path: PathBuf, pattern: &Regex) -> Result<Vec<LocalStarter>> {
    let mut matches = HashMap::new();

    let starter_groups = parse_starters(&path)?;
    for group in starter_groups {
        for starter in group.1 {
            if pattern.is_match(&starter.path) {
                // Check the starter group/name
                matches.insert(starter.path.clone(), starter.clone());
            } else {
                // Check all starter files
                let full_starter_path = path.join(&starter.path);
                let starter_file_matches =
                    search_starter_files(&starter, full_starter_path, &pattern).with_context(
                        || {
                            format!(
                                "Error searching starter files for instance at path {:?}",
                                path
                            )
                        },
                    )?;
                matches.extend(starter_file_matches);
            }
        }
    }

    Ok(matches.into_values().collect())
}

fn search_starter_files(
    starter: &LocalStarter,
    path: PathBuf,
    pattern: &Regex,
) -> Result<HashMap<String, LocalStarter>> {
    let mut matches = HashMap::new();
    for entry_result in path.read_dir()? {
        let entry = entry_result?;

        if entry.file_type()?.is_dir() {
            // Recursively search directories
            let recursed_matches = search_starter_files(starter, entry.path(), pattern)?;
            matches.extend(recursed_matches);
        } else if entry.file_type()?.is_file() {
            // Check if the file path matches
            if pattern.is_match(&entry.file_name().to_string_lossy()) {
                matches.insert(starter.path.clone(), starter.clone());
            } else {
                // Check if the file contents match
                let contents = read_to_string(entry.path())?;
                if pattern.is_match(&contents) {
                    matches.insert(starter.path.clone(), starter.clone());
                }
            }
        }
    }

    Ok(matches)
}
