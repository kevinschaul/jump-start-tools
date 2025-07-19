# Upgrade Guide

This document contains instructions for upgrading your jump-start repository when there are breaking changes or required migrations between versions.

## From 0.1.X to 0.2.X

### Summary

`jump-start` is now a CLI! This greatly simplifies what's required to live within individual jump-start repos.

### Required changes to your jump-start repo:

Follow these steps, or make the changes [in this commit](https://github.com/kevinschaul/jump-start-template/commit/ea00ec0935e756ccf1bc2cb340973b6931c123ce).

1. Copy the latest [deploy.yml GitHub workflow](https://github.com/kevinschaul/jump-start-template/blob/main/.github/workflows/deploy.yml) into your repo
2. Copy the latest [README.md](https://github.com/kevinschaul/jump-start-template/blob/main/README.md) into your repo
3. Remove `package.json`
4. Commit and push, and watch for the action to (hopefully) succeed

### Optional improvements:

- Remove all `degit.json` files from your starters -- they are no longer used
- Install the `jump-start` cli: `cargo install jump-start`
