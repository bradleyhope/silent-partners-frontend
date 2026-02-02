/**
 * Silent Partners - Context Editor
 * 
 * Form for editing investigation context.
 * Extracted from InvestigativeAssistant.tsx.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Check } from 'lucide-react';
import { InvestigationContext } from './types';

interface ContextEditorProps {
  context: InvestigationContext;
  onSave: (context: InvestigationContext) => void;
  onCancel: () => void;
}

export function ContextEditor({ context, onSave, onCancel }: ContextEditorProps) {
  const [editedContext, setEditedContext] = useState(context);
  const [newQuestion, setNewQuestion] = useState('');

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setEditedContext(prev => ({
        ...prev,
        keyQuestions: [...prev.keyQuestions, newQuestion.trim()]
      }));
      setNewQuestion('');
    }
  };

  const removeQuestion = (index: number) => {
    setEditedContext(prev => ({
      ...prev,
      keyQuestions: prev.keyQuestions.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
      <div>
        <label className="text-[10px] font-medium text-muted-foreground">Topic</label>
        <Input
          value={editedContext.topic}
          onChange={(e) => setEditedContext(prev => ({ ...prev, topic: e.target.value }))}
          className="h-7 text-xs mt-1"
          placeholder="e.g., 1MDB Financial Scandal"
        />
      </div>
      <div>
        <label className="text-[10px] font-medium text-muted-foreground">Domain</label>
        <Input
          value={editedContext.domain}
          onChange={(e) => setEditedContext(prev => ({ ...prev, domain: e.target.value }))}
          className="h-7 text-xs mt-1"
          placeholder="e.g., Financial Crime, Politics"
        />
      </div>
      <div>
        <label className="text-[10px] font-medium text-muted-foreground">Focus</label>
        <Input
          value={editedContext.focus}
          onChange={(e) => setEditedContext(prev => ({ ...prev, focus: e.target.value }))}
          className="h-7 text-xs mt-1"
          placeholder="e.g., Following the money trail"
        />
      </div>
      <div>
        <label className="text-[10px] font-medium text-muted-foreground">Key Questions</label>
        <div className="space-y-1 mt-1">
          {editedContext.keyQuestions.map((q, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="text-xs flex-1 bg-background rounded px-2 py-1">{q}</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeQuestion(i)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <div className="flex gap-1">
            <Input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="h-7 text-xs"
              placeholder="Add a key question..."
              onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
            />
            <Button variant="outline" size="sm" className="h-7 px-2" onClick={addQuestion}>
              Add
            </Button>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" className="h-7 text-xs" onClick={() => onSave(editedContext)}>
          <Check className="w-3 h-3 mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
}

export default ContextEditor;
