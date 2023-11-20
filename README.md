# YTMPV
ytmpv is a combination of two programs (a web browser extension and a backend process) that plays youtube videos in mpv instead of the youtube website.

YTMPV is being developed for and tested on Windows and Linux with Google Chrome and Firefox. Other browsers and operating systems may also work, but I haven't tested them and cant guarantee their functionality.
# Installing ytmpv
## The browser extension
YTMPV works on both chrome and firefox. You can install the extension from the Chrome web store or the Mozilla addons website.

Chrome webstore page: pending

Mozilla addons page: https://addons.mozilla.org/en-US/firefox/addon/ytmpv/

You can also install the extension from the releases page (look for `ytmpv-[your browser].zip`).

Additionally, you can install the extension directly from the source code by navigating to `extension/[your browser]` and zipping the directory.
## The backend
The ytmpv backend is a program that communicates with the browser extension and handles playing the video on your computer. You can find the backend in the releases page under `ytmpv-[your os]`.
### Dependencies

For the backend to work, `yt-dlp` and `mpv` must both be installed and accessible from the command line (in the PATH variable). For now, these are up to you to install, but I might find a way to bundle them with the backend executable in the future.
### Note for windows users
Upon running the backend for the first time, windows will prompt you to allow it network access. Please allow it, as the backend uses the network to communicate with the browser extension and with youtube directly.
# Building from source
The development environment for the backend is targeted towards Linux / POSIX systems, and uses tools that are expected to be present in this environment. If you're on windows you can achieve this with WSL.

To set up the development environment, run `sh setup.sh`. This will automatically download and set up the required tools to build ytmpv. After this has completed, run `yarn build` to build the backend. This will generate executables for Windows, Linux and macos (untested).

To automate the setup and build process, run `sh setup.sh --clean --build`. This should automatically download the necessary build dependencies and tools, build the executables and clean up the project afterwards.
# License
YTMPV is published under the GNU General Public License (GPL) v2. TL;DR: Feel free to create open source derivatives for non-commercial use.