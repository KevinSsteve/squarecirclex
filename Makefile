.PHONY: help install build deploy validate test clean logs local-api

# Default target
help:
	@echo "Experta AI Social Media Manager - Make Commands"
	@echo ""
	@echo "Available commands:"
	@echo "  make install       - Install all dependencies"
	@echo "  make validate      - Validate SAM template"
	@echo "  make build         - Build SAM project"
	@echo "  make deploy        - Deploy to AWS (dev environment)"
	@echo "  make deploy-prod   - Deploy to production"
	@echo "  make test          - Run all tests"
	@echo "  make test-node     - Run Node.js tests"
	@echo "  make test-python   - Run Python tests"
	@echo "  make local-api     - Start API Gateway locally"
	@echo "  make logs          - Tail CloudWatch logs"
	@echo "  make verify        - Verify infrastructure deployment"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make delete        - Delete CloudFormation stack"
	@echo ""

# Install dependencies
install:
	@echo "Installing Node.js dependencies..."
	cd lib/nodejs && npm install
	@echo "Installing Python dependencies..."
	cd lib/python && pip install -r requirements.txt
	@echo "Dependencies installed successfully!"

# Validate SAM template
validate:
	@echo "Validating SAM template..."
	sam validate
	@echo "Template is valid!"

# Build SAM project
build:
	@echo "Building SAM project..."
	sam build
	@echo "Build complete!"

# Deploy to dev environment
deploy: build
	@echo "Deploying to dev environment..."
	sam deploy --parameter-overrides Environment=dev

# Deploy to staging environment
deploy-staging: build
	@echo "Deploying to staging environment..."
	sam deploy --parameter-overrides Environment=staging

# Deploy to production environment
deploy-prod: build
	@echo "Deploying to production environment..."
	@read -p "Are you sure you want to deploy to PRODUCTION? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		sam deploy --parameter-overrides Environment=prod; \
	else \
		echo "Deployment cancelled."; \
	fi

# Run all tests
test: test-node test-python

# Run Node.js tests
test-node:
	@echo "Running Node.js tests..."
	cd lib/nodejs && npm test

# Run Python tests
test-python:
	@echo "Running Python tests..."
	cd lib/python && pytest

# Start API Gateway locally
local-api:
	@echo "Starting API Gateway locally..."
	sam local start-api

# Tail CloudWatch logs
logs:
	@echo "Tailing CloudWatch logs..."
	sam logs --stack-name experta-ai-social-manager --tail

# Verify infrastructure
verify:
	@echo "Verifying infrastructure..."
	bash scripts/validate-infrastructure.sh

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf .aws-sam
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	@echo "Clean complete!"

# Delete CloudFormation stack
delete:
	@read -p "Are you sure you want to DELETE the stack? This will remove all resources! [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		sam delete; \
	else \
		echo "Deletion cancelled."; \
	fi

# Quick deploy (build + deploy)
quick-deploy: build deploy

# Full setup (install + build + deploy)
setup: install build deploy verify
	@echo ""
	@echo "Setup complete! Infrastructure is ready."
	@echo "Next steps:"
	@echo "1. Enable Bedrock model access"
	@echo "2. Subscribe to SNS failure notifications"
	@echo "3. Implement Lambda functions (Task 2+)"
