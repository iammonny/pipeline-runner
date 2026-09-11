# Learning path

Each exercise takes 15–45 minutes and maps to a box in the SSDLC diagram. Do them in order;
later ones assume the earlier setup exists. Where an exercise says "expect", check that it
really happened before moving on.

Prerequisites: Node.js 20 or newer, git, a Bitbucket account, and a Jenkins instance you are
allowed to point at the repo. Aikido can be added at exercise 8; everything before it works
without a scanner.

---

## 1. Read the code (source code, libraries)

1. Open `src/logic.js`. Read every function; each one is a few lines. This is "your own code".
2. Open `public/game.js` and find where it calls the functions from `logic.js`.
3. Open `package.json`. The `dependencies` and `devDependencies` blocks are the libraries
   the project chose on purpose.
4. Run `npm install`, then `npm ls --all`. Everything below the top level is transitive:
   nobody chose it, it arrived with something else.

Expect: you can explain in one sentence what `express` does for this project and why
`eslint` is not needed at runtime.

## 2. Run it, break it, fix it (tests)

1. `npm test` — all tests pass.
2. In `src/logic.js`, change `JUMP_VELOCITY` from `-11` to `11`. Run `npm test`.
3. Read the failing output until you understand which test caught it and why.
4. Revert the change. `npm run lint` and `npm test` should both be clean.

Expect: you know the difference between "the game looks wrong" and "a test failed",
and why a pipeline can only react to the second.

## 3. Put it in Bitbucket (repository, main branch)

```bash
git init
git add .
git commit -m "Initial commit: pipeline runner game"
```

Create an empty repository in Bitbucket, then follow its instructions to push
(`git remote add origin ...`, `git push -u origin main`).

Check that `node_modules/` did **not** get pushed. `.gitignore` is what prevented it.
Look at the size of the repo compared to the size of `node_modules/` on your disk.

Expect: the repo in Bitbucket shows `package-lock.json` but no `node_modules/`.

## 4. Protect main (branch protection)

In Bitbucket: Repository settings → Branch restrictions (or Branch permissions).
On `main`:

- Prevent direct pushes for everyone, including yourself.
- Require at least one approval before merging.
- Require a successful build before merging (this activates once Jenkins reports in).

Then try `git push origin main` with a trivial change. It should be rejected.

Expect: the only way into `main` is now a pull request. This is the gate every later
security control hangs on.

## 5. Your first pull request (branch, PR, review, merge)

```bash
git checkout -b feature/show-speed
```

Add the current speed to the HUD: in `public/index.html` add a third counter, and in
`public/game.js` update it inside `update()` using `speedForScore(score)`. Then:

```bash
npm run lint && npm test
git add -A
git commit -m "Show current speed in the HUD"
git push -u origin feature/show-speed
```

In Bitbucket, open a pull request from `feature/show-speed` into `main`. Write a
description a reviewer could understand without reading the diff. Ask a colleague to
review (or review it yourself from a second account if you have one), then merge.

```bash
git checkout main
git pull
```

Expect: `git log` on main shows your commit arriving via a merge, not a direct push.

## 6. Connect Jenkins (webhook, Jenkinsfile, stages)

1. In Jenkins, create a **Multibranch Pipeline** job pointing at the Bitbucket repo.
   Jenkins will discover the `Jenkinsfile` and build `main`.
2. In Bitbucket, add a webhook to your Jenkins URL so pushes and PRs trigger builds
   automatically. (The Bitbucket Branch Source plugin can do this for you.)
3. Open the build log and match each stage to a line in `Jenkinsfile`.

Now repeat exercise 5 with a new branch. Watch the PR page: a build status appears,
and with the rule from exercise 4 the Merge button stays disabled until it is green.

Expect: you can point at the `Jenkinsfile` stage that produced each part of the build log.

## 7. Make the pipeline fail on purpose (why the gate matters)

On a new branch, introduce a lint error (an unused variable in `server.js`) and open a PR.

- The Lint stage fails, the PR shows a red status, the merge is blocked.
- Fix it, push again, and watch the build rerun without anyone clicking anything.

Then do the same with a failing test (change an `assert.equal` in `test/logic.test.js`).

Expect: the reason for "no human clicks anything" is obvious from experience, not theory.

## 8. Add Aikido (SAST, SCA, secrets)

1. Sign in to Aikido, connect it to Bitbucket, and select this repository.
2. Let the first scan finish. With a clean project you should see few or no findings;
   that is the baseline.
