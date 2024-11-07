import mongoose, { Document, Schema } from 'mongoose';

const userSchema = new Schema({
	name: { type: String, required: true },
	isAdmin: { type: Boolean, required: true },
	email: { type: String, required: true },
	pwd: { type: String }
});


export const UserModel = mongoose.model('User', userSchema);
