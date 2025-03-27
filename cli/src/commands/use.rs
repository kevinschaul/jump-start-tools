use crate::JumpStartInstance;
use crate::starter::StarterConfig;
use crate::{Config, LocalStarter, RemoteStarter, config::get_default_instance};
use anyhow::{Context, Result};
use directories::ProjectDirs;
use flate2::read::GzDecoder;
use log::{debug, info, warn};
use reqwest::blocking::Client;
use std::fs::{self, File};
use std::io;
use std::path::{Path, PathBuf};
use tar::Archive;

pub fn r#use(config: Config, starter_identifier: &str, dest: Option<&str>) -> Result<()> {
    let instance = get_default_instance(&config);

    if starter_identifier.starts_with("@") {
        let starter = RemoteStarter::from_path(starter_identifier).unwrap();
        debug!("Remote starter {:?}", starter);
        let mode = "tar";

        let ultimate_dest = clone_remote_starter(starter, dest, mode)
            .with_context(|| format!("Cloning remote starter"))?;
        info!("{} copied to {:?}", starter_identifier, ultimate_dest)
    } else {
        let starter = LocalStarter::from_path(starter_identifier).unwrap();
        debug!("Local starter {:?}", starter);

        let ultimate_dest = clone_local_starter(instance, starter, dest)
            .with_context(|| format!("Cloning local starter"))?;
        info!("{} copied to {:?}", starter_identifier, ultimate_dest)
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
        let tar_path = download_tar(&tar_url, &cache_dir)
            .with_context(|| format!("Downloading tar {}", tar_url))?;
        let subdir = format!("{}/{}", starter.group, starter.name);
        let cache_dest = cache_dir.join(&subdir);

        extract_tar_subdir(&tar_path, &subdir, &cache_dest)
            .with_context(|| format!("Extracting tar {} into {:?}", tar_url, cache_dest))?;
        debug!(
            "Extracted {:?} with subdir {:?} to {:?}",
            tar_path, subdir, cache_dest
        );

        let final_dest = get_final_dest(&cache_dest, dest)?;

        copy_dir_contents(&cache_dest, &final_dest)
            .with_context(|| format!("Copying dir contents"))?;
        Ok(final_dest)
    } else {
        anyhow::bail!("Not implemented")
    }
}

/// Get the final destination for the starter according to these rules:
///
/// 1. If `dest` is specified, use that
/// 2. If the starter's jump-start.yaml file has "defaultDir" specified, use that
/// 3. Otherwise use "."
fn get_final_dest(starter_path_full: &PathBuf, dest: Option<&str>) -> Result<PathBuf> {
    let final_dest = match dest {
        Some(dest) => PathBuf::from(&dest),
        None => {
            let starter_config_path = starter_path_full.join("jump-start.yaml");
            let file_content = fs::read_to_string(&starter_config_path)?;
            let starter_config = file_content
                .parse::<StarterConfig>()
                .unwrap_or_else(|e| panic!("Could not parse yaml: {:?} {}", starter_path_full, e));

            // Default to "." if default_dir is None
            match starter_config.default_dir {
                Some(dir) if !dir.as_os_str().is_empty() => dir,
                _ => PathBuf::from("."),
            }
        }
    };

    Ok(final_dest)
}

/// Copy a starter into `dest`.
fn clone_local_starter(
    instance: &JumpStartInstance,
    starter: LocalStarter,
    dest: Option<&str>,
) -> Result<PathBuf> {
    let starter_path_full = instance.path.join(starter.path);
    let final_dest = get_final_dest(&starter_path_full, dest)?;

    copy_dir_contents(&starter_path_full, &final_dest)?;
    Ok(final_dest)
}

#[cfg(test)]
mod tests {
    use super::*;
    use flate2::Compression;
    use flate2::write::GzEncoder;
    use tar::Builder;
    use tempfile::{TempDir, tempdir};

    fn create_test_archive(
        root_dir: &str,
        _target_subdir: &str,
        files: Vec<(String, &str)>,
    ) -> Result<(TempDir, PathBuf)> {
        let temp_dir = tempdir()?;
        let archive_path = temp_dir.path().join("test_archive.tar.gz");

        let tar_gz = File::create(&archive_path)?;
        let enc = GzEncoder::new(tar_gz, Compression::default());
        let mut builder = Builder::new(enc);

        for (file_path, contents) in files {
            let full_path = format!("{}/{}", root_dir, file_path);

            let mut header = tar::Header::new_gnu();
            header.set_size(contents.len() as u64);
            header.set_mode(0o644);
            header.set_cksum();
            builder.append_data(&mut header, full_path, contents.as_bytes())?;
        }

        builder.finish()?;
        Ok((temp_dir, archive_path))
    }

    #[test]
    fn test_extract_tar_subdir() -> Result<()> {
        let root_dir = "test-repo-root";
        let subdir_path = "test-group/test-starter";

        let files = vec![
            (
                format!("{}/file1.txt", subdir_path),
                "This is file 1 content",
            ),
            (
                format!("{}/file2.txt", subdir_path),
                "This is file 2 content",
            ),
            (
                format!("{}/nested/file3.txt", subdir_path),
                "This is a nested file",
            ),
            (
                "other-dir/file4.txt".to_string(),
                "This file should not be extracted",
            ),
            (
                "test-group/other-starter/file5.txt".to_string(),
                "This file should not be extracted",
            ),
        ];

        let (_archive_temp, archive_path) = create_test_archive(root_dir, subdir_path, files)?;
        let extract_temp = tempdir()?;
        let extract_path = extract_temp.path();

        extract_tar_subdir(&archive_path, subdir_path, extract_path)?;

        assert!(
            extract_path.join("file1.txt").exists(),
            "file1.txt should be extracted"
        );
        assert!(
            extract_path.join("file2.txt").exists(),
            "file2.txt should be extracted"
        );
        assert!(
            extract_path.join("nested/file3.txt").exists(),
            "nested/file3.txt should be extracted"
        );

        assert_eq!(
            fs::read_to_string(extract_path.join("file1.txt"))?,
            "This is file 1 content"
        );
        assert_eq!(
            fs::read_to_string(extract_path.join("file2.txt"))?,
            "This is file 2 content"
        );
        assert_eq!(
            fs::read_to_string(extract_path.join("nested/file3.txt"))?,
            "This is a nested file"
        );

        assert!(
            !extract_path.join("other-dir/file4.txt").exists(),
            "file4.txt should not be extracted"
        );
        assert!(
            !extract_path
                .join("test-group/other-starter/file5.txt")
                .exists(),
            "file5.txt should not be extracted"
        );

        Ok(())
    }

    #[test]
    fn test_extract_tar_subdir_nonexistent_subdir() -> Result<()> {
        let root_dir = "test-repo-root";
        let real_subdir = "test-group/test-starter";

        let files = vec![(
            format!("{}/file1.txt", real_subdir),
            "This is file 1 content",
        )];

        let (_archive_temp, archive_path) = create_test_archive(root_dir, real_subdir, files)?;
        let extract_temp = tempdir()?;
        let extract_path = extract_temp.path();

        let nonexistent_subdir = "nonexistent/directory";
        let result = extract_tar_subdir(&archive_path, nonexistent_subdir, extract_path);

        assert!(
            result.is_err(),
            "Function should return an error for nonexistent subdirectory"
        );

        if let Err(e) = result {
            assert!(e.to_string().contains("not found in archive"));
        }

        Ok(())
    }

    #[test]
    fn test_extract_tar_subdir_partial() -> Result<()> {
        let root_dir = "test-repo-root";
        let real_subdir = "test-group/test-starter";

        let files = vec![(
            format!("{}/file1.txt", real_subdir),
            "This is file 1 content",
        )];

        let (_archive_temp, archive_path) = create_test_archive(root_dir, real_subdir, files)?;
        let extract_temp = tempdir()?;
        let extract_path = extract_temp.path();

        let partial_subdir = "test-group/test-star";
        let result = extract_tar_subdir(&archive_path, partial_subdir, extract_path);

        assert!(
            result.is_err(),
            "Function should return an error for subdirectory name that is only partially included"
        );

        if let Err(e) = result {
            assert!(e.to_string().contains("not found in archive"));
        }

        Ok(())
    }

    #[test]
    fn test_copy_dir_contents() -> Result<()> {
        let temp_dir = tempdir()?;
        let src_dir = temp_dir.path().join("src");
        let dest_dir = temp_dir.path().join("dest");

        // Create source directory with some files
        fs::create_dir_all(src_dir.join("nested"))?;
        fs::write(src_dir.join("file1.txt"), "test content 1")?;
        fs::write(src_dir.join("nested/file2.txt"), "test content 2")?;

        copy_dir_contents(&src_dir, &dest_dir)?;

        // Verify files were copied correctly
        assert!(dest_dir.join("file1.txt").exists());
        assert!(dest_dir.join("nested/file2.txt").exists());

        // Check file contents
        let file1_content = fs::read_to_string(dest_dir.join("file1.txt"))?;
        assert_eq!(file1_content, "test content 1");
        Ok(())
    }

    #[test]
    fn test_get_final_dest_explicit() -> Result<()> {
        let temp_dir = tempdir()?;
        let starter_path = temp_dir.path().join("starter");
        fs::create_dir_all(&starter_path)?;

        // Create a starter config
        let config_content = "name: test-starter\ndefaultDir: ./default-project";
        fs::write(starter_path.join("jump-start.yaml"), config_content)?;

        let explicit_dest = "explicit-dest";
        let final_dest = get_final_dest(&starter_path, Some(explicit_dest))?;

        assert_eq!(final_dest, PathBuf::from(explicit_dest));

        Ok(())
    }

    #[test]
    fn test_get_final_dest_from_config() -> Result<()> {
        let temp_dir = tempdir()?;
        let starter_path = temp_dir.path().join("starter");
        fs::create_dir_all(&starter_path)?;

        // Create a starter config
        let config_content = "name: test-starter\ndefaultDir: ./default-project";
        fs::write(starter_path.join("jump-start.yaml"), config_content)?;

        let final_dest = get_final_dest(&starter_path, None)?;

        assert_eq!(final_dest, PathBuf::from("./default-project"));

        Ok(())
    }

    #[test]
    fn test_get_final_dest_empty_default() -> Result<()> {
        let temp_dir = tempdir()?;
        let starter_path = temp_dir.path().join("starter");
        fs::create_dir_all(&starter_path)?;

        // Create a starter config with empty defaultDir
        let config_content = "name: test-starter\ndefaultDir: \"\"";
        fs::write(starter_path.join("jump-start.yaml"), config_content)?;

        let final_dest = get_final_dest(&starter_path, None)?;

        assert_eq!(final_dest, PathBuf::from("."));

        Ok(())
    }
}