3. Turn on PR comments / PR checks in Aikido's Bitbucket integration settings.
4. Optional: in Aikido → Integrations → CI/CD, generate a CI token, store it as a Jenkins
   credential named `aikido-ci-token`, and replace the placeholder in the `Security scan`
   stage of `Jenkinsfile` with the command Aikido gives you.

Expect: Aikido lists the repository and shows the dependency tree it discovered from
`package-lock.json`.

## 9. Trip every scanner type, one PR each

Do each of these on its own branch with its own PR, then **close the PR without merging**
and delete the branch. Never merge these.

**a) Secret detection.** Add a fake credential to `server.js`:
```js
const AWS_SECRET_ACCESS_KEY = 'AKIAIOSFODNN7EXAMPLEwJalrXUtnFEMI/K7MDENG/bPxRfiCY';
```
Push, open the PR, look for the Aikido comment. Then read `.env.example` and understand
why configuration belongs in the environment, not the code. Finally: even though this
secret was fake, note what you would have to do if it had been real (rotate it; removing
it from the code is not enough because git history keeps it).

**b) Vulnerable dependency (SCA).** Downgrade Express to a release with a known transitive
issue and see what happens:
```bash
npm install express@4.18.0
git commit -am "Downgrade express" && git push
```
Compare `npm audit` locally with what Aikido reports on the PR. Look at whether Aikido
marks the finding as reachable. Then upgrade back with `npm install express@5` and watch
the finding clear on the next push.

**c) Insecure code pattern (SAST).** Add a route to `server.js` that builds a response
from user input without care:
```js
app.get('/echo', (req, res) => res.send(`<h1>${req.query.msg}</h1>`));
```
Start the server and open `http://localhost:3000/echo?msg=<script>alert(1)</script>`.
Then see what Aikido (and ESLint) say about the route on the PR.

Expect: you have seen one finding of each kind land as a comment on a PR, and you have
closed all three PRs unmerged.

## 10. Tune the gate (your job as AppSec)

In Aikido, decide which findings should block a merge and which should only comment.
A reasonable starting policy: secrets and critical reachable vulnerabilities block;
everything else comments. Then mark one of the findings from exercise 9 as a false
positive or accepted risk, and note that Aikido asks for a reason: this is the exception
process from the diagram.

Expect: you can explain to your manager why you did not block on everything.

## 11. Build once, deploy the artifact (UAT)

1. Install Docker, then run `docker build -t pipeline-runner:local .` and
   `docker run -p 3000:3000 pipeline-runner:local`. The game is served from the image.
2. Read the Dockerfile and find the line that keeps dev dependencies out of the image and
   the line that stops the app running as root.
3. In `Jenkinsfile`, look at the `Build artifact` and `Deploy to UAT` stages. Notice the
   deploy stage runs only for `main`: PR branches are scanned and tested but never deployed.

Expect: you can say what an artifact is, where it is stored, and why UAT and prod must
receive the same one.

## 12. Attack the running app (DAST)

With the app running locally or in UAT, point a dynamic scanner at it (OWASP ZAP is free;
Aikido's DAST works too). Read the report. Most findings on a static game will be missing
security headers; add a header-setting library such as `helmet` via a normal PR and rerun.

Expect: a finding discovered by *attacking* the app went back through branch → PR →
Jenkins → Aikido → merge, exactly like a code finding.

---

## Where each concept lives in this project

| Concept in the diagram        | Where you touch it here                                  |
|-------------------------------|----------------------------------------------------------|
| Repository                    | The Bitbucket repo you created in exercise 3             |
| Own code                      | `src/logic.js`, `public/game.js`, `server.js`            |
| Library / dependency          | `express` in `package.json`                              |
| Transitive dependency         | Everything under it in `npm ls --all`                    |
| Lockfile                      | `package-lock.json`; `npm ci` in the Jenkinsfile         |
| Branch, PR, review, merge     | Exercises 5–7                                            |
| Branch protection             | Exercise 4                                               |
| Jenkins, Jenkinsfile, webhook | Exercise 6; the `Jenkinsfile` at the repo root           |
| SAST / SCA / secrets          | Exercise 9                                               |
| Exceptions and thresholds     | Exercise 10                                              |
| Artifact, build once          | `Dockerfile`, `Build artifact` stage, exercise 11        |
| DAST                          | Exercise 12                                              |
| Configuration, not secrets    | `.env.example` and `.gitignore`                          |
