"use client"

import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { SharedData } from "@/types"
import { usePage } from "@inertiajs/react"
import { Brain, Coins, HelpCircle, Lightbulb, Target } from "lucide-react"
import { memo } from "react"

interface StrategySelectorProps {
    value: string
    onChange: (strategy: string) => void
    disabled?: boolean
    userBalance?: number
    strategyCosts?: {
        rgc: number
        few_shot: number
        chain_of_thought: number
    }
}

const strategies = [
    {
        value: "rgc",
        label: "RGC",
        description: "Fast & consistent",
        icon: Target,
        badge: "Rec",
        cost: 1,
    },
    {
        value: "few_shot",
        label: "Few-Shot",
        description: "Creative & nuanced",
        icon: Lightbulb,
        badge: "Pro",
        cost: 3,
    },
    {
        value: "chain_of_thought",
        label: "Chain-of-Thought",
        description: "Complex reasoning",
        icon: Brain,
        badge: "Max",
        cost: 5,
    },
]

export const StrategySelector = memo(function StrategySelector({
    value,
    onChange,
    disabled = false,
    strategyCosts = { rgc: 1, few_shot: 3, chain_of_thought: 5 },
}: StrategySelectorProps) {
    const { customer } = usePage<SharedData>().props
    const selectedStrategy = strategies.find((s) => s.value === value) || strategies[0]
    const selectedCost = strategyCosts[value as keyof typeof strategyCosts] || strategyCosts.rgc
    const canAfford = (cost: number) => customer.credits >= cost

    return (
        <TooltipProvider>
            <div className="space-y-2">
                {/* Compact Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <Label className="text-xs text-muted-foreground">Strategy</Label>
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs max-w-48">
                                AI approach for email generation
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Coins className="h-3 w-3" />
                        <span>{customer.credits}</span>
                    </div>
                </div>

                {/* Minimal Select */}
                <Select value={value} onValueChange={onChange} disabled={disabled}>
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue>
                            <div className="flex items-center gap-2">
                                <selectedStrategy.icon className="h-3 w-3" />
                                <span className="font-medium">{selectedStrategy.label}</span>
                                <Badge variant="outline" className=" px-1 text-xs">
                                    {selectedStrategy.badge}
                                </Badge>
                                <div className="ml-auto flex items-center gap-1">
                                    <Coins className="h-3 w-3" />
                                    <span>{selectedCost}</span>
                                </div>
                            </div>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {strategies.map((strategy) => {
                            const cost = strategyCosts[strategy.value as keyof typeof strategyCosts] || strategy.cost
                            const affordable = canAfford(cost)

                            return (
                                <SelectItem key={strategy.value} value={strategy.value} disabled={!affordable} className="h-10 text-xs">
                                    <div className="flex items-center gap-2 w-full">
                                        <strategy.icon className="h-3 w-3" />
                                        <div className="flex-1">
                                            <div className="font-medium">{strategy.label}</div>
                                            <div className="text-muted-foreground">{strategy.description}</div>
                                        </div>
                                        <Badge variant="outline" className=" px-1 text-xs">
                                            {strategy.badge}
                                        </Badge>
                                        <div className="flex items-center gap-1">
                                            <Coins className="h-3 w-3" />
                                            <span className={!affordable ? "text-destructive" : ""}>{cost}</span>
                                        </div>
                                    </div>
                                </SelectItem>
                            )
                        })}
                    </SelectContent>
                </Select>

                {/* Mini Preview */}
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded text-xs">
                    <selectedStrategy.icon className="h-3 w-3 text-primary" />
                    <span className="text-muted-foreground">{selectedStrategy.description}</span>
                    {!canAfford(selectedCost) && (
                        <Badge variant="destructive" className="h-4 px-1 text-xs ml-auto">
                            Need {selectedCost - customer.credits} more
                        </Badge>
                    )}
                </div>
            </div>
        </TooltipProvider>
    )
})
