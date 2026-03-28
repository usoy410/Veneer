# Maintainer: usoy alfortearjay0@gmail.com
pkgname=veneer
pkgver=0.1.0
pkgrel=1
pkgdesc="A premium widget manager for Eww (Veneer)"
arch=('x86_64')
url="https://github.com/usoy/Widget_Manager"
license=('MIT')
depends=('webkit2gtk-4.1' 'gtk3' 'libayatana-appindicator')
makedepends=('cargo' 'npm' 'git')
source=("veneer::git+file://$PWD")
md5sums=('SKIP')

build() {
  cd "$srcdir/veneer"
  npm install
  npm run tauri build -- --no-bundle
}

package() {
  cd "$srcdir/veneer"
  
  # Binary
  install -Dm755 "src-tauri/target/release/veneer" "$pkgdir/usr/bin/veneer"
  
  # Desktop Entry
  install -Dm644 "veneer.desktop" "$pkgdir/usr/share/applications/veneer.desktop"
  
  # Icons
  install -Dm644 "src-tauri/icons/128x128.png" "$pkgdir/usr/share/icons/hicolor/128x128/apps/veneer.png"
  install -Dm644 "src-tauri/icons/32x32.png" "$pkgdir/usr/share/icons/hicolor/32x32/apps/veneer.png"
  install -Dm644 "src-tauri/icons/icon.png" "$pkgdir/usr/share/icons/hicolor/256x256/apps/veneer.png"
}
