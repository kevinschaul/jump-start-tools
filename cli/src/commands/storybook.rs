use anyhow::{Context, Result};
use handlebars::Handlebars;
use serde_json::json;
use std::fs::{self, File, create_dir_all};
use std::io::Write;
use std::path::{Path, PathBuf};

use crate::Config;
use crate::types::Starter;
use crate::utils::config::*;
use crate::utils::starter::*;

pub fn dev(config: Config, port: u16) {
    let instance = get_default_instance(&config);
    println!("Using instance {} ({:?})", instance.name, instance.path);

    if let Err(e) = generate_storybook_files(&instance.path) {
        eprintln!("Error generating Storybook files: {}", e);
        return;
    }

    println!("Starting Storybook development server on port {}...", port);
}

pub fn prod(_config: Config, _output: String) {
    println!("storybook");
}

fn generate_storybook_files(instance: &PathBuf) -> Result<()> {
    let starters_dir = instance;
    let stories_dir = instance.join(".storybook/stories");

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
            generate_starter_story(&starter, &group_dir, &mut handlebars)?;
        }
    }

    println!(
        "Successfully generated Storybook files at: {}",
        stories_dir.display()
    );
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

fn generate_starter_story(
    starter: &Starter,
    group_dir: &Path,
    handlebars: &mut Handlebars,
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

{{{starter.description}}}

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
    let files = get_starter_files(&starter)?;
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
    let degit_mode = std::env::var("DEGIT_MODE").unwrap_or_else(|_| "false".to_string());

    // Get starter command
    let starter_command = get_starter_command(starter, &github_username, &github_repo, &degit_mode);

    // Render the template
    let template_data = json!({
        "starter": starter,
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

fn get_starter_command(
    starter: &Starter,
    github_username: &str,
    github_repo: &str,
    degit_mode: &str,
) -> String {
    if degit_mode == "true" {
        format!(
            "npx degit {}/{}#{}/{} {}",
            github_username, github_repo, starter.group, starter.name, starter.name
        )
    } else {
        format!("jump-start add {}/{}", starter.group, starter.name)
    }
}
