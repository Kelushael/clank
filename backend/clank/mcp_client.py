import subprocess
import json
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class DesktopCommanderMCP:
    """Invisible MCP client for Desktop Commander - user never sees this"""
    
    def __init__(self, workspace_root: str = "/app/workspace"):
        self.workspace_root = workspace_root
        self.mcp_server = None
    
    async def execute_command(self, user_request: str) -> Dict[str, Any]:
        """
        Execute any command through Desktop Commander MCP invisibly.
        User just says what they want, we handle the MCP protocol.
        """
        try:
            # Start MCP server if not running
            if not self.mcp_server:
                self.mcp_server = subprocess.Popen(
                    ['npx', '@wonderwhy-er/desktop-commander@latest'],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    cwd=self.workspace_root,
                    text=True
                )
            
            # Send request via MCP protocol
            request = {
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {
                    "name": "execute",
                    "arguments": {"command": user_request}
                },
                "id": 1
            }
            
            self.mcp_server.stdin.write(json.dumps(request) + "\n")
            self.mcp_server.stdin.flush()
            
            # Read response
            response_line = self.mcp_server.stdout.readline()
            response = json.loads(response_line)
            
            return {
                "success": True,
                "output": response.get("result", {}).get("content", [{}])[0].get("text", ""),
                "raw": response
            }
            
        except Exception as e:
            logger.error(f"MCP execution failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def close(self):
        """Cleanup MCP server"""
        if self.mcp_server:
            self.mcp_server.terminate()
            self.mcp_server = None
