"""Vendor the pinned Scratch standalone editor and its source offer.

Run: python scripts/vendor-scratch-editor.py [--archive /path/to/downloaded.tgz]
No npm installation or application React-version changes are required.
SPDX-License-Identifier: AGPL-3.0-or-later
"""

import argparse
import base64
import hashlib
import io
from pathlib import Path
import re
import shutil
import tarfile
import urllib.request
import zipfile

VERSION = "15.2.0"
COMMIT = "970132883d63286762783448d4d487dcefedabf8"
ARCHIVE_URL = f"https://registry.npmjs.org/@scratch/scratch-gui/-/scratch-gui-{VERSION}.tgz"
INTEGRITY = "ZjKknkK6Suh0qtfCgaKNUt2Ilz/j6pWdTn6+Brrb2NLn8iXviccLfiSezAFvXqFqWaOMjac0sMfe8JpKkkOPTg=="
OUTPUT = Path(__file__).resolve().parents[1] / "artifacts/mind-matters/public/coding-editor/vendor"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path)
    args = parser.parse_args()
    raw = args.archive.read_bytes() if args.archive else urllib.request.urlopen(ARCHIVE_URL).read()
    assert base64.b64encode(hashlib.sha512(raw).digest()).decode() == INTEGRITY, "Archive integrity mismatch"
    OUTPUT.mkdir(parents=True, exist_ok=True)
    runtime_files = 0
    with tarfile.open(fileobj=io.BytesIO(raw), mode="r:gz") as archive:
        with zipfile.ZipFile(OUTPUT / "source.zip", "w", compression=zipfile.ZIP_DEFLATED) as source:
            for item in archive:
                if not item.isfile():
                    continue
                relative = Path(item.name).relative_to("package")
                if ".." in relative.parts:
                    raise ValueError("Unsafe archive path")
                runtime = (
                    relative.as_posix().startswith(("dist/static/", "dist/chunks/", "dist/libraries/"))
                    or relative.as_posix() in (
                        "dist/scratch-gui-standalone.js",
                        "dist/scratch-gui-standalone.js.LICENSE.txt",
                        "dist/extension-worker.js",
                        "dist/extension-worker.js.LICENSE.txt",
                    )
                ) and not relative.name.endswith(".map")
                license_file = relative.as_posix() in ("LICENSE", "TRADEMARK")
                if runtime or license_file:
                    destination = OUTPUT / (relative.relative_to("dist") if runtime else relative)
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    with archive.extractfile(item) as data, destination.open("wb") as output:
                        if relative.as_posix() == "dist/scratch-gui-standalone.js":
                            # npm's standalone build hardcodes "/" for its own
                            # assets and its nested scratch-fetch worker bundle.
                            # Adapt only these two runtime paths, not editor code.
                            script, count = re.subn(
                                r'([A-Za-z_$][\w$]*\.p)="/"',
                                r'\1=globalThis.__MIND_MATTERS_SCRATCH_ASSET_BASE__',
                                data.read().decode("utf-8"),
                            )
                            assert count == 2, f"Unexpected public-path layout: {count}"
                            output.write(script.encode("utf-8"))
                        else:
                            shutil.copyfileobj(data, output)
                    runtime_files += 1
                if (
                    relative.parts[0] == "src"
                    or relative.as_posix() in (
                        "LICENSE", "TRADEMARK", "package.json", "README.md",
                        "dist/scratch-gui-standalone.js.map", "dist/extension-worker.js.map",
                    )
                ):
                    source.writestr(relative.as_posix(), archive.extractfile(item).read())
            # Preserve the exact upstream build configuration and dependency lock.
            for filename in (
                "package.json", "package-lock.json", ".npmrc",
                "packages/scratch-gui/webpack.config.js",
                "packages/scratch-gui/babel.config.js",
            ):
                url = f"https://raw.githubusercontent.com/scratchfoundation/scratch-editor/{COMMIT}/{filename}"
                try:
                    contents = urllib.request.urlopen(url).read()
                except urllib.error.HTTPError as error:
                    if error.code == 404:
                        continue
                    raise
                source.writestr(f"upstream-build/{filename}", contents)
            source.writestr("BUILD-SOURCE.txt", (
                f"Scratch GUI {VERSION}, npm distribution with local asset-path adaptation.\n"
                f"Upstream commit: {COMMIT}\n"
                "Complete upstream monorepo, build tools, and original assets:\n"
                f"https://github.com/scratchfoundation/scratch-editor/tree/{COMMIT}\n"
                f"https://codeload.github.com/scratchfoundation/scratch-editor/tar.gz/{COMMIT}\n"
                "Bundled dependency sources are also preserved in the included source maps.\n"
                "See upstream README/package scripts for rebuilding the standalone UMD target.\n"
                "The hosting integration is provided as ../editor.js and ../index.html.\n"
            ))
            source.writestr("integration/vendor-scratch-editor.py", Path(__file__).read_bytes())
    print(f"Vendored Scratch GUI {VERSION}: {runtime_files} runtime/license files; source.zip available.")


if __name__ == "__main__":
    main()
