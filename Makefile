.PHONY: help test build install release update-readme

# Show available commands
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

test:
	cargo test

install:
	cargo install --path cli

update-readme:
	uvx --from cogapp cog -r README.md

release: update-readme
	@echo "Current version: $$(grep '^version = ' cli/Cargo.toml | sed 's/.*"\(.*\)".*/\1/')"; \
	read -p "Version: " v && ./scripts/release.sh $$v
