import {Router, Request, Response } from "express";
import { UserModel } from "../models/user";
import jwt from 'jsonwebtoken';

const router : Router = Router()

router.post('/', async (req: Request, res: Response) => {
	try {
	  const { name, email, pwd, isAdmin} = req.body;
	  const newUser = new UserModel({ name, email, pwd, isAdmin });
	  const savedUser = await newUser.save();
	  res.status(201).json(savedUser);
	} catch (error) {
	  res.status(500).json({ message: 'Error creating user', error });
	}
  });
  
  router.get('/', async (req: Request, res: Response) => {
	try {
	  const users = await UserModel.find();
	  res.json(users);
	} catch (error) {
	  res.status(500).json({ message: 'Error fetching users', error });
	}
  });
  
  router.get('/:id', async (req: Request, res: Response) => {
	  const user = await UserModel.findById(req.params.id);
	  if (!user) {
		res.status(404).json({ message: 'User not found' });
	  }
	  else res.status(200).json()
  });

  router.post('/login', async (req : Request, res : Response) => {
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
	  const { name, email, pwd, isAdmin } = req.body;
	  const updatedUser = await UserModel.findByIdAndUpdate(
		req.params.id,
		{ name, email, pwd, isAdmin },
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