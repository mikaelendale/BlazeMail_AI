import AppDarkLogoIcon from './app-dark-logo-icon';
import AppLogoIcon from './app-logo-icon';

export default function AppLogo( props: React.HTMLAttributes<HTMLDivElement> ) {
    return (
        <>
            <div {...props} className="flex aspect-square size-10 items-center justify-center rounded-full bg-white text-sidebar-primary-foreground dark:bg-black">
                <AppLogoIcon className="size-7 fill-current text-white dark:text-black block dark:hidden" />
                <AppDarkLogoIcon className="size-7 fill-current text-white dark:text-black hidden dark:block" />
            </div>
            {/* <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">Blaze Mail</span>
            </div> */}
        </>
    );
}
