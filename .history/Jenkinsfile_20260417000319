pipeline {
    agent any

    environment {
        BACKEND_IMAGE = "jayv1161/todo-app-backend"
        FRONTEND_IMAGE = "jayv1161/todo-app-frontend"
        VERSION = "1.0"
        TAG = "v${VERSION}.${BUILD_NUMBER}"

        K8S_REPO = "https://github.com/jayvaja-ecosmob/k8s-todo-app.git"
    }

    stages {

        stage('Clone App Repo') {
            steps {
                git branch: 'main',
                url: 'https://github.com/jayvaja-ecosmob/todo-app.git'
            }
        }

        // -------------------------
        // SONAR (backend example)
        // -------------------------
        // stage('SonarQube Analysis') {
        //     environment {
        //         scannerHome = tool 'sonar-scanner'
        //     }
        //     steps {
        //         withSonarQubeEnv('sonarqube') {
        //             dir('backend') {
        //                 sh '''
        //                 npm install
        //                 npx sonar-scanner \
        //                 -Dsonar.projectKey=todo-backend \
        //                 -Dsonar.sources=.
        //                 '''
        //             }
        //         }
        //     }
        // }

        // stage('Quality Gate') {
        //     steps {
        //         timeout(time: 5, unit: 'MINUTES') {
        //             waitForQualityGate abortPipeline: true
        //         }
        //     }
        // }

        // -------------------------
        // BUILD IMAGES
        // -------------------------
        stage('Build Backend Image') {
            steps {
                sh """
                docker build -t ${BACKEND_IMAGE}:${TAG} ./backend
                """
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh """
                docker build -t ${FRONTEND_IMAGE}:${TAG} ./frontend
                """
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
                    sh """
                    echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                    docker push ${BACKEND_IMAGE}:${TAG}
                    docker push ${FRONTEND_IMAGE}:${TAG}
                    """
                }
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

            sh """
            rm -rf k8s-repo

            git clone https://$GIT_TOKEN@github.com/jayvaja-ecosmob/k8s-todo-app.git
            cd k8s-todo-app

            # Update backend image
            sed -i 's|image: .*backend.*|image: ${BACKEND_IMAGE}:${TAG}|g' backend-deployment.yaml


            # Update frontend image
            sed -i 's|image: .*frontend.*|image: ${FRONTEND_IMAGE}:${TAG}|g' frontend-deployment.yaml

            git config user.email "jay.vaja@ecosmob.com"
            git config user.name "jayvaja-ecosmob"

            git add .
            git commit -m "Update images to ${TAG}"
            git push origin main
            """
        }
    }
}
    }
}
