from typing import Dict, Any, List, Optional
import logging
import asyncio
from pathlib import Path
from .types import ParsedIntent, SkillResult, ExecutionContext, IntentType, RiskLevel

class FileAnalysisSkill:
    """Skill for analyzing uploaded files - documents, images, etc."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.supported_types = {
            # Documents
            '.pdf', '.docx', '.txt', '.md', '.csv', '.json', '.xml',
            # Images 
            '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
            # Code
            '.py', '.js', '.html', '.css', '.jsx', '.ts', '.tsx',
            # Data
            '.xlsx', '.pptx'
        }
    
    def can_handle(self, intent: ParsedIntent) -> bool:
        return (
            intent.type == IntentType.FILE_OPERATION and
            'analyze' in intent.parameters.get('operation', '').lower() or
            'file_path' in intent.parameters
        )
    
    def estimate_risk(self, intent: ParsedIntent) -> RiskLevel:
        # File analysis is generally safe (read-only)
        return RiskLevel.LOW
    
    async def execute(self, intent: ParsedIntent, ctx: ExecutionContext) -> SkillResult:
        """Execute file analysis based on intent"""
        
        file_path = intent.parameters.get('file_path')
        analysis_type = intent.parameters.get('analysis_type', 'general')
        user_question = intent.parameters.get('user_question', intent.natural_language)
        
        if not file_path:
            return SkillResult(
                status="FAILURE",
                message="No file path provided for analysis"
            )
        
        try:
            # Import analysis tools
            from extract_file_tool import extract_file_tool
            from analyze_file_tool import analyze_file_tool
            
            file_extension = Path(file_path).suffix.lower()
            
            if file_extension not in self.supported_types:
                return SkillResult(
                    status="FAILURE", 
                    message=f"File type {file_extension} not supported. Supported: {', '.join(self.supported_types)}"
                )
            
            self.logger.info(f"Analyzing file: {file_path} (type: {analysis_type})")
            
            # For images, use analyze_file_tool for deeper insights
            if file_extension in ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']:
                result = await self._analyze_image(file_path, user_question, ctx)
            
            # For documents, extract specific data or analyze content
            elif file_extension in ['.pdf', '.docx', '.txt', '.csv', '.json']:
                result = await self._analyze_document(file_path, user_question, analysis_type, ctx)
            
            # For code files, analyze structure and content
            elif file_extension in ['.py', '.js', '.html', '.css', '.jsx', '.ts', '.tsx']:
                result = await self._analyze_code(file_path, user_question, ctx)
            
            else:
                # Generic analysis
                result = await self._analyze_generic(file_path, user_question, analysis_type, ctx)
            
            return SkillResult(
                status="SUCCESS",
                message=f"Successfully analyzed {Path(file_path).name}",
                details={"analysis_result": result, "file_type": file_extension},
                artifacts=[file_path],
                next_suggestions=[
                    "Ask follow-up questions about the file content",
                    "Request specific data extraction", 
                    "Compare with other uploaded files"
                ]
            )
            
        except Exception as e:
            self.logger.error(f"File analysis failed: {e}")
            return SkillResult(
                status="FAILURE",
                message=f"Analysis failed: {str(e)}"
            )
    
    async def _analyze_image(self, file_path: str, user_question: str, ctx: ExecutionContext) -> str:
        """Analyze images with AI vision"""
        from analyze_file_tool import analyze_file_tool
        
        try:
            result = analyze_file_tool(
                source=file_path,
                analysis_type="general",
                query=user_question or "Describe this image in detail, including any text, objects, scenes, and notable features."
            )
            return result
        except Exception as e:
            self.logger.error(f"Image analysis failed: {e}")
            return f"Unable to analyze image: {str(e)}"
    
    async def _analyze_document(self, file_path: str, user_question: str, analysis_type: str, ctx: ExecutionContext) -> str:
        """Analyze documents - PDFs, Word docs, etc."""
        from extract_file_tool import extract_file_tool
        from analyze_file_tool import analyze_file_tool
        
        try:
            # First extract content
            if 'extract' in user_question.lower() or analysis_type == 'extract':
                result = extract_file_tool(
                    source=file_path,
                    prompt=user_question or "Extract all key information, data, and text content from this document"
                )
            else:
                # Then analyze for insights
                result = analyze_file_tool(
                    source=file_path,
                    analysis_type=analysis_type,
                    query=user_question or "Analyze this document and provide key insights, summary, and important findings."
                )
            
            return result
        except Exception as e:
            self.logger.error(f"Document analysis failed: {e}")
            return f"Unable to analyze document: {str(e)}"
    
    async def _analyze_code(self, file_path: str, user_question: str, ctx: ExecutionContext) -> str:
        """Analyze code files"""
        from extract_file_tool import extract_file_tool
        
        try:
            result = extract_file_tool(
                source=file_path,
                prompt=user_question or "Analyze this code: identify the main functions, purpose, dependencies, potential issues, and code quality. Provide suggestions for improvement."
            )
            return result
        except Exception as e:
            self.logger.error(f"Code analysis failed: {e}")
            return f"Unable to analyze code: {str(e)}"
    
    async def _analyze_generic(self, file_path: str, user_question: str, analysis_type: str, ctx: ExecutionContext) -> str:
        """Generic file analysis"""
        from analyze_file_tool import analyze_file_tool
        
        try:
            result = analyze_file_tool(
                source=file_path,
                analysis_type=analysis_type,
                query=user_question or "Analyze this file and provide relevant insights based on its content and type."
            )
            return result
        except Exception as e:
            self.logger.error(f"Generic analysis failed: {e}")
            return f"Unable to analyze file: {str(e)}"