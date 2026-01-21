'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Check, X, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';

interface ToolExecutionCardProps {
  toolName: string;
  toolCallId: string;
  arguments?: Record<string, unknown>;
  result?: string | Record<string, unknown> | null;
  status: 'executing' | 'completed' | 'failed';
  txHash?: string;
  errorMessage?: string;
}

export function ToolExecutionCard({
  toolName,
  toolCallId: _toolCallId, // Prefixed to indicate intentionally unused
  arguments: toolArgs,
  result,
  status,
  txHash,
  errorMessage,
}: ToolExecutionCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusBadge = () => {
    switch (status) {
      case 'executing':
        return (
          <Badge variant="secondary">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Executing
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-600">
            <Check className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
    }
  };

  return (
    <Card className="border-primary/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-auto">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CardTitle className="text-sm font-mono">{toolName}</CardTitle>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-3">
            {/* Tool Arguments */}
            {toolArgs && Object.keys(toolArgs).length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
                  Arguments
                </h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(toolArgs, null, 2)}
                </pre>
              </div>
            )}

            {/* Error Message */}
            {status === 'failed' && errorMessage && (
              <div>
                <h4 className="text-xs font-semibold mb-2 text-destructive">
                  Error
                </h4>
                <div className="text-xs bg-destructive/10 p-3 rounded text-destructive">
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Tool Result */}
            {result && (
              <div>
                <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
                  Result
                </h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {typeof result === 'string'
                    ? result
                    : JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            {/* Transaction Link */}
            {txHash && (
              <div className="pt-2 border-t">
                <a
                  href={`https://cronoscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  View transaction on Cronoscan
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
