# Maintainer: usoy alfortearjay0@gmail.com
pkgname=veneer
pkgver=0.1.0
pkgrel=1
pkgdesc="A widget manager for Eww (Veneer)"
arch=('x86_64')
url="https://github.com/usoy410/Veneer"
license=('MIT')

# Added openssl and zstd to runtime depends just in case
depends=('webkit2gtk-4.1' 'gtk3' 'libayatana-appindicator' 'openssl' 'zstd')

# CRITICAL: Added zstd, openssl, and pkgconf to makedepends
makedepends=('cargo' 'npm' 'git' 'zstd' 'openssl' 'pkgconf')

source=("veneer::git+https://github.com/usoy410/Veneer.git")
md5sums=('SKIP')

build() {
  cd "$srcdir/veneer"
  
  # 1. Ensure the Node dependencies are fresh
  npm install
  
  # 2. FORCE the zstd-sys crate to build from source instead of linking 
  # to the incompatible Arch system library.
  export ZSTD_SYS_USE_PKG_CONFIG=0
  
  # 3. Build the binary (no-bundle since we are packaging manually in package())
  npm run tauri build -- --no-bundle
}

package() {
  cd "$srcdir/veneer"

  # Binary
  install -Dm755 "src-tauri/target/release/veneer" "$pkgdir/usr/bin/veneer"

  # Desktop Entry (Ensure this file exists in your repo root!)
  if [ -f "veneer.desktop" ]; then
    install -Dm644 "veneer.desktop" "$pkgdir/usr/share/applications/veneer.desktop"
  fi

  # Icons - using -p to ensure directory structure
  install -Dm644 "src-tauri/icons/128x128.png" "$pkgdir/usr/share/icons/hicolor/128x128/apps/veneer.png"
  install -Dm644 "src-tauri/icons/32x32.png" "$pkgdir/usr/share/icons/hicolor/32x32/apps/veneer.png"
  install -Dm644 "src-tauri/icons/icon.png" "$pkgdir/usr/share/icons/hicolor/256x256/apps/veneer.png"
}
