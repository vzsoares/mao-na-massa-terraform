# AWS Region
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

# Environment
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# Lambda function name
variable "lambda_function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "message-mural-lambda"
}

# DynamoDB table name
variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  type        = string
  default     = "MessageMural"
}

# API Gateway name
variable "api_gateway_name" {
  description = "Name of the API Gateway"
  type        = string
  default     = "message-mural-api"
}

