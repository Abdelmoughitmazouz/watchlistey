import React from 'react';
import { Logo, XIcon, FacebookIconV2, InstagramIcon, YouTubeIcon, ArrowRightIcon, DiscordIcon } from '../constants';
import { useTranslation } from 'react-i18next';

interface FooterProps {
    onNavigate?: (path: string) => void;
}

const socialLinks = [
    { name: 'X', href: 'https://x.com/watchlistey', icon: XIcon },
    { name: 'Instagram', href: 'https://instagram.com/watchlistey', icon: InstagramIcon },
    { name: 'YouTube', href: 'https://youtube.com/@watchlistey', icon: YouTubeIcon },
    { name: 'Facebook', href: 'https://facebook.com/watchlistey', icon: FacebookIconV2 },
    { name: 'Discord', href: 'https://discord.gg/WQ6hXPrvdd', icon: DiscordIcon },
];

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
    const { t } = useTranslation();

    const footerLinkColumns = [
        {
            title: t('footer.product'),
            links: [
                { name: t('footer.links.features'), href: '/features' },
                { name: t('footer.links.mobile'), href: '/mobile-app' },
            ],
        },
        {
            title: t('footer.company'),
            links: [
                { name: t('footer.links.about'), href: '/about' },
                { name: t('footer.links.contact'), href: '/contact' },
            ],
        },
        {
            title: t('footer.resources'),
            links: [
                { name: t('footer.links.help'), href: '/help' },
                { name: t('footer.links.support'), href: '/support' },
                { name: t('footer.links.community'), href: '/community' },
            ],
        },
        {
            title: t('footer.legal'),
            links: [
                { name: t('footer.links.terms'), href: '/terms' },
                { name: t('footer.links.privacy'), href: '/privacy' },
                { name: t('footer.links.cookies'), href: '/cookies' },
            ],
        },
    ];
    
    const handleLinkClick = (e: React.MouseEvent, href: string) => {
        if (onNavigate && href.startsWith('/')) {
            e.preventDefault();
            onNavigate(href);
        }
    };

    return (
        <footer className="bg-transparent pt-16 pb-8 transition-colors duration-200">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
                
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 mb-16">
                    {/* Brand & Newsletter Column */}
                    <div className="xl:col-span-4 flex flex-col gap-6">
                        <Logo />
                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
                            {t('seo.default_desc')}
                        </p>
                        
                        <div className="mt-2">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{t('footer.subscribe')}</h4>
                            <form className="flex gap-2 max-w-sm" onSubmit={(e) => e.preventDefault()}>
                                <input 
                                    type="email" 
                                    placeholder={t('footer.placeholder')}
                                    className="flex-1 bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all placeholder:text-gray-400 rtl:text-end"
                                />
                                <button className="px-4 py-2.5 bg-brand-primary text-black font-bold rounded-lg hover:bg-brand-primary/90 transition-all hover:scale-105 flex items-center justify-center rtl:rotate-180">
                                    <ArrowRightIcon className="w-5 h-5" />
                                </button>
                            </form>
                            <p className="text-xs text-gray-400 mt-2">{t('footer.privacy_note')} <a href="/privacy" onClick={(e) => handleLinkClick(e, '/privacy')} className="underline hover:text-gray-500">{t('footer.links.privacy').toLowerCase()}</a>.</p>
                        </div>
                    </div>

                    {/* Links Grid */}
                    <div className="xl:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8 xl:ps-8">
                        {footerLinkColumns.map(col => (
                            <div key={col.title}>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white tracking-wide uppercase mb-4">{col.title}</h4>
                                <ul className="flex flex-col gap-3">
                                    {col.links.map(link => (
                                        <li key={link.name}>
                                            <a 
                                                href={link.href} 
                                                onClick={(e) => handleLinkClick(e, link.href)} 
                                                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-primary dark:hover:text-brand-primary transition-colors inline-flex items-center gap-1 group"
                                            >
                                                {link.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Bottom Bar */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center text-sm text-gray-500 dark:text-gray-400 font-medium">
                        <p>© 2025 {t('footer.rights')}</p>
                        <div className="flex gap-6">
                            <a href="/terms" onClick={(e) => handleLinkClick(e, '/terms')} className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">{t('footer.links.terms')}</a>
                            <a href="/privacy" onClick={(e) => handleLinkClick(e, '/privacy')} className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">{t('footer.links.privacy')}</a>
                            <a href="/cookies" onClick={(e) => handleLinkClick(e, '/cookies')} className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">{t('footer.links.cookies')}</a>
                        </div>
                    </div>

                    <ul className="flex gap-4">
                        {socialLinks.map(link => (
                           <li key={link.name}>
                               <a 
                                   href={link.href}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   aria-label={link.name} 
                                   className="text-gray-500 dark:text-gray-400 hover:text-brand-primary dark:hover:text-brand-primary transition-all duration-300 transform hover:-translate-y-1"
                               >
                                   <link.icon className="w-6 h-6" />
                               </a>
                           </li>
                        ))}
                    </ul>
                </div>
            </div>
        </footer>
    );
};

export default Footer;