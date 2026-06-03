FROM ghcr.io/cirruslabs/flutter:stable AS builder
WORKDIR /app
COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get
COPY . .
RUN flutter build apk --release \
    --dart-define=API_URL=${API_URL:-http://10.0.2.2:8080} \
    --dart-define=TENANT_ID=${TENANT_ID:-tenant-001}

FROM scratch AS export
COPY --from=builder /app/build/app/outputs/flutter-apk/app-release.apk \
     /output/umkm-finance.apk
