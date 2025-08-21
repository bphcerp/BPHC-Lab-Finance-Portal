
import mongoose from 'mongoose';
import { UserModel } from '../models/user';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({
	path: path.resolve(process.cwd(), "../.env"),
});


async function main() {
	const email = process.argv[2];
	if (!email) {
		console.error('Usage: pnpm db:seed <email>');
		process.exit(1);
	}

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
		await mongoose.disconnect();
		process.exit(0);
	}

	const user = new UserModel({ email });
	await user.save();
	console.log(`Added user with email: ${email}`);
	await mongoose.disconnect();
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});
