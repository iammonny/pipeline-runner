# Pipeline Runner

A tiny endless-runner game (jump the robot over the bugs) built as a small but complete
software project. The game itself is the excuse; the point is the repository around it:
dependencies, a lockfile, tests, linting, a Jenkinsfile, a Dockerfile, and a pull-request
workflow that a security scanner can hook into.

Start with `LEARNING_PATH.md` for the step-by-step exercises.

## Run it

```bash
npm install      # installs dependencies from package-lock.json into node_modules/
npm start        # serves the game at http://localhost:3000
npm test         # runs the unit tests in test/
npm run lint     # checks code style and common mistakes
npm audit        # lists known vulnerabilities in the dependency tree
```

Space, up arrow or a tap makes the robot jump.

## Layout

```
pipeline-runner/
  public/            what the browser loads: index.html, style.css, game.js (drawing + input)
  src/logic.js       the game rules as pure functions; no browser code, so it is testable
  test/              unit tests for src/logic.js, run with Node's built-in test runner
  server.js          a small Express web server that serves public/ and src/
  package.json       the project manifest: name, scripts, dependencies
  package-lock.json  the lockfile: exact versions of every dependency, direct and transitive
  eslint.config.js   lint rules
  Jenkinsfile        the CI pipeline Jenkins runs on every pull request
  Dockerfile         how the deployable container image is built
  .env.example       documents configuration; the real .env is git-ignored
```

## Dependencies, explained

- `express` is the only runtime dependency. It ships inside the artifact.
- `eslint`, `@eslint/js` and `globals` are dev dependencies. They are used to check the code
  and never reach production (`npm ci --omit=dev` in the Dockerfile leaves them out).
- Run `npm ls --all | wc -l` to see how many packages those four names actually pull in.
  That gap is what software composition analysis (SCA) exists for.
