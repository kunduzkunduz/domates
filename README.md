# BDD AI Assistant

A modern Behavior Driven Development assistant powered by LLMs that generates automated tests and living documentation from Gherkin feature files.

## Features

- 📝 Parse `.feature` files written in Gherkin syntax
- 🤖 Generate automated test code (Playwright, Cypress, Pytest)
- 📚 Create living documentation (Markdown/HTML/MDX)
- 🔗 Sync scenarios with Linear/Jira tasks
- 🎯 Toggle between manual and automated execution
- 📊 Beautiful dashboard for visualizing features and results

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Generate tests from feature files
npx bdd-ai generate tests --from features/

# Start the development server
npm run dev
```

## Project Structure

```
├── src/
│   ├── parser/          # Feature file parser
│   ├── generator/       # LLM test generator
│   ├── docs/           # Documentation generator
│   ├── cli/            # Command line interface
│   ├── types/          # TypeScript type definitions
│   └── server/         # Express server
├── frontend/           # Next.js dashboard
├── features/           # Example .feature files
├── tests/              # Generated test files
└── docs/               # Generated documentation
```

## Environment Variables

Create a `.env` file:

```env
OPENAI_API_KEY=your_openai_api_key
LINEAR_API_KEY=your_linear_api_key
PORT=3000
```

## License

MIT



