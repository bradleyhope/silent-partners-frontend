/**
 * File Drop Zone for Silent Partners
 * 
 * Provides drag-and-drop functionality for importing files:
 * - JSON files → Direct import dialog (merge/replace network data)
 * - PDF files → Extract text and send to AI for entity extraction
 * - Other documents → Future support for DOCX, XLSX, CSV
 * 
 * Shows a visual overlay when dragging files over the canvas.
 */

import { useState, useCallback, useEffect } from 'react';
import { FileJson, Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ImportJsonDialog, { validateImportData, parseImportData } from './ImportJsonDialog';
import { useNetwork } from '@/contexts/NetworkContext';
import { generateId, Entity, Relationship } from '@/lib/store';
import { extractTextFromPdf, isPdfFile } from '@/lib/pdf-utils';
import api, { DocumentTooLargeError } from '@/lib/api';

interface FileDropZoneProps {
  children: React.ReactNode;
}

// Supported file types
const SUPPORTED_EXTENSIONS = ['.json', '.pdf', '.docx', '.xlsx', '.csv', '.txt'];
const MAX_PDF_PAGES = 20;

// Get file type category
function getFileCategory(file: File): 'json' | 'pdf' | 'document' | 'unsupported' {
  const name = file.name.toLowerCase();
  const type = file.type;
  
  if (name.endsWith('.json') || type === 'application/json') {
    return 'json';
  }
  if (name.endsWith('.pdf') || type === 'application/pdf') {
    return 'pdf';
  }
  if (name.endsWith('.docx') || name.endsWith('.xlsx') || name.endsWith('.csv') || name.endsWith('.txt')) {
    return 'document';
  }
  return 'unsupported';
}

export default function FileDropZone({ children }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importedData, setImportedData] = useState<ReturnType<typeof parseImportData>>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const { network, dispatch, addEntitiesAndRelationships, clearNetwork } = useNetwork();
  
  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if dragging files
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set to false if leaving the drop zone entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  // Process JSON file
  const processJsonFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate the data
      const validation = validateImportData(data);
      
      if (!validation.isValid) {
        toast.error('Invalid JSON format', {
          description: validation.errors[0],
        });
        return;
      }
      
      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Import warnings:', validation.warnings);
      }
      
      // Parse and normalize the data
      const parsed = parseImportData(data);
      if (!parsed) {
        toast.error('Failed to parse JSON data');
        return;
      }
      
      setImportedData(parsed);
      setShowImportDialog(true);
    } catch (error) {
      console.error('JSON parse error:', error);
      toast.error('Failed to parse JSON file', {
        description: error instanceof Error ? error.message : 'Invalid JSON syntax',
      });
    }
  }, []);
  
  // Process PDF file
  const processPdfFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProcessingStatus('Reading PDF...');
    
    try {
      // Extract text from PDF
      const pdfResult = await extractTextFromPdf(file, (progress) => {
        setProcessingStatus(progress.message);
      });
      
      if (!pdfResult.text.trim()) {
        toast.error('No text could be extracted from the PDF');
        return;
      }
      
      // Check page count
      if (pdfResult.pageCount > MAX_PDF_PAGES) {
        toast.error(
          `Document too large: ${pdfResult.pageCount} pages detected. Maximum allowed is ${MAX_PDF_PAGES} pages.`,
          { duration: 8000 }
        );
        return;
      }
      
      setProcessingStatus(`Extracted ${pdfResult.pageCount} pages. Analyzing with AI...`);
      
      // Send to AI for entity extraction
      const result = await api.extract(pdfResult.text, 'gpt-5');
      
      if (!result.entities || result.entities.length === 0) {
        toast.warning('No entities found in the PDF');
        return;
      }
      
      // Convert API response to our format
      const apiIdToOurId = new Map<string, string>();
      
      const entities: Entity[] = result.entities.map((e) => {
        const ourId = generateId();
        if (e.id) apiIdToOurId.set(e.id, ourId);
        apiIdToOurId.set(e.name.toLowerCase(), ourId);
        
        return {
          id: ourId,
          name: e.name,
          type: (e.type?.toLowerCase() || 'unknown') as Entity['type'],
          description: e.description,
          importance: e.importance || 5,
          source_type: 'document' as const,
          created_at: new Date().toISOString(),
        };
      });
      
      const relationships: Relationship[] = result.relationships
        .map((r) => {
          const sourceId = apiIdToOurId.get(r.source) || apiIdToOurId.get(r.source.toLowerCase());
          const targetId = apiIdToOurId.get(r.target) || apiIdToOurId.get(r.target.toLowerCase());
          
          if (!sourceId || !targetId) return null;
          
          return {
            id: generateId(),
            source: sourceId,
            target: targetId,
            type: r.type,
            label: r.label,
          } as Relationship;
        })
        .filter((r): r is Relationship => r !== null);
      
      // Add to network
      addEntitiesAndRelationships(entities, relationships);
      
      toast.success(
        `Extracted ${entities.length} entities and ${relationships.length} connections from PDF`
      );
    } catch (error) {
      console.error('PDF processing error:', error);
      
      if (error instanceof DocumentTooLargeError) {
        toast.error(
          `Document too large: ~${error.estimatedPages} pages. Maximum is ${error.maxPages} pages.`,
          { duration: 8000 }
        );
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to process PDF');
      }
    } finally {
      setIsProcessing(false);
      setProcessingStatus(null);
    }
  }, [addEntitiesAndRelationships]);
  
  // Process other document types (placeholder for future)
  const processDocumentFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    // For now, show a message about upcoming support
    toast.info(`${ext?.toUpperCase()} support coming soon`, {
      description: 'Currently only JSON and PDF files are fully supported. Drop a PDF or JSON file to import.',
    });
  }, []);
  
  // Main drop handler
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (isProcessing) {
      toast.warning('Please wait for the current file to finish processing');
      return;
    }
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    const file = files[0]; // Process first file only
    const category = getFileCategory(file);
    
    switch (category) {
      case 'json':
        await processJsonFile(file);
        break;
      case 'pdf':
        await processPdfFile(file);
        break;
      case 'document':
        await processDocumentFile(file);
        break;
      case 'unsupported':
        toast.error('Unsupported file type', {
          description: `Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`,
        });
        break;
    }
  }, [isProcessing, processJsonFile, processPdfFile, processDocumentFile]);
  
  // Handle import action from dialog
  const handleImport = useCallback((mode: 'merge' | 'replace') => {
    if (!importedData) return;
    
    if (mode === 'replace') {
      // Clear existing network and set new data
      dispatch({ type: 'CLEAR_NETWORK' });
      
      // Set title and description if provided
      if (importedData.title) {
        dispatch({ type: 'SET_TITLE', payload: importedData.title });
      }
      if (importedData.description) {
        dispatch({ type: 'SET_DESCRIPTION', payload: importedData.description });
      }
      if (importedData.investigationContext) {
        dispatch({ type: 'SET_INVESTIGATION_CONTEXT', payload: importedData.investigationContext });
      }
      
      // Add all entities
      importedData.entities.forEach(entity => {
        dispatch({ type: 'ADD_ENTITY', payload: entity });
      });
      
      // Add all relationships
      importedData.relationships.forEach(rel => {
        dispatch({ type: 'ADD_RELATIONSHIP', payload: rel });
      });
      
      toast.success(`Imported ${importedData.entities.length} entities and ${importedData.relationships.length} relationships`);
    } else {
      // Merge mode - add only new entities and relationships
      const existingEntityIds = new Set(network.entities.map(e => e.id));
      const existingEntityNames = new Set(network.entities.map(e => e.name.toLowerCase()));
      const existingRelIds = new Set(network.relationships.map(r => r.id));
      
      let addedEntities = 0;
      let addedRelationships = 0;
      let skippedEntities = 0;
      
      // Map old IDs to new IDs for entities that get renamed
      const idMapping = new Map<string, string>();
      
      // Add entities, skipping duplicates by name
      importedData.entities.forEach(entity => {
        if (existingEntityNames.has(entity.name.toLowerCase())) {
          // Find the existing entity to map the ID
          const existing = network.entities.find(e => e.name.toLowerCase() === entity.name.toLowerCase());
          if (existing) {
            idMapping.set(entity.id, existing.id);
          }
          skippedEntities++;
          return;
        }
        
        // Generate new ID if it conflicts
        let newId = entity.id;
        if (existingEntityIds.has(entity.id)) {
          newId = generateId();
          idMapping.set(entity.id, newId);
        }
        
        dispatch({ 
          type: 'ADD_ENTITY', 
          payload: { ...entity, id: newId } 
        });
        existingEntityIds.add(newId);
        existingEntityNames.add(entity.name.toLowerCase());
        addedEntities++;
      });
      
      // Add relationships, updating IDs as needed
      importedData.relationships.forEach(rel => {
        // Map source and target IDs
        const sourceId = idMapping.get(rel.source) || rel.source;
        const targetId = idMapping.get(rel.target) || rel.target;
        
        // Skip if relationship already exists (same source-target pair)
        const existingRel = network.relationships.find(
          r => (r.source === sourceId && r.target === targetId) ||
               (r.source === targetId && r.target === sourceId)
        );
        if (existingRel) return;
        
        // Generate new ID if needed
        let newId = rel.id;
        if (existingRelIds.has(rel.id)) {
          newId = generateId();
        }
        
        dispatch({
          type: 'ADD_RELATIONSHIP',
          payload: { ...rel, id: newId, source: sourceId, target: targetId },
        });
        addedRelationships++;
      });
      
      if (skippedEntities > 0) {
        toast.success(`Added ${addedEntities} entities and ${addedRelationships} relationships`, {
          description: `${skippedEntities} duplicate entities were skipped`,
        });
      } else {
        toast.success(`Added ${addedEntities} entities and ${addedRelationships} relationships`);
      }
    }
    
    setShowImportDialog(false);
    setImportedData(null);
  }, [importedData, network, dispatch]);
  
  // Global keyboard shortcut for paste (Ctrl/Cmd + V)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Only handle if not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const text = e.clipboardData?.getData('text');
      if (!text) return;
      
      // Try to parse as JSON
      try {
        const data = JSON.parse(text);
        const validation = validateImportData(data);
        
        if (validation.isValid) {
          e.preventDefault();
          const parsed = parseImportData(data);
          if (parsed) {
            setImportedData(parsed);
            setShowImportDialog(true);
          }
        }
      } catch {
        // Not JSON, ignore
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);
  
  return (
    <div
      className="relative w-full h-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      
      {/* Drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-amber-50/90 backdrop-blur-sm border-4 border-dashed border-amber-400 rounded-lg transition-all">
          <div className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <Upload className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold text-amber-800 mb-2">
              Drop File to Import
            </h3>
            <p className="text-amber-600 text-sm max-w-xs mx-auto mb-3">
              Drop a file to import data into your network.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <span className="px-2 py-1 bg-amber-200/50 rounded text-amber-700 flex items-center gap-1">
                <FileJson className="w-3 h-3" /> JSON
              </span>
              <span className="px-2 py-1 bg-amber-200/50 rounded text-amber-700 flex items-center gap-1">
                <FileText className="w-3 h-3" /> PDF
              </span>
              <span className="px-2 py-1 bg-amber-200/30 rounded text-amber-600/70">
                DOCX (soon)
              </span>
              <span className="px-2 py-1 bg-amber-200/30 rounded text-amber-600/70">
                XLSX (soon)
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Processing overlay */}
      {isProcessing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center p-8">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-amber-600 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Processing Document
            </h3>
            <p className="text-gray-600 text-sm">
              {processingStatus || 'Please wait...'}
            </p>
          </div>
        </div>
      )}
      
      {/* Import dialog */}
      <ImportJsonDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        importedData={importedData}
        onImport={handleImport}
        currentEntityCount={network.entities.length}
        currentRelationshipCount={network.relationships.length}
      />
    </div>
  );
}
