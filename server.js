require("dotenv").config();
const express = require("express");
const cors = require("cors");

const TwitchAPI = require("./libs/twitchAPI");

const twitchAPI = new TwitchAPI();

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3001;

(async () => {
  try {
    await twitchAPI.authenticateWithTwitch();

    app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });

    // @desc Get user data by login
    // @route GET /api/v1/users?login=login
    // @acess Public
    app.get("/api/v1/users", async (req, res) => {
      try {
        const { login, id } = req.query;

        if (login) {
          const data = await twitchAPI.getUserDataByLogin(login);
          res.status(200).json(data);
        } else if (id) {
          const data = await twitchAPI.getUserDataById(id);
          res.status(200).json(data);
        } else {
          throw "No login or id provided";
        }
      } catch (err) {
        console.log(err);
        res.status(500).json({
          success: false,
          error: err,
        });
      }
    });

    // @desc Get user followers by id
    // @route GET /api/v1/users/follows?to_id=id&first=100&after=after
    // @acess Public
    app.get("/api/v1/users/follows", async (req, res) => {
      try {
        const { to_id, first, after } = req.query;

        if (!to_id) throw "User ID not found";

        const data = await twitchAPI.getUserFollowerIdsById(
          to_id,
          first,
          after
        );

        res.status(200).json(data);
      } catch (err) {
        console.log(err);
        res.status(500).json({
          success: false,
          error: err,
        });
      }
    });

    // @desc Get stream data by ids
    // @route GET /api/v1/streams?ids=ids
    // @acess Public
    app.get("/api/v1/streams", async (req, res) => {
      try {
        const { user_id } = req.query;

        if (!user_id) throw "Follower IDs not found";

        const data = await twitchAPI.getStreamDataById(user_id);

        res.status(200).json(data);
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
