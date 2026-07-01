import sys
import paramiko

def run_ssh_cmd(host, port, user, password, cmd):
    # Set console encoding to UTF-8 to handle unicode symbols/tables from PM2
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass
        
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(host, port=port, username=user, password=password, timeout=10)
        print(f"--- Connected to {host} ---")
        print(f"Executing: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        # Wait for command completion
        exit_status = stdout.channel.recv_exit_status()
        
        print(f"Exit Code: {exit_status}")
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        
        if out:
            print("--- STDOUT ---")
            print(out)
        if err:
            print("--- STDERR ---")
            print(err)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    host = "64.227.133.133"
    port = 22
    user = "akash"
    password = "akash@123"
    
    # Join command-line arguments as a single command, default to 'pm2 list'
    cmd = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "pm2 list"
    run_ssh_cmd(host, port, user, password, cmd)
