import api from './api';

const userService = {
  // Get current user profile
  getProfile: async () => {
    // Current user data is stored in localStorage / session
    const savedUser = localStorage.getItem('apnapay_user');
    if (savedUser) {
      try {
        return { success: true, user: JSON.parse(savedUser) };
      } catch (_) { }
    }
    return { success: false, message: 'No user session found' };
  },

  // Update profile details (local state / persistence)
  updateProfile: async (updatedData) => {
    const savedUser = localStorage.getItem('apnapay_user');
    let currentUser = savedUser ? JSON.parse(savedUser) : {};
    const newUser = { ...currentUser, ...updatedData };
    localStorage.setItem('apnapay_user', JSON.stringify(newUser));
    return { success: true, message: 'Profile updated successfully.', user: newUser };
  }
};

export default userService;

