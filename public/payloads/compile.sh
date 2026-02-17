#!/bin/bash

# KONFIGURASI NDK (Sesuaikan dengan path yang ditemukan)
export NDK_HOME=$HOME/Android/Sdk/ndk/29.0.14206865
export TOOLCHAIN=$NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64
export TARGET=aarch64-linux-android30  # Target Android 11 (API 30)
export CC=$TOOLCHAIN/bin/$TARGET-clang
export CXX=$TOOLCHAIN/bin/$TARGET-clang++

# Pastikan toolchain ada
if [ ! -f "$CC" ]; then
    echo "[-] Toolchain clang tidak ditemukan di: $CC"
    echo "[-] Cek versi NDK Anda!"
    exit 1
fi

echo "[+] Menggunakan NDK: $NDK_HOME"
echo "[+] Compiler: $CC"

# Build Shared Library (.so) untuk Termux
echo "[*] Compiling agent.go -> libmalxgmn.so..."

CGO_ENABLED=1 \
GOOS=android \
GOARCH=arm64 \
CC=$CC \
CXX=$CXX \
go build -buildmode=c-shared -o libmalxgmn.so agent.go

if [ $? -eq 0 ]; then
    echo "[✔] BERHASIL! Output: libmalxgmn.so"
    file libmalxgmn.so
else
    echo "[-] GAGAL COMPILING!"
fi
