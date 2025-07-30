'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { memo } from 'react';

interface GenerationFeedbackProps {
    error?: string;
    success?: boolean;
    strategy?: string;
    generationTime?: number;
    onRetry?: () => void;
}

export const GenerationFeedback = memo(function GenerationFeedback({ error, success, strategy, generationTime, onRetry }: GenerationFeedbackProps) {
    if (error) {
        return (
            <Alert variant="destructive" className="border-none shadow-none">
                <AlertDescription className="mt-2">
                    {error}
                    {onRetry && (
                        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 bg-transparent">
                            Try Again
                        </Button>
                    )}
                </AlertDescription>
            </Alert>
        );
    }
    if (success) {
        return (
            <div className='flex items-center justify-between border-b border-border/50 bg-card/95 p-4 backdrop-blur-sm'>
                <span>{strategy && (
                    <Badge className="">{strategy}</Badge>
                )}</span>
                {generationTime && (
                    <div className="mt-2 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{generationTime} seconds</span>
                    </div>
                )}
            </div>
        );
    }
    return null;
});
