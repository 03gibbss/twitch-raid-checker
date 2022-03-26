require("dotenv").config();
const axios = require("axios");

const twitchAPI = axios.create({
  baseURL: "https://api.twitch.tv/helix/",
  method: "GET",
  headers: {
    "Client-Id": process.env.TWITCH_CLIENT_ID,
  },
});

const init = async () => {
  try {
    const accessToken = await getAccessToken();

    twitchAPI.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${accessToken}`;

    // login could be passed from front end etc
    const id = await getUserIdByLogin("03gibbss");

    const followerIds = await getUserFollowerIdsById(id);

    let allLiveFollowers = await getAllLiveFollowers(followerIds);

    allLiveFollowers.sort((a, b) => b.viewer_count - a.viewer_count);

    console.log(
      allLiveFollowers.map((follower) => {
        return { name: follower.user_name, viewers: follower.viewer_count };
      })
    );
    console.log(allLiveFollowers.length);
  } catch (err) {
    console.error(err);
  }
};

const getAccessToken = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        data: { access_token: accessToken },
      } = await axios({
        method: "POST",
        url: "https://id.twitch.tv/oauth2/token",
        data: {
          client_id: process.env.TWITCH_CLIENT_ID,
          client_secret: process.env.TWITCH_CLIENT_SECRET,
          grant_type: "client_credentials",
        },
      });

      resolve(accessToken);
    } catch (err) {
      reject(err);
    }
  });
};

const getUserIdByLogin = (login) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        data: {
          data: [{ id } = ""],
        },
      } = await twitchAPI(`/users?login=${login}`);

      if (!id) reject("User not found");

      resolve(id);
    } catch (err) {
      reject(err);
    }
  });
};

const getUserFollowerIdsById = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      let after = "";
      let followerIds = [];

      do {
        const {
          data: {
            data,
            pagination: { cursor },
          },
        } = await twitchAPI(
          `/users/follows?to_id=${id}&first=100&after=${after}`
        );

        followerIds = [
          ...followerIds,
          ...data.map((follower) => follower.from_id),
        ];

        after = cursor;
      } while (after !== undefined);

      resolve(followerIds);
    } catch (err) {
      reject(err);
    }
  });
};

const getAllLiveFollowers = (followerIds) => {
  return new Promise(async (resolve, reject) => {
    try {
      let liveFollowers = [];

      do {
        let ids = followerIds
          .splice(0, 100)
          .map((id) => `user_id=${id}`)
          .join("&");

        const {
          data: { data },
        } = await twitchAPI(`/streams?${ids}?`);

        if (data.length) liveFollowers = [...liveFollowers, ...data];
      } while (followerIds.length > 0);

      resolve(liveFollowers);
    } catch (err) {
      reject(err);
    }
  });
};

init();
