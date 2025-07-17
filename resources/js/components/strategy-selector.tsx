'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Brain, HelpCircle, Lightbulb, Target } from 'lucide-react';
import { memo } from 'react';

interface StrategySelectorProps {
    value: string;
    onChange: (strategy: string) => void;
    disabled?: boolean;
}

const strategies = [
    {
        value: 'rgc',
        label: 'RGC Framework',
        description: 'Role-Goal-Context approach for consistent, professional emails',
        icon: Target,
        badge: 'Recommended',
        badgeVariant: 'default' as const,
        features: ['Fast generation', 'Consistent quality', 'Professional tone'],
    },
    {
        value: 'few_shot',
        label: 'Few-Shot Learning',
        description: 'Uses multiple examples for creative, nuanced emails',
        icon: Lightbulb,
        badge: 'Creative',
        badgeVariant: 'secondary' as const,
        features: ['High creativity', 'Context-aware', 'Nuanced output'],
    },
    {
        value: 'chain_of_thought',
        label: 'Chain of Thought',
        description: 'Step-by-step reasoning for complex email scenarios',
        icon: Brain,
        badge: 'Advanced',
        badgeVariant: 'outline' as const,
        features: ['Detailed reasoning', 'Complex scenarios', 'Transparent logic'],
    },
];

export const StrategySelector = memo(function StrategySelector({ value, onChange, disabled = false }: StrategySelectorProps) {
    const selectedStrategy = strategies.find((s) => s.value === value) || strategies[0];

    return (
        <TooltipProvider>
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium text-muted-foreground">AI Strategy</Label>
                    <Tooltip>
                        <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            <p>Choose how the AI approaches email generation</p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                <Select value={value} onValueChange={onChange} disabled={disabled}>
                    <SelectTrigger className="h-10 rounded-xl border-border text-sm">
                        <SelectValue>
                            <div className="flex items-center gap-2">
                                <selectedStrategy.icon className="h-4 w-4" />
                                <span>{selectedStrategy.label}</span>
                                <Badge variant={selectedStrategy.badgeVariant} className="text-xs">
                                    {selectedStrategy.badge}
                                </Badge>
                            </div>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {strategies.map((strategy) => (
                            <SelectItem key={strategy.value} value={strategy.value} className="p-0">
                                <Card className="w-full border-none shadow-none">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-2">
                                            <strategy.icon className="h-4 w-4" />
                                            <CardTitle className="text-sm">{strategy.label}</CardTitle>
                                            <Badge variant={strategy.badgeVariant} className="text-xs">
                                                {strategy.badge}
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-xs">{strategy.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex flex-wrap gap-1">
                                            {strategy.features.map((feature, index) => (
                                                <Badge key={index} variant="outline" className="text-xs">
                                                    {feature}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Quick Strategy Info */}
                <div className="rounded-lg bg-muted/30 p-3">
                    <div className="flex items-start gap-2">
                        <selectedStrategy.icon className="mt-0.5 h-4 w-4 text-primary" />
                        <div className="flex-1">
                            <p className="text-xs font-medium text-foreground">{selectedStrategy.label}</p>
                            <p className="text-xs text-muted-foreground">{selectedStrategy.description}</p>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
});
