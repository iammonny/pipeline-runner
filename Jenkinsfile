// Jenkins reads this file from the repo on every pull request and runs the stages in order.
// This is the "3. Jenkins pipeline" box in the SSDLC diagram. Compare each stage to the diagram.
pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    CI = 'true'
  }

  stages {

    stage('Install dependencies') {
      steps {
        // `npm ci` installs exactly what package-lock.json says and fails if the lockfile
        // and package.json disagree. Never use plain `npm install` in CI.
        sh 'node --version'
        sh 'npm ci'
      }
    }

    stage('Lint') {
      steps {
        sh 'npm run lint'
      }
    }

    stage('Unit tests') {
      steps {
        sh 'npm test'
      }
    }

    stage('Security scan') {
      steps {
        // Two layers: npm's own advisory database as a fast baseline...
        sh 'npm audit --audit-level=high'
        // ...and Aikido as the real gate. Aikido already scans every push through the
        // Bitbucket app; this stage lets the build itself fail on policy.
        // Get the exact command for your account from Aikido -> Integrations -> CI/CD,
        // store the token as a Jenkins credential, and reference it like this:
        //
        // withCredentials([string(credentialsId: 'aikido-ci-token', variable: 'AIKIDO_TOKEN')]) {
        //   sh '<aikido CI scan command from the Aikido docs>'
        // }
        echo 'Aikido CI gate: plug in the command from your Aikido workspace here.'
      }
    }

    stage('Build artifact') {
      steps {
        // Build once. The same artifact is deployed to UAT and later promoted to prod.
        sh 'npm pack'
        archiveArtifacts artifacts: '*.tgz', fingerprint: true
        // With Docker available on the agent you would build and push an image instead:
        // sh "docker build -t pipeline-runner:${env.GIT_COMMIT} ."
      }
    }

    stage('Deploy to UAT') {
      when { branch 'main' }   // only merged code goes to UAT, never a PR branch
      steps {
        echo 'Deploy the stored artifact to UAT here (e.g. docker run, scp, or a deploy script).'
      }
    }
  }

  post {
    failure {
      echo 'Build failed. The PR is blocked until this is green.'
    }
  }
}
