import { Schema, model, type InferSchemaType } from 'mongoose';
const userSchema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'user'], default: 'user', index: true }
}, { timestamps: true, versionKey: false });
export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
