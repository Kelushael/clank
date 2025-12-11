from typing import List, Dict, Any
import logging
from .types import ParsedIntent, PlannerDecision, ConfirmationOption, IntentType, RiskLevel

class ClankPlanner:
    """Decision engine that determines what actions to take based on classified intents"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    def decide(self, intent: ParsedIntent, conversation_id: str, user_preferences: Dict[str, Any] = None) -> PlannerDecision:
        """Main planning logic - decides whether to respond, ask confirmation, or execute"""
        
        user_prefs = user_preferences or {}
        
        # Low confidence = ask for clarification
        if intent.confidence < 0.6:
            return PlannerDecision(
                action="ASK_CLARIFICATION",
                reason=f"Low confidence ({intent.confidence:.2f}) in intent classification",
                question=self._generate_clarification_question(intent)
            )
        
        # Route by intent type
        if intent.type == IntentType.ASK_QUESTION:
            return self._handle_question_intent(intent, user_prefs)
        
        elif intent.type == IntentType.CODE_GENERATION:
            return self._handle_code_generation_intent(intent, user_prefs)
        
        elif intent.type == IntentType.FILE_OPERATION:
            return self._handle_file_operation_intent(intent, user_prefs)
        
        elif intent.type == IntentType.FILE_ANALYSIS or intent.type == IntentType.IMAGE_ANALYSIS:
            return self._handle_file_analysis_intent(intent, user_prefs)
        
        elif intent.type == IntentType.TERMINAL_OPERATION:
            return self._handle_terminal_operation_intent(intent, user_prefs)
        
        elif intent.type == IntentType.BUILD_EXECUTABLE:
            return self._handle_build_executable_intent(intent, user_prefs)
        
        elif intent.type == IntentType.PROJECT_SCAFFOLD:
            return self._handle_project_scaffold_intent(intent, user_prefs)
        
        elif intent.type == IntentType.CONFIGURE_ENVIRONMENT:
            return self._handle_configure_environment_intent(intent, user_prefs)
        
        elif intent.type == IntentType.META_REQUEST:
            return self._handle_meta_request_intent(intent, user_prefs)
        
        # Fallback
        return PlannerDecision(
            action="RESPOND_ONLY",
            reason="Unhandled intent type, defaulting to text response"
        )
    
    def _handle_question_intent(self, intent: ParsedIntent, user_prefs: Dict[str, Any]) -> PlannerDecision:
        """Handle simple questions - just respond with text"""
        return PlannerDecision(
            action="RESPOND_ONLY",
            reason="User asked a question, no actions needed"
        )
    
    def _handle_code_generation_intent(self, intent: ParsedIntent, user_prefs: Dict[str, Any]) -> PlannerDecision:
        """Handle code generation requests"""
        if intent.risk_level == RiskLevel.HIGH:
            return PlannerDecision(
                action="ASK_CONFIRMATION",
                reason="Code generation with system implications",
                options=[
                    ConfirmationOption(
                        id="GENERATE_CODE_ONLY",
                        label="Just show me the code",
                        description="I'll generate and display the code without creating any files",
                        risk_level=RiskLevel.LOW
                    ),
                    ConfirmationOption(
                        id="GENERATE_AND_SAVE",
                        label="Generate and save to files",
                        description="I'll create the code and save it to your workspace",
                        risk_level=RiskLevel.MEDIUM
                    )
                ]
            )
        else:
            return PlannerDecision(
                action="EXECUTE_PLAN",
                reason="Safe code generation request",
                plan_steps=[intent]
            )
    
    def _handle_file_operation_intent(self, intent: ParsedIntent, user_prefs: Dict[str, Any]) -> PlannerDecision:
        """Handle file operations"""
        operation = intent.parameters.get('operation', 'unknown')
        
        if intent.risk_level == RiskLevel.HIGH or 'delete' in operation:
            return PlannerDecision(
                action="ASK_CONFIRMATION",
                reason=f"Potentially destructive file operation: {operation}",
                options=[
                    ConfirmationOption(
                        id="PROCEED_WITH_BACKUP",
                        label="Proceed with backup",
                        description="I'll create a backup before making changes",
                        risk_level=RiskLevel.MEDIUM
                    ),
                    ConfirmationOption(
                        id="PROCEED_DIRECT",
                        label="Proceed directly",
                        description="Make the changes without backup",
                        risk_level=RiskLevel.HIGH
                    ),
                    ConfirmationOption(
                        id="SHOW_PLAN_ONLY",
                        label="Just show me what you would do",
                        description="Describe the changes without executing them",
                        risk_level=RiskLevel.LOW
                    )
                ]
            )
        else:
            return PlannerDecision(
                action="EXECUTE_PLAN",
                reason="Safe file operation",
                plan_steps=[intent]
            )
    
    def _handle_terminal_operation_intent(self, intent: ParsedIntent, user_prefs: Dict[str, Any]) -> PlannerDecision:
        """Handle terminal/command operations"""
        command = intent.parameters.get('command', 'unknown')
        
        return PlannerDecision(
            action="ASK_CONFIRMATION",
            reason="Terminal operations always require confirmation",
            options=[
                ConfirmationOption(
                    id="RUN_SANDBOXED",
                    label="Run in sandboxed environment",
                    description=f"Execute '{command}' in the secure workspace",
                    risk_level=RiskLevel.MEDIUM
                ),
                ConfirmationOption(
                    id="SHOW_COMMAND_ONLY",
                    label="Just show me the command",
                    description="Display what I would run without executing",
                    risk_level=RiskLevel.LOW
                )
            ]
        )
    
    def _handle_build_executable_intent(self, intent: ParsedIntent, user_prefs: Dict[str, Any]) -> PlannerDecision:
        """Handle executable building requests"""
        target = intent.parameters.get('target', 'exe')
        
        return PlannerDecision(
            action="ASK_CONFIRMATION",
            reason="Build operations involve multiple steps",
            options=[
                ConfirmationOption(
                    id="AUTO_BUILD",
                    label="Let Clank handle the full build",
                    description="I'll detect your project type and build the executable automatically",
                    risk_level=RiskLevel.MEDIUM
                ),
                ConfirmationOption(
                    id="TERMINAL_BUILD",
                    label="Start a terminal build process",
                    description="I'll open a terminal and guide you through the build",
                    risk_level=RiskLevel.MEDIUM
                ),
                ConfirmationOption(
                    id="BUILD_PLAN_ONLY",
                    label="Just show me the build plan",
                    description="Outline the steps without executing them",
                    risk_level=RiskLevel.LOW
                )
            ]
        )
    
    def _handle_project_scaffold_intent(self, intent: ParsedIntent, user_prefs: Dict[str, Any]) -> PlannerDecision:
        """Handle project scaffolding requests"""
        framework = intent.parameters.get('framework', 'unknown')
        name = intent.parameters.get('name', 'new-project')
        
        return PlannerDecision(
            action="ASK_CONFIRMATION",
            reason="Project scaffolding creates many files",
            options=[
                ConfirmationOption(
                    id="SCAFFOLD_FULL",
                    label=f"Create full {framework} project",
                    description=f"Generate complete project structure for '{name}' with all dependencies",
                    risk_level=RiskLevel.MEDIUM
                ),
                ConfirmationOption(
                    id="SCAFFOLD_MINIMAL",
                    label="Create minimal structure",
                    description="Just the essential files and folders",
                    risk_level=RiskLevel.MEDIUM
                ),
                ConfirmationOption(
                    id="SHOW_STRUCTURE_ONLY",
                    label="Just show me the project structure",
                    description="Display what would be created without making any files",
                    risk_level=RiskLevel.LOW
                )
            ]
        )
    
    def _handle_configure_environment_intent(self, intent: ParsedIntent, user_prefs: Dict[str, Any]) -> PlannerDecision:
        """Handle environment configuration requests"""
        return PlannerDecision(
            action="ASK_CONFIRMATION",
            reason="Environment changes can affect system behavior",
            options=[
                ConfirmationOption(
                    id="CONFIGURE_LOCAL",
                    label="Configure workspace only",
                    description="Make changes only within the current project",
                    risk_level=RiskLevel.MEDIUM
                ),
                ConfirmationOption(
                    id="SHOW_CONFIG_ONLY",
                    label="Show configuration plan",
                    description="Display what changes would be made",
                    risk_level=RiskLevel.LOW
                )
            ]
        )
    
    def _handle_meta_request_intent(self, intent: ParsedIntent, user_prefs: Dict[str, Any]) -> PlannerDecision:
        """Handle requests about the system itself"""
        return PlannerDecision(
            action="RESPOND_ONLY",
            reason="Meta question about the system"
        )
    
    def _generate_clarification_question(self, intent: ParsedIntent) -> str:
        """Generate a clarification question for low-confidence intents"""
        if intent.confidence < 0.3:
            return "I'm not sure what you're asking for. Could you rephrase that or give me more details?"
        else:
            return f"I think you might be asking about {intent.type.value.lower().replace('_', ' ')}, but I'm not certain. Could you clarify what you'd like me to do?"