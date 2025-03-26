use std::fs::{self, File};
use std::path::PathBuf;

use anyhow::Result;
use flate2::Compression;
use flate2::write::GzEncoder;
use jump_start::commands::extract_tar_subdir;
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
            format!("test-group/other-starter/file5.txt"),
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
