# Contributing to Ping Pong Party

Thank you for contributing to the Digital Scoreboard project!

## Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Auth0 credentials
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

## Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Keep domain logic in `.domain.ts` files
- Use Zod for validation schemas
- Write descriptive commit messages (conventional commits)

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) for automatic versioning:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `perf:` - Performance improvements

**Examples**:
```
feat: add player management UI
fix: correct ELO calculation for edge cases
docs: update CLAUDE.md with new architecture
```

## Testing

Before submitting a PR:

1. **Type check**:
   ```bash
   npm run type-check
   ```

2. **Run tests** (when available):
   ```bash
   npm test
   ```

3. **Build successfully**:
   ```bash
   npm run build
   ```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all tests pass
4. Update documentation if needed
5. Submit a PR with a clear description

## Questions?

Check [CLAUDE.md](CLAUDE.md) for architecture guidance or [MIGRATION.md](MIGRATION.md) for migration details from the previous implementation.
