import os
import json
from datetime import datetime
import ctypes
from ctypes import wintypes
import winreg
import time
import gzip
import base64
import argparse
#---------------------------------------------
def get_unc_path(drive_letter):
    drive_letter = drive_letter.strip().rstrip('\\')
    mpr = ctypes.WinDLL('mpr')
    
    buffer_len = wintypes.DWORD(512)
    buffer = ctypes.create_unicode_buffer(buffer_len.value)
    
    result = mpr.WNetGetConnectionW(drive_letter, buffer, ctypes.byref(buffer_len))
    if result == 0:
        return buffer.value
    return None
#---------------------------------------------
def get_local_label_from_reg(drive_letter):
    unc_path = get_unc_path(drive_letter)
    if not unc_path:
        return None

    registry_key_name = "##" + unc_path.lstrip('\\').replace('\\', '#')
    
    full_key_path = rf"Software\Microsoft\Windows\CurrentVersion\Explorer\MountPoints2\{registry_key_name}"
    
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, full_key_path) as key:
            label, _ = winreg.QueryValueEx(key, "_LabelFromReg")
            return label
    except FileNotFoundError:
        return None
#---------------------------------------------
def get_drive_label(drive_letter):
    kernel32 = ctypes.windll.kernel32
    volumeNameBuffer = ctypes.create_unicode_buffer(1024)
    fileSystemNameBuffer = ctypes.create_unicode_buffer(1024)
    serial_number = None
    max_component_length = None
    file_system_flags = None

    rc = kernel32.GetVolumeInformationW(
        ctypes.c_wchar_p(drive_letter),
        volumeNameBuffer,
        ctypes.sizeof(volumeNameBuffer),
        serial_number,
        max_component_length,
        file_system_flags,
        fileSystemNameBuffer,
        ctypes.sizeof(fileSystemNameBuffer)
    )
    return volumeNameBuffer.value

#---------------------------------------------
def scan_dir(path, depth, max_depth):
    info = {
        "folders": {},
        "files": []
    }

    if depth >= max_depth:
        return info

    try:
        with os.scandir(path) as entries:
            for entry in entries:
                if entry.is_symlink():
                    continue

                if entry.is_file():
                    info["files"].append(entry.name)

                elif entry.is_dir():
                    info["folders"][entry.name] = scan_dir(
                        entry.path,
                        depth + 1,
                        max_depth
                    )

    except (PermissionError, OSError) as e:
        info["error"] = str(e)

    info["files"].sort()
    info["folders"] = dict(sorted(info["folders"].items()))

    return info
#---------------------------------------------
def scan_drive(drive_path):
    label = get_local_label_from_reg(drive_path)
    if label:
        drive_label = label
    else:
        drive_label = get_drive_label(drive_path)

    print(drive_path + " (" + drive_label + ")")

    result = {
        "drive": drive_path,
        "label": drive_label,
        "scanned_at": datetime.now().isoformat(),
        "root_files": [],
        "folders": {}
    }

    try:
        with os.scandir(drive_path) as root_entries:
            for entry in root_entries:
                if entry.is_symlink():
                    continue

                if entry.is_file():
                    result["root_files"].append(entry.name)

                elif entry.is_dir():
                    result["folders"][entry.name] = scan_dir(
                        entry.path,
                        depth=1,
                        max_depth=args.depth
                    )

    except (PermissionError, OSError) as e:
        result["error"] = str(e)

    result["root_files"].sort()
    result["folders"] = dict(sorted(result["folders"].items()))

    return result
#---------------------------------------------
parser = argparse.ArgumentParser(description="Stores folder and file names on selected drives")
parser.add_argument("-dc", action="store_true", help="disable compression")
parser.add_argument("-d", "--depth", type=int, default=3, help="Scan depth")
parser.add_argument(
    "-drives", "--drivesArg", 
    nargs="+", 
    type=str.upper,
    help="List of drive letters you want to scan"
)
args = parser.parse_args()
#---------------------------------------------
drives = ["C:\\","D:\\", "E:\\", "F:\\", "G:\\", "H:\\", "M:\\", "N:\\", "S:\\", "T:\\", "U:\\", "Z:\\"]
if args.drivesArg:
    drives = [f"{d}:\\" for d in args.drivesArg]

print(f"Scanning drives: {drives}")

data = []

time_start = time.perf_counter()
time_drive_start = time_start
#---------------------------------------------
for drive in drives:
    try:
        data.append(scan_drive(drive))
    except Exception as e:
        data.append({
            "drive": drive,
            "error": str(e)
        })
    print(f"{(time.perf_counter() - time_drive_start) * 1000:.2f} ms")
    time_drive_start = time.perf_counter()



with open("drives_data.js", "w", encoding="utf-8") as f:
    if args.dc:
        f.write("const compressed = false; const jsonData = ")
        json.dump(data, f, indent=2)
        f.write(";")
    else:
        #gzip
        json_str = json.dumps(data)
        compressed_bytes = gzip.compress(json_str.encode('utf-8'))
        b64_encoded = base64.b64encode(compressed_bytes).decode('utf-8')
        f.write(f"let jsonData; const compressed = true; const compressedData = '{b64_encoded}';")
#---------------------------------------------
print("done")
time_end = time.perf_counter()
elapsed_ms = (time_end - time_start) * 1000
print(f"{elapsed_ms:.2f} ms")