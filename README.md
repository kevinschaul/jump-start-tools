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

This prints the path to your `config.json` file. Edit it to add your starter instances:

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

#### Local starters

```bash
# Use a specific starter
jump-start use frontend/react-app

# Use with custom output directory
jump-start use frontend/react-app --out my-new-project

# Search through local starters
jump-start find react
```

#### Remote starters

```bash
# Use starter from GitHub repository
jump-start use @kevinschaul/react-d3/LineChart
```

### Command Reference

#### `jump-start use`

<!--[[[cog
import subprocess
result = subprocess.run(['cargo', 'run', '--', 'use', '--help'], capture_output=True, text=True)
cog.out("```\n" + result.stdout.strip() + "\n```\n")
]]]-->
```
Use a starter

Usage: jump-start use <STARTER_IDENTIFIER> [DEST]

Arguments:
  <STARTER_IDENTIFIER>  The starter to use.
                        For local starters: group/starter-name
                            e.g. react-d3/LineChart
                        For remote starters: @username/group/starter-name or @username/repo/group/starter-path
                            e.g. @kevinschaul/react-d3/LineChart
  [DEST]                Optional destination directory

Options:
  -h, --help  Print help
```
<!--[[[end]]]-->

#### `jump-start config`

<!--[[[cog
import subprocess
result = subprocess.run(['cargo', 'run', '--', 'config', '--help'], capture_output=True, text=True)
cog.out("```\n" + result.stdout.strip() + "\n```\n")
]]]-->
```
Print path to config file

Usage: jump-start config

Options:
  -h, --help  Print help
```
<!--[[[end]]]-->

#### `jump-start storybook`

<!--[[[cog
import subprocess
result = subprocess.run(['cargo', 'run', '--', 'storybook', '--help'], capture_output=True, text=True)
cog.out("```\n" + result.stdout.strip() + "\n```\n")
]]]-->
```
Storybook commands

Usage: jump-start storybook <COMMAND>

Commands:
  dev   Start Storybook development server
  prod  Build Storybook for production
  help  Print this message or the help of the given subcommand(s)

Options:
  -h, --help  Print help
```
<!--[[[end]]]-->

##### Development Server

<!--[[[cog
import subprocess
result = subprocess.run(['cargo', 'run', '--', 'storybook', 'dev', '--help'], capture_output=True, text=True)
cog.out("```\n" + result.stdout.strip() + "\n```\n")
]]]-->
```
Start Storybook development server

Usage: jump-start storybook dev [OPTIONS]

Options:
      --instance-path <INSTANCE_PATH>  Path to the instance to operate on
  -p, --port <PORT>                    Port to run Storybook on [default: 6006]
  -h, --help                           Print help
```
<!--[[[end]]]-->

##### Production Build

<!--[[[cog
import subprocess
result = subprocess.run(['cargo', 'run', '--', 'storybook', 'prod', '--help'], capture_output=True, text=True)
cog.out("```\n" + result.stdout.strip() + "\n```\n")
]]]-->
```
Build Storybook for production

Usage: jump-start storybook prod [OPTIONS]

Options:
      --instance-path <INSTANCE_PATH>  Path to the instance to operate on
  -o, --output <OUTPUT>                Output directory [default: storybook-static]
  -h, --help                           Print help
```
<!--[[[end]]]-->

#### `jump-start find`

<!--[[[cog
import subprocess
result = subprocess.run(['cargo', 'run', '--', 'find', '--help'], capture_output=True, text=True)
cog.out("```\n" + result.stdout.strip() + "\n```\n")
]]]-->
```
Find a starter

Usage: jump-start find [OPTIONS] <SEARCH_TERM>

Arguments:
  <SEARCH_TERM>  Search term to find starters (searches names and content)

Options:
      --json  Output results as JSON
  -h, --help  Print help
```
<!--[[[end]]]-->

**Search Term Examples:**
- `react` - Find all starters containing "react"
- `frontend` - Find starters in the frontend group
- `python` - Find Python-related templates

#### `jump-start update-readme`

<!--[[[cog
import subprocess
result = subprocess.run(['cargo', 'run', '--', 'update-readme', '--help'], capture_output=True, text=True)
cog.out("```\n" + result.stdout.strip() + "\n```\n")
]]]-->
```
Update readme

Usage: jump-start update-readme [OPTIONS]

Options:
      --instance-path <INSTANCE_PATH>  Path to the instance to operate on
  -h, --help                           Print help
```
<!--[[[end]]]-->

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
