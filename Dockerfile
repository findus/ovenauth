FROM rust as builder

WORKDIR ./ovenauth
COPY ./Cargo.toml ./Cargo.toml
COPY ./migrations ./migrations
COPY ./Cargo.lock ./Cargo.lock
COPY ./sqlx-data.json ./sqlx-data.json
COPY ./src ./src
RUN cargo build --release
RUN rm src/*.rs

FROM debian:buster-slim

RUN apt-get update && apt-get install -y libssl-dev && apt-get install -y ca-certificates
COPY --from=builder /ovenauth/target/release/ovenauth ./ovenauth
COPY ./private_key.pem ./private_key.pem
CMD ["./ovenauth"]