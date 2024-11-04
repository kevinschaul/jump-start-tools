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

### `jump-start find <search_term>`

### `jump-start storybook`

TODO use config
TODO rename this to preview?

### `jump-start build-storybook`

TODO use config

### `jump-start update-readme`

TODO use config

## Development

To view the website locally, navigate to your
jump-start repo (or [mine, for example](https://github.com/kevinschaul/jump-start)), run
`npm install` and then `npm run dev`.

Alternatively, if this repo is next to your jump-start
repo, you can just run `npm run dev` from this repo.
