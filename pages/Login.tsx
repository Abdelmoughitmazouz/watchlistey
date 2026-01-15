import React, { useState } from 'react';
import AuthLayout from '../components/AuthLayout';
import { EyeIcon, EyeOffIcon } from '../constants';
import Checkbox from '../components/Checkbox';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Logger } from '../lib/logger';
import { useTranslation } from 'react-i18next';

interface LoginProps {
    onLogin: () => void;
    onNavigate: (path: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigate }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured) {
            // Mock login for demo mode
            setTimeout(() => {
                onLogin();
            }, 500);
            return;
        }

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                setError(signInError.message);
                setLoading(false);
            } else {
                onLogin();
            }
        } catch (err: any) {
             Logger.error("Login error:", err);
             let msg = "Unable to connect to the server. Please check your internet connection or project URL.";
             if (err.message === "Failed to fetch") {
                 msg = "Connection failed. If you are the developer, please check your Supabase CORS configuration.";
             }
             setError(msg);
             setLoading(false);
        }
    };

    const inputClasses = "appearance-none block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] text-gray-900 dark:text-white rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary sm:text-sm transition-all";

    return (
        <AuthLayout 
            title={t('auth.welcome_back')}
            subtitle={t('auth.welcome_subtitle')}
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg text-sm border border-red-200 dark:border-red-800">{error}</div>}
                {!isSupabaseConfigured && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-lg text-sm border border-blue-200 dark:border-blue-800">
                        {t('auth.demo_mode')}
                    </div>
                )}

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {t('auth.email')}
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder={t('footer.placeholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClasses}
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {t('auth.password')}
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={inputClasses}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 end-0 pr-3 pl-3 flex items-center text-sm leading-5"
                        >
                            {showPassword ? (
                                <EyeOffIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                            ) : (
                                <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <Checkbox
                        id="remember-me"
                        label={<span className="text-sm text-gray-700 dark:text-gray-300">{t('auth.remember_me')}</span>}
                        checked={rememberMe}
                        onChange={setRememberMe}
                    />

                    <div className="text-sm">
                        <button type="button" onClick={() => onNavigate('/forgot-password')} className="font-semibold text-brand-primary hover:text-brand-primary/80 dark:text-brand-primary dark:hover:text-brand-primary/80">
                            {t('auth.forgot_password')}
                        </button>
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-black bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? t('common.loading') : t('auth.sign_in')}
                    </button>
                </div>
            </form>

             <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                {t('auth.no_account')} {' '}
                <button type="button" onClick={() => onNavigate('/signup')} className="font-semibold text-brand-primary hover:text-brand-primary/80">
                    {t('auth.sign_up')}
                </button>
            </p>
        </AuthLayout>
    );
};

export default Login;