import os
import sys
import time
import socket
import subprocess
import uvicorn

# Ensure UTF-8 output encoding on Windows consoles
if sys.platform == "win32" and sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) == 0

def find_pid_on_port(port: int) -> list:
    pids = set()
    try:
        if sys.platform == "win32":
            output = subprocess.check_output(f"netstat -ano | findstr :{port}", shell=True, text=True)
            for line in output.strip().splitlines():
                parts = line.strip().split()
                if len(parts) >= 5 and "LISTENING" in parts:
                    pids.add(int(parts[-1]))
    except Exception:
        pass
    return list(pids)

def kill_process_by_pid(pid: int):
    try:
        if sys.platform == "win32":
            subprocess.run(f"taskkill /PID {pid} /F", shell=True, capture_output=True)
        else:
            os.kill(pid, 9)
    except Exception:
        pass

def main():
    host = "127.0.0.1"
    port = 8000
    force_restart = "--force" in sys.argv or "-f" in sys.argv

    print("=" * 65)
    print(" [NRI Institute of Technology - Digital Library Server]")
    print("=" * 65)

    if is_port_in_use(port, host):
        pids = find_pid_on_port(port)
        if force_restart and pids:
            print(f"[!] Port {port} is occupied by PID(s): {pids}. Freeing port...")
            for pid in pids:
                kill_process_by_pid(pid)
            time.sleep(1)
        elif is_port_in_use(port, host):
            pid_info = f" (PID: {pids[0]})" if pids else ""
            print(f"\n[!] WARNING: Port {port} is already in use{pid_info}.")
            print(f"[>] Options:")
            print(f"    1. Access active server directly at: http://{host}:{port}/docs")
            print(f"    2. Auto-kill & restart: run `python serve.py --force`")
            if pids:
                print(f"    3. Kill manually: `taskkill /PID {pids[0]} /F`")
            print("=" * 65)
            sys.exit(1)

    print(f"\n[+] Starting FastAPI backend on http://{host}:{port}")
    print(f"[+] Swagger UI Documentation: http://{host}:{port}/docs")
    print(f"[+] ReDoc Documentation:      http://{host}:{port}/redoc")
    print(f"[+] Frontend Web Portal:      index.html")
    print("=" * 65 + "\n")

    uvicorn.run(
        "backend.server:app",
        host=host,
        port=port,
        reload=True
    )

if __name__ == "__main__":
    main()
