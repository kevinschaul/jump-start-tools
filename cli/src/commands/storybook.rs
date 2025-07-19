use crate::Config;
use crate::config::resolve_instance_path;
use crate::starter::{LocalStarter, get_starter_command, get_starter_files, parse_starters};
use anyhow::{Context, Result};
use handlebars::Handlebars;
use serde_json::json;
use std::fs::{self, File, create_dir_all};
use std::io::Write;
use std::path::Path;
use std::process::{Command, Stdio};
use std::thread;
use tempfile::TempDir;

// Template files included at compile-time
const PACKAGE_JSON: &str = include_str!("../templates/storybook/package.json");
const MAIN_TS: &str = include_str!("../templates/storybook/main.ts");
const PREVIEW_TS: &str = include_str!("../templates/storybook/preview.ts");
const STARTER_PREVIEW_TSX: &str = include_str!("../templates/storybook/StarterPreview.tsx");
const TYPES_TSX: &str = include_str!("../templates/storybook/types.tsx");

pub fn dev(config: Config, instance_path: Option<&str>, port: u16) -> Result<()> {
    let instance_path = resolve_instance_path(&config, instance_path);
    println!("Using instance at {:?}", instance_path);

    // Create temporary directory for Storybook
    let temp_dir = TempDir::new().context("Failed to create temporary directory")?;
    let temp_path = temp_dir.path();
    setup_storybook_environment(&temp_path, &instance_path)?;

    println!("Starting Storybook development server on port {}...", port);
    let storybook_path = temp_path.to_path_buf();
    let port_str = port.to_string();
    // Start storybook in a separate thread
    let storybook_thread = thread::spawn(move || {
        let mut cmd = Command::new("npx");
        cmd.arg("storybook")
            .arg("dev")
            .arg("-p")
            .arg(port_str)
            .arg("--ci")
            .current_dir(&storybook_path)
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit());

        match cmd.spawn() {
            Ok(mut child) => {
                if let Err(e) = child.wait() {
                    eprintln!("Error running Storybook: {}", e);
                }
            }
            Err(e) => {
                eprintln!("Failed to start Storybook: {}", e);
            }
        }
    });

    println!("Press Ctrl+C to stop the server");

    // Wait for the storybook thread to finish
    storybook_thread
        .join()
        .map_err(|e| anyhow::anyhow!("Storybook thread panicked: {:?}", e))?;

    // temp_dir will be automatically cleaned up when it goes out of scope
    Ok(())
}

pub fn prod(config: Config, instance_path: Option<&str>, output: String) -> Result<()> {
    let instance_path = resolve_instance_path(&config, instance_path);
    println!("Using instance at {:?}", instance_path);

    // Create temporary directory for Storybook
    let temp_dir = TempDir::new().context("Failed to create temporary directory")?;
    let temp_path = temp_dir.path();
    setup_storybook_environment(&temp_path, &instance_path)?;

    // Make output path absolute relative to current working directory
    let cwd = std::env::current_dir().context("Failed to get current working directory")?;
    let output_path = cwd.join(&output);
    
    println!("Building Storybook for production to {}", output_path.display());
    let output_arg = format!("--output-dir={}", output_path.display());
    let mut cmd = Command::new("npx");
    cmd.arg("storybook")
        .arg("build")
        .arg(output_arg)
        .current_dir(&temp_path)
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit());

    let status = cmd.status().context("Failed to execute storybook build")?;

    if status.success() {
        println!("Storybook build completed successfully");
        Ok(())
    } else {
        anyhow::bail!("Storybook build failed with status: {}", status)
    }
}

/// Sets up the complete Storybook environment in a temporary directory
/// This includes installing dependencies, generating config, and creating stories
fn setup_storybook_environment(temp_dir: &Path, instance_dir: &Path) -> Result<()> {
    println!("Setting up Storybook in temporary directory: {:?}", temp_dir);
    install_node_deps(temp_dir)?;
    generate_config(temp_dir)?;
    generate_stories_in_temp(temp_dir, instance_dir)?;
    Ok(())
}

/// Generates stories in the temporary directory by reading starters from the instance directory
fn generate_stories_in_temp(temp_dir: &Path, instance_dir: &Path) -> Result<()> {
    let stories_dir = temp_dir.join(".storybook/stories");

    // Clean existing stories directory (shouldn't exist in temp, but just in case)
    if stories_dir.exists() {
        fs::remove_dir_all(&stories_dir).context("Failed to clean existing stories directory")?;
    }

    // Create stories directory
    create_dir_all(&stories_dir).context("Failed to create storybook stories directory")?;

    // Parse starters from the instance directory (not temp_dir)
    let grouped_starters = parse_starters(instance_dir)?;

    // Initialize Handlebars for templating
    let mut handlebars = Handlebars::new();
    handlebars.register_escape_fn(handlebars::no_escape); // Don't escape MDX content

    // Generate the overview page
    generate_overview_page(instance_dir, &stories_dir, &mut handlebars)?;

    // Generate stories for each starter
    for (group, starters) in grouped_starters {
        let group_dir = stories_dir.join(&group);
        create_dir_all(&group_dir)
            .with_context(|| format!("Failed to create directory for group: {}", group))?;

        for starter in starters {
            generate_starter_story(&starter, &group_dir, &mut handlebars, instance_dir)?;
        }
    }

    println!(
        "Successfully generated Storybook files at: {}",
        stories_dir.display()
    );
    Ok(())
}

pub fn generate_stories(instance_dir: &Path) -> Result<()> {
    let starters_dir = instance_dir;
    let stories_dir = instance_dir.join(".storybook/stories");

    // Clean existing stories directory
    if stories_dir.exists() {
        fs::remove_dir_all(&stories_dir).context("Failed to clean existing stories directory")?;
    }

    // Create stories directory
    create_dir_all(&stories_dir).context("Failed to create storybook stories directory")?;

    // Parse starters from the instance
    let grouped_starters = parse_starters(starters_dir)?;

    // Initialize Handlebars for templating
    let mut handlebars = Handlebars::new();
    handlebars.register_escape_fn(handlebars::no_escape); // Don't escape MDX content

    // Generate the overview page
    generate_overview_page(starters_dir, &stories_dir, &mut handlebars)?;

    // Generate stories for each starter
    for (group, starters) in grouped_starters {
        let group_dir = stories_dir.join(&group);
        create_dir_all(&group_dir)
            .with_context(|| format!("Failed to create directory for group: {}", group))?;

        for starter in starters {
            generate_starter_story(&starter, &group_dir, &mut handlebars, starters_dir)?;
        }
    }

    println!(
        "Successfully generated Storybook files at: {}",
        stories_dir.display()
    );
    Ok(())
}

/// Creates package.json and installs Storybook dependencies
fn install_node_deps(instance_dir: &Path) -> Result<()> {
    let package_json_path = instance_dir.join("package.json");

    fs::write(package_json_path, PACKAGE_JSON).context("Failed to create package.json file")?;

    println!("Running `npm install` in {}", instance_dir.display());

    let status = Command::new("npm")
        .arg("install")
        .current_dir(instance_dir)
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status()
        .context("Failed to execute `npm install`")?;

    if !status.success() {
        anyhow::bail!("`npm install` failed with status: {}", status);
    }

    println!("npm install completed successfully.");

    Ok(())
}

/// Creates the configuration files for Storybook using templates embedded at compile-time
fn generate_config(instance_dir: &Path) -> Result<()> {
    let storybook_dir = instance_dir.join(".storybook");

    // Create storybook directory if it doesn't exist
    if !storybook_dir.exists() {
        create_dir_all(&storybook_dir).context("Failed to create .storybook directory")?;
    }

    // Write all template files to the storybook directory
    fs::write(storybook_dir.join("main.ts"), MAIN_TS)
        .context("Failed to create main.ts configuration file")?;

    fs::write(storybook_dir.join("preview.ts"), PREVIEW_TS)
        .context("Failed to create preview.ts configuration file")?;

    fs::write(
        storybook_dir.join("StarterPreview.tsx"),
        STARTER_PREVIEW_TSX,
    )
    .context("Failed to create StarterPreview.tsx file")?;

    fs::write(storybook_dir.join("types.tsx"), TYPES_TSX)
        .context("Failed to create types.tsx file")?;

    Ok(())
}

fn generate_overview_page(
    starters_dir: &Path,
    stories_dir: &Path,
    handlebars: &mut Handlebars,
) -> Result<()> {
    // Register the overview template
    handlebars.register_template_string(
        "overview",
        r#"
import { Meta, Title } from '@storybook/blocks';

<Meta title='Jump Start' />
[View on GitHub](https://github.com/{{github_username}}/{{github_repo}})

{{{readme_content}}}
"#,
    )?;

    // Read README and rewrite the starters section
    let readme_path = starters_dir.join("README.md");
    let readme_content = fs::read_to_string(&readme_path)
        .unwrap_or_else(|_| "# Jump Start\n\nWelcome to Jump Start!".to_string());

    // Simple implementation of rewrite_readme_section
    let readme_content = if let Some(start_idx) = readme_content.find("## Starters") {
        let pre_section = &readme_content[0..start_idx];

        if let Some(next_section_idx) = readme_content[start_idx..].find("\n## ") {
            // Found next section
            let post_section = &readme_content[start_idx + next_section_idx..];
            format!(
                "{}## Starters\n\nView available starters on the left\n{}",
                pre_section, post_section
            )
        } else {
            // No next section found
            format!(
                "{}## Starters\n\nView available starters on the left",
                pre_section
            )
        }
    } else {
        readme_content
    };

    // Get GitHub username and repo from environment or config
    let github_username =
        std::env::var("GITHUB_USERNAME").unwrap_or_else(|_| "username".to_string());
    let github_repo = std::env::var("GITHUB_REPO").unwrap_or_else(|_| "jump-start".to_string());

    // Render the overview template
    let template_data = json!({
        "github_username": github_username,
        "github_repo": github_repo,
        "readme_content": readme_content
    });

    let mdx_content = handlebars
        .render("overview", &template_data)
        .context("Failed to render overview page")?;

    // Write the file
    let output_path = stories_dir.join("jump-start.mdx");
    let mut file = File::create(&output_path)
        .with_context(|| format!("Failed to create overview at {}", output_path.display()))?;

    file.write_all(mdx_content.as_bytes())
        .with_context(|| format!("Failed to write overview to {}", output_path.display()))?;

    println!("Generated overview page");
    Ok(())
}

pub fn generate_starter_story(
    starter: &LocalStarter,
    group_dir: &Path,
    handlebars: &mut Handlebars,
    instance_dir: &Path,
) -> Result<()> {
    // Register the starter template
    handlebars.register_template_string(
        "starter-story",
        r#"
import { Meta, Title } from '@storybook/blocks';
import StarterPreview from '../../../StarterPreview';
import files from './files.json';
import starter from './starter.json';

<Meta title='{{starter.group}}/{{starter.name}}' />
<Title>{{starter.group}}/{{starter.name}}</Title>

{{{starter_description}}}

[View on GitHub](https://github.com/{{github_username}}/{{github_repo}}/tree/main/{{starter.group}}/{{starter.name}})

## Use this starter

```
{{{starter_command}}}
```

<StarterPreview starter={starter} files={files} />
"#,
    )?;

    // Create directory for the starter
    let starter_dir = group_dir.join(&starter.name);
    create_dir_all(&starter_dir)
        .with_context(|| format!("Failed to create directory for starter: {}", starter.name))?;

    // Write starter.json
    let starter_json_path = starter_dir.join("starter.json");
    let starter_json = serde_json::to_string_pretty(starter)?;
    fs::write(&starter_json_path, starter_json).with_context(|| {
        format!(
            "Failed to write starter.json at {}",
            starter_json_path.display()
        )
    })?;

    // Get starter files and write files.json
    let starter_files_path = starter_dir.join("files.json");
    // Use the instance_dir parameter passed to this function
    let files = get_starter_files(starter, instance_dir)?;
    println!(
        "Starter {}/{} has {} files",
        starter.group,
        starter.name,
        files.len()
    );
    let files_json = serde_json::to_string_pretty(&files)?;
    fs::write(&starter_files_path, files_json).with_context(|| {
        format!(
            "Failed to write files.json at {}",
            starter_files_path.display()
        )
    })?;

    // Get GitHub username and repo from environment or config
    let github_username =
        std::env::var("GITHUB_USERNAME").unwrap_or_else(|_| "username".to_string());
    let github_repo = std::env::var("GITHUB_REPO").unwrap_or_else(|_| "jump-start".to_string());
    // Get starter command
    let starter_command = get_starter_command(starter, &github_username, &github_repo);

    // Render the template
    let template_data = json!({
        "starter": starter,
        "starter_description": starter.config.as_ref().unwrap().description,
        "github_username": github_username,
        "github_repo": github_repo,
        "starter_command": starter_command
    });

    let mdx_content = handlebars
        .render("starter-story", &template_data)
        .with_context(|| {
            format!(
                "Failed to render MDX for starter: {}/{}",
                starter.group, starter.name
            )
        })?;

    // Write the MDX file
    let mdx_path = starter_dir.join(format!("{}.mdx", starter.name));
    fs::write(&mdx_path, mdx_content)
        .with_context(|| format!("Failed to write MDX at {}", mdx_path.display()))?;

    println!("Generated story for: {}/{}", starter.group, starter.name);
    Ok(())
}
