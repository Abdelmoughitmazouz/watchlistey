
import React, { useState } from 'react';
import AuthLayout from '../components/AuthLayout';
import Checkbox from '../components/Checkbox';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Logger } from '../lib/logger';
import { useTranslation } from 'react-i18next';

interface SignUpProps {
    onNavigate: (path: string) => void;
    onLogin?: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onNavigate, onLogin }) => {
    const { t } = useTranslation();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            setLoading(false);
            return;
        }

        const cleanUsername = username.trim();
        const cleanEmail = email.trim();

        if (isSupabaseConfigured) {
            try {
                // Check if username is already taken
                const { data: existingUser } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('username', cleanUsername)
                    .maybeSingle();

                if (existingUser) {
                    setError('This username is already taken. Please choose another one.');
                    setLoading(false);
                    return;
                }
            } catch (checkErr) {
                Logger.error("Error checking username availability:", checkErr);
            }
        } else {
            setTimeout(() => {
                setLoading(false);
                setSubmitted(true);
            }, 1000);
            return;
        }

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email: cleanEmail,
                password,
                options: {
                    data: {
                        name: `${firstName} ${lastName}`.trim(),
                        first_name: firstName,
                        last_name: lastName,
                        username: cleanUsername,
                    },
                },
            });

            if (signUpError) {
                setError(signUpError.message);
            } else {
                setSubmitted(true);
            }
        } catch (err) {
            Logger.error("Sign up error:", err);
            setError("Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "appearance-none block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] text-gray-900 dark:text-white rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary sm:text-sm transition-all";

    if (submitted) {
        return (
            <AuthLayout title={t('auth.check_email')} subtitle={t('auth.check_email_sub')}>
                <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                        We've sent a confirmation link to <span className="font-bold text-gray-900 dark:text-white">{email}</span>. Please check your inbox to verify your account.
                    </p>
                    <div className="mt-6">
                        <button
                            onClick={() => onNavigate('/login')}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-black bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
                        >
                            {t('auth.return_login')}
                        </button>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title={t('auth.create_account')} subtitle={t('auth.create_subtitle')}>
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg text-sm border border-red-200 dark:border-red-800">{error}</div>}
                {!isSupabaseConfigured && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-lg text-sm border border-blue-200 dark:border-blue-800">
                        {t('auth.demo_mode')}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {t('auth.first_name')}
                        </label>
                        <input
                            id="first-name"
                            name="first-name"
                            type="text"
                            autoComplete="given-name"
                            required
                            placeholder={t('auth.first_name')}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className={inputClasses}
                        />
                    </div>

                    <div>
                        <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {t('auth.last_name')}
                        </label>
                        <input
                            id="last-name"
                            name="last-name"
                            type="text"
                            autoComplete="family-name"
                            required
                            placeholder={t('auth.last_name')}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className={inputClasses}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {t('auth.username')}
                    </label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        required
                        placeholder={t('auth.username')}
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                        className={inputClasses}
                    />
                </div>

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
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        placeholder="******"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputClasses}
                    />
                </div>

                <div className="flex items-center">
                    <Checkbox
                        id="terms"
                        label={
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                I agree to the{' '}
                                <button type="button" onClick={(e) => { e.preventDefault(); onNavigate('/terms'); }} className="text-brand-primary hover:underline font-semibold">{t('footer.links.terms')}</button>
                                {' '}and{' '}
                                <button type="button" onClick={(e) => { e.preventDefault(); onNavigate('/privacy'); }} className="text-brand-primary hover:underline font-semibold">{t('footer.links.privacy')}</button>.
                            </span>
                        }
                        checked={agreeToTerms}
                        onChange={setAgreeToTerms}
                    />
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading || !agreeToTerms}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-black bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? t('common.loading') : t('auth.sign_up')}
                    </button>
                </div>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                {t('auth.have_account')} {' '}
                <button type="button" onClick={() => onNavigate('/login')} className="font-semibold text-brand-primary hover:text-brand-primary/80">
                    {t('auth.sign_in')}
                </button>
            </p>
        </AuthLayout>
    );
};

export default SignUp;
