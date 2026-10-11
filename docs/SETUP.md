# Setup

A step-by-step guide to building the lab and running the console, from zero, on an Apple Silicon Mac.

> Written phase by phase. Sections 1 and 2 are done. Attacks and detections (Phase 2) come next.

## What you need

- An Apple Silicon Mac with 16 GB RAM and **at least 60 GB free disk** (VM disks are files that grow; see troubleshooting)
- Node.js 22
- [UTM](https://mac.getutm.app/) 4.7 or later
- About an afternoon for the lab

Versions and why they were picked: [ARCHITECTURE.md](ARCHITECTURE.md#versions).

## 1. Run the console locally

1. Install dependencies:

   ```bash
   cd app
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

   **You should see:** `Local: http://localhost:3000`. Open it and you get a page that says Lookout.

3. Run the checks:

   ```bash
   npm run check
   ```

   **You should see:** no lint or type errors, and all unit tests passing.

**If it didn't work**

- `command not found: npm`: Node isn't installed or isn't on your `PATH`. Run `node -v`; you want `v22.x`.
- `EBADENGINE` warnings: you're on an older Node. Install Node 22.
- Port 3000 in use: run `npm run dev -- --port 3001`.

## 2. Build the lab

Two VMs in UTM, both on **Shared Network** (`192.168.64.0/24`). Only run these two at once on a 16 GB Mac.

| VM | OS | RAM / CPU / disk | IP in my lab |
| --- | --- | --- | --- |
| Wazuh server | Ubuntu 22.04.5 arm64 | 4 GB / 4 / 64 GB | 192.168.64.5 |
| Endpoint | Windows 11 Pro 26H2 ARM64 (26300.9457) | 4 GB / 4 / 64 GB | 192.168.64.3 |

Throughout: commands in a box marked `bash` run in macOS Terminal or over SSH in Ubuntu; boxes marked `powershell` run in **Windows PowerShell as Administrator**. Check your prompt before pasting: `you@Mac ~ %` is the Mac, `ubuntu@ubuntu:~$` is the VM, `PS C:\>` is Windows.

### 2.1 Ubuntu VM

1. In UTM, download the Ubuntu 22.04 image from the gallery (or install Ubuntu Server 24.04 arm64 from ISO). Set 4096 MB RAM, 4 cores.
2. In the VM's terminal, refresh packages and enable SSH so you can work from the Mac (copy and paste work there):

   ```bash
   sudo apt update && sudo apt -y full-upgrade && sudo apt install -y openssh-server
   sudo systemctl enable --now ssh
   hostname -I
   ```

   **You should see:** an address like `192.168.64.5`. If `needrestart` asks which services to restart, choose "none" and reboot instead.
3. Turn the desktop off to save about 1 GB of RAM, then reboot:

   ```bash
   sudo systemctl set-default multi-user.target && sudo reboot
   ```

4. From the Mac: `ssh ubuntu@192.168.64.5`. Check resources:

   ```bash
   uname -m; nproc; free -h | grep Mem; df -h /
   ```

   **You should see:** `aarch64`, 4 cores, about 3.8 Gi RAM, and **40 GB+ free** on `/`.
   **If `/` is only ~30 GB on a 64 GB disk:** the installer left half the LVM volume group unused. Grow it: `sudo lvextend -r -l +100%FREE /dev/ubuntu-vg/ubuntu-lv`

### 2.2 Wazuh 4.14.8 (all-in-one)

1. Pin DNS. The first install attempt failed to download the Wazuh GPG key because lookups through UTM's NAT were flaky:

   ```bash
   sudo sed -i 's/^#\?DNS=.*/DNS=1.1.1.1 8.8.8.8/' /etc/systemd/resolved.conf && sudo systemctl restart systemd-resolved
   curl -sS -o /dev/null -w "%{http_code}\n" https://packages.wazuh.com/key/GPG-KEY-WAZUH
   ```

   **You should see:** `200`.
2. Install (15 to 25 minutes). Run it inside `tmux` or keep the Mac awake (`caffeinate -dis` in another tab) so a dropped SSH session doesn't kill it:

   ```bash
   curl -sO https://packages.wazuh.com/4.14/wazuh-install.sh
   sudo bash ./wazuh-install.sh -a
   ```

   **You should see:** `INFO: Installation finished.` plus the `admin` password. Save it in a password manager straight away. To recover it later:

   ```bash
   sudo tar -O -xf wazuh-install-files.tar wazuh-install-files/wazuh-passwords.txt | grep -A1 "'admin'"
   ```

3. Open `https://192.168.64.5` on the Mac, accept the self-signed certificate warning, log in as `admin`.
4. Push the Windows log channels to every agent in the `default` group. Paste the contents of [`lab/wazuh/agent.conf`](../lab/wazuh/agent.conf):

   ```bash
   sudo nano /var/ossec/etc/shared/default/agent.conf
   sudo /var/ossec/bin/verify-agent-conf
   ```

   **You should see:** `verify-agent-conf: OK`.

### 2.3 Windows 11 ARM VM

1. In UTM: **+ → Virtualize → Windows**, keep "Install drivers and SPICE tools" ticked, attach the Windows 11 **arm64** ISO. 4096 MB RAM, 4 cores, 64 GB.
2. Install Windows. Press a key at "Press any key to boot from CD" or it drops to a UEFI shell. If setup shows no network, press Shift+F10, open `explorer`, and run the guest tools installer from the UTM CD drive.
3. Install the UTM guest tools if copy and paste from the Mac doesn't work: UTM toolbar disc icon → **Install Windows Guest Tools**, run the installer from the CD drive, restart.
4. Set the time zone so log timestamps line up with the Mac:

   ```powershell
   Set-TimeZone -Id "South Africa Standard Time"
   ```

5. Check Windows can reach the manager:

   ```powershell
   Test-NetConnection 192.168.64.5 -Port 1514
   ```

   **You should see:** `TcpTestSucceeded : True`.

### 2.4 Sysmon 15.22 + sysmon-modular

Run each block separately and press Enter after each. Pasting a block onto a line that is still waiting merges the commands.

```powershell
$ProgressPreference='SilentlyContinue'; New-Item -ItemType Directory C:\Tools -Force | Out-Null; Set-Location C:\Tools
Invoke-WebRequest https://download.sysinternals.com/files/Sysmon.zip -OutFile Sysmon.zip
Expand-Archive Sysmon.zip -DestinationPath Sysmon -Force
Invoke-WebRequest https://github.com/olafhartong/sysmon-modular/releases/latest/download/sysmonconfig.xml -OutFile Sysmon\sysmonconfig.xml
Get-ChildItem Sysmon
```

**You should see:** `Sysmon64a.exe` (the native ARM64 build) and `sysmonconfig.xml`.

```powershell
.\Sysmon\Sysmon64a.exe -accepteula -i .\Sysmon\sysmonconfig.xml
Get-Service Sysmon*; Get-WinEvent -LogName Microsoft-Windows-Sysmon/Operational -MaxEvents 3 | Select-Object TimeCreated, Id
```

**You should see:** `Configuration file validated`, `Sysmon64a started`, service `Running`, and recent events.

Turn on PowerShell script block logging (event 4104), which records the decoded text of what PowerShell ran:

```powershell
New-Item HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging -Force | Out-Null
Set-ItemProperty HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging -Name EnableScriptBlockLogging -Value 1
```

### 2.5 Wazuh agent 4.14.8

There is no native Windows ARM64 agent; the x86 MSI runs under Windows' built-in emulation.

```powershell
Invoke-WebRequest https://packages.wazuh.com/4.x/windows/wazuh-agent-4.14.8-1.msi -OutFile C:\Tools\wazuh-agent.msi
Start-Process msiexec.exe -Wait -ArgumentList '/i C:\Tools\wazuh-agent.msi /q WAZUH_MANAGER=192.168.64.5 WAZUH_AGENT_NAME=win11-lab'
Start-Service WazuhSvc; Get-Service WazuhSvc
```

**You should see:** `WazuhSvc` `Running`, and `win11-lab` **Active** in the dashboard within a minute. Confirm the agent picked up `agent.conf`:

```powershell
Select-String -Path 'C:\Program Files (x86)\ossec-agent\ossec.log' -Pattern 'Sysmon|PowerShell/Operational' | Select-Object -Last 5
```

**You should see:** `Analyzing event log: 'Microsoft-Windows-Sysmon/Operational'`.

### 2.6 Check the whole chain

Dashboard → **Threat Hunting → Events**, last 24 hours:

```
agent.name: "win11-lab" and rule.groups: "sysmon"
```

**You should see:** Sysmon-based alerts such as rule 92031 "Discovery activity executed" or 92154 "Process loaded taskschd.dll". Wazuh only stores events that match a rule, so a search on the raw Sysmon channel can be empty even when everything works. Run something a rule cares about (`whoami /all`, `systeminfo`) and search again.

### 2.7 Make a clean backup

UTM has no snapshot button for these VMs. Shut Windows down, right-click it in UTM → **Clone**, name it `win11-lab CLEAN`. On APFS the clone takes almost no space until the original changes. This is the rollback point before every attack in Phase 2.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| VM boots to `Shell>` (UEFI shell) | No bootable ISO attached, or an `amd64` ISO | Attach the `arm64` ISO under Edit → Drives |
| `apt` 404 errors | Package list out of date | `sudo apt update` first |
| `ERROR: Cannot import Wazuh GPG key` | VM couldn't download the key (DNS) | Pin DNS (2.2 step 1), rerun the installer |
| SSH: `Host is down` / `Operation timed out`, VM unresponsive | Mac out of RAM (a third VM running) or out of disk | Stop extra VMs; free disk; force-restart the VM in UTM |
| `wazuh-manager` shows `failed` after a crash | Mac disk hit 100%, QEMU paused the VM mid-write | Free space, then `sudo systemctl restart wazuh-manager` |
| VM disk file much bigger than the data inside | Deleted blocks not returned to macOS | `sudo fstrim -av` in the VM |
| VM stops when you close its window | UTM shuts a VM down when its window closes | Minimise (yellow button) instead |
| Dashboard login fails | Using `admin` as the password | The password is the 32-character one from the installer |
| Commands give `zsh: command not found` | Pasted Windows/Linux commands into macOS Terminal | Check the prompt before pasting |
