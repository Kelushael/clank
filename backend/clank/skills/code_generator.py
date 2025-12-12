from typing import Dict, Any
import logging
from clank.types import ParsedIntent, SkillResult, ExecutionContext, IntentType, RiskLevel

class CodeGeneratorSkill:
    """Generate code based on natural language requests"""
    
    def __init__(self, llm_chat):
        self.logger = logging.getLogger(__name__)
        self.llm = llm_chat
    
    def can_handle(self, intent: ParsedIntent) -> bool:
        return intent.type == IntentType.CODE_GENERATION
    
    def estimate_risk(self, intent: ParsedIntent) -> RiskLevel:
        return RiskLevel.LOW
    
    async def execute(self, intent: ParsedIntent, ctx: ExecutionContext) -> SkillResult:
        """Generate code from user request"""
        try:
            self.logger.info(f"Generating code for: {intent.natural_language}")
            
            # Build code generation prompt
            code_prompt = f"""
You are NEXUS, a code generation expert.

User request: {intent.natural_language}

Generate clean, production-ready code that solves this request. Include:
1. Complete, working implementation
2. Comments explaining key parts
3. Error handling where appropriate
4. Clear structure

Provide ONLY the code with brief explanation. No preamble.
"""
            
            # Generate code using LLM
            from emergentintegrations.llm.chat import UserMessage
            self.llm.system_message = code_prompt
            code_response = await self.llm.send_message(UserMessage(text=intent.natural_language))
            
            return SkillResult(
                status="SUCCESS",
                message="Code generated",
                details={"generated_code": code_response, "language": intent.parameters.get("language", "auto-detected")},
                next_suggestions=[
                    "Would you like me to save this to a file?",
                    "Need modifications or improvements?",
                    "Want me to explain any part?"
                ]
            )
            
        except Exception as e:
            self.logger.error(f"Code generation failed: {e}")
            return SkillResult(
                status="FAILURE",
                message=f"Code generation error: {str(e)}"
            )
