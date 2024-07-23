pkgname=ytmpv
pkgver=1.0.1
pkgrel=0
pkgdesc="ytmpv - mpv for youtube"
arch=('x86_64' 'arm64' 'aarch64')
license=('GPLv2')
depends=('ffmpeg' 'mpv' 'yt-dlp')
options=(!strip)
makedepends=('curl' 'unzip' 'tar' 'gcc' 'python')

build() {
    cd ..
	./setup.sh --build --clean
}

package() {
    cd ..
    mkdir -pv "$pkgdir/usr/local/bin/"
	cp -v ./Build/ytmpv "$pkgdir/usr/local/bin/ytmpv"
}
