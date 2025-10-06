const ONBOARDING_STATUS_KEY = 'onboarding_status';

interface OnboardingStatus {
    completed: boolean;
    showOnNextLogin: boolean;
}

export const saveOnboardingStatus = (completed: boolean, showOnNextLogin: boolean): void => {
    const status: OnboardingStatus = { completed, showOnNextLogin };
    try {
        localStorage.setItem(ONBOARDING_STATUS_KEY, JSON.stringify(status));
    } catch (error) {
        console.error('Failed to save onboarding status:', error);
    }
};

export const getOnboardingStatus = (): OnboardingStatus => {
    try {
        const storedStatus = localStorage.getItem(ONBOARDING_STATUS_KEY);
        if (storedStatus) {
            return JSON.parse(storedStatus);
        }
    } catch (error) {
        console.error('Failed to retrieve onboarding status:', error);
    }
    // Default state if nothing is stored or an error occurs
    return { completed: false, showOnNextLogin: false };
};