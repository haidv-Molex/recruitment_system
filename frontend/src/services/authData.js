export const users = [
  {
    username: 'annie',
    password: 'annie123',
    displayName: 'Annie (Recruiter)',
    role: 'recruiter',
  },
  {
    username: 'hein',
    password: 'hein123',
    displayName: 'Hein (Recruiter)',
    role: 'recruiter',
  },
  {
    username: 'kim',
    password: 'kim123',
    displayName: 'Kim (Recruiter)',
    role: 'recruiter',
  },
  {
    username: 'admin',
    password: 'admin123',
    displayName: 'HR Admin',
    role: 'admin',
  },
];

export const authenticateUser = (username, password) => {
  const user = users.find(
    (u) =>
      u.username.toLowerCase() === username.toLowerCase() &&
      u.password === password
  );
  if (!user) return null;

  const { password: _removed, ...safeUser } = user;
  return safeUser;
};