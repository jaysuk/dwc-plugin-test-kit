# Testing against real firmware instead of the mock

`mock-duet/server.mjs` is a static REST server: `rr_gcode` just records the string you sent and
`rr_model` always returns whatever canned model you configured — it can prove a plugin sent the
right command, never that the command actually did anything. For most component/route-level
assertions that's the right tradeoff (fast, hermetic, no external dependency). For anything that
actually depends on RRF's real behaviour — object-model semantics, HTTP quirks, "does this G-code
genuinely change machine state" — swap the backend for
[meeloo/duet3-emulation](https://github.com/meeloo/duet3-emulation): Renode running an **actual
RepRapFirmware build**, not a test double. Same `rr_connect`/`rr_model`/`rr_gcode`/`rr_reply`
surface, so `emulated-smoke.spec.ts` differs from `smoke.spec.ts` only in how it verifies things (real
object-model reads via `request`, since there's no `/__sent` on real firmware) — not in how it talks
to the board.

**This is a heavier, opt-in tier.** It requires building firmware from source (ARM toolchain +
6 sibling repos + Renode), not `npm install`. Treat it the way this template's own README treats the
browser layer generally: scaffolding to turn on once stable for your setup, not something to wire
into every CI run.

## Bring-up (verified working on WSL2 Ubuntu 26.04, x86_64 — the emulator's own README only claims
## macOS/Apple Silicon, but this Linux path needs none of its Lima-VM detour, which exists purely to
## work around macOS having no native TAP device)

```bash
# Toolchain + Renode (portable build with bundled .NET -- no system dotnet dependency)
sudo apt-get install -y gcc-arm-none-eabi
curl -sL -o renode.tar.gz https://github.com/renode/renode/releases/download/v1.16.1/renode-1.16.1.linux-portable-dotnet.tar.gz
mkdir -p ~/renode && tar -xzf renode.tar.gz -C ~/renode --strip-components=1

# Sibling repos, side by side. The emulator's own README omits two things it actually needs:
# CoreN2G/CANlib/FreeRTOS default to their 3.6-dev branch, but this fork's Makefile needs 3.7-dev;
# and WiFiSocketServerRTOS (for MessageFormats.h) isn't mentioned in its clone list at all, but the
# board's Pins_Duet3_MB6HC.h sets HAS_WIFI_NETWORKING=1, so RepRapFirmware won't link without it.
mkdir -p ~/dev/duet3 && cd ~/dev/duet3
git clone --depth 1 -b feature/velocity-jog https://github.com/meeloo/RepRapFirmware.git
git clone --depth 1 -b feature/host-test-portability https://github.com/meeloo/RRFLibraries.git
git clone --depth 1 -b 3.7-dev https://github.com/Duet3D/CoreN2G.git
git clone --depth 1 -b 3.7-dev https://github.com/Duet3D/CANlib.git
git clone --depth 1 -b 3.7-dev https://github.com/Duet3D/FreeRTOS.git
git clone --depth 1 https://github.com/Duet3D/LibTinyusb.git && (cd LibTinyusb && git submodule update --init --depth 1)
git clone --depth 1 https://github.com/Duet3D/LibMbedTls.git
git clone --depth 1 https://github.com/Duet3D/WiFiSocketServerRTOS.git
git clone --depth 1 https://github.com/meeloo/duet3-emulation.git

cd duet3-emulation
tools/fetch_svd.sh
# Edit platforms/duet3_mb6hc.repl's ApplySVD line to this checkout's absolute SVD path.

# Networking needs the SD-card firmware variant (USE_EMBEDDED_FILES has mass storage compiled out),
# not the plain build_firmware.sh output, which targets the embedded-files config:
make -C ../RepRapFirmware Duet3_MB6HC CROSS_COMPILE=/usr/bin/arm-none-eabi- -j8
python3 ../RepRapFirmware/Scripts/CrcAppender.py ../RepRapFirmware/Duet3_MB6HC/Duet3Firmware_MB6HC.bin
cp ../RepRapFirmware/Duet3_MB6HC/Duet3Firmware_MB6HC.{bin,elf} build/  # as firmware_sd.{bin,elf}

# FAT32 SD image from files/ (dosfstools + mtools) -- no Lima needed on native Linux either:
sudo apt-get install -y dosfstools mtools
dd if=/dev/zero of=build/sdcard.img bs=1M count=64 && mkfs.vfat -F 32 -n DUET build/sdcard.img
# (mmd/mcopy every dir/file under files/ into it -- see tools/make_sdcard.sh's guest-side loop)

# Real TAP device (native Linux has one; this is what Lima exists to fake on macOS):
sudo ip tuntap add dev tap0 mode tap user "$(whoami)"
sudo ip addr replace 192.168.100.1/24 dev tap0 && sudo ip link set tap0 up

# Boot networked, forward the board's :80 to :8080 -- see tools/guest_run.sh for the full launcher
# (its Lima-specific bits: SSH-session process ownership, a read-only-home SD workaround. Neither
# applies natively; setsid + a plain sdcard.img path are enough).
socat TCP-LISTEN:8080,fork,reuseaddr,bind=0.0.0.0 TCP:192.168.100.50:80 &
~/renode/renode --disable-xwt --console \
    -e '$tcmodel=@duet3-emulation/peripherals/SAME70_TimerCounter.cs' \
    -e '$piomodel=@duet3-emulation/peripherals/SAME70_ParallelIO.cs' \
    -e '$afecmodel=@duet3-emulation/peripherals/SAME70_AnalogFrontEnd.cs' \
    -e '$xdmacmodel=@duet3-emulation/peripherals/SAME70_Xdmac.cs' \
    -e '$hsmcimodel=@duet3-emulation/peripherals/SAME70_Hsmci.cs' \
    -e '$rstcmodel=@duet3-emulation/peripherals/SAME70_ResetController.cs' \
    -e '$usartspimodel=@duet3-emulation/peripherals/SAME70_UsartSpi.cs' \
    -e '$sd=@duet3-emulation/build/sdcard.img' \
    -e '$fw=@duet3-emulation/build/firmware_sd.bin' \
    -e '$elf=@duet3-emulation/build/firmware_sd.elf' \
    -e '$plat=@duet3-emulation/platforms/duet3_mb6hc.repl' \
    -e 'include @duet3-emulation/scripts/networked.resc'

curl -s 'http://localhost:8080/rr_connect?password='   # {"err":0,...,"boardType":"duet3mb6hc101",...}
```

**WSL2 note**: a socat listener bound to `0.0.0.0:8080` inside WSL is reachable at
`http://localhost:8080` from Windows directly (WSL2's default automatic port forwarding) — so DWC and
Playwright can run on the Windows side while the emulator runs in WSL, with no extra bridging.

## Two real HTTP gotchas hit standing this up (worth knowing before debugging your own client code)

- **`rr_model?key=move.axes[0]` (unencoded brackets) returns an empty response, no error.** Percent-
  encode to `move.axes%5B0%5D`. Confirmed exactly as the emulator's own README warns — a runtime
  quirk no amount of reading RRF's C++ source would surface.
- **`curl --data-urlencode` (form-encoding: space -> `+`) breaks `rr_gcode`.** RRF's query parser
  does not treat `+` as space; it needs a literal `%20`. `encodeURIComponent()` (what a browser/DWC
  actually uses) never produces `+`, so this is a curl-testing gotcha specifically, not something a
  real DWC client hits — but it will bite a Node-side `request` helper built carelessly.

## Motion does not run at wall-clock speed -- poll, don't sleep

A real (cycle-accurate) firmware/motion simulation is not a real-time one. A 10mm move at F600
(nominally 1 second of machine time) measured roughly **9x slower** than real time in practice —
a fixed `waitForTimeout` after sending a move is a real, reproducible flake, not paranoia.
`emulated-smoke.spec.ts`'s second test polls the actual object-model position
(`expect.poll(readX, { timeout: 20000 })`) until it arrives, rather than guessing a delay.

## One more, in the browser itself

DWC's toolbar and its connect dialog both have a button labelled **"Connect"**. While the dialog is
open, the toolbar one sits behind the dialog's overlay scrim — `getByRole('button', { name:
"Connect" }).first()` resolves to it and then hangs forever retrying a blocked click. Use `.last()`
(`emulated-smoke.spec.ts`'s `connectToBoard` helper does this).
