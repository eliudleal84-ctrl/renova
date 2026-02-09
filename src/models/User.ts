import mongoose, { Schema, Model } from 'mongoose';

export interface IUser {
    _id: mongoose.Types.ObjectId;
    email: string;
    password: string;
    name: string;
    whatsappPhoneId?: string;
    whatsappToken?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: [true, 'El email es requerido'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'La contraseña es requerida'],
            minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
        },
        name: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
        },
        whatsappPhoneId: {
            type: String,
            trim: true,
        },
        whatsappToken: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
