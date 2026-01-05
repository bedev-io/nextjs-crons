# Contributing to nextjs-crons

Thank you for your interest in contributing! Here's how you can help.

## Development Setup

1. Clone the repository

```bash
git clone https://github.com/yourusername/nextjs-crons.git
cd nextjs-crons
```

2. Install dependencies

```bash
npm install
```

3. Build the project

```bash
npm run build
```

4. Run tests

```bash
npm test
```

## Project Structure

```
nextjs-crons/
├── src/
│   ├── index.ts       # Main export
│   ├── runner.ts      # Core logic
│   ├── types.ts       # TypeScript types
│   └── cli.ts         # CLI implementation
├── tests/
│   └── runner.test.ts # Unit tests
├── examples/
│   └── programmatic.ts # Usage examples
└── README.md          # Documentation
```

## Making Changes

1. Create a new branch

```bash
git checkout -b feature/my-feature
```

2. Make your changes

3. Add tests for new functionality

4. Ensure all tests pass

```bash
npm test
```

5. Build the project

```bash
npm run build
```

6. Commit your changes

```bash
git commit -m "feat: add my feature"
```

7. Push and create a pull request

## Coding Standards

- Use TypeScript strict mode
- Follow existing code style
- Add JSDoc comments for public APIs
- Write unit tests for new features
- Maintain 80%+ code coverage

## Commit Messages

Follow conventional commits format:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions/changes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Writing Tests

- Place tests in `tests/` directory
- Use descriptive test names
- Mock external dependencies
- Test edge cases and error handling

Example:

```typescript
describe("CronRunner", () => {
  it("should throw error if baseUrl is missing", () => {
    expect(() => {
      new CronRunner({ baseUrl: "" });
    }).toThrow("baseUrl is required");
  });
});
```

## Pull Request Process

1. Update README.md with details of changes if applicable
2. Update the version number following [SemVer](https://semver.org/)
3. Ensure all tests pass and coverage is maintained
4. The PR will be merged once you have approval from a maintainer

## Reporting Bugs

Please include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Your environment (Node version, OS, etc.)

## Feature Requests

Open an issue with:

- Clear description of the feature
- Use cases and benefits
- Possible implementation approach

## Questions?

Feel free to open an issue for any questions!
