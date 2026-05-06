# Contributing to OmniWTMS

Thank you for your interest in contributing to OmniWTMS! We welcome contributions from the community and are pleased to have you join us.

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Git
- A Supabase account for backend services

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/omniwtms.com.git
   cd omniwtms.com
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your environment variables (see README.md for details)

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 📋 How to Contribute

### Reporting Bugs
- Use the [GitHub Issues](https://github.com/KhamareClarke/omniwtms.com/issues) page
- Check if the issue already exists before creating a new one
- Include detailed steps to reproduce the bug
- Add screenshots or videos if helpful

### Suggesting Features
- Open a new issue with the "feature request" label
- Describe the feature and its benefits
- Include mockups or examples if possible

### Code Contributions

#### Branch Naming Convention
- `feature/description` - for new features
- `fix/description` - for bug fixes
- `docs/description` - for documentation updates
- `refactor/description` - for code refactoring

#### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(dashboard): add real-time vehicle tracking
fix(auth): resolve login redirect issue
docs(readme): update installation instructions
```

#### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run lint
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(scope): your descriptive message"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use a clear and descriptive title
   - Fill out the PR template completely
   - Link any related issues
   - Request review from maintainers

## 🎨 Code Style Guidelines

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### React Components
- Use functional components with hooks
- Follow the existing component structure
- Use TypeScript interfaces for props
- Keep components focused and reusable

### CSS/Styling
- Use Tailwind CSS classes
- Follow mobile-first responsive design
- Use semantic class names
- Maintain consistent spacing and colors

### File Organization
```
components/
├── ui/              # Base UI components
├── dashboard/       # Dashboard-specific components
├── warehouse/       # Warehouse management
└── transport/       # Transport management

app/
├── (auth)/         # Authentication pages
├── dashboard/      # Main application
└── api/           # API routes
```

## 🧪 Testing

### Running Tests
```bash
npm run test          # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

### Writing Tests
- Write unit tests for utility functions
- Write integration tests for API routes
- Write component tests for React components
- Aim for >80% code coverage

### Test Structure
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test implementation
  });

  it('should handle user interactions', () => {
    // Test implementation
  });
});
```

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for functions and classes
- Include parameter and return type descriptions
- Provide usage examples for complex functions

### README Updates
- Update README.md when adding new features
- Include setup instructions for new dependencies
- Add screenshots for UI changes

## 🔍 Code Review Process

### For Contributors
- Respond to feedback promptly
- Make requested changes in new commits
- Keep discussions focused and professional

### For Reviewers
- Be constructive and specific in feedback
- Test the changes locally when possible
- Approve when ready or request changes with clear guidance

## 🏷️ Release Process

### Versioning
We follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes (backward compatible)

### Release Checklist
- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Create release notes
- [ ] Tag the release
- [ ] Deploy to production

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Maintain professional communication

### Getting Help
- Join our [Discord community](https://discord.gg/omniwtms)
- Ask questions in GitHub Discussions
- Check existing issues and documentation first

## 📞 Contact

- **Project Maintainer**: Khamare Clarke
- **Email**: khamare@omniwtms.com
- **GitHub**: [@KhamareClarke](https://github.com/KhamareClarke)

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to OmniWTMS! 🚀
