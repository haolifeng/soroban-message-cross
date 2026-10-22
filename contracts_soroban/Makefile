default: build

all: test

test: build
	cargo test

build:
	soroban contract build
	@ls -l target/wasm32-unknown-unknown/release/*.wasm
	@cp target/wasm32-unknown-unknown/release/*.wasm  ../soroban_dev/d_script/

fmt:
	cargo fmt --all

clean:
	cargo clean
