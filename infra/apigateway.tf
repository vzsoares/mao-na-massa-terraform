# API Gateway HTTP API
resource "aws_apigatewayv2_api" "message_mural_api" {
  name          = "message-mural-api"
  description   = "Message Mural API Gateway"
  protocol_type = "HTTP"

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token", "x-amz-user-agent"]
    allow_methods     = ["*"]
    allow_origins     = ["*"]
    expose_headers    = ["date", "keep-alive"]
    max_age           = 86400
  }
}

# Lambda Integration
resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id = aws_apigatewayv2_api.message_mural_api.id

  integration_uri    = aws_lambda_function.test_lambda.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

# GET Route for /api/messages
resource "aws_apigatewayv2_route" "get_messages" {
  api_id = aws_apigatewayv2_api.message_mural_api.id

  route_key = "GET /api/messages"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# POST Route for /api/messages
resource "aws_apigatewayv2_route" "post_messages" {
  api_id = aws_apigatewayv2_api.message_mural_api.id

  route_key = "POST /api/messages"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# OPTIONS Route for CORS preflight
resource "aws_apigatewayv2_route" "options_messages" {
  api_id = aws_apigatewayv2_api.message_mural_api.id

  route_key = "OPTIONS /api/messages"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "default" {
  api_id = aws_apigatewayv2_api.message_mural_api.id

  name        = "default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn

    format = jsonencode({
      requestId               = "$context.requestId"
      sourceIp                = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      protocol                = "$context.protocol"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
    })
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gw" {
  name = "/aws/api_gw/${aws_apigatewayv2_api.message_mural_api.name}"

  retention_in_days = 14
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.test_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.message_mural_api.execution_arn}/*/*"
}

# Output the API Gateway URL
output "api_gateway_url" {
  description = "Base URL for API Gateway stage"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "get_messages_endpoint" {
  description = "GET endpoint for retrieving messages"
  value       = "${aws_apigatewayv2_stage.default.invoke_url}/api/messages"
}

output "post_messages_endpoint" {
  description = "POST endpoint for creating messages"
  value       = "${aws_apigatewayv2_stage.default.invoke_url}/api/messages"
}
