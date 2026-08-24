$ErrorActionPreference = "Stop"

$ReleasesHost = "https://releases.proofboard.io"
$BinDir = "$env:LOCALAPPDATA\Proofboard\bin"
$BinName = "proofboard.exe"

function Get-Arch {
    switch ($env:PROCESSOR_ARCHITECTURE) {
        "AMD64" { return "amd64" }
        "ARM64" { return "arm64" }
        default { return "unsupported" }
    }
}

$Arch = Get-Arch
if ($Arch -eq "unsupported") {
    Write-Error "Proofboard CLI: unsupported platform (windows $env:PROCESSOR_ARCHITECTURE)."
    exit 1
}

# The release publishes the product name. The lowercase name is the older
# convention, still accepted by the download host, and still what a
# checksums.txt from an older release lists — so ask for the product name and
# be prepared to verify against either.
$Asset = "Proofboard-Career-Agent-windows-$Arch.exe"
$LegacyAsset = "proofboard-windows-$Arch.exe"
$DownloadUrl = "$ReleasesHost/latest/$Asset"

$TmpDir = Join-Path $env:TEMP ([System.Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $TmpDir | Out-Null

try {
    Write-Host "Downloading Proofboard CLI (windows/$Arch)..."
    $AssetPath = Join-Path $TmpDir $Asset
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $AssetPath -UseBasicParsing

    Write-Host "Verifying checksum..."
    $ChecksumsPath = Join-Path $TmpDir "checksums.txt"
    Invoke-WebRequest -Uri "$ReleasesHost/latest/checksums.txt" -OutFile $ChecksumsPath -UseBasicParsing

    $ChecksumLine = Get-Content $ChecksumsPath | Where-Object {
        $Name = ($_ -split '\s+')[1]
        $Name -eq $Asset -or $Name -eq $LegacyAsset
    } | Select-Object -First 1
    if (-not $ChecksumLine) {
        Write-Error "No checksum entry found for $Asset in checksums.txt"
        exit 1
    }
    $ExpectedHash = ($ChecksumLine -split '\s+')[0].ToLower()
    $ActualHash = (Get-FileHash -Path $AssetPath -Algorithm SHA256).Hash.ToLower()

    if ($ExpectedHash -ne $ActualHash) {
        Write-Error "Checksum verification failed."
        exit 1
    }
    Write-Host "${Asset}: OK"

    New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
    $DestPath = Join-Path $BinDir $BinName
    Move-Item -Path $AssetPath -Destination $DestPath -Force

    $UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($UserPath -notlike "*$BinDir*") {
        [Environment]::SetEnvironmentVariable("Path", "$UserPath;$BinDir", "User")
        $env:Path = "$env:Path;$BinDir"
    }

    Write-Host "Proofboard CLI installed. Run: proofboard auth"
}
finally {
    Remove-Item -Recurse -Force $TmpDir -ErrorAction SilentlyContinue
}
