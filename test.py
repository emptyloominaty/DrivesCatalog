import os
import json
from datetime import datetime

import ctypes


#todo network drive labels
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


def scan_drive(drive_path):
    drive_label = get_drive_label(drive_path)
    print(drive_path+" - "+drive_label)

    result = {
        "drive": drive_path,
        "label": drive_label,
        "scanned_at": datetime.now().isoformat(),
        "root_files": [],
        "folders": {}
    }

    with os.scandir(drive_path) as root_entries:
        for entry in root_entries:
            if entry.is_file():
                result["root_files"].append(entry.name)

            elif entry.is_dir():
            
                if entry.is_symlink():
                    result["folders"][entry.name] = {"error": "skipped symbolic link"}
                    continue
                    
                folder_info = {
                    "folders": [],
                    "files": []
                }

                try:
                    with os.scandir(entry.path) as sub_entries:
                        for sub in sub_entries:
                            if sub.is_symlink():
                                continue
                            if sub.is_dir():
                                folder_info["folders"].append(sub.name)
                            elif sub.is_file():
                                folder_info["files"].append(sub.name)
                except (PermissionError, OSError) as e:
                    folder_info["error"] = str(e)

                result["folders"][entry.name] = folder_info

    result["root_files"].sort()
    for f in result["folders"].values():
        f["folders"].sort()
        f["files"].sort()

    return result


drives = ["C:\\","D:\\", "E:\\", "F:\\", "G:\\", "H:\\", "M:\\", "N:\\", "S:\\", "T:\\", "U:\\", "Z:\\"]

data = []

for drive in drives:
    try:
        data.append(scan_drive(drive))
    except Exception as e:
        data.append({
            "drive": drive,
            "error": str(e)
        })

with open("drives_data.js", "w", encoding="utf-8") as f:
    f.write("const jsonData = ")
    json.dump(data, f, indent=2)
    f.write(";")

print("Done.")