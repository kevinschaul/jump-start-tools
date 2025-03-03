# Test Fixtures

This directory contains test fixtures used by the integration tests.

## Directory Structure

- `starters/`: Sample starters used for testing
  - Contains example starters with various configurations
  - Each starter has a jump-start.yaml file and associated files

- `expected/stories/`: Expected output from the Storybook generation
  - Contains the expected MDX files, JSON metadata, and other outputs
  - Used to validate that the Storybook generation produces the correct output

## Usage

These fixtures are used by the `storybook_tests.rs` integration test to validate that:

1. Individual starter stories can be generated correctly
2. The full Storybook generation process works as expected

The test compares the generated output with these expected files to ensure compatibility
with the existing setup.