# jump-start-tools

CLI tool for the [jump-start template system](https://github.com/kevinschaul/jump-start-template): A shortcut to your favorite code.

**New to jump-start?** Start with the [jump-start-template repository](https://github.com/kevinschaul/jump-start-template) to understand the system and set up your first template collection.

## Installation

```bash
cargo install jump-start
jump-start --help
```

## Configuration

```bash
jump-start config
```

This prints the path to your `config.json` file. Edit it to add your template instances:

### Single Instance

```json
{
  "instances": [
    {
      "name": "my-templates",
      "path": "/home/user/my-jump-start-templates",
      "default": true
    }
  ]
}
```

### Multiple Instances

```json
{
  "instances": [
    {
      "name": "work",
      "path": "/home/user/work-templates",
      "default": true
    },
    {
      "name": "personal",
      "path": "/home/user/personal-templates",
      "default": false
    }
  ]
}
```

## Usage

### Common Workflows

#### Local templates

```bash
# Use a specific template
jump-start use frontend/react-app

# Use with custom output directory
jump-start use frontend/react-app --out my-new-project

# Search for templates
jump-start find react
```

#### Remote templates

```bash
# Use template from GitHub repository
jump-start use @kevinschaul/react-d3/LineChart
```

### Command Reference

#### `jump-start use`

Copy a starter to your project:

```bash
jump-start use [--out <dir>] <starter-identifier>
```

#### `jump-start config`

Show config file path:

```bash
jump-start config
```

#### `jump-start storybook`

Preview your templates with an integrated Storybook interface:

##### Development Server

```bash
jump-start storybook dev [--port <port>]
```

Opens at `http://localhost:6006` with live previews of all your templates.

##### Production Build

```bash
jump-start storybook prod [--output <dir>]
```

Generates static Storybook files for deployment.

#### `jump-start find`

Search starters by name or content:

```bash
jump-start find [--json] <search-term>
```

#### `jump-start update-readme`

Regenerate the README.md in your instance:

```bash
jump-start update-readme [--instance-path <path>]
```

## Neovim plugin

[./nvim](./nvim) provides a Telescope extension to search and use jump-start starters.

To install with [lazy.nvim](https://lazy.folke.io/):

```lua
{ dir = "~/dev/jump-start-tools/nvim" },
```

You will have a new Telescope picker. Run it with:

```
:Telescope jump_start find
```

But you problably want to set up your own mappings. Here is mine:

```
["<Leader>fj"] = {
  function() require("telescope").extensions.jump_start.find() end,
  desc = "Find jump-starter",
},
```

## Development

Build and test:

```bash
make build
make test
```

Install locally:

```bash
cargo install --path cli
```

Release a new version:

```bash
make release
```
