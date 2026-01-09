import pool from '../config/database.config';
import { User } from '../types/user.types';

/**
 * Create a new user in the database
 */
export const createUser = async (
    username: string,
    email: string,
    passwordHash: string
): Promise<void> => {
    const query = `
    INSERT INTO users (user_id, username, email, password_hash, provider)
    VALUES (gen_random_uuid()::text, $1, $2, $3, 'email')
  `;
    await pool.query(query, [username, email, passwordHash]);
};

/**
 * Find a user by email
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
};

/**
 * Find a user by ID
 */
export const findUserById = async (userId: string): Promise<User | null> => {
    const query = 'SELECT * FROM users WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
};

/**
 * Update user profile details
 */
export const updateUserProfile = async (
    userId: string,
    profileDetails: string
): Promise<void> => {
    const query = 'UPDATE users SET profile_details = $1 WHERE user_id = $2';
    await pool.query(query, [profileDetails, userId]);
};

/**
 * Create a Firebase user in the database
 */
export const createFirebaseUser = async (
    userId: string,
    username: string,
    email: string,
    provider: string
): Promise<void> => {
    const query = `
    INSERT INTO users (user_id, username, email, provider, created_at)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
  `;
    await pool.query(query, [userId, username, email, provider]);
};
