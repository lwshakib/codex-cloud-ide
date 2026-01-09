# Codex Cloud IDE

A modern, cloud-based Integrated Development Environment (IDE) built for seamless collaboration and efficient coding.

## Features

- **Real-time Collaboration**: Code together in real-time with your team.
- **Cloud-based Infrastructure**: Access your workspace from anywhere, anytime.
- **Integrated Terminal**: Run commands and manage your environment directly.
- **Support for Multiple Languages**: Built-in support for various programming languages and frameworks.
- **Modern UI/UX**: Designed for productivity with a sleek, minimalist interface.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui.
- **Backend**: Express.js, Prisma, PostgreSQL.
- **Infrastructure**: Bun, Kafka (for services).

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine.
- PostgreSQL database instance.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/lwshakib/codex-cloud-ide.git
   cd codex-cloud-ide
   ```

2. Install dependencies for the server:
   ```bash
   cd server
   bun install
   ```

3. Install dependencies for the web client:
   ```bash
   cd ../web
   bun install
   ```

4. Set up environment variables in `.env` files for both `server` and `web`.

### Running Locally

To start the development servers:

**Server:**
```bash
cd server
bun run dev
```

**Web:**
```bash
cd web
bun run dev
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built by [lwshakib](https://github.com/lwshakib)
- Powered by modern web technologies.