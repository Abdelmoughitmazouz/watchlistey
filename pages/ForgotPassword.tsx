import React, { useState } from 'react';
import AuthLayout from '../components/AuthLayout';
import { useTranslation } from 'react-i18next';

interface ForgotPasswordProps {
    onNavigate: (path: string) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle password reset logic
        setSubmitted(true);
    };

    const inputClasses = "appearance-none block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] text-gray-900 dark:text-white rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary sm:text-sm transition-all";

    return (
        <AuthLayout title={t('auth.forgot_password')} subtitle="Reset your password to regain access.">
            {submitted ? (
                <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                        If an account with that email exists, we've sent a password reset link to it. Please check your inbox.
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
            ) : (
                <>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
                        Enter the email address associated with your account and we'll send you a link to reset your password.
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-5">
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
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-black bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
                            >
                                Send reset link
                            </button>
                        </div>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                        Remember your password?{' '}
                        <button type="button" onClick={() => onNavigate('/login')} className="font-semibold text-brand-primary hover:text-brand-primary/80">
                            {t('auth.sign_in')}
                        </button>
                    </p>
                </>
            )}
        </AuthLayout>
    );
};

export default ForgotPassword;