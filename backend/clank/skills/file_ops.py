from typing import Dict, Any
import logging
from pathlib import Path
from clank.types import ParsedIntent, SkillResult, ExecutionContext, IntentType, RiskLevel

class FileOperationsSkill:
    """Read, write, and manage files in workspace"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def can_handle(self, intent: ParsedIntent) -> bool:
        return intent.type == IntentType.FILE_OPERATION
    
    def estimate_risk(self, intent: ParsedIntent) -> RiskLevel:
        operation = intent.parameters.get('operation', '').lower()
        
        if operation in ['delete', 'remove']:
            return RiskLevel.HIGH
        elif operation in ['write', 'create', 'modify', 'move']:
            return RiskLevel.MEDIUM
        else:  # read, list
            return RiskLevel.LOW
    
    async def execute(self, intent: ParsedIntent, ctx: ExecutionContext) -> SkillResult:
        """Execute file operation"""
        
        operation = intent.parameters.get('operation', 'read').lower()
        file_path = intent.parameters.get('path')
        content = intent.parameters.get('content')
        
        if not file_path:
            return SkillResult(
                status="FAILURE",
                message="No file path specified"
            )
        
        try:
            # Ensure path is within workspace
            full_path = Path(ctx.workspace_root) / file_path
            
            if not str(full_path.resolve()).startswith(str(Path(ctx.workspace_root).resolve())):
                return SkillResult(
                    status="FAILURE",
                    message="Path outside workspace - access denied"
                )
            
            if operation == 'read':
                if not full_path.exists():
                    return SkillResult(status="FAILURE", message="File not found")
                
                file_content = full_path.read_text()
                return SkillResult(
                    status="SUCCESS",
                    message=f"Read {len(file_content)} characters from {file_path}",
                    details={"content": file_content, "path": str(file_path)}
                )
            
            elif operation == 'write':
                if not content:
                    return SkillResult(status="FAILURE", message="No content to write")
                
                full_path.parent.mkdir(parents=True, exist_ok=True)
                full_path.write_text(content)
                
                return SkillResult(
                    status="SUCCESS",
                    message=f"Wrote {len(content)} characters to {file_path}",
                    artifacts=[str(file_path)]
                )
            
            elif operation == 'list':
                if full_path.is_file():
                    return SkillResult(status="FAILURE", message="Path is a file, not a directory")
                
                items = [str(p.relative_to(ctx.workspace_root)) for p in full_path.iterdir()]
                return SkillResult(
                    status="SUCCESS",
                    message=f"Found {len(items)} items",
                    details={"items": items}
                )
            
            elif operation == 'delete':
                if not full_path.exists():
                    return SkillResult(status="FAILURE", message="File not found")
                
                if full_path.is_file():
                    full_path.unlink()
                else:
                    import shutil
                    shutil.rmtree(full_path)
                
                return SkillResult(
                    status="SUCCESS",
                    message=f"Deleted {file_path}"
                )
            
            else:
                return SkillResult(
                    status="FAILURE",
                    message=f"Unknown operation: {operation}"
                )
            
        except Exception as e:
            self.logger.error(f"File operation failed: {e}")
            return SkillResult(
                status="FAILURE",
                message=f"Operation error: {str(e)}"
            )
