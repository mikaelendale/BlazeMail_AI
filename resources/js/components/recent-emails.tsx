import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Link } from '@inertiajs/react';
import { Calendar, Copy, Edit, Eye, MoreHorizontal, Trash2, TrendingUp } from 'lucide-react';

export function RecentEmails({ emails }) {
    const getStatusColor = (status) => {
        switch (status) {
            case 'sent':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'draft':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'scheduled':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const getToneColor = (tone) => {
        switch (tone.toLowerCase()) {
            case 'professional':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'casual':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'formal':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    if (!emails || emails.length === 0) {
        return (
            <div className="p-8 text-center">
                <h3 className="mb-2 text-lg font-medium text-slate-900">No emails yet</h3>
                <p className="mb-4 text-slate-600">Get started by generating your first email template</p>
                <Link href="/email/generate">
                    <Button>Generate Your First Email</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="divide-y divide-primary-foreground">
            {emails.map((email, index) => (
                <div key={email.id} className="p-6 transition-colors hover:bg-primary-foreground">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <div className="mb-2 flex items-center gap-3">
                                <h3 className="truncate font-semibold text-primary">{email.subject}</h3>
                                <Badge variant="outline" className={`text-xs ${getStatusColor(email.purpose)}`}>
                                    {email.purpose}
                                </Badge> 
                            </div>

                            <p className="mb-3 line-clamp-2 text-sm text-secondary">{email.preview}</p>

                            <div className="flex items-center gap-4 text-xs text-secondary">
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(email.created_at).toLocaleDateString()}
                                </div>
                                <Separator orientation="vertical" className="h-3" />
                                <Badge variant="outline" className={`text-xs ${getToneColor(email.tone)}`}>
                                    {email.tone}
                                </Badge>
                                <Separator orientation="vertical" className="h-3" />
                                <span>{email.targetAudience}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link href={`/email/${email.id}`}>
                                <Button variant="outline" size="sm" className="bg-transparent hover:bg-primary-foreground">
                                    <Eye className="mr-1 h-4 w-4" />
                                    View
                                </Button>
                            </Link>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="hover:bg-primary-foreground">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
