# Contributing to Specification-Driven Agents

Thank you for your interest in contributing to the Specification-Driven Agents framework! This document provides guidelines and instructions for contributing.

## 🎯 Project Vision

Specification-Driven Agents is a framework that enables humans, AI systems, and agents to understand architectural intent, execute contracts reliably, and analyze decisions through structured specifications. Our goal is to make software design legible, traceable, and human-AI-agent-executable.

## 📋 Code of Conduct

Please read and follow our Code of Conduct to ensure a welcoming environment for everyone. (See [ Contributor Covenant](https://www.contributor-covenant.org/))

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Git

### Development Setup
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/specification-driven-agents.git
   cd specification-driven-agents
   ```
3. Install dependencies:
   ```bash
   cd tooling
   npm install
   ```
4. Build the project:
   ```bash
   npm run build
   ```

## 🏗️ Project Structure

```
specification-driven-agents/
├── tooling/              # CLI tool implementation
│   ├── src/             # TypeScript source code
│   ├── templates/       # Specification templates
│   ├── tests/           # Test suite
│   └── package.json
├── schemas/             # Contract schemas
├── examples/            # Example specifications
├── specs/              # Project specifications
└── docs/               # Documentation
```

## 📝 Development Workflow

### 1. Branch Naming
Use descriptive branch names:
- `feature/` for new features
- `fix/` for bug fixes
- `docs/` for documentation
- `refactor/` for code refactoring

### 2. Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Maintenance tasks

### 3. Pull Request Process
1. Create a new branch from `main`
2. Make your changes
3. Run tests: `npm test`
4. Ensure code passes linting: `npm run lint`
5. Update documentation if needed
6. Create a pull request with a clear description

## 🧪 Testing

### Running Tests
```bash
cd tooling
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
```

### Writing Tests
- Place test files next to the code they test with `.test.ts` extension
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies

## 📚 Documentation

### Documentation Types
1. **API Documentation**: Code comments using JSDoc
2. **User Documentation**: README files and guides
3. **Architecture Documentation**: Specification documents

### Updating Documentation
- Update README.md for user-facing changes
- Update inline code comments for API changes
- Update specification documents for architectural changes

## 🛠️ Tooling Development

### CLI Commands
The tooling supports these commands:
- `sda init`: Initialize a new project
- `sda generate`: Generate specifications from templates
- `sda validate`: Validate specifications against schema
- `sda validate-project`: Validate all specifications in project
- `sda resolve`: Resolve authority hierarchy
- `sda status`: Update specification lifecycle status
- `sda graph`: Generate dependency graphs

### Adding New Commands
1. Create command file in `tooling/src/cli/`
2. Implement command logic
3. Register command in `tooling/src/index.ts`
4. Add tests in `tooling/tests/`
5. Update documentation

## 🏛️ Specification Development

### Specification Types
The framework supports 10 specification types:
1. **genesis** (.md): Root narrative and architectural entry point
2. **standard** (.yaml): Global engineering laws and cross-cutting rules
3. **domain** (.yaml): Bounded context or core business capability
4. **implementation** (.yaml): Concrete realization details for code
5. **api** (.yaml): Interface contracts for endpoints
6. **migration** (.yaml): Safe structural changes to persistence layers
7. **security** (.yaml): Security controls, trust boundaries, threat assumptions
8. **validation** (.yaml): How a system must be verified
9. **operational** (.yaml): Runtime, deployment, monitoring requirements
10. **task-change** (.yaml): Focused change tied to one unit of delivery

### Creating New Templates
1. Add template file to `tooling/templates/`
2. Follow existing template structure
3. Include all required sections from schema
4. Add comprehensive examples and comments
5. Update schema validation if needed

## 🔍 Code Review Guidelines

### What Reviewers Look For
- **Correctness**: Does the code work as intended?
- **Testing**: Are there adequate tests?
- **Documentation**: Is the code well-documented?
- **Style**: Does it follow project conventions?
- **Performance**: Are there performance implications?
- **Security**: Are there security concerns?

### Review Process
1. Author creates PR
2. At least one reviewer approves
3. All tests pass
4. Code meets quality standards
5. Documentation is updated
6. PR is merged

## 🐛 Bug Reports

### Reporting Bugs
Create an issue with:
1. Clear description of the bug
2. Steps to reproduce
3. Expected vs actual behavior
4. Environment details
5. Screenshots if applicable

### Fixing Bugs
1. Reproduce the bug locally
2. Write a failing test
3. Fix the bug
4. Ensure all tests pass
5. Update documentation if needed

## ✨ Feature Requests

### Requesting Features
Create an issue with:
1. Problem description
2. Proposed solution
3. Use cases
4. Potential implementation approach

### Implementing Features
1. Discuss design in issue comments
2. Create specification if needed
3. Implement feature
4. Add tests
5. Update documentation
6. Create examples

## 📊 Performance Considerations

### Code Performance
- Avoid unnecessary computations
- Use efficient algorithms
- Cache expensive operations
- Monitor memory usage

### Tool Performance
- CLI commands should be fast
- Validation should be efficient
- Graph resolution should handle large projects
- File I/O should be optimized

## 🔒 Security Guidelines

### Security Considerations
- Never commit secrets or credentials
- Validate all user input
- Follow security best practices
- Regular dependency updates
- Security scanning in CI/CD

### Reporting Security Issues
Please report security issues privately to the maintainers.

## 📈 Release Process

### Versioning
Follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps
1. Update version in `package.json`
2. Update CHANGELOG.md
3. Run full test suite
4. Create release tag
5. Build and publish package
6. Update documentation

## 🤝 Community

### Getting Help
- Check documentation first
- Search existing issues
- Ask in discussions
- Join community channels

### Recognition
Contributors will be recognized in:
- Release notes
- Contributor list
- Documentation credits

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).

## 🙏 Thank You!

Thank you for contributing to making software development more structured, legible, and human-AI-agent-executable!