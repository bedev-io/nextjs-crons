# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-05

### Added

- Initial release
- Core `CronRunner` class with scheduling functionality
- CLI tool with multiple commands
- Support for `vercel.json` configuration
- Authentication with `CRON_SECRET`
- Filter crons by path pattern
- Execute all crons once or specific cron
- List configured cron jobs
- Verbose logging option
- Comprehensive unit tests (80%+ coverage)
- Full TypeScript support
- Minimal dependencies (only `node-cron`)

### Features

- `start()` - Start all crons in watch mode
- `stop()` - Stop all running crons
- `executeAll()` - Execute all crons once
- `executeOne(path)` - Execute specific cron
- `getStats()` - Get execution statistics
- `listJobs()` - List configured jobs

### CLI Commands

- `--url` - Set base URL
- `--secret` - Set cron secret
- `--config` - Set config path
- `--verbose` - Enable verbose logging
- `--filter` - Filter crons by pattern
- `--once` - Execute all once
- `--execute` - Execute specific cron
- `--list` - List all crons
- `--help` - Show help

[1.0.0]: https://github.com/yourusername/nextjs-crons/releases/tag/v1.0.0
