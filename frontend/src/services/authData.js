const initialUsers = [
  {
    id: 'user-001',
    username: 'admin',
    password: 'admin123',
    displayName: 'HR Admin',
    role: 'admin',
  },
  {
    id: 'user-002',
    username: 'annie',
    password: 'annie123',
    displayName: 'Annie (Recruiter)',
    role: 'recruiter',
  },
  {
    id: 'user-003',
    username: 'hein',
    password: 'hein123',
    displayName: 'Hein (Recruiter)',
    role: 'recruiter',
  },
  {
    id: 'user-004',
    username: 'kim',
    password: 'kim123',
    displayName: 'Kim (Recruiter)',
    role: 'recruiter',
  },
];

const USERS_STORAGE_KEY = 'recruitment_users';

const loadUsers = () => {
  try {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    // If saved data exists in localStorage, parse and return it
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return [...initialUsers];
};

const saveUsers = (users) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

let users = loadUsers();

export const authenticateUser = (username, password) => {
  // Find user whose username and password both match the input
  const user = users.find(
    (u) =>
      u.username.toLowerCase() === username.toLowerCase() &&
      u.password === password
  );
  // If no matching user found, return null
  if (!user) return null;

  const { password: _removed, ...safeUser } = user;
  return safeUser;
};

export const getAllUsers = () => {
  // Return all users with password field removed
  return users.map(({ password, ...rest }) => rest);
};

export const addUser = ({ username, password, displayName, role }) => {
  // Check if any existing user has the same username (case-insensitive)
  const exists = users.some(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  // If username already taken, return error
  if (exists) {
    return { success: false, message: 'Username already exists.' };
  }

  const newUser = {
    id: `user-${Date.now()}`,
    username: username.trim(),
    password,
    displayName: displayName.trim(),
    role: role || 'recruiter',
  };

  users = [...users, newUser];
  saveUsers(users);

  const { password: _removed, ...safeUser } = newUser;
  return { success: true, user: safeUser };
};

export const updateUser = (id, updates) => {
  // Find the index of user to update by id
  const index = users.findIndex((u) => u.id === id);
  // If user not found, return error
  if (index === -1) {
    return { success: false, message: 'User not found.' };
  }

  // If username is being changed, check for duplicates
  if (updates.username) {
    // Check if another user already has the new username
    const duplicate = users.some(
      (u) =>
        u.id !== id &&
        u.username.toLowerCase() === updates.username.toLowerCase()
    );
    // If duplicate username found, return error
    if (duplicate) {
      return { success: false, message: 'Username already exists.' };
    }
  }

  const updatedUser = { ...users[index], ...updates };
  // If no new password provided, keep the existing password
  if (!updates.password) {
    updatedUser.password = users[index].password;
  }

  // Replace the old user object with the updated one
  users = users.map((u) => (u.id === id ? updatedUser : u));
  saveUsers(users);

  return { success: true };
};

export const deleteUser = (id) => {
  // Find the user to delete by id
  const user = users.find((u) => u.id === id);
  // If user not found, return error
  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  // Count how many admin accounts exist
  const adminCount = users.filter((u) => u.role === 'admin').length;
  // If this is the last admin account, prevent deletion
  if (user.role === 'admin' && adminCount <= 1) {
    return { success: false, message: 'Cannot delete the last admin account.' };
  }

  // Remove the user from the list
  users = users.filter((u) => u.id !== id);
  saveUsers(users);

  return { success: true };
};

export const availableRoles = [
  { value: 'admin', label: 'Admin' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'viewer', label: 'Viewer (Read Only)' },
];