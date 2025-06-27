# jump-start-tools

The tools for
[jump-start](https://github.com/kevinschaul/jump-start-template):
A shortcut to your favorite code.

This repo contains the `jump-start` CLI.

To set up your own jump-start instance, navigate to
[jump-start-template](https://github.com/kevinschaul/jump-start-template)
instead!

## Installation

Ensure you have Rust and Cargo installed.

Install the `jump-start` CLI:

```
cargo install --path cli
```

Alternatively, once published to crates.io:

```
cargo install jump-start
```

## Configuration

Set up your jump-start instances:

```
jump-start config
```

Running this prints the path to your `config.json`. Edit it to add instances, for example:

```json
{
  "instances": [
    {
      "path": "/home/kevin/dev/jump-start/",
      "name": "kevinschaul"
    }
  ]
}
```

## Usage

### `jump-start config`

Print the path to your jump-start config file:

```
jump-start config
```

### `jump-start find`

Search installed starters by name or content:

```
jump-start find [--json] <search-term>
```

Options:
  --json         Output results as JSON
  -h, --help     Display help

### `jump-start use`

Copy a starter to your project:

```
jump-start use [--out <dir>] <starter-identifier>
```

Arguments:
  <starter-identifier>  Specify with `<group>/<starter>` or `<instance>/<group>/<starter>`

Options:
  --out <dir>     Output directory (defaults to starter’s default)
  -h, --help      Display help

### `jump-start storybook dev`

Start the Storybook development server for your jump-start instance:

```
jump-start storybook dev [--instance-path <path>] [--port <port>]
```

Options:
  --instance-path <path>   Specify a custom instance path (overrides config)
  -p, --port <port>        Port to run Storybook on (default: 6006)
  -h, --help               Display help

### `jump-start storybook prod`

Build Storybook for production:

```
jump-start storybook prod [--instance-path <path>] [--output <dir>]
```

Options:
  --instance-path <path>   Specify a custom instance path (overrides config)
  -o, --output <dir>       Output directory (default: storybook-static)
  -h, --help               Display help

### `jump-start update-readme`

Regenerate the `README.md` in your jump-start instance:

```
jump-start update-readme [--instance-path <path>]
```

Options:
  --instance-path <path>   Specify a custom instance path (overrides config)
  -h, --help               Display help

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

### CLI

Build and test the Rust CLI:

```
cargo build
cargo test
```

Install locally:

```
cargo install --path cli
```

Publish to crates.io:

```
cargo publish -p jump-start
```

