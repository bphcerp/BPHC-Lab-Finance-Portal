import {Router, Request, Response } from "express";
import { UserModel } from "../models/user";
import { OAuth2Client } from "google-auth-library";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const router : Router = Router()
  
router.get('/', async (req: Request, res: Response) => {
	try {
	  const users = await UserModel.find();
	  res.json(users);
	} catch (error) {
	  res.status(500).json({ message: 'Error fetching users', error });
	}
});

router.post('/logout', async (req: Request, res: Response) => {
	res.clearCookie('token', {
	   httpOnly: true,
	   sameSite: 'lax',
	 });
	 
   res.status(200).json({ message: 'Logged out successfully' });
})

router.post('/login', async (req: Request, res: Response) => {
	const credentialResponse = req.body;
	const client = new OAuth2Client()

	try {
		const ticket = await client.verifyIdToken({
			idToken: credentialResponse.credential,
			audience: process.env.OAUTH_CID
		});
		
		const { name, email } = ticket.getPayload() as any;

		let user = await UserModel.findOne({ email });
		
		if (!user) {
			user = new UserModel({
				name,
				email,
				isAdmin: false,
			});
			await user.save();
		}

		res.cookie("token", credentialResponse.credential);
		res.send("Login Successful");
	} catch (error) {
		console.error(error);
		res.status(403).send("Invalid Credentials");
	}
});

router.post('/passlogin', async (req : Request, res : Response) => {
	const {email, pwd} = req.body
	const result = await UserModel.findOne({email}).lean()
	if (!result) {
		res.status(404).send(`No user found`)
		return
	}
		
	const resultPasswordHidden = {...result,pwd:""}

	if (result!.pwd === pwd){
		const jwtSecretKey = process.env.JWT_SECRET_KEY!;
		const token = jwt.sign(resultPasswordHidden,jwtSecretKey)
		res.cookie("token",token,{
			expires : new Date(Date.now() + 3600*1000),
			path : "/",
			httpOnly : true,
			sameSite : "lax"
		})
		res.send("Login Successful")
	}
	else res.status(401).send(`Wrong Credentials`)
})
  
router.put('/:id', async (req: Request, res: Response) => {
	try {
	  const { name, email, isAdmin } = req.body;
	  const updatedUser = await UserModel.findByIdAndUpdate(
		req.params.id,
		{ name, email, isAdmin },
		{ new: true }
	  );
	  if (!updatedUser) {
		res.status(404).json({ message: 'User not found' })
	  }
	  else res.json(updatedUser);
	} catch (error) {
	  res.status(500).json({ message: 'Error updating user', error });
	}
});
  
router.delete('/:id', async (req: Request, res: Response) => {
	try {
	  const deletedUser = await UserModel.findByIdAndDelete(req.params.id);
	  if (!deletedUser) {
		res.status(404).json({ message: 'User not found' })
	  }
	  else res.status(204).send()
	} catch (error) {
	  res.status(500).json({ message: 'Error deleting user', error })
	}
});

export default router