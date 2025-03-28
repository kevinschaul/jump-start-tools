use crate::{Config, LocalStarter, starter::parse_starters};
use anyhow::Result;
use log::info;
use regex::Regex;
use std::collections::HashMap;
use std::path::PathBuf;

pub fn find(config: Config, search_term: &str) -> Result<()> {
    info!("Finding {search_term}");

    let pattern = make_pattern(&search_term)?;

    for instance in config.instances {
        info!("{:?}", instance);
        let _matches = search_instance(instance.path, &pattern)?;
    }

    Ok(())
}

pub fn make_pattern(search_term: &str) -> Result<Regex> {
    let pattern = Regex::new(search_term)?;
    Ok(pattern)
}

pub fn search_instance(path: PathBuf, pattern: &Regex) -> Result<HashMap<String, LocalStarter>> {
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
                    search_starter_files(&starter, full_starter_path, &pattern)?;
                matches.extend(starter_file_matches);
            }
        }
    }

    Ok(matches)
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
            let recursed_matches = search_starter_files(starter, entry.path(), pattern)?;
            matches.extend(recursed_matches);
        } else {
            if pattern.is_match(&entry.file_name().to_string_lossy()) {
                matches.insert(starter.path.clone(), starter.clone());
            } else {
                // TODO check the file contents
            }
        }
    }

    Ok(matches)
}
