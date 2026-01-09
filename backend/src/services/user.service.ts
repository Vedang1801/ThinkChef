import * as userModel from '../models/user.model';

/**
 * Sync Firebase user with database
 */
export const syncUser = async (
    userId: string,
    username: string,
    email: string,
    provider: string
) => {
    // Check if user_id already exists
    const existingUser = await userModel.findUserById(userId);

    if (existingUser) {
        // User exists, update their info
        return { message: 'User already exists', user: existingUser };
    }

    // Check if email already exists with different user_id
    const userByEmail = await userModel.findUserByEmail(email);

    if (userByEmail) {
        throw new Error('Email already in use by another account');
    }

    // Create new user
    await userModel.createFirebaseUser(userId, username, email, provider);
    const newUser = await userModel.findUserById(userId);

    return { message: 'User created', user: newUser };
};
