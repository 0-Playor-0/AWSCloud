# Used by `sam build` (BuildMethod: makefile). Packages engine/ + backend/ and pins
# Linux x86_64 / CPython 3.14 wheels so the build is the same on macOS, Linux or WSL.
PYTHON ?= python3

build-ApiFunction:
	mkdir -p "$(ARTIFACTS_DIR)"
	cp -R engine backend "$(ARTIFACTS_DIR)/"
	$(PYTHON) -m pip install --quiet --no-compile -r backend/requirements.txt \
		--target "$(ARTIFACTS_DIR)" --platform manylinux2014_x86_64 \
		--implementation cp --python-version 3.14 --only-binary=:all: --upgrade
	find "$(ARTIFACTS_DIR)" -name "__pycache__" -type d -prune -exec rm -rf {} +
