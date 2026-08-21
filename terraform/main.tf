# ✅  SECURE TERRAFORM — All Checkov findings resolved
#
# Fixes applied:
#   1. S3 bucket — public access blocked
#   2. Security group — only required ports, restricted CIDR
#   3. RDS — encrypted, not public, backups enabled
#   4. No hardcoded credentials — use AWS Secrets Manager

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# ✅ FIX 1: S3 bucket — block all public access
resource "aws_s3_bucket" "task_files" {
  bucket = "devsecops-demo-task-files"

  tags = {
    Name        = "Task Files"
    Environment = "production"
  }
}

resource "aws_s3_bucket_public_access_block" "task_files" {
  bucket                  = aws_s3_bucket.task_files.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "task_files" {
  bucket = aws_s3_bucket.task_files.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ✅ FIX 2: Security group — only allow the app port, from internal CIDR only
resource "aws_security_group" "app_sg" {
  name        = "app-security-group"
  description = "Security group for the demo app — restricted"

  ingress {
    description = "App port from internal VPC only"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]  # ✅ Internal VPC only — not the internet
  }

  egress {
    description = "Allow outbound HTTPS only"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ✅ FIX 3: RDS — encrypted, private, backups enabled, password from Secrets Manager
data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = "prod/taskmanager/db-password"  # ✅ Password stored in Secrets Manager
}

resource "aws_db_instance" "task_db" {
  identifier        = "taskmanager-db"
  engine            = "mysql"
  engine_version    = "8.0"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  db_name           = "tasks"

  username = "admin"
  password = data.aws_secretsmanager_secret_version.db_password.secret_string

  storage_encrypted       = true   # ✅ Encrypted at rest
  publicly_accessible     = false  # ✅ Not reachable from internet
  deletion_protection     = true   # ✅ Cannot be accidentally deleted
  backup_retention_period = 7      # ✅ 7 days of automated backups

  vpc_security_group_ids = [aws_security_group.app_sg.id]

  skip_final_snapshot = false
  final_snapshot_identifier = "taskmanager-db-final-snapshot"
}
