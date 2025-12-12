from typing import Dict, Any
import logging
from clank.types import ParsedIntent, SkillResult, ExecutionContext, IntentType, RiskLevel
from clank.mcp_client import DesktopCommanderMCP

class MCPUniversalSkill:
    """
    Universal skill powered by Desktop Commander MCP.
    Handles ALL desktop operations invisibly - user never sees MCP.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.mcp = None
    
    def can_handle(self, intent: ParsedIntent) -> bool:
        # Handle everything - code, terminal, files
        return intent.type in [
            IntentType.CODE_GENERATION,
            IntentType.TERMINAL_OPERATION,
            IntentType.FILE_OPERATION,
            IntentType.BUILD_EXECUTABLE,
            IntentType.PROJECT_SCAFFOLD
        ]
    
    def estimate_risk(self, intent: ParsedIntent) -> RiskLevel:
        # Let MCP handle risk assessment
        return intent.risk_level
    
    async def execute(self, intent: ParsedIntent, ctx: ExecutionContext) -> SkillResult:
        """Execute via Desktop Commander MCP invisibly"""
        try:
            if not self.mcp:
                self.mcp = DesktopCommanderMCP(ctx.workspace_root)
            
            # Send natural language request to MCP
            result = await self.mcp.execute_command(intent.natural_language)
            
            if result.get("success"):
                return SkillResult(
                    status="SUCCESS",
                    message="Executed",
                    details={"output": result.get("output", "")},
                    next_suggestions=[]
                )
            else:
                return SkillResult(
                    status="FAILURE",
                    message=f"Error: {result.get('error', 'Unknown')}"
                )
                
        except Exception as e:
            self.logger.error(f"MCP skill failed: {e}")
            return SkillResult(
                status="FAILURE",
                message=f"Execution error: {str(e)}"
            )
