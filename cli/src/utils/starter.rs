use crate::types::{Starter, StarterFile};
use glob::glob;
use serde_yaml;
use std::collections::HashMap;
use std::fs;
use std::io;
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

                // Parse YAML file directly into a Config struct
                let starter_config: serde_yaml::Value = serde_yaml::from_str(&file_content)
                    .unwrap_or_else(|_| serde_yaml::Value::Mapping(serde_yaml::Mapping::new()));

                // Get directory information for group and name
                let current_dir = path.parent().unwrap_or(Path::new(""));
                let name = current_dir
                    .file_name()
                    .unwrap_or_else(|| std::ffi::OsStr::new("unknown"))
                    .to_string_lossy()
                    .to_string();

                let parent_dir = current_dir.parent().unwrap_or(Path::new(""));
                let group = parent_dir
                    .file_name()
                    .unwrap_or_else(|| std::ffi::OsStr::new("misc"))
                    .to_string_lossy()
                    .to_string();

                // Create starter with properties from YAML
                let mut starter = Starter {
                    name: name.clone(),
                    group: group.clone(),
                    path: format!("{}/{}", group, name),
                    description: None,
                    default_dir: None,
                    main_file: None,
                    preview: None,
                    files: None,
                };

                // Extract fields from YAML
                if let Some(description) = starter_config.get("description") {
                    if let Some(desc_str) = description.as_str() {
                        starter.description = Some(desc_str.to_string());
                    }
                }

                if let Some(default_dir) = starter_config.get("defaultDir") {
                    if let Some(dir_str) = default_dir.as_str() {
                        starter.default_dir = Some(dir_str.to_string());
                    }
                }

                if let Some(main_file) = starter_config.get("mainFile") {
                    if let Some(file_str) = main_file.as_str() {
                        starter.main_file = Some(file_str.to_string());
                    }
                }

                // Handle preview config if present
                if let Some(preview) = starter_config.get("preview") {
                    // Try to deserialize the preview section
                    if let Ok(preview_config) = serde_yaml::from_value::<
                        crate::types::StarterPreviewConfig,
                    >(preview.clone())
                    {
                        starter.preview = Some(preview_config);
                    }
                }

                // Add to groups
                groups.entry(group).or_insert_with(Vec::new).push(starter);
            }
            Err(e) => eprintln!("Error processing glob entry: {}", e),
        }
    }

    Ok(groups)
}

// Get files for a starter using the instance directory as the base path
pub fn get_starter_files(starter: &Starter, instance_dir: &Path) -> io::Result<Vec<StarterFile>> {
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
        out.push(StarterFile {
            path: "example.file".to_string(),
            contents: "// This is a sample file content\nconsole.log('Hello world');\n".to_string(),
        });
    }

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

                    // Try to read file contents
                    match fs::read_to_string(&path) {
                        Ok(contents) => {
                            // Create and push StarterFile
                            files.push(StarterFile {
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
