import { Link, router } from '@inertiajs/react';

export default function Pagination({ pagination }) {
    return (
        <div className="py-10 text-center">
            <div className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{pagination.from}</span> to <span className="font-medium">{pagination.to}</span> of{' '}
                <span className="font-medium">{pagination.total}</span> results
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                {pagination.links.map((link) =>
                    link.url ? (
                        <Link
                            className={`mx-0.5 rounded-md border px-2 py-1 text-xs transition-colors sm:mx-1 sm:px-3 sm:py-2 sm:text-base ${
                                link.active ? 'bg-primary-foreground font-semibold text-primary' : 'bg-accent'
                            }`}
                            key={link.label}
                            href={link.url}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span
                            className="mx-0.5 cursor-not-allowed rounded-md border border-gray-200 bg-background px-2 py-1 text-xs text-gray-400 sm:mx-1 sm:px-3 sm:py-2 sm:text-base dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500"
                            key={link.label}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ),
                )}
            </div>
        </div>
    );
}
