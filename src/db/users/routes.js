import express from "express";
import UsersModal from "./schema.js";
import createHttpError from "http-errors";
import { JWTAuthenticate } from "../../middleware/tools.js";
import { JWTAuthMiddleware } from "../../middleware/authentication.js";
import CollectionModel from "../collections/schema.js";
import { adminOnly } from "../../middleware/authorization.js";
const userRouter = express.Router();

//get all users
userRouter.get(
  "/allUsers",
  JWTAuthMiddleware,
  adminOnly,
  async (req, res, next) => {
    try {
      const users = await UsersModal.find({});
      res.status(200).send(users);
    } catch (error) {
      next(error);
    }
  }
);

// get user collections
userRouter.get("/me/stories", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const collections = await CollectionModel.find({
      users: req.user._id.toString(),
    });
    res.status(200).send(collections);
  } catch (error) {
    next(error);
  }
});

// get single user
userRouter.get("/:userId", adminOnly, async (req, res, next) => {
  try {
    if (req.params.userId.length !== 24)
      return next(createHttpError(400, "Invalid ID"));
    const user = await UsersModal.findById(req.params.userId);
    if (!user)
      return next(
        createHttpError(
          400,
          `The id ${req.params.userId} does not match any users`
        )
      );
    res.send(user);
  } catch (error) {
    res.send(500).send({ message: error.message });
  }
});

// create user
userRouter.post("/register", async (req, res, next) => {
  try {
    console.log("REQ USER", req.user);
    const { username, email, password } = req.body;
    if (!(username && email && password)) {
      res.status(200).send({ msg: "All the fields are required!" });
    }
    const oldUser = await UsersModal.findOne({ email });
    if (oldUser) {
      res.status(409).send({ msg: "User already exist with this email!" });
    }
    const user = new UsersModal(req.body);
    const { _id } = await user.save();
    console.log("ID", _id);
    res.status(204).send({ _id });
  } catch (error) {
    next(error);
  }
});

// user login
userRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!(email && password))
      res.status(204).send({ msg: "All fields are required!" });
    const user = await UsersModal.checkCredentials(email, password);
    if (!user)
      return next(
        createHttpError(401, "Credentials are not ok. User does not exist!")
      );
    const accessToken = await JWTAuthenticate(user);
    res.status(200).send({ accessToken });
  } catch (error) {
    next(error);
  }
});

// delete user
userRouter.delete("/:userId", adminOnly, async (req, res, next) => {
  try {
    if (req.params.userId.length !== 24)
      return next(createHttpError(400, "Invalid ID"));
    const result = await UsersModal.findByIdAndDelete(req.params.userId);
    if (!result)
      return next(
        createHttpError(
          400,
          `The id ${req.params.userId} does not match any users`
        )
      );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// update user
userRouter.put("/:userId", adminOnly, async (req, res, next) => {
  try {
    if (req.params.userId.length !== 24)
      return next(createHttpError(400, "Invalid ID"));
    const updatedUser = await UsersModal.findByIdAndUpdate(
      req.params.userId,
      req.body,
      { new: true }
    );
    if (!updatedUser)
      return next(
        createHttpError(
          400,
          `The id ${req.params.userId} does not match any users`
        )
      );
    res.send(updatedUser);
  } catch (error) {
    next(error);
  }
});
export default userRouter;
