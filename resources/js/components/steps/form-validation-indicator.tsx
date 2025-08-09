'use client';

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FormValidationIndicatorProps {
    isValid: boolean;
    isRequired: boolean;
    isSkippable: boolean;
    fieldCount?: {
        completed: number;
        total: number;
    };
}

export function FormValidationIndicator({
    isValid,
    isRequired,
    isSkippable,
    fieldCount
}: FormValidationIndicatorProps) {
    if (isValid) {
        return (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Complete
            </Badge>
        );
    }

    if (isRequired) {
        return (
            <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                <XCircle className="w-3 h-3 mr-1" />
                Required
                {fieldCount && ` (${fieldCount.completed}/${fieldCount.total})`}
            </Badge>
        );
    }

    if (isSkippable) {
        return (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                <AlertCircle className="w-3 h-3 mr-1" />
                Optional
            </Badge>
        );
    }

    return null;
}
