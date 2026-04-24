import { create } from 'zustand';
import { listSchoolLogos } from '../api/api';

const useLogoStore = create((set) => ({
    logos: [],
    loading: false,
    error: null,
    pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    },

    fetchLogos: async (params = {}) => {
        set({ loading: true, error: null });
        try {
            const { data } = await listSchoolLogos(params);

            if (data.success) {
                set({
                    logos: (data.data || []).filter(i => String(i.status) === "0"),
                    pagination: data.pagination,
                    loading: false,
                    error: null
                });
            } else {
                set({
                    error: data.error || 'Failed to fetch logos',
                    loading: false
                });
            }
        } catch (err) {
            set({
                error: err.response?.data?.error || err.message || 'Something went wrong',
                loading: false
            });
        }
    },

    // Reset store if needed
    reset: () => set({
        logos: [],
        loading: false,
        error: null,
        pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
        }
    })
}));

export default useLogoStore;
