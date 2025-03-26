use std::fs;
use std::path::PathBuf;

use anyhow::Result;
use jump_start::commands::r#use;
use jump_start::{Config, JumpStartInstance};
use tempfile::tempdir;

fn setup_test_environment() -> Result<(PathBuf, PathBuf)> {
    let temp_dir = tempdir()?;
    let instance_dir = temp_dir.path().join("instance");
    let starter_dir = instance_dir.join("group/starter");

    // Create starter directory and files
    fs::create_dir_all(&starter_dir)?;
    fs::write(starter_dir.join("file1.txt"), "test content 1")?;
    fs::create_dir_all(starter_dir.join("nested"))?;
    fs::write(starter_dir.join("nested/file2.txt"), "test content 2")?;

    // Create starter config
    let config_content = r#"
name: test-starter
defaultDir: ./test-project
    "#;
    fs::write(starter_dir.join("jump-start.yaml"), config_content)?;

    Ok((temp_dir.into_path(), instance_dir))
}

#[test]
fn test_use_local_starter() -> Result<()> {
    // Set up test environment
    let (temp_dir, instance_dir) = setup_test_environment()?;
    let dest_dir = temp_dir.join("dest");

    // Create test config
    let config = Config {
        instances: vec![JumpStartInstance {
            name: "test-instance".to_string(),
            path: instance_dir,
            default: Some(true),
        }],
    };

    // Call the use function with a local starter
    r#use::r#use(config, "group/starter", Some(dest_dir.to_str().unwrap()))?;

    // Verify files were copied correctly
    assert!(dest_dir.join("file1.txt").exists());
    assert!(dest_dir.join("nested/file2.txt").exists());

    // Check content of files
    let file1_content = fs::read_to_string(dest_dir.join("file1.txt"))?;
    assert_eq!(file1_content, "test content 1");

    Ok(())
}

#[test]
fn test_use_local_starter_default_path() -> Result<()> {
    // Set up test environment
    let (temp_dir, instance_dir) = setup_test_environment()?;

    // Create test config
    let config = Config {
        instances: vec![JumpStartInstance {
            name: "test-instance".to_string(),
            path: instance_dir,
            default: Some(true),
        }],
    };

    // Set current directory to temp_dir for this test
    let original_dir = std::env::current_dir()?;
    std::env::set_current_dir(&temp_dir)?;

    // Call the use function with default destination (from config)
    r#use::r#use(config, "group/starter", None)?;

    // Test project directory should be created based on the config
    let project_dir = temp_dir.join("test-project");
    assert!(project_dir.join("file1.txt").exists());
    assert!(project_dir.join("nested/file2.txt").exists());

    // Return to original directory
    std::env::set_current_dir(original_dir)?;

    Ok(())
}

// // This test would require a mock server for GitHub API
// #[test]
// fn test_use_remote_starter() -> Result<()> {
//     use mockito::{mock, server_url};
//
//     // Set up mock server for GitHub API
//     let _m = mock("GET", "/username/repo/archive/HEAD.tar.gz")
//         .with_status(200)
//         .with_body_from_file("tests/fixtures/test-repo.tar.gz")
//         .create();
//
//     let temp_dir = tempdir()?;
//     let dest_dir = temp_dir.path().join("dest");
//
//     // Create test config
//     let config = Config {
//         instances: vec![JumpStartInstance {
//             name: "test-instance".to_string(),
//             path: PathBuf::from("/not/used/for/remote"),
//             default: Some(true),
//         }],
//     };
//
//     // Create a GitHub URL that points to our mock server
//     let github_starter = format!("@username/repo:group/starter");
//
//     // Call the use function with a remote starter
//     r#use::r#use(config, &github_starter, Some(dest_dir.to_str().unwrap()))?;
//
//     // Verify files were copied correctly (would depend on your test fixture)
//     assert!(dest_dir.exists());
//
//     Ok(())
// }
