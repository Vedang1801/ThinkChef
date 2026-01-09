import * as userModel from '../models/user.model';
import { hashPassword, comparePassword } from '../utils/bcrypt.util';
import { generateToken } from '../utils/jwt.util';
import { CreateUserDTO, LoginDTO, UserResponse } from '../types/user.types';

/**
 * Register a new user
 */
export const registerUser = async (userData: CreateUserDTO): Promise<void> => {
    const { username, email, password } = userData;

    // Check if user already exists
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    await userModel.createUser(username, email, passwordHash);
};

/**
 * Login user and return token
 */
export const loginUser = async (
    loginData: LoginDTO
): Promise<{ user: UserResponse; token: string }> => {
    const { email, password } = loginData;

    // Find user
    const user = await userModel.findUserByEmail(email);
    if (!user) {
        throw new Error('Invalid email or password');
    }

    // Verify password
    if (!user.password_hash) {
        throw new Error('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
        throw new Error('Invalid email or password');
    }

    // Generate token
    const token = generateToken({
        userId: user.user_id,
        username: user.username,
        email: user.email,
    });

    // Return user data without password
    const userResponse: UserResponse = {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        profile_details: user.profile_details,
        created_at: user.created_at,
    };

    return { user: userResponse, token };
};
