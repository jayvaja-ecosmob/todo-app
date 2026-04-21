# TODO App — Full Stack (React + Node.js + MySQL)

## Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18 + Vite + nginx           |
| Backend   | Node.js 20 + Express + mysql2     |
| Database  | MySQL 8.0                         |
| Container | Docker (multi-stage builds)       |
| Orchestration | Kubernetes + nginx Ingress    |

## Project Structure

```
todo-app/
├── frontend/
│   ├── src/
│   │   ├── main.jsx       # React entry
│   │   ├── App.jsx        # Main component
│   │   ├── App.css        # Component styles
│   │   ├── index.css      # Global styles + CSS vars
│   │   └── api.js         # API fetch helper
│   ├── nginx.conf         # nginx config with /api proxy
│   ├── vite.config.js     # Vite + dev proxy
│   ├── index.html
│   └── Dockerfile         # Multi-stage: build → nginx
├── backend/
│   ├── src/
│   │   ├── index.js       # Express app entry
│   │   ├── db.js          # MySQL pool + table init
│   │   └── routes/
│   │       └── tasks.js   # CRUD routes
│   ├── .env.example
│   └── Dockerfile
├── k8s/
│   ├── namespace.yaml
│   ├── secret.yaml
│   ├── configmap.yaml
│   ├── mysql-statefulset.yaml
│   ├── mysql-service.yaml
│   ├── mysql-pvc.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── backend-hpa.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── frontend-hpa.yaml
│   └── ingress.yaml
└── docker-compose.yml
```

---

## Local Development (Docker Compose)

```bash
# Clone and enter the project
cd todo-app

# Start all services
docker compose up --build

# App available at:
#   http://localhost       → frontend
#   http://localhost:3000  → backend API
#   http://localhost:3306  → MySQL (external)

# Stop and remove volumes
docker compose down -v
```

---

## API Endpoints

| Method | Path               | Description                    |
|--------|--------------------|--------------------------------|
| GET    | /api/tasks         | List all tasks                 |
| GET    | /api/tasks?filter= | Filter: all / active / done / high |
| POST   | /api/tasks         | Create task `{ text, priority }` |
| PUT    | /api/tasks/:id     | Update `{ text?, done?, priority? }` |
| DELETE | /api/tasks/:id     | Delete one task                |
| DELETE | /api/tasks         | Delete all completed tasks     |
| GET    | /health            | Health check                   |

---

## Docker — Build & Push Images

```bash
# Backend
docker build -t your-registry/todo-backend:latest ./backend
docker push your-registry/todo-backend:latest

# Frontend
docker build -t your-registry/todo-frontend:latest ./frontend
docker push your-registry/todo-frontend:latest
```

Replace `your-registry` with your Docker Hub username or private registry URL.

---

## Kubernetes — Deploy

### Prerequisites
- `kubectl` configured and pointing at your cluster
- nginx Ingress controller installed
- Container images pushed to a registry

### 1. Update image references
Edit `k8s/backend-deployment.yaml` and `k8s/frontend-deployment.yaml`:
```yaml
image: your-registry/todo-backend:latest
image: your-registry/todo-frontend:latest
```

### 2. Update domain
Edit `k8s/ingress.yaml`:
```yaml
host: todo.example.com   # ← your real domain
```

### 3. Apply all manifests (order matters)

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/mysql-statefulset.yaml

# Wait for MySQL to be ready
kubectl rollout status statefulset/mysql -n todo-app

kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

Or apply everything at once:
```bash
kubectl apply -f k8s/
```

### 4. Verify

```bash
# Check all pods are Running
kubectl get pods -n todo-app

# Check services
kubectl get svc -n todo-app

# Check ingress
kubectl get ingress -n todo-app

# Tail backend logs
kubectl logs -f deployment/todo-backend -n todo-app

# Tail frontend logs
kubectl logs -f deployment/todo-frontend -n todo-app
```

### 5. Teardown

```bash
kubectl delete namespace todo-app
```

---

## Kubernetes — Autoscaling

HPA is configured for:
- **Backend**: 2–8 replicas, scales at 70% CPU
- **Frontend**: 2–6 replicas, scales at 70% CPU
- **MySQL**: 1 replica (StatefulSet, single primary)

Check HPA status:
```bash
kubectl get hpa -n todo-app
```

---

## Environment Variables

### Backend

| Variable     | Default       | Description           |
|--------------|---------------|-----------------------|
| PORT         | 3000          | Express listen port   |
| DB_HOST      | localhost     | MySQL host            |
| DB_PORT      | 3306          | MySQL port            |
| DB_USER      | todo_user     | MySQL username        |
| DB_PASSWORD  | todo_pass     | MySQL password        |
| DB_NAME      | todo_db       | MySQL database name   |
| CORS_ORIGIN  | *             | Allowed CORS origin   |

---

## Production Checklist

- [ ] Replace default passwords in `k8s/secret.yaml`
- [ ] Replace `your-registry` in deployment YAMLs
- [ ] Replace `todo.example.com` in `ingress.yaml`
- [ ] Add TLS cert (cert-manager + Let's Encrypt)
- [ ] Set `CORS_ORIGIN` to your actual frontend domain
- [ ] Review resource requests/limits for your cluster size
- [ ] Set up MySQL backups (CronJob or managed DB)