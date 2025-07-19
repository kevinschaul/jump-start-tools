.PHONY: help test build release

# Show available commands
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

test:
	cargo test

build:
	cargo build

release:
	@echo "Current version: $$(grep '^version = ' cli/Cargo.toml | sed 's/.*"\(.*\)".*/\1/')"; \
	read -p "Version: " v && ./scripts/release.sh $$v
