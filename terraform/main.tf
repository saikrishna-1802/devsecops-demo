# ⚠️  VULNERABLE TERRAFORM — FOR DEMO PURPOSES ONLY
#
# Misconfigurations Checkov will catch:
#   1. S3 bucket with public access enabled
#   2. Security group open to the entire internet (0.0.0.0/0)
#   3. RDS database not encrypted
#   4. No MFA delete on S3
#   5. Hardcoded credentials in resource definition

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

# ─────────────────────────────────────────────────────────
# 🔴 VULNERABILITY 1: S3 bucket open to the public
# Checkov rule: CKV_AWS_20 — S3 Bucket has an ACL defined which allows public access
# ─────────────────────────────────────────────────────────
resource "aws_s3_bucket" "task_files" {
  bucket = "devsecops-demo-task-files"
  acl    = "public-read"   # 🔴 Anyone on the internet can read this bucket

  tags = {
    Name        = "Task Files"
    Environment = "demo"
  }
}

# ─────────────────────────────────────────────────────────
# 🔴 VULNERABILITY 2: Security group open to the entire internet
# Checkov rule: CKV_AWS_24 — Security groups should not allow unrestricted access
# ─────────────────────────────────────────────────────────
resource "aws_security_group" "app_sg" {
  name        = "app-security-group"
  description = "Security group for the demo app"

  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # 🔴 ALL ports open to the entire internet
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # 🔴 SSH open to the world
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ─────────────────────────────────────────────────────────
# 🔴 VULNERABILITY 3: RDS database with no encryption
# Checkov rule: CKV_AWS_17 — Ensure all data stored in the RDS is securely encrypted
# ─────────────────────────────────────────────────────────
resource "aws_db_instance" "task_db" {
  identifier        = "taskmanager-db"
  engine            = "mysql"
  engine_version    = "8.0"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  db_name           = "tasks"

  username = "admin"
  password = "Admin123!"   # 🔴 Hardcoded password in infrastructure code

  storage_encrypted       = false  # 🔴 Database not encrypted at rest
  publicly_accessible     = true   # 🔴 Database reachable from the internet
  deletion_protection     = false
  backup_retention_period = 0      # 🔴 No backups configured

  skip_final_snapshot = true
}
