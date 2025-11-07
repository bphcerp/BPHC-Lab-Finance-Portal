
import mongoose from 'mongoose';
import { UserModel } from '../models/user';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({
	path: path.resolve(process.cwd(), "../.env"),
});


async function main() {
	const email = process.argv[2];
	const roleArg = process.argv[3]; // optional: Admin | Viewer
	if (!email) {
		console.error('Usage: pnpm db:seed <email> [Admin|Viewer]');
		process.exit(1);
	}

	const normalizedRole = roleArg && ["Admin", "Viewer"].includes(roleArg)
		? (roleArg as "Admin" | "Viewer")
		: undefined;

	const {
		MONGO_HOST,
		MONGO_PORT,
		MONGO_DB,
		MONGO_USER,
		MONGO_PASSWORD
	} = process.env;

	if (!MONGO_HOST || !MONGO_PORT || !MONGO_DB || !MONGO_USER || !MONGO_PASSWORD) {
		throw new Error('Missing one or more required MongoDB environment variables: MONGO_HOST, MONGO_PORT, MONGO_DB, MONGO_USER, MONGO_PASSWORD');
	}

	const MONGO_URI = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
	await mongoose.connect(MONGO_URI);

	// Check if user already exists
	const existing = await UserModel.findOne({ email });
	if (existing) {
		if (normalizedRole && existing.role !== normalizedRole) {
			existing.role = normalizedRole;
			await existing.save();
			console.log(`Updated role for ${email} -> ${normalizedRole}`);
		} else {
			console.log(`User ${email} already exists with role: ${existing.role || 'Viewer'}`);
		}
		await mongoose.disconnect();
		process.exit(0);
	}

	const user = new UserModel({ email, ...(normalizedRole ? { role: normalizedRole } : {}) });
	await user.save();
	console.log(`Added user with email: ${email} as ${user.role}`);
	await mongoose.disconnect();
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});
