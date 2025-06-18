resource "aws_dynamodb_table" "example" {
  name             = "MessageMural"
  hash_key         = "id"
  billing_mode     = "PAY_PER_REQUEST"

  attribute {
    name = "id"
    type = "S"
  }
}
