import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';

interface EpisodeCountdownProps {
    airDate?: string | null;
    className?: string;
}

const EpisodeCountdown: React.FC<EpisodeCountdownProps> = ({ airDate, className = "" }) => {
    const { t } = useTranslation();
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        isPast: boolean;
        isValid: boolean;
    } | null>(null);

    useEffect(() => {
        if (!airDate) {
            setTimeLeft(null);
            return;
        }

        const calculateTimeLeft = () => {
            const now = Date.now();
            let targetDate = new Date(airDate);
            
            // LOGIC FIX: Default to 8 PM local time for "Release Date" strings without time.
            if (airDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                 targetDate = new Date(`${airDate}T20:00:00`);
            }

            const target = targetDate.getTime();
            
            if (isNaN(target)) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, isPast: false, isValid: false });
                return;
            }

            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, isPast: true, isValid: true });
                return;
            }

            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / 1000 / 60) % 60),
                isPast: false,
                isValid: true
            });
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000); // Check every minute

        return () => clearInterval(timer);
    }, [airDate]);

    if (!airDate || !timeLeft || !timeLeft.isValid) return null;

    if (timeLeft.isPast) {
        return (
            <span className={`text-green-500 font-bold tracking-wide uppercase text-xs ${className}`}>
                {t('common.released')}
            </span>
        );
    }

    return (
        <div className={`flex gap-1.5 items-center text-xs font-bold font-mono tracking-tight ${className}`} title={`Airs: ${airDate}`}>
            <span className="bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded">{timeLeft.days}d</span>
            <span className="bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded">{timeLeft.hours}h</span>
            <span className="bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded">{timeLeft.minutes}m</span>
        </div>
    );
};

export default EpisodeCountdown;