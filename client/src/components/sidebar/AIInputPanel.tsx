/**
 * Silent Partners - AI Input Panel
 *
 * Unified AI input with orchestrator, mode toggle, and PDF upload.
 */

import { useState, useCallback } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ChevronDown, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useNetwork } from '@/contexts/NetworkContext';
import { extractTextFromPdf, isPdfFile } from '@/lib/pdf-utils';
import api, { DocumentTooLargeError } from '@/lib/api';
import { generateId, Entity, Relationship } from '@/lib/store';
import UnifiedAIInput from '@/components/UnifiedAIInput';
import { NarrativeEvent } from '@/components/NarrativePanel';

interface AIInputPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNarrativeEvent?: (event: Omit<NarrativeEvent, 'id' | 'timestamp'>) => void;
  initialQuery?: string;
}

const MAX_PAGES = 20;

export default function AIInputPanel({
  isOpen,
  onOpenChange,
  onNarrativeEvent,
  initialQuery,
}: AIInputPanelProps) {
  const { network, clearNetwork, addEntitiesAndRelationships } = useNetwork();

  const [aiMode, setAiMode] = useState<'add' | 'new'>('add');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Handle PDF upload - client-side extraction then AI analysis
  const handlePdfUpload = useCallback(
    async (file: File) => {
      if (!isPdfFile(file)) {
        toast.error('Please upload a PDF file');
        return;
      }

      setIsProcessing(true);
      setUploadProgress('Reading PDF...');

      try {
        // Step 1: Extract text from PDF client-side
        const pdfResult = await extractTextFromPdf(file, (progress) => {
          setUploadProgress(progress.message);
        });

        if (!pdfResult.text.trim()) {
          toast.error('No text could be extracted from the PDF');
          return;
        }

        // Check page count before sending to API
        if (pdfResult.pageCount > MAX_PAGES) {
          toast.error(
            `Document too large: ${pdfResult.pageCount} pages detected. Maximum allowed is ${MAX_PAGES} pages. Please upload a smaller document or split it into sections.`,
            { duration: 8000 }
          );
          return;
        }

        setUploadProgress(`Extracted ${pdfResult.pageCount} pages. Analyzing with AI...`);

        // Step 2: Send extracted text to AI for entity/relationship extraction
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
            type: (e.type?.toLowerCase() || 'organization') as Entity['type'],
            description: e.description,
            importance: e.importance || 5,
            source_type: 'document' as const,
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

        if (aiMode === 'new') clearNetwork();
        addEntitiesAndRelationships(entities, relationships);

        toast.success(
          `Extracted ${entities.length} entities and ${relationships.length} connections from PDF (${pdfResult.pageCount} pages)`
        );
      } catch (error) {
        console.error('PDF upload error:', error);

        // Handle specific error types
        if (error instanceof DocumentTooLargeError) {
          toast.error(
            `Document too large: ~${error.estimatedPages} pages detected. Maximum allowed is ${error.maxPages} pages. Please upload a smaller document.`,
            { duration: 8000 }
          );
        } else {
          toast.error(error instanceof Error ? error.message : 'Failed to process PDF');
        }
      } finally {
        setIsProcessing(false);
        setUploadProgress(null);
      }
    },
    [aiMode, addEntitiesAndRelationships, clearNetwork]
  );

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) handlePdfUpload(file);
    },
    [handlePdfUpload]
  );

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-sidebar-accent/50 transition-colors">
        <span className="section-header mb-0 border-0 pb-0">AI</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? '' : '-rotate-90'}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 space-y-3">
        {/* Unified AI Input with Orchestrator */}
        <UnifiedAIInput
          onNarrativeEvent={onNarrativeEvent}
          clearFirst={aiMode === 'new'}
          investigationContext={network.investigationContext}
          initialQuery={initialQuery}
        />

        <RadioGroup value={aiMode} onValueChange={(v) => setAiMode(v as 'add' | 'new')} className="flex gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="add" id="add" />
            <Label htmlFor="add" className="text-xs text-muted-foreground cursor-pointer">
              Add to current
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="new" id="new" />
            <Label htmlFor="new" className="text-xs text-muted-foreground cursor-pointer">
              Start new
            </Label>
          </div>
        </RadioGroup>

        {/* PDF Upload Drop Zone */}
        <div className="pt-2 border-t border-border">
          <label
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative block border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30'
            } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePdfUpload(file);
              }}
              className="sr-only"
              disabled={isProcessing}
            />
            {uploadProgress ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">{uploadProgress}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 pointer-events-none">
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Drop PDF here or click to upload</span>
              </div>
            )}
          </label>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
