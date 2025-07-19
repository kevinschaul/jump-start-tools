# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Rust CLI tool called `jump-start` that helps developers quickly scaffold and manage code templates ("starters"). It's part of a broader ecosystem where users can create collections of code templates organized by groups and then easily find, preview, and use them in new projects.

## Build and Development Commands

### Building and Testing
```bash
# Build the entire workspace
cargo build

# Build with release optimizations
cargo build --release

# Run all tests
cargo test

# Run tests for specific modules
cargo test find_tests
cargo test use_tests
cargo test storybook_tests

# Install locally for development
cargo install --path cli

# Publish to crates.io (when ready)
cargo publish -p jump-start
```

### Running the CLI
```bash
# After installation, the binary is available as:
jump-start --help

# Common commands during development:
jump-start config                    # Show config file path
jump-start find <search-term>        # Search for starters
jump-start use <group>/<starter>     # Use a starter template
jump-start storybook dev             # Start Storybook preview server
jump-start update-readme             # Update instance README
```

## Architecture Overview

### Core Components

**Main CLI Structure (`cli/src/main.rs`):**
- Uses `clap` for command-line argument parsing with derive macros
- Implements custom logging with `SimpleLogger` for clean output
- Separates config-dependent commands from config setup
- All commands except `config` require a valid configuration file

**Configuration System (`cli/src/config.rs`):**
- Stores user instances in `~/.config/jump-start/config.json`
- Each instance represents a collection of starters at a specific path
- Supports multiple instances with one marked as default
- Auto-creates default config if none exists

**Starter Management (`cli/src/starter.rs`):**
- `LocalStarter`: Templates stored locally in instance directories
- `RemoteStarter`: Templates fetched from GitHub repositories
- Starters organized as `group/name` hierarchies
- Each starter has a `jump-start.yaml` config file
- Supports recursive file discovery with glob patterns

**Command Modules (`cli/src/commands/`):**
- `find.rs`: Search starters by name/content with JSON output option
- `use.rs`: Copy starter templates to target directories
- `storybook.rs`: Launch/build Storybook for previewing starters
- `update_readme.rs`: Generate documentation for starter collections
- `config.rs`: Display configuration file location

### Key Data Structures

**JumpStartInstance:** Represents a collection of starters
- `name`: Human-readable identifier
- `path`: Filesystem path to starter collection
- `default`: Boolean flag for default instance

**StarterConfig:** Configuration from `jump-start.yaml`
- `description`: Human-readable description
- `defaultDir`: Default output directory when using starter
- `mainFile`: Primary file to highlight in previews
- `preview`: Storybook/preview configuration with dependencies

### Storybook Integration

The tool includes a complete Storybook setup for previewing starters:
- Templates in `cli/src/templates/storybook/`
- Uses React 18, Sandpack for live code preview, and Storybook 8.3.0
- Generates stories dynamically from starter files
- Supports both dev server and production builds
- **Clean Architecture**: Uses temporary directories for Node.js dependencies and build artifacts
- **Automatic Cleanup**: No files left in user's starter directories
- **Smart Output**: Production builds output to user's current working directory while keeping temporary files isolated

### Storybook Architecture Details

**Temporary Directory Approach:**
- `storybook dev/prod` commands create isolated temporary directories using the `tempfile` crate
- All Node.js dependencies, Storybook configuration, and build artifacts are contained within temp directories
- User's starter directories remain completely clean - no `node_modules`, `package.json`, or `.storybook` files
- Automatic cleanup when process exits (even on failures or interruptions)

**Build Process:**
1. Creates temporary directory (`tempfile::TempDir`)
2. Copies Storybook templates (package.json, main.ts, preview.ts, etc.) to temp directory
3. Runs `npm install` in temp directory to install Node.js dependencies
4. Reads starters from user's instance directory
5. Generates dynamic stories in temp directory based on starter files
6. Runs Storybook dev server or build process from temp directory
7. For production builds: outputs final static files to user's current working directory
8. Automatically cleans up temp directory

**Key Functions:**
- `setup_storybook_environment()`: Orchestrates the complete setup process
- `generate_stories_in_temp()`: Generates stories from instance directory into temp directory
- `install_node_deps()`: Installs Node.js dependencies in temp directory
- `generate_config()`: Creates Storybook configuration files in temp directory

**Dependencies (Storybook 8.3.0 ecosystem):**
- All Storybook addons properly included in package.json template
- Compatible Vite version (4.4.0) for stable builds
- TypeScript support for proper MDX/JSX parsing
- Sandpack integration for live code previews

### Testing Strategy

Tests are organized by command functionality:
- `find_tests.rs`: Tests search functionality with fixtures
- `use_tests.rs`: Tests template copying and directory creation
- `storybook_tests.rs`: Tests Storybook server management
- Extensive fixture data in `tests/fixtures/` for realistic scenarios

### Instance Directory Structure

Expected structure for jump-start instances:
```
instance-root/
├── group1/
│   ├── starter1/
│   │   ├── jump-start.yaml
│   │   └── [template files]
│   └── starter2/
└── group2/
    └── starter3/
```

### Error Handling

- Uses `anyhow` for error propagation throughout the codebase
- Custom error messages for common user issues (missing config, invalid starters)
- Graceful degradation when starter directories are missing
- Debug logging available with `--verbose` flag

## Development Notes

- The project uses Cargo workspace with a single `cli` member
- Edition 2024 features are enabled
- Dependencies include `clap`, `serde`, `reqwest`, `handlebars` for core functionality
- **New dependency**: `tempfile` for clean temporary directory management in Storybook operations
- Storybook templates use React 18 with TypeScript and Storybook 8.3.0
- File system operations handle both text and binary files appropriately
- **Storybook Requirements**: Node.js must be installed on user's system for Storybook commands