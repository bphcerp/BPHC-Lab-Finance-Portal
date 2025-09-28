import { Router, Request, Response } from "express";
import { UserModel } from "../models/user";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { authenticateToken, encrypt } from "../middleware/authenticateToken";
import { requireAdmin } from "../middleware/restrictViewer";

const isProd = process.env.NODE_ENV === "production";

const router: Router = Router();

router.get(
  "/",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const users = await UserModel.find().select("name email");
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users", error });
    }
  }
);

router.get("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user?.email) {
      return res.status(401).json({ message: "User not found in token" });
    }

    const user = await UserModel.findOne({ email: req.user.email }).select(
      "-pwd"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user info", error });
  }
});

router.post(
  "/",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { name, email } = req.body;

      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        res.status(400).json({ message: "User already exists" });
        return;
      }

      const newUser = new UserModel({ name, email });
      await newUser.save();

      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ message: "Error creating user", error });
    }
  }
);

router.post(
  "/logout",
  authenticateToken,
  async (req: Request, res: Response) => {
    res.clearCookie("token", {
      secure: isProd,
      httpOnly: true,
      sameSite: isProd ? "strict" : "lax",
    });

    res.status(200).json({ message: "Logged out successfully" });
  }
);

router.post("/login", async (req: Request, res: Response) => {
  const credentialResponse = req.body;
  const client = new OAuth2Client();

  try {
    const ticket = await client.verifyIdToken({
      idToken: credentialResponse.credential,
      audience: process.env.VITE_OAUTH_CID,
    });

    const { name, email } = ticket.getPayload() as any;

    let user = await UserModel.findOne({ email });

    if (!user) {
      res
        .status(401)
        .send({
          message: `You are not allowed to login to this portal. Please contact ${
            process.env.VITE_LAB_NAME ?? "the lab"
          }.`,
        });
      return;
    }

    if (!user.name) {
      user.name = name;
      await user.save();
    }

    const jwtSecretKey = process.env.JWT_SECRET_KEY!;
    const payload = {
      _id: user._id,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, jwtSecretKey);
    const encryptedToken = encrypt(token);

    res.cookie("token", encryptedToken, {
      expires: new Date(Date.now() + 3600 * 1000),
      path: "/",
      secure: isProd,
      httpOnly: true,
      sameSite: isProd ? "strict" : "lax",
    });
    res.send({ message: "Login Successful" });
  } catch (error) {
    console.error(error);
    res.status(403).send({ message: "Invalid Credentials" });
  }
});

router.post("/passlogin", async (req: Request, res: Response) => {
  const { email, pwd } = req.body;
  const result = await UserModel.findOne({ email }).lean();
  if (!result) {
    res.status(404).send({ message: `No user found` });
    return;
  }

  const resultPasswordHidden = { ...result, pwd: "" };

  if (result!.pwd === pwd) {
    const jwtSecretKey = process.env.JWT_SECRET_KEY!;
    const payload = {
      _id: result._id,
      email: result.email,
      role: result.role,
    };
    const token = jwt.sign(payload, jwtSecretKey);
    const encryptedToken = encrypt(token);
    res.cookie("token", encryptedToken, {
      expires: new Date(Date.now() + 3600 * 1000),
      path: "/",
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
    });
    res.send({ message: "Login Successful" });
  } else res.status(401).send({ message: `Wrong Credentials` });
});

router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { name, email } = req.body;
      const updatedUser = await UserModel.findByIdAndUpdate(
        req.params.id,
        { name, email },
        { new: true }
      );
      if (!updatedUser) {
        res.status(404).json({ message: "User not found" });
      } else res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Error updating user", error });
    }
  }
);

router.put(
  "/:id/role",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { role } = req.body;
      const userId = req.params.id;

      if (!role || !["Admin", "Viewer"].includes(role)) {
        return res
          .status(400)
          .json({ message: "Invalid role. Must be Admin or Viewer." });
      }

      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { role },
        { new: true }
      ).select("-pwd");

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "User role updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Error updating user role", error });
    }
  }
);

router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const deletedUser = await UserModel.findByIdAndDelete(req.params.id);
      if (!deletedUser) {
        res.status(404).json({ message: "User not found" });
      } else res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting user", error });
    }
  }
);

export default router;
