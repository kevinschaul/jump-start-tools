# jump-start-tools

The tools for
[jump-start](https://github.com/kevinschaul/jump-start-template):
A shortcut to your favorite code.

This repo contains the `jump-start` CLI.

To set up your own jump-start instance, navigate to
[jump-start-template](https://github.com/kevinschaul/jump-start-template)
instead!

## Installation

1. Install from npm

TODO publish to npm

```
npm install --save --global jump-start-tools
```

2. Set up config with `jump-start config`:

`jump-start config` prints out the path to the jump-start config file. Edit this to add your jump-start instances, e.g.

**instances** Array of jump-start instances installed on your computer

**instances[].path** Path to the jump-start instance

**instances[].name** Optional. Name of jump-start instance, to distinguish when multiple are installed

```
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

### `jump-start find`

Usage: jump-start find [options] <search-term>

Search your installed starters. Searches both filenames and file content.

Options:
  -h, --help  display help for command

### `jump-start use`

Usage: jump-start use [options] <starter-string>

Use a starter.

Arguments:
  starter-string  Specify the starter with `<group>/<starter>` or
                  `<instance>/<group>/<starter>`.

Options:
  --out <dir>     Where to save the starter. Defaults to the starter's
                  defaultDir.
  -h, --help      display help for command

### `jump-start add`

Usage: jump-start add [options] <starter-string> <files>

Add a starter.

Arguments:
  starter-string  Specify the starter with `<group>/<starter>` or
                  `<instance>/<group>/<starter>`.
  files           A JSON string containing an array of files to add, with keys
                  `name` and `contents`.

Options:
  -h, --help      display help for command

### `jump-start storybook`

TODO use config
TODO rename this to preview?

### `jump-start build-storybook`

TODO use config

### `jump-start update-readme`

TODO use config

## Neovim plugin

[./jump-start.nvim](./jump_start.nvim) includes a Telescope picker to easily search and use starters.

To install with [lazy.nvim](https://lazy.folke.io/):

```
{ dir = "~/dev/jump-start-tools/jump_start.nvim" },
```

You will have a new Telescope pickers now. Run manually with:

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

To view the website locally, navigate to your
jump-start repo (or [mine, for example](https://github.com/kevinschaul/jump-start)), run
`npm install` and then `npm run dev`.

Alternatively, if this repo is next to your jump-start
repo, you can just run `npm run dev` from this repo.

```
cargo install --path cli
```
