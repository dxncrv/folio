# PocketBase Production Dockerfile
# Railway will use this for the 'pb-folio' service

FROM alpine:latest

ARG PB_VERSION=0.35.1

RUN apk add --no-cache \
    unzip \
    ca-certificates

# Download and install PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/ && rm /tmp/pb.zip

# Copy migrations (these define your schema)
COPY pb_migrations/ /pb/pb_migrations/

# Copy hooks (server-side logic)
COPY pb_hooks/ /pb/pb_hooks/

# Create data directory (Railway volume should mount here)
RUN mkdir -p /pb/pb_data

EXPOSE 8080

# Serve on 0.0.0.0:8080
# Railway will provide the public domain; internal access via pb.railway.internal:8080
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080"]
