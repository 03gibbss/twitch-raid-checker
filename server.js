require("dotenv").config();
const express = require("express");

const TwitchAPI = require("./libs/twitchAPI");

const twitchAPI = new TwitchAPI();

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3001;

(async () => {
  try {
    await twitchAPI.authenticateWithTwitch();

    app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });

    // @desc Get user data by login
    // @route GET /api/v1/get-user-data-by-login
    // @acess Public
    app.get("/api/v1/get-user-data-by-login/:login", async (req, res) => {
      try {
        const { login } = req.params;

        const userData = await twitchAPI.getUserDataByLogin(login);

        res.status(200).json({
          success: true,
          data: userData,
        });
      } catch (err) {
        console.log(err);
        res.status(500).json({
          success: false,
          error: err,
        });
      }
    });

    // @desc Get user followers by id
    // @route GET /api/v1/get-user-followers-by-id
    // @acess Public
    app.get("/api/v1/get-user-followers-by-id/:userId", async (req, res) => {
      try {
        const { userId } = req.params;
        if (!userId) throw "User ID not found";

        const followerIds = await twitchAPI.getUserFollowerIdsById(userId);

        res.status(200).json({
          success: true,
          data: followerIds,
        });
      } catch (err) {
        console.log(err);
        res.status(500).json({
          success: false,
          error: err,
        });
      }
    });

    // @desc Get live followers by follower id araray
    // @route POST /api/v1/get-all-live-followers
    // @acess Public
    app.post("/api/v1/get-all-live-followers/", async (req, res) => {
      try {
        const { allFollowerIds } = req.body;
        if (!allFollowerIds) throw "Follower IDs not found";

        const allLiveFollowers = await twitchAPI.getAllLiveFollowers(
          allFollowerIds
        );

        res.status(200).json({
          success: true,
          data: allLiveFollowers,
        });
      } catch (err) {
        console.log(err);
        res.status(500).json({
          success: false,
          error: err,
        });
      }
    });
  } catch (err) {
    process.exit(1);
  }
})();
