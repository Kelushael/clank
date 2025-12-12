from typing import Dict, Any
import logging
import subprocess
from pathlib import Path
from clank.types import ParsedIntent, SkillResult, ExecutionContext, IntentType, RiskLevel

class TerminalOperationsSkill:
    """Execute terminal commands safely in workspace"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.dangerous_commands = ['rm -rf /', 'del /f', 'format', 'mkfs', ':(){:|:&};:']
    
    def can_handle(self, intent: ParsedIntent) -> bool:
        return intent.type == IntentType.TERMINAL_OPERATION
    
    def estimate_risk(self, intent: ParsedIntent) -> RiskLevel:
        command = intent.parameters.get('command', '').lower()
        
        # Check for dangerous patterns
        if any(dangerous in command for dangerous in self.dangerous_commands):
            return RiskLevel.HIGH
        
        # Write operations are MEDIUM risk
        if any(op in command for op in ['rm', 'del', 'mv', 'cp', 'chmod', 'chown']):
            return RiskLevel.MEDIUM
        
        # Read operations are LOW risk
        return RiskLevel.LOW
    
    async def execute(self, intent: ParsedIntent, ctx: ExecutionContext) -> SkillResult:
        """Execute terminal command in workspace"""
        
        command = intent.parameters.get('command')
        if not command:
            return SkillResult(
                status="FAILURE",
                message="No command specified"
            )
        
        # Safety check
        if any(dangerous in command.lower() for dangerous in self.dangerous_commands):
            return SkillResult(
                status="FAILURE",
                message="Command blocked for safety: potentially destructive operation detected"
            )
        
        try:
            self.logger.info(f"Executing: {command}")
            
            result = subprocess.run(
                command,
                shell=True,
                cwd=ctx.workspace_root,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            output = result.stdout or result.stderr or "(no output)"
            
            return SkillResult(
                status="SUCCESS" if result.returncode == 0 else "PARTIAL",
                message=f"Command executed (exit code: {result.returncode})",
                details={
                    "command": command,
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "exit_code": result.returncode,
                    "output": output
                },
                next_suggestions=[
                    "Need to run another command?",
                    "Want to check the results?"
                ]
            )
            
        except subprocess.TimeoutExpired:
            return SkillResult(
                status="FAILURE",
                message="Command timed out (>30s)"
            )
        except Exception as e:
            self.logger.error(f"Command execution failed: {e}")
            return SkillResult(
                status="FAILURE",
                message=f"Execution error: {str(e)}"
            )
