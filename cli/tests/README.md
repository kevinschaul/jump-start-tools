# Integration Tests

This directory contains integration tests for the Jump Start CLI.

## Test Organization

- `storybook_tests.rs`: Tests for the Storybook generation functionality
  - Tests that individual starter stories can be generated correctly
  - Tests that the full Storybook generation process works with multiple starters

- `fixtures/`: Test data used by the tests
  - Contains sample starters and expected output for validation

## Running Tests

Run all tests using:

```bash
cargo test
```

Run specific test files using:

```bash
cargo test --test storybook_tests
```

Run specific tests with a pattern:

```bash
cargo test test_generate_starter_story
```

## Adding New Tests

To add new integration tests:

1. Create a new `.rs` file in the `tests` directory
2. Add test fixtures to the `fixtures` directory as needed
3. Use the existing test patterns as a guide