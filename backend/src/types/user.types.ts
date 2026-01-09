export interface User {
    user_id: string;
    username: string;
    email: string;
    password_hash?: string;
    profile_details?: string;
    provider?: string;
    created_at?: Date;
}

export interface CreateUserDTO {
    username: string;
    email: string;
    password: string;
}

export interface LoginDTO {
    email: string;
    password: string;
}

export interface UserResponse {
    user_id: string;
    username: string;
    email: string;
    profile_details?: string;
    created_at?: Date;
}
