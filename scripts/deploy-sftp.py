import os
import sys
import subprocess
import paramiko

def get_changed_files():
    # Run git status --porcelain to find modified (M) and untracked (??) files
    res = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
    if res.returncode != 0:
        print("Git status check failed. Make sure git is installed and configured.")
        sys.exit(1)
        
    lines = res.stdout.strip().split("\n")
    files_to_upload = []
    
    # Exclude list
    exclude_prefixes = [
        "scripts/ssh-exec.py",
        "scripts/deploy-sftp.py",
        ".env",
        ".git/",
        "node_modules/",
        "deployment_guide.md"
    ]
    
    for line in lines:
        if not line:
            continue
        status = line[:2].strip()
        filepath = line[2:].strip().replace('"', '').replace("\\", "/")
        
        # Only upload src/, scripts/, next.config.ts, or server.js
        is_allowed = (
            filepath.startswith("src/") or 
            filepath.startswith("scripts/") or 
            filepath == "next.config.ts" or
            filepath == "server.js"
        )
        if not is_allowed:
            continue
            
        if status in ["M", "A", "??"]:
            if os.path.isdir(filepath):
                for root, dirs, files in os.walk(filepath):
                    for file in files:
                        subpath = os.path.join(root, file).replace("\\", "/")
                        if not any(subpath.startswith(ex) for ex in exclude_prefixes):
                            files_to_upload.append(subpath)
            else:
                if not any(filepath.startswith(ex) for ex in exclude_prefixes):
                    files_to_upload.append(filepath)
                    
    return files_to_upload

def sftp_mkdir_recursive(sftp, remote_dir):
    parts = remote_dir.split('/')
    current = ""
    for part in parts:
        if not part:
            current += "/"
            continue
        if current and current != "/":
            current += "/" + part
        else:
            current += part
            
        try:
            sftp.stat(current)
        except IOError:
            print(f"Creating remote directory: {current}")
            sftp.mkdir(current)

def deploy():
    host = "64.227.133.133"
    port = 22
    user = "akash"
    password = "akash@123"
    remote_root = "/home/dcrf/htdocs/dcrf.world"
    
    # Ensure stdout supports UTF-8
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

    files = get_changed_files()
    if not files:
        print("No changed or untracked files detected to deploy.")
        return
        
    print(f"Found {len(files)} files to deploy:")
    for f in files:
        print(f" - {f}")
        
    # Connect
    print(f"\nConnecting to SSH {host}:{port}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(host, port=port, username=user, password=password, timeout=15)
        print("SSH Connection established.")
        
        # SFTP Upload
        sftp = ssh.open_sftp()
        print("SFTP Session started. Uploading files...")
        
        package_json_changed = False
        
        for local_file in files:
            if not os.path.exists(local_file):
                continue
            
            if local_file == "package.json":
                package_json_changed = True
                
            remote_file = f"{remote_root}/{local_file}"
            remote_dir = os.path.dirname(remote_file).replace("\\", "/")
            
            # Ensure folder structure exists on remote
            sftp_mkdir_recursive(sftp, remote_dir)
            
            print(f"Uploading: {local_file} -> {remote_file}")
            sftp.put(local_file, remote_file)
            
        sftp.close()
        print("Upload complete!")
        
        # Build commands
        print("\n--- Executing server build commands ---")
        
        cmds = []
        if package_json_changed:
            cmds.append("npm install")
        cmds.append("npm run build")
        cmds.append("pm2 restart dcrs")
        
        full_cmd = f"cd {remote_root} && " + " && ".join(cmds)
        print(f"Running on remote: {full_cmd}")
        
        stdin, stdout, stderr = ssh.exec_command(full_cmd)
        
        # Stream the stdout and stderr in real-time
        while True:
            line = stdout.readline()
            if not line:
                break
            print(line, end="")
            
        err = stderr.read().decode('utf-8', errors='ignore')
        if err:
            print("\n--- STDERR / Warnings ---")
            print(err)
            
        print("\nDeployment finished successfully!")
        
    except Exception as e:
        print(f"Deployment failed: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    deploy()
