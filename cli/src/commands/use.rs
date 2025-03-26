use crate::{Config, LocalStarter, RemoteStarter, config::get_default_instance};
use anyhow::Result;
use flate2::read::GzDecoder;
use reqwest::blocking::Client;
use std::fs::{self, File};
use std::io;
use std::path::{Path, PathBuf};
use tar::Archive;

pub fn r#use(config: Config, starter_identifier: &str) -> Result<()> {
    let _instance = get_default_instance(&config);

    if starter_identifier.starts_with("@") {
        let starter = RemoteStarter::from_path(starter_identifier).unwrap();
        println!("Found remote starter {:?}", starter);
        let dest = ".";
        let mode = "tar";

        clone_remote_starter(starter, dest, mode)?;
    } else {
        let starter = LocalStarter::from_path(starter_identifier);
        println!("Found local starter {:?}", starter);
    }

    Ok(())
}

fn download_tar(url: &String, dest: &Path) -> Result<PathBuf> {
    fs::create_dir_all(dest)?;

    let file_path = dest.join("HEAD.tar.gz");
    // TODO is this the behavior I want?
    if file_path.exists() {
        println!("{} already exists locally", file_path.display());
        return Ok(file_path);
    }

    println!("Downloading {} to {}", url, file_path.display());

    let client = Client::new();
    let mut response = client.get(url).send()?;

    if !response.status().is_success() && !response.status().is_success() {
        panic!("Failed to download tar: {}", url);
    }

    let mut file = File::create(&file_path)?;
    io::copy(&mut response, &mut file)?;

    Ok(file_path)
}

fn extract_tar_subdir(tar_path: &Path, subdir: &str, dest: &Path) -> Result<()> {
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
        // println!("parts: {:?}", parts);

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

        // Check if the file is in the subdirectory
        if !rel_path_str.starts_with(subdir) {
            continue;
        }

        // Adjust the path to remove the subdirectory prefix
        let subdir_components = Path::new(subdir).components().count();
        let final_path = rel_path
            .components()
            .skip(subdir_components)
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

// Helper function to recursively copy directory contents
// fn copy_dir_contents(src: &Path, dst: &Path) -> Result<()> {
//     for entry in fs::read_dir(src)? {
//         let entry = entry?;
//         let file_type = entry.file_type()?;
//         let src_path = entry.path();
//         let dst_path = dst.join(entry.file_name());
//
//         if file_type.is_dir() {
//             fs::create_dir_all(&dst_path)?;
//             copy_dir_contents(&src_path, &dst_path)?;
//         } else {
//             fs::copy(&src_path, &dst_path)?;
//         }
//     }
//
//     Ok(())
// }

fn clone_remote_starter(starter: RemoteStarter, dest: &str, mode: &str) -> Result<()> {
    let dest_path = Path::new(dest);

    if mode == "tar" {
        let cache_dir = dirs::cache_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("jump-start")
            .join("github")
            .join(&starter.github_username)
            .join(&starter.github_repo);

        let tar_url = format!(
            "https://www.github.com/{}/{}/archive/HEAD.tar.gz",
            starter.github_username, starter.github_repo
        );
        let tar_path = download_tar(&tar_url, &cache_dir)?;
        let subdir = format!("{}/{}", starter.group, starter.name);
        extract_tar_subdir(&tar_path, &subdir, dest_path)?;

        println!(
            "Extracted {:?} with subdir {:?} to {:?}",
            tar_path, subdir, dest_path
        );
    }

    // TODO print success message

    Ok(())
}
