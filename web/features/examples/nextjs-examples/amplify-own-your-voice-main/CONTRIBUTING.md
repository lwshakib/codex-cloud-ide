# Contributing to Amplify

First off, thank you for considering contributing to Amplify! Your support helps make Amplify a premier platform for voice and communication mastery.

## Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Local Setup

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/lwshakib/amplify-own-your-voice.git
   cd amplify-own-your-voice
   ```

2. **Install Dependencies**:
   We use [Bun](https://bun.sh) for high-performance package management.
   ```bash
   bun install
   ```

3. **Environment Variables**:
   Ensure you have a `.env` file with the following keys:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `BETTER_AUTH_SECRET`: Secret for authentication.
   - `GOOGLE_API_KEY`: For AI analysis and logic (Gemini).
   - `DEEPGRAM_API_KEY`: For high-quality text-to-speech features.

4. **Database Initialization**:
   ```bash
   bun x prisma generate
   bun x prisma db push
   ```

5. **Run Development Server**:
   ```bash
   bun dev
   ```

## How Can I Contribute?

### Reporting Bugs
- **Search for existing issues.**
- **Open a new issue.** Include a clear title, descriptive steps to reproduce, and environment details.

### Suggesting Enhancements
- **Open a new issue.** Explain the proposed feature and its benefit to users.

### Pull Requests
1. Create a branch from `main` (e.g., `feat/ai-analysis` or `fix/nav-bug`).
2. Follow the established code style (TypeScript, Tailwind CSS, Shadcn UI).
3. Ensure no linting or build errors by running `bun run build`.
4. Submit your PR with a clear summary of changes.

## Style Guide
- **Package Manager**: Always use `bun`.
- **Typing**: Use strict TypeScript typing; avoid `any`.
- **UI**: Follow the design system using Tailwind CSS and Shadcn UI.
- **State Management**: Prefer React Hooks and Context; use Zustand for complex global state.
- **Commits**: Use descriptive, imperative-mood commit messages (e.g., "Implement debate scoring logic").

## Questions?
Reach out to the project owner at [lwshakib](https://github.com/lwshakib) or via email at [l.w.shakib@gmail.com].
