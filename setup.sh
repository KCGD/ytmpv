#!/bin/sh

echo "Starting setup"

#get architecture
architecture=$(uname -m)
if [ "$architecture" = "x86_64" ]; then
    ARCH="x64"
elif [ "$architecture" = "aarch64" ]; then
    ARCH="arm64"
else
    echo "Unsupported architecture: $architecture"
    exit 1
fi

#node definitions
NODEVER="18.5.0"
NODE="v$NODEVER-linux-$ARCH"
NODEURL="https://nodejs.org/dist/v$NODEVER/node-$NODE.tar.xz"
YARN="1.22.19"
YARNURL="https://yarnpkg.com/downloads/$YARN/yarn-v$YARN.tar.gz"

#paths
TMP="/tmp/nodesetup"
BIN="$(pwd)/.bin"

#remove old
echo "Remove old bin files (if any)"
rm -rf "$BIN" || true
rm -rf "./node_modules" || true

#create paths
mkdir "$TMP"
mkdir "$BIN"
mkdir "$BIN/bin"

#get files
echo "Downloading nodejs $NODE"
curl -O --output-dir "$TMP" "$NODEURL" -L
echo "Downloading yarn v$YARN"
curl -O --output-dir "$TMP" "$YARNURL" -L

#extract files
echo "Extracting files"
tar -xJf "$TMP/$(basename "$NODEURL")" -C "$BIN"
tar -xzf "$TMP/$(basename "$YARNURL")" -C "$BIN"

#linking
echo "Linking node"
ln -s "$BIN/node-$NODE/bin/node" "$BIN/bin/node"
echo "Linking yarn"
ln -s "$BIN/yarn-v$YARN/bin/yarn" "$BIN/bin/yarn"

#cleanup
echo "Cleaning up temporaries"
rm -r "$TMP"

#applying changes to path
echo "Apply changes to PATH"
. ./.env

#yarn test
echo "Install dependencies"
yarn install

#gyp rebuild
echo "Running node-pty rebuild"
yarn run gyp-rebuild > /dev/null 2>&1

#build program (if given flag)
if [[ $* == *--build* ]]; then
    echo "Running initial build"
    yarn run build
fi

#clean program (if given flag)
if [[ $* == *--clean* ]]; then
    echo "Cleaning build"
    yarn run clean
fi

echo "Done"