use std::fs;

use anyhow::Result;
use jump_start::commands::find::{make_pattern, search_instance};
use tempfile::{TempDir, tempdir};

// TODO I'd rather return instance_dir, but when temp_dir goes out of scope the directory
// is automatically deleted
fn fixture1() -> Result<TempDir> {
    let group = "group";
    let name = "test-starter";
    let temp_dir = tempdir()?;
    let instance_dir = temp_dir.path().join("instance");
    let starter_dir = instance_dir.join(format!("{}/{}", group, name));

    // Create starter directory and files
    fs::create_dir_all(&starter_dir)?;
    // Create starter config
    let config_content = r#"
description: A starter for testing
defaultDir: ./test-project
    "#;
    fs::write(starter_dir.join("jump-start.yaml"), config_content)?;

    Ok(temp_dir)
}

#[test]
fn test_search_instance_filename_group() -> Result<()> {
    let temp_dir = fixture1()?;
    let instance_dir = temp_dir.path().join("instance");
    let search_term = "group";
    let pattern = make_pattern(search_term)?;

    let matches = search_instance(instance_dir, &pattern)?;
    assert_eq!(matches.len(), 1);
    assert_eq!(matches[0].path, "group/test-starter");

    Ok(())
}

#[test]
fn test_search_instance_filename_name() -> Result<()> {
    let temp_dir = fixture1()?;
    let instance_dir = temp_dir.path().join("instance");
    let search_term = "starter";
    let pattern = make_pattern(search_term)?;

    let matches = search_instance(instance_dir, &pattern)?;
    assert_eq!(matches.len(), 1);
    assert_eq!(matches[0].path, "group/test-starter");

    Ok(())
}

#[test]
fn test_search_instance_filename_not_instance() -> Result<()> {
    let temp_dir = fixture1()?;
    let instance_dir = temp_dir.path().join("instance");
    let search_term = "instance";
    let pattern = make_pattern(search_term)?;

    let matches = search_instance(instance_dir, &pattern)?;
    assert_eq!(matches.len(), 0);

    Ok(())
}

#[test]
fn test_search_instance_filename_group_name() -> Result<()> {
    let temp_dir = fixture1()?;
    let instance_dir = temp_dir.path().join("instance");
    let search_term = "group/test";
    let pattern = make_pattern(search_term)?;

    let matches = search_instance(instance_dir, &pattern)?;
    assert_eq!(matches.len(), 1);
    assert_eq!(matches[0].path, "group/test-starter");

    Ok(())
}

#[test]
fn test_search_instance_contents_yaml() -> Result<()> {
    let temp_dir = fixture1()?;
    let instance_dir = temp_dir.path().join("instance");
    let search_term = "A starter for testing";
    let pattern = make_pattern(search_term)?;

    let matches = search_instance(instance_dir, &pattern)?;
    assert_eq!(matches.len(), 1);
    assert_eq!(matches[0].path, "group/test-starter");

    Ok(())
}

#[test]
#[cfg(unix)]
fn test_search_instance_with_symlink() -> Result<()> {
    let temp_dir = fixture1()?;
    let instance_dir = temp_dir.path().join("instance");
    fs::create_dir_all(instance_dir.join("group/test-starter/data"))?;
    std::os::unix::fs::symlink(
        instance_dir.join("group/test-starter/data"),
        instance_dir.join("group/test-starter/symlink"),
    )?;
    let search_term = "A starter for testing";
    let pattern = make_pattern(search_term)?;

    let matches = search_instance(instance_dir, &pattern)?;
    assert_eq!(matches.len(), 1);
    assert_eq!(matches[0].path, "group/test-starter");

    Ok(())
}
