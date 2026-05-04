pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    COMPOSE_PROJECT_NAME = 'dvfu_ege'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Backend checks') {
      steps {
        sh 'docker compose -f docker-compose.yml build backend'
        sh 'docker compose -f docker-compose.yml run --rm backend python manage.py check'
      }
    }

    stage('Frontend build') {
      steps {
        sh 'docker compose -f docker-compose.yml build frontend'
        sh 'docker compose -f docker-compose.yml run --rm frontend npm run build'
      }
    }

    stage('Build production images') {
      steps {
        sh 'docker compose -f docker-compose.prod.yml build'
      }
    }

    stage('Deploy production') {
      when {
        anyOf {
          branch 'auth'
          branch 'main'
          branch 'master'
        }
      }
      steps {
        sh 'test -f .env || cp .env.example .env'
        sh 'docker compose -f docker-compose.prod.yml up -d --build'
      }
    }
  }

  post {
    always {
      sh 'docker compose -f docker-compose.yml down -v --remove-orphans || true'
      sh 'docker image prune -f || true'
    }
  }
}
