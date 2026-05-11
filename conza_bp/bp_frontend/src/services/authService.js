// src/services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = 'conza_users';
const SESSION_KEY = 'conza_session';

// ── Helpers ───────────────────────────────────────────────────────────────────

const getUsers = async () => {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveUsers = async (users) => {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// ── Auth API ──────────────────────────────────────────────────────────────────

export const signUp = async (userData) => {
  const users = await getUsers();

  const phoneExists = users.find((u) => u.phone === userData.phone);
  if (phoneExists) throw new Error('Phone number already registered.');

  const usernameExists = users.find(
    (u) => u.username.toLowerCase() === userData.username.toLowerCase()
  );
  if (usernameExists) throw new Error('Username already taken.');

  if (userData.email) {
    const emailExists = users.find(
      (u) => u.email && u.email.toLowerCase() === userData.email.toLowerCase()
    );
    if (emailExists) throw new Error('Email already registered.');
  }

  const newUser = {
    id: `user_${Date.now()}`,
    ...userData,
    createdAt: new Date().toISOString(),
  };

  await saveUsers([...users, newUser]);

  // Auto-login after sign up
  const session = { userId: newUser.id, createdAt: Date.now() };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));

  return newUser;
};

export const login = async (identifier, password) => {
  const users = await getUsers();

  const user = users.find(
    (u) =>
      (u.phone === identifier ||
        u.username.toLowerCase() === identifier.toLowerCase() ||
        (u.email && u.email.toLowerCase() === identifier.toLowerCase())) &&
      u.password === password
  );

  if (!user) {
    const identifierExists = users.find(
      (u) =>
        u.phone === identifier ||
        u.username.toLowerCase() === identifier.toLowerCase() ||
        (u.email && u.email.toLowerCase() === identifier.toLowerCase())
    );
    if (!identifierExists) throw new Error('No account found with that username or phone.');
    throw new Error('Incorrect password.');
  }

  const session = { userId: user.id, createdAt: Date.now() };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));

  return user;
};

export const logout = async () => {
  await AsyncStorage.removeItem(SESSION_KEY);
};

export const getSession = async () => {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  const session = JSON.parse(raw);
  return session;
};

export const getLoggedInUser = async () => {
  const session = await getSession();
  if (!session) return null;
  const users = await getUsers();
  return users.find((u) => u.id === session.userId) || null;
};

export const forgotPassword = async (identifier) => {
  const users = await getUsers();
  const user = users.find(
    (u) =>
      u.phone === identifier ||
      u.username.toLowerCase() === identifier.toLowerCase() ||
      (u.email && u.email.toLowerCase() === identifier.toLowerCase())
  );
  if (!user) throw new Error('No account found with that username, phone, or email.');
  // In production: trigger SMS/email OTP here
  // For now, return masked hint
  return {
    hint: user.email
      ? `Reset link sent to ${user.email.replace(/(.{2}).+(@.+)/, '$1***$2')}`
      : `OTP sent to ${user.phone.replace(/(\d{3})\d{5}(\d{2})/, '$1*****$2')}`,
  };
};
