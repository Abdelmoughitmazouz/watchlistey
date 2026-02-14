
import { UserActivity } from '../types';

/**
 * Aggregates consecutive progress updates for the same show by the same user.
 * Example: User watches Ep 1, then Ep 2, then Ep 3. 
 * Converts into: "Watched episodes 1-3"
 */
export const aggregateActivities = (activities: UserActivity[]): UserActivity[] => {
    if (!activities.length) return [];

    const aggregated: UserActivity[] = [];
    
    activities.forEach((current) => {
        if (aggregated.length === 0) {
            aggregated.push({ ...current });
            return;
        }

        const last = aggregated[aggregated.length - 1];

        // Grouping Rules:
        // 1. Same user
        // 2. Same show
        // 3. Both are 'progress_updated'
        // 4. Occurred within a 12-hour window
        const timeDiff = new Date(last.created_at).getTime() - new Date(current.created_at).getTime();
        const twelveHours = 12 * 60 * 60 * 1000;

        if (
            last.user_id === current.user_id &&
            last.show_id === current.show_id &&
            last.action === 'progress_updated' &&
            current.action === 'progress_updated' &&
            Math.abs(timeDiff) < twelveHours
        ) {
            // Update the range
            const lastProg = last.metadata.progress || 0;
            const currProg = current.metadata.progress || 0;
            
            const min = Math.min(lastProg, currProg, last.metadata.prev_progress || lastProg);
            const max = Math.max(lastProg, currProg);
            
            last.metadata.episode_range = `${min}-${max}`;
            last.metadata.progress = max;
            last.metadata.prev_progress = min;
            
            // Keep the most recent timestamp
            if (new Date(current.created_at) > new Date(last.created_at)) {
                last.created_at = current.created_at;
            }
        } else {
            aggregated.push({ ...current });
        }
    });

    return aggregated;
};
