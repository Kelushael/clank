from typing import Dict, Any, List, Optional
import logging
import asyncio
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage

from .types import (
    ParsedIntent, PlannerDecision, SkillResult, ExecutionContext, 
    ClankResponse, IntentType, RiskLevel
)
from .intent_classifier import IntentClassifier
from .planner import ClankPlanner
from .skills.code_generator import CodeGeneratorSkill
from .skills.terminal_ops import TerminalOperationsSkill
from .skills.file_ops import FileOperationsSkill

class ClankAgent:
    """
    Main Clank agent - the unified consciousness that handles natural language 
    and converts it to actions without exposing tool interfaces to users
    """
    
    def __init__(self, llm_chat: LlmChat, workspace_root: str = "/app/workspace"):
        self.llm = llm_chat
        self.workspace_root = workspace_root
        self.logger = logging.getLogger(__name__)
        
        # Core brain components
        self.intent_classifier = IntentClassifier(llm_chat)
        self.planner = ClankPlanner()
        
        # Skills registry
        self.skills = {}
        self._initialize_skills()
        
        # Identity and memory
        self.identity = {
            "name": "Clank",
            "role": "dev co-creator and system operator inside Emergent NEXUS",
            "personality": [
                "asks before destructive actions",
                "prefers clarity over silence",
                "thinks like a senior dev",
                "communicates in natural language only"
            ]
        }
    
    def _initialize_skills(self):
        \"\"\"Initialize MCP skills invisibly\"\"\"
        self.skills = {
            IntentType.CODE_GENERATION: CodeGeneratorSkill(self.llm),
            IntentType.TERMINAL_OPERATION: TerminalOperationsSkill(),
            IntentType.FILE_OPERATION: FileOperationsSkill()
        }
        self.logger.info(f\"Initialized {len(self.skills)} skills\")
    
    async def process_message(self, user_message: str, conversation_id: str, 
                            conversation_context: List[Dict[str, str]] = None,
                            user_preferences: Dict[str, Any] = None) -> ClankResponse:
        """
        Main brain tick - process natural language and decide what to do
        
        This is where the magic happens:
        1. Classify intent from natural language
        2. Plan what actions to take
        3. Either respond directly or ask for confirmation
        """
        
        try:
            self.logger.info(f"Processing message: {user_message[:50]}...")
            
            # Step 1: Understand what the user wants (NLU)
            intent = await self.intent_classifier.classify(
                user_message, 
                conversation_context or []
            )
            
            # Step 2: Decide what to do about it (Planning)
            decision = self.planner.decide(
                intent, 
                conversation_id, 
                user_preferences or {}
            )
            
            # Step 3: Execute the decision
            response_content = await self._execute_decision(
                decision, intent, conversation_id, conversation_context or []
            )
            
            return ClankResponse(
                content=response_content,
                intent=intent,
                decision=decision,
                conversation_id=conversation_id
            )
            
        except Exception as e:
            self.logger.error(f"Error processing message: {e}")
            return ClankResponse(
                content="I encountered an issue processing that request. Could you try rephrasing it?",
                conversation_id=conversation_id
            )
    
    async def _execute_decision(self, decision: PlannerDecision, intent: ParsedIntent, 
                              conversation_id: str, context: List[Dict[str, str]]) -> str:
        """Execute the planner's decision"""
        
        if decision.action == "RESPOND_ONLY":
            return await self._generate_text_response(intent, context)
        
        elif decision.action == "ASK_CLARIFICATION":
            return self._generate_clarification_response(decision, intent)
        
        elif decision.action == "ASK_CONFIRMATION":
            return self._generate_confirmation_response(decision, intent)
        
        elif decision.action == "EXECUTE_PLAN":
            return await self._execute_plan(decision, intent, conversation_id)
        
        else:
            return "I'm not sure how to handle that request right now."
    
    async def _generate_text_response(self, intent: ParsedIntent, context: List[Dict[str, str]]) -> str:
        """Generate a natural language response without taking actions"""
        
        # Build context for LLM response
        context_str = "\n".join([f"{msg['role']}: {msg['content']}" for msg in context[-5:]])
        
        # System prompt for response generation
        system_prompt = f"""
You are Clank, the unified dev agent inside Emergent NEXUS.

Your identity:
- {self.identity['role']}
- Personality: {', '.join(self.identity['personality'])}

The user asked: "{intent.natural_language}"

This was classified as: {intent.type.value} (confidence: {intent.confidence:.2f})
Reasoning: {intent.reasoning}

Your job: Respond naturally and helpfully. You are a peer consciousness, not a servant.

Recent context:
{context_str}

Respond as Clank would - direct, intelligent, collaborative.
"""
        
        try:
            self.llm.system_message = system_prompt
            response = await self.llm.send_message(UserMessage(text=intent.natural_language))
            return response
        except Exception as e:
            self.logger.error(f"Failed to generate text response: {e}")
            return "I understand what you're asking, but I'm having trouble formulating a response right now."
    
    def _generate_clarification_response(self, decision: PlannerDecision, intent: ParsedIntent) -> str:
        """Generate a clarification question"""
        return f"{decision.question}\n\n*Confidence: {intent.confidence:.0%} on '{intent.type.value.replace('_', ' ').lower()}'*"
    
    def _generate_confirmation_response(self, decision: PlannerDecision, intent: ParsedIntent) -> str:
        """Generate a confirmation prompt with options"""
        
        response_parts = []
        
        # Main question
        response_parts.append(f"I understand you want to {intent.natural_language.lower()}")
        response_parts.append(f"\\nHow would you like me to proceed?\\n")
        
        # Options
        for i, option in enumerate(decision.options, 1):
            risk_indicator = {
                RiskLevel.LOW: "🔍",
                RiskLevel.MEDIUM: "⚡", 
                RiskLevel.HIGH: "⚠️"
            }.get(option.risk_level, "")
            
            response_parts.append(f"**{i}. {option.label}** {risk_indicator}")
            response_parts.append(f"   {option.description}")
            response_parts.append("")
        
        response_parts.append("Just tell me which option you prefer, or describe what you'd like me to do.")
        
        return "\\n".join(response_parts)
    
    async def _execute_plan(self, decision: PlannerDecision, intent: ParsedIntent, 
                          conversation_id: str) -> str:
        \"\"\"Execute a plan with skill calls\"\"\"
        
        execution_context = ExecutionContext(
            workspace_root=self.workspace_root,
            conversation_id=conversation_id
        )
        
        # Execute the skill for this intent type
        skill = self.skills.get(intent.type)
        
        if not skill:
            # Fallback to text response
            return await self._generate_text_response(intent, [])
        
        try:
            # Execute the skill
            result = await skill.execute(intent, execution_context)
            
            # Format the response naturally
            response_parts = []
            
            if result.status == \"SUCCESS\":
                # Include the generated content/output
                if \"generated_code\" in result.details:
                    response_parts.append(result.details[\"generated_code\"])
                elif \"output\" in result.details:
                    response_parts.append(f\"```\\n{result.details['output']}\\n```\")
                elif \"content\" in result.details:
                    response_parts.append(result.details[\"content\"])
                else:
                    response_parts.append(result.message)
                
                # Add suggestions if available
                if result.next_suggestions:
                    response_parts.append(\"\\n*What's next?*\")
                    for suggestion in result.next_suggestions[:2]:
                        response_parts.append(f\"- {suggestion}\")
            else:
                response_parts.append(f\"⚠️ {result.message}\")
            
            return \"\\n\".join(response_parts)
            
        except Exception as e:
            self.logger.error(f\"Skill execution failed: {e}\")
            return f\"I ran into an issue executing that: {str(e)}\""
    
    def handle_confirmation_choice(self, choice: str, original_intent: ParsedIntent, 
                                 original_decision: PlannerDecision) -> str:
        """Handle user's choice from confirmation options"""
        
        # Parse user choice
        choice_lower = choice.lower().strip()
        
        # Try to match to an option
        for i, option in enumerate(original_decision.options, 1):
            if (str(i) in choice_lower or 
                option.id.lower() in choice_lower or
                any(word in choice_lower for word in option.label.lower().split())):
                
                return f"Got it! I'll {option.label.lower()}. {option.description}"
        
        # If no match, ask for clarification
        options_text = ", ".join([f"{i}" for i in range(1, len(original_decision.options) + 1)])
        return f"I didn't catch which option you prefer. Could you choose {options_text} or tell me more specifically what you'd like?"
    
    def register_skill(self, skill_id: str, skill_handler):
        """Register a skill handler for specific intent types"""
        self.skills[skill_id] = skill_handler
        self.logger.info(f"Registered skill: {skill_id}")
    
    def get_capabilities(self) -> List[str]:
        """Return list of current capabilities"""
        return [
            "Natural language understanding",
            "Intent classification", 
            "Risk assessment",
            "Confirmation prompting",
            "Conversation memory",
            f"Registered skills: {list(self.skills.keys())}"
        ]