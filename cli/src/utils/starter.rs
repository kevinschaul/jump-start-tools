use crate::types::{Starter, StarterFile};
use glob::glob;
use serde_yaml;
use std::collections::HashMap;
use std::fs;
use std::io::{self, Read};
use std::path::{Path, PathBuf};

type StarterGroupLookup = HashMap<String, Vec<Starter>>;

pub fn parse_starters(path: &PathBuf) -> io::Result<StarterGroupLookup> {
    let mut groups: StarterGroupLookup = HashMap::new();

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
                
                // Create a basic starter first to avoid deserialization issues
                let mut starter = Starter {
                    group: String::new(),
                    name: String::new(),
                    path: String::new(),
                    description: String::new(),
                };
                
                // Try to parse the YAML to extract only the description
                if let Ok(value) = serde_yaml::from_str::<serde_yaml::Value>(&file_content) {
                    if let Some(description) = value.get("description") {
                        if let Some(desc_str) = description.as_str() {
                            starter.description = desc_str.to_string();
                        }
                    }
                }

                // Get directory information for group and name
                let current_dir = path.parent().unwrap_or(Path::new(""));
                let name = current_dir.file_name()
                    .unwrap_or_else(|| std::ffi::OsStr::new("unknown"))
                    .to_string_lossy()
                    .to_string();
                
                let parent_dir = current_dir.parent().unwrap_or(Path::new(""));
                let group = parent_dir.file_name()
                    .unwrap_or_else(|| std::ffi::OsStr::new("misc"))
                    .to_string_lossy()
                    .to_string();
                
                // Update starter with path information
                starter.name = name.clone();
                starter.group = group.clone();
                starter.path = format!("{}/{}", group, name);

                // Add to groups
                groups.entry(group).or_insert_with(Vec::new).push(starter);
            }
            Err(e) => eprintln!("Error processing glob entry: {}", e),
        }
    }

    Ok(groups)
}

pub fn get_starter_files(starter: &Starter) -> io::Result<Vec<StarterFile>> {
    let mut out = Vec::new();

    let excluded_files = ["jump-start.yaml", "degit.json"];

    // Walk the directory recursively
    let path_str = &starter.path;
    visit_dirs(Path::new(path_str), &mut out, &excluded_files, path_str)?;

    Ok(out)
}

fn visit_dirs(
    dir: &Path,
    files: &mut Vec<StarterFile>,
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

                    // Read file contents
                    let mut contents = String::new();
                    let mut file = fs::File::open(&path)?;
                    file.read_to_string(&mut contents)?;

                    // Create and push StarterFile
                    files.push(StarterFile {
                        path: rel_path,
                        contents,
                    });
                }
            }
        }
    }

    Ok(())
}
