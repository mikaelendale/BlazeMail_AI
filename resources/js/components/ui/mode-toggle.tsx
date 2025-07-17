import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppearance } from '@/hooks/use-appearance';

const appearances = ["light", "dark", "system"] as const;

export function ModeToggle({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const getCurrentIcon = () => {
        switch (appearance) {
            case "dark":
                return <Moon className="h-5 w-5" />;
            case "light":
                return <Sun className="h-5 w-5" />;
            default:
                return <Monitor className="h-5 w-5" />;
        }
    };

    const handleToggle = () => {
        const currentIndex = appearances.indexOf(appearance as typeof appearances[number]);
        const nextIndex = (currentIndex + 1) % appearances.length;
        updateAppearance(appearances[nextIndex]);
    };

    return (
        <div className={className} {...props}>
            <Button
                variant="link"
                size="icon"
                className="h-9 w-9 rounded-md text-primary"
                onClick={handleToggle}
            >
                {getCurrentIcon()}
                <span className="sr-only">Toggle theme</span>
            </Button>
        </div>
    );
}
