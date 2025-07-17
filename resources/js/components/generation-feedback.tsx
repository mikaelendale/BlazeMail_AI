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
            <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Generation Failed</AlertTitle>
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
            <Alert className="mb-4 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Email Generated Successfully</AlertTitle>
                <AlertDescription className="mt-2 flex items-center gap-2 text-green-700">
                    <div className="flex items-center gap-2">
                        {strategy && (
                            <Badge variant="outline" className="text-xs">
                                <Zap className="mr-1 h-3 w-3" />
                                {strategy.toUpperCase()}
                            </Badge>
                        )}
                        {generationTime && (
                            <Badge variant="outline" className="text-xs">
                                <Clock className="mr-1 h-3 w-3" />
                                {generationTime}ms
                            </Badge>
                        )}
                    </div>
                </AlertDescription>
            </Alert>
        );
    }

    return null;
});
