from enum import Enum
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field
from datetime import datetime

class IntentType(str, Enum):
    ASK_QUESTION = "ASK_QUESTION"
    CODE_GENERATION = "CODE_GENERATION"
    FILE_OPERATION = "FILE_OPERATION"
    TERMINAL_OPERATION = "TERMINAL_OPERATION"
    BUILD_EXECUTABLE = "BUILD_EXECUTABLE"
    PROJECT_SCAFFOLD = "PROJECT_SCAFFOLD"
    CONFIGURE_ENVIRONMENT = "CONFIGURE_ENVIRONMENT"
    META_REQUEST = "META_REQUEST"  # talk about the system itself

class RiskLevel(str, Enum):
    LOW = "LOW"      # no system mutation or trivial edits
    MEDIUM = "MEDIUM"  # modifies files inside workspace
    HIGH = "HIGH"     # terminal commands or anything destructive

class ParsedIntent(BaseModel):
    type: IntentType
    confidence: float = Field(ge=0.0, le=1.0)
    natural_language: str  # original user text
    parameters: Dict[str, Any] = Field(default_factory=dict)
    risk_level: RiskLevel
    reasoning: Optional[str] = None  # why this classification

class ConfirmationOption(BaseModel):
    id: str
    label: str
    description: str
    risk_level: RiskLevel = RiskLevel.MEDIUM

class PlannerDecision(BaseModel):
    action: str  # "RESPOND_ONLY", "ASK_CONFIRMATION", "EXECUTE_PLAN", "ASK_CLARIFICATION"
    reason: str
    options: List[ConfirmationOption] = Field(default_factory=list)
    question: Optional[str] = None
    plan_steps: List[ParsedIntent] = Field(default_factory=list)

class SkillResult(BaseModel):
    status: str  # "SUCCESS", "FAILURE", "PARTIAL"
    message: str
    details: Dict[str, Any] = Field(default_factory=dict)
    artifacts: List[str] = Field(default_factory=list)  # files created/modified
    next_suggestions: List[str] = Field(default_factory=list)

class ExecutionContext(BaseModel):
    workspace_root: str
    conversation_id: str
    user_id: Optional[str] = None
    project_context: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        arbitrary_types_allowed = True

class ConversationMemory(BaseModel):
    id: str
    messages: List[Dict[str, str]] = Field(default_factory=list)
    project_context: Dict[str, Any] = Field(default_factory=dict)
    user_preferences: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProjectMemory(BaseModel):
    project_id: str
    root_path: str
    tech_stack: List[str] = Field(default_factory=list)
    recent_actions: List[Dict[str, Any]] = Field(default_factory=list)
    build_config: Dict[str, Any] = Field(default_factory=dict)
    preferences: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ClankIdentity(BaseModel):
    name: str = "Clank"
    role: str = "dev co-creator and system operator inside Emergent NEXUS"
    personality_traits: List[str] = Field(default_factory=lambda: [
        "asks before destructive actions",
        "prefers clarity over silence", 
        "thinks like a senior dev",
        "communicates in natural language"
    ])
    preferences: Dict[str, Any] = Field(default_factory=dict)
    capabilities: List[str] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserMessage(BaseModel):
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    conversation_id: str
    user_id: Optional[str] = None

class ClankResponse(BaseModel):
    content: str
    intent: Optional[ParsedIntent] = None
    decision: Optional[PlannerDecision] = None
    skill_results: List[SkillResult] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    conversation_id: str