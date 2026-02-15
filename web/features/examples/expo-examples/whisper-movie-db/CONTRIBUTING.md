# Contributing to Whisper 🎬

First off, thanks for taking the time to contribute! 🎉

We love your input! We want to make contributing to **Whisper** as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## How to Contribute

### 1. Fork and Clone

Fork the repo on GitHub and clone it locally:

```bash
git clone https://github.com/lwshakib/whisper-movie-db.git
cd whisper-movie-db
```

### 2. Create a Branch

Create a new branch for your feature or bugfix. This keeps your changes organized and separated from the main codebase.

```bash
git checkout -b feature/amazing-new-feature
# or
git checkout -b bugfix/fixing-annoying-bug
```

### 3. Install Dependencies

Make sure you have [Bun](https://bun.sh/) or npm installed.

```bash
bun install
```

### 4. Make Your Changes

Implement your feature or fix.

- Keep your code clean and readable.
- Follow the existing style and conventions (we use **NativeWind/Tailwind** for styling).
- Use `useEffect` and `useState` appropriately.
- Ensure animations are smooth (using Reanimated).

### 5. Check Your Work

Run the app to make sure everything works as expected.

```bash
npx expo start
```

### 6. Commit Your Changes

Commit your changes with a clear and descriptive message.

```bash
git commit -m "feat: add amazing new feature"
# or
git commit -m "fix: resolve infinite loop in search"
```

### 7. Push to GitHub

Push your branch to your forked repository.

```bash
git push origin feature/amazing-new-feature
```

### 8. Submit a Pull Request

Go to the original repository on GitHub and create a Pull Request from your fork.

- Provide a clear title and description.
- Explain what you changed and why.
- Attach screenshots or videos if you changed the UI.

## Coding Guidelines

- **TypeScript**: We use TypeScript. Please avoid using `any` unless absolutely necessary.
- **Styling**: Use NativeWind utility classes (`className="..."`). Avoid inline styles `style={{...}}` unless for dynamic values.
- **Components**: Create reusable components in the `components/` directory.
- **State Management**: Use React Context or Zustand (Global State) sparingly and effectively.

## Reporting Bugs

Improperly formatted bug reports may be closed without investigation.
If you find a bug, please create an issue including:

- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Screenshots/Video**
- **Your environment** (OS, Device, Expo Go version)

## License

By contributing, you agree that your contributions will be licensed under its MIT License.

---

Happy Coding! 🚀
