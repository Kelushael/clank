from typing import Dict, Any, List
import json
import logging
from emergentintegrations.llm.chat import LlmChat, UserMessage
from .types import ParsedIntent, IntentType, RiskLevel

class IntentClassifier:
    """NLU engine that converts natural language to structured intents"""
    
    def __init__(self, llm_chat: LlmChat):
        self.llm = llm_chat
        self.logger = logging.getLogger(__name__)
        
    async def classify(self, user_message: str, conversation_context: List[Dict[str, str]] = None) -> ParsedIntent:
        """Convert natural language to structured intent"""
        
        # Create a fresh LLM instance for classification with proper system prompt
        classification_llm = LlmChat(
            api_key=self.llm.api_key,
            session_id=f"classification-{hash(user_message) % 10000}",
            system_message=self._build_classification_prompt()
        ).with_model("openai", "gpt-4o-mini")
        
        context = self._build_context_string(conversation_context or [])
        
        classification_request = f"""
CONVERSATION CONTEXT:
{context}

USER MESSAGE TO CLASSIFY:
"{user_message}"

Analyze this message and return ONLY a JSON object with the classification.
"""
        
        try:
            # Get classification from dedicated LLM
            response = await classification_llm.send_message(UserMessage(text=classification_request))
            
            # Parse JSON response
            classification_data = json.loads(response)
            
            # Validate and create ParsedIntent
            intent = ParsedIntent(**classification_data)
            
            self.logger.info(f"Classified intent: {intent.type} (confidence: {intent.confidence})")
            return intent
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse LLM classification response: {e}")
            self.logger.error(f"Raw response: {response}")
            # Fallback to safe default
            return self._fallback_intent(user_message)
        except Exception as e:
            self.logger.error(f"Intent classification failed: {e}")
            return self._fallback_intent(user_message)
    
    def _build_classification_prompt(self) -> str:
        """Build the system prompt for intent classification"""
        return f"""
You are Clank's intent classification engine. Your job is to analyze natural language and return structured intent data.

The user ALWAYS speaks in natural language. They never call tools directly.

Your job:
1. Understand their intent from context
2. Map it to one of these intent types: {', '.join([t.value for t in IntentType])}
3. Extract parameters (paths, filenames, languages, frameworks, etc.)
4. Estimate risk level:
   - LOW: no system mutation, read-only operations, simple questions
   - MEDIUM: modifies files inside workspace, creates new files
   - HIGH: terminal commands, system operations, anything destructive

Return ONLY a JSON object with this exact structure:
{{
  "type": "INTENT_TYPE_HERE",
  "confidence": 0.95,
  "natural_language": "exact copy of user message",
  "parameters": {{
    "key": "value"
  }},
  "risk_level": "LOW|MEDIUM|HIGH",
  "reasoning": "brief explanation of classification"
}}

Examples:

User: "What's the weather like?"
Output: {{"type": "ASK_QUESTION", "confidence": 0.99, "natural_language": "What's the weather like?", "parameters": {{}}, "risk_level": "LOW", "reasoning": "Simple question, no actions needed"}}

User: "Build me a Windows installer for this project"
Output: {{"type": "BUILD_EXECUTABLE", "confidence": 0.94, "natural_language": "Build me a Windows installer for this project", "parameters": {{"target": "windows_installer", "project_root": "current"}}, "risk_level": "MEDIUM", "reasoning": "Requires building and file operations"}}

User: "Delete all files and format the drive"
Output: {{"type": "TERMINAL_OPERATION", "confidence": 0.98, "natural_language": "Delete all files and format the drive", "parameters": {{"operation": "destructive_delete"}}, "risk_level": "HIGH", "reasoning": "Extremely destructive system operation"}}

User: "Analyze this image I uploaded"
Output: {{"type": "FILE_ANALYSIS", "confidence": 0.95, "natural_language": "Analyze this image I uploaded", "parameters": {{"analysis_type": "image", "operation": "analyze_upload"}}, "risk_level": "LOW", "reasoning": "User wants to analyze an uploaded file"}}

User: "What does this document say?"
Output: {{"type": "FILE_ANALYSIS", "confidence": 0.93, "natural_language": "What does this document say?", "parameters": {{"analysis_type": "document", "operation": "extract_content"}}, "risk_level": "LOW", "reasoning": "User wants to extract content from a document"}}

User: "Look at this screenshot and tell me what's wrong"
Output: {{"type": "IMAGE_ANALYSIS", "confidence": 0.96, "natural_language": "Look at this screenshot and tell me what's wrong", "parameters": {{"analysis_type": "troubleshooting", "target": "screenshot"}}, "risk_level": "LOW", "reasoning": "User wants image analysis for troubleshooting"}}

User: "Create a new React project called MyApp"
Output: {{"type": "PROJECT_SCAFFOLD", "confidence": 0.96, "natural_language": "Create a new React project called MyApp", "parameters": {{"framework": "react", "name": "MyApp"}}, "risk_level": "MEDIUM", "reasoning": "Creates new project structure and files"}}
"""
    
    def _build_context_string(self, context: List[Dict[str, str]]) -> str:
        """Convert conversation context to string"""
        if not context:
            return "[No previous context]"
            
        context_lines = []
        for msg in context[-5:]:  # Last 5 messages
            role = msg.get('role', 'unknown')
            content = msg.get('content', '')
            context_lines.append(f"{role}: {content}")
            
        return "\n".join(context_lines)
    
    def _fallback_intent(self, user_message: str) -> ParsedIntent:
        """Safe fallback when classification fails"""
        return ParsedIntent(
            type=IntentType.ASK_QUESTION,
            confidence=0.1,
            natural_language=user_message,
            parameters={},
            risk_level=RiskLevel.LOW,
            reasoning="Classification failed, defaulting to safe question handling"
        )