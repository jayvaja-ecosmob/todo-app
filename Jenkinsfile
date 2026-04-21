def sendGoogleChatNotification(String message) {
    withCredentials([string(credentialsId: 'gchat-webhook', variable: 'WEBHOOK_URL')]) {
    sh """
    curl -X POST -H 'Content-Type: application/json' \
    -d '{
          "text": "${message}"
        }' \
    "$WEBHOOK_URL"
    """
    }
}

pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        BACKEND_IMAGE  = "jayv1161/todo-app-backend"
        FRONTEND_IMAGE = "jayv1161/todo-app-frontend"
        VERSION        = "1.0"
        TAG            = "v${VERSION}.${BUILD_NUMBER}"
    }

    stages {

        stage('Clone App Repo') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/jayvaja-ecosmob/todo-app.git'
            }
        }

        // -------------------------
        // SONARQUBE
        // -------------------------
        stage('SonarQube Analysis') {
            environment {
                scannerHome = tool 'sonar-scanner'
            }
            steps {
                withSonarQubeEnv('sonarqube') {
                    sh """
                    ${scannerHome}/bin/sonar-scanner \
                        -Dsonar.projectKey=todo-backend \
                        -Dsonar.sources=./backend
                    """
                    sh """
                    ${scannerHome}/bin/sonar-scanner \
                        -Dsonar.projectKey=todo-frontend \
                        -Dsonar.sources=./frontend
                    """
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // -------------------------
        // BUILD IMAGES
        // -------------------------
        stage('Build Backend Image') {
            steps {
                sh "docker build -t ${BACKEND_IMAGE}:${TAG} ./backend"
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh "docker build -t ${FRONTEND_IMAGE}:${TAG} ./frontend"
            }
        }

        // -------------------------
        // PUSH IMAGES
        // -------------------------
        stage('Push Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    sh "docker push ${BACKEND_IMAGE}:${TAG}"
                    sh "docker push ${FRONTEND_IMAGE}:${TAG}"
                }
            }
        }

        // -------------------------
        // CLEANUP LOCAL IMAGES
        // -------------------------
        stage('Cleanup Local Images') {
            steps {
                sh "docker rmi ${BACKEND_IMAGE}:${TAG} || true"
                sh "docker rmi ${FRONTEND_IMAGE}:${TAG} || true"
            }
        }

        // -------------------------
        // UPDATE K8S REPO
        // -------------------------
        stage('Update K8s Repo') {
            steps {
                withCredentials([string(
                    credentialsId: 'github-token',
                    variable: 'GIT_TOKEN'
                )]) {
                    sh 'rm -rf k8s-todo-app'
                    sh 'git clone https://$GIT_TOKEN@github.com/jayvaja-ecosmob/k8s-todo-app.git'

                    dir('k8s-todo-app') {
                        sh "sed -i 's|image: .*backend.*|image: ${BACKEND_IMAGE}:${TAG}|g' backend-deployment.yaml"
                        sh "sed -i 's|image: .*frontend.*|image: ${FRONTEND_IMAGE}:${TAG}|g' frontend-deployment.yaml"
                        sh """
                        git config user.email "jay.vaja@ecosmob.com"
                        git config user.name "jayvaja-ecosmob"
                        git add .
                        git commit -m "Update images to ${TAG}" || echo "Nothing to commit"
                        git push origin main
                        """
                    }
                }
            }
        }
    }

    // -------------------------
    // POST ACTIONS
    // -------------------------
    post {
        always {
            sh 'docker logout || true'
            cleanWs()
        }

        success {
            script {
                sendGoogleChatNotification("✅ SUCCESS: Build ${env.BUILD_NUMBER} (${TAG}) completed successfully.")
            }
            echo "✅ Pipeline succeeded! Image ${TAG} deployed."
        }

        failure {
            script {
                sendGoogleChatNotification("❌ FAILURE: Build ${env.BUILD_NUMBER} failed. Check Jenkins logs.")
            }
            echo "❌ Pipeline failed for ${TAG}. Check logs above."
        }
    }
}