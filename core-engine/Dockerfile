# Build Stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o core-engine ./cmd/server

# Run Stage
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/core-engine .

EXPOSE 8080

CMD ["./core-engine"]
