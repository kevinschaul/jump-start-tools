use crate::starter::StarterConfig;
use crate::{Config, LocalStarter, RemoteStarter, config::get_default_instance};
use anyhow::Result;
use directories::ProjectDirs;
use flate2::read::GzDecoder;
use log::{debug, info, warn};
use reqwest::blocking::Client;
use std::fs::{self, File};
use std::io;
use std::path::{Path, PathBuf};
use tar::Archive;

pub fn r#use(config: Config, starter_identifier: &str, dest: Option<&str>) -> Result<()> {
    let _instance = get_default_instance(&config);

    if starter_identifier.starts_with("@") {
        let starter = RemoteStarter::from_path(starter_identifier).unwrap();
        debug!("Remote starter {:?}", starter);
        let mode = "tar";

        let ultimate_dest = clone_remote_starter(starter, dest, mode)?;
        info!("{} copied to {:?}", starter_identifier, ultimate_dest)
    } else {
        let starter = LocalStarter::from_path(starter_identifier);
        debug!("Local starter {:?}", starter);
    }

    Ok(())
}

fn download_tar(url: &String, dest: &Path) -> Result<PathBuf> {
    fs::create_dir_all(dest)?;

    let file_path = dest.join("HEAD.tar.gz");
    // TODO is this the behavior I want?
    if file_path.exists() {
        debug!("{} already exists locally", file_path.display());
        return Ok(file_path);
    }

    info!("Downloading {} to {}", url, file_path.display());
    debug!("Starting download for tarball from {}", url);

    let client = Client::new();
    let mut response = client.get(url).send()?;

    if !response.status().is_success() {
        warn!("HTTP request failed with status: {}", response.status());
        anyhow::bail!("Failed to download tar: {}", url);
    }

    let mut file = File::create(&file_path)?;
    io::copy(&mut response, &mut file)?;

    Ok(file_path)
}

/// Extracts a subdirectory from a tar.gz archive file to a destination path.
///
/// # Arguments
///
/// * `tar_path` - Path to the tar.gz archive
/// * `subdir` - Subdirectory to extract
/// * `dest` - Destination path
///
/// # Examples
///
/// ```no_run
/// # use std::path::Path;
/// # use jump_start::commands::extract_tar_subdir;
/// let archive = Path::new("/tmp/repo.tar.gz");
/// let subdir = "group/starter";
/// let dest = Path::new("./project");
///
/// extract_tar_subdir(archive, subdir, dest).expect("Failed to extract");
/// ```
pub fn extract_tar_subdir(tar_path: &Path, subdir: &str, dest: &Path) -> Result<()> {
    fs::create_dir_all(dest)?;

    let tar_file = File::open(tar_path)?;
    let tar = GzDecoder::new(tar_file);
    let mut archive = Archive::new(tar);
    let mut subdir_found = false;

    for entry in archive.entries()? {
        let mut entry = entry?;
        let path = entry.path()?;
        let path_str = path.to_string_lossy();

        let parts: Vec<&str> = path_str.split('/').collect();

        if parts.len() <= 1 {
            // Skip the root directory itself
            continue;
        }

        // Remove the repository root directory (first component)
        // This handles names like "jump-start-b3c8d936025b11b9a57cfac99e0decb9f908042e/"
        let rel_path_str = parts[1..].join("/");
        let rel_path = PathBuf::from(&rel_path_str);
        // println!("rel_path: {:?}", rel_path);

        if rel_path.as_os_str().is_empty() {
            continue;
        }

        // Check if the file path is in the subdirectory using Path components
        // This is more robust than string manipulation
        let subdir_path = Path::new(subdir);

        // Get the components from both paths for comparison
        let rel_path_components: Vec<_> = rel_path.components().collect();
        let subdir_components: Vec<_> = subdir_path.components().collect();

        // Check if rel_path has at least the same components as subdir
        if rel_path_components.len() < subdir_components.len() {
            continue;
        }

        // Check if all subdir components match the beginning of rel_path components
        let is_match = subdir_components
            .iter()
            .zip(rel_path_components.iter())
            .all(|(a, b)| a == b);

        if !is_match {
            continue;
        }

        // Use the components we already collected
        let final_path = rel_path_components
            .into_iter()
            .skip(subdir_components.len())
            .collect::<PathBuf>();

        // Skip if this was just the directory itself
        if final_path.as_os_str().is_empty() {
            continue;
        }

        let dest_path = dest.join(final_path);

        if let Some(parent) = dest_path.parent() {
            fs::create_dir_all(parent)?;
        }

        entry.unpack(&dest_path)?;

        subdir_found = true;
    }

    if subdir_found {
        Ok(())
    } else {
        anyhow::bail!("Subdirectory '{}' not found in archive", subdir)
    }
}

/// Recursively copy the directory `src` to `dest`
fn copy_dir_contents(src: &Path, dest: &Path) -> Result<()> {
    fs::create_dir_all(dest)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let file_type = entry.file_type()?;
        let src_path = entry.path();
        let dst_path = dest.join(entry.file_name());

        if file_type.is_dir() {
            fs::create_dir_all(&dst_path)?;
            copy_dir_contents(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }

    Ok(())
}

/// Download a starter from GitHub, storing it in `dest`.
///
/// `mode` should be "tar" or "git" but "git" is not yet implemented.
fn clone_remote_starter(starter: RemoteStarter, dest: Option<&str>, mode: &str) -> Result<PathBuf> {
    if mode == "tar" {
        let project_dirs = ProjectDirs::from("", "", "jump-start")
            .unwrap_or_else(|| panic!("Could not find OS project directory"));

        let cache_dir = project_dirs
            .cache_dir()
            .join("github")
            .join(&starter.github_username)
            .join(&starter.github_repo);

        let tar_url = format!(
            "https://www.github.com/{}/{}/archive/HEAD.tar.gz",
            starter.github_username, starter.github_repo
        );
        let tar_path = download_tar(&tar_url, &cache_dir)?;
        let subdir = format!("{}/{}", starter.group, starter.name);
        let cache_dest = cache_dir.join(&subdir);

        extract_tar_subdir(&tar_path, &subdir, &cache_dest)?;

        debug!(
            "Extracted {:?} with subdir {:?} to {:?}",
            tar_path, subdir, cache_dest
        );

        let final_dest = match dest {
            Some(dest) => PathBuf::from(&dest),
            None => {
                // If `dest` was not specified, read the value from the
                // starter's jump-start.yaml
                let starter_config_path = cache_dest.join("jump-start.yaml");
                let file_content = fs::read_to_string(&starter_config_path)?;
                let starter_config = file_content
                    .parse::<StarterConfig>()
                    .unwrap_or_else(|e| panic!("Could not parse yaml: {:?} {}", cache_dest, e));

                starter_config.default_dir.unwrap_or_default()
            }
        };

        copy_dir_contents(&cache_dest, &final_dest)?;
        Ok(final_dest)
    } else {
        anyhow::bail!("Not implemented")
    }
}
