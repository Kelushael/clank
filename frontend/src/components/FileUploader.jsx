import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Upload, File, Image, FileText, Code, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FileUploader = ({ onFileAnalysis }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const allowedTypes = {
    'image/*': { icon: Image, color: 'text-green-500' },
    'application/pdf': { icon: FileText, color: 'text-red-500' },
    'application/msword': { icon: FileText, color: 'text-blue-500' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, color: 'text-blue-500' },
    'text/*': { icon: Code, color: 'text-purple-500' },
    'application/json': { icon: Code, color: 'text-yellow-500' }
  };

  const getFileIcon = (fileType) => {
    for (const [type, config] of Object.entries(allowedTypes)) {
      if (fileType?.match(type.replace('*', '.*'))) {
        return config;
      }
    }
    return { icon: File, color: 'text-zinc-400' };
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    uploadFiles(files);
  };

  const uploadFiles = async (files) => {
    setIsUploading(true);
    
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${BACKEND_URL}/api/files/upload`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Upload failed');
        }
        
        const result = await response.json();
        
        const uploadedFile = {
          id: result.file_id,
          name: result.filename,
          size: file.size,
          type: file.type,
          uploadedAt: new Date()
        };
        
        setUploadedFiles(prev => [...prev, uploadedFile]);
        toast.success(`Uploaded ${file.name}`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const analyzeFile = async (file) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/files/analyze/${file.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify('Please analyze this file')
      });
      
      if (!response.ok) {
        throw new Error('Analysis failed');
      }
      
      const result = await response.json();
      
      if (onFileAnalysis) {
        onFileAnalysis(`📎 **Analysis of ${file.name}:**\\n\\n${result.analysis}`);
      }
      
      toast.success(`Analyzed ${file.name}`);
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error(`Analysis failed: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        className={`border-2 border-dashed transition-all ${
          isDragOver 
            ? 'border-emerald-400 bg-emerald-50/10' 
            : 'border-zinc-600 bg-black/20'
        } backdrop-blur`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-6 text-center">
          <Upload className={`w-8 h-8 mx-auto mb-3 ${isDragOver ? 'text-emerald-400' : 'text-zinc-400'}`} />
          <p className="text-zinc-300 mb-2">
            Drop files here or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-emerald-400 hover:underline"
              disabled={isUploading}
            >
              browse
            </button>
          </p>
          <p className="text-xs text-zinc-500">
            Images, PDFs, documents, code files
          </p>
        </div>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.docx,.txt,.md,.csv,.json,.py,.js,.html,.css,.jsx,.ts,.tsx"
      />

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm text-zinc-400">Recent uploads:</h3>
          {uploadedFiles.map((file) => {
            const { icon: IconComponent, color } = getFileIcon(file.type);
            return (
              <Card key={file.id} className="p-3 bg-black/40 border-zinc-700/50 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className={`w-4 h-4 ${color}`} />
                    <div>
                      <p className="text-sm text-zinc-200 font-medium">{file.name}</p>
                      <p className="text-xs text-zinc-500">
                        {(file.size / 1024).toFixed(1)} KB • {file.uploadedAt.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => analyzeFile(file)}
                      className="text-xs bg-emerald-900/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40"
                    >
                      Analyze
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(file.id)}
                      className="text-zinc-400 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {isUploading && (
        <div className="text-center text-zinc-400 text-sm">
          Uploading files...
        </div>
      )}
    </div>
  );
};

export default FileUploader;