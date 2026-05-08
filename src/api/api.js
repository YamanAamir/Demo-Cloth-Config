import { api } from './index';

// Auth APIs
export const loginUser = (data) => api.post('/auth/student-login', data);
export const registerUser = (data) => api.post('/auth/register', data);
export const setUserPassword = (data) => api.post('/auth/set-password', data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);

export const listSchoolLogos = (params = {}) => api.post('/student/logos', params);
export const getMyClassBackDesigns = (params = {}) => api.post('/student/back-designs', params);
export const placeOrder = (data) => api.post('/student/place-order', data);
export const getMyOrder = () => api.get('/student/my-order');
export const getMyOrderHistory = () => api.get('/student/my-order-history');
export const deleteHistory = (id) => api.delete(`/student/history/${id}`);

// Order Management (Admin/Class Rep)
export const unlockOrder = (orderId) => api.put(`/admin/orders/${orderId}/unlock`);
export const lockOrder = (orderId) => api.put(`/admin/orders/${orderId}/lock`);

// Stripe Payment
export const createCheckoutSession = (data) => api.post('/payment/create-checkout-session', data);

// Inquiry Email (no auth required)
export const sendInquiry = (data) => api.post('/contact/inquiry', data);

// Public school list (no auth required) — full list for dropdown
export const getPublicSchools = () => api.post('/student/schools', { page: 1, limit: 1000, search: '' });

// Public classes by school — for inquiry form dropdown
export const getClassesBySchool = (schoolId) => api.post(`/student/schools/${schoolId}/classes`);

// Settings (public)
export const getPublicSettings = () => api.get('/student/settings');

// Student Profile
export const getStudentProfile = () => api.get('/student/profile');
export const updateStudentProfile = (data) => api.put('/student/profile', data);
export const changePasswordAuth = (data) => api.put('/auth/change-password', data);

// Order Reset Functions
export const resetOrder = (orderId) => api.post(`/student/reset-order/${orderId}`);
export const createFreshOrder = () => api.post('/student/create-fresh-order');

// Library designs — browse by country
export const getCountries = () => api.get('/student/countries');
export const getLibraryDesigns = (countryId) => api.get(`/student/library-designs?country_id=${countryId}`);
