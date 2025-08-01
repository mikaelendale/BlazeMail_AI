export default function ThreeCards() {
    return (
        <div className="max-w-7xl px-4 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Restaurant POS Card */}
                    <div className="border-2 border-accent shadow-sm bg-gradient-to-br from-orange-100  via-primary-from-primary-foreground to-primary-foreground dark:bg-gradient-to-br dark:from-orange-500/20 dark:via-primary-foreground dark:to-primary-foreground  rounded-3xl p-6 transform rotate-[-1deg] hover:rotate-0 transition-transform duration-300">
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-muted rounded-full p-2 w-10 h-10 flex items-center justify-center">
                            <span className="text-primary font-bold">1</span>
                        </div>
                    </div>

                    <h2 className="text-primary text-xl font-bold mb-3">Restaurant POS</h2>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                        A fast, intuitive point-of-sale system built for front-of-house speed — manage orders, split bills, and
                        serve customers with zero friction.
                    </p>
                </div>

                {/* Inventory Management Card */}
                <div className="border-2 border-accent shadow-sm bg-gradient-to-br from-primary-foreground via-orange-100 to-primary-from-primary-foreground dark:bg-gradient-to-br dark:from-primary-foreground dark:via-orange-500/20 dark:to-primary-from-primary-foreground rounded-3xl p-6 transform rotate-[1deg] hover:rotate-0 transition-transform duration-300">
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-muted rounded-full p-2 w-10 h-10 flex items-center justify-center">
                            <span className="text-primary font-bold">2</span>
                        </div>
                    </div>

                    <h2 className="text-primary text-xl font-bold mb-3">Inventory Management</h2>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                        Track stocks in real-time — monitor ingredients, automate reorders, reduce waste with recipes.
                    </p>
                </div>

                {/* Dashboard Card */}
                <div className="border-2 border-accent shadow-sm bg-gradient-to-br from-primary-foreground via-primary-foreground to-orange-100 dark:bg-gradient-to-br dark:from-primary-foreground dark:via-primary-foreground dark:to-orange-500/20   rounded-3xl p-6 transform rotate-[-0.5deg] hover:rotate-0 transition-transform duration-300 ">
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-muted rounded-full p-2 w-10 h-10 flex items-center justify-center">
                            <span className="text-primary font-bold">3</span>
                        </div>
                    </div>

                    <h2 className="text-primary text-xl font-bold mb-3">Dashboard</h2>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                        Stay in control with insights across your restaurant — from sales to inventory, all in one powerful
                        dashboard.
                    </p>
                </div>
            </div>
        </div>
    )
}
