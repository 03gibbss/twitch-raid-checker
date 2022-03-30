const axios = require("axios");

const twitchAPI = axios.create({
  baseURL: "https://api.twitch.tv/helix/",
  headers: {
    "Client-Id": process.env.TWITCH_CLIENT_ID,
  },
});

const authenticateWithTwitch = () => {
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

      twitchAPI.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${accessToken}`;

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

const getUserDataByLogin = (login) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        data: {
          data: [user],
        },
      } = await twitchAPI({
        method: "GET",
        url: `/users?login=${login}`,
      });

      if (!user) reject("User not found");

      console.log(`Retrieved data for ${login}`);

      resolve(user);
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
            total,
          },
        } = await twitchAPI(
          `/users/follows?to_id=${id}&first=100&after=${after}`
        );

        followerIds = [
          ...followerIds,
          ...data.map((follower) => follower.from_id),
        ];

        console.log(`Loading ${followerIds.length} / ${total} followers...`);

        after = cursor;
      } while (after !== undefined);

      resolve(followerIds);
    } catch (err) {
      reject(err);
    }
  });
};

const getAllLiveFollowers = (allFollowerIds) => {
  return new Promise(async (resolve, reject) => {
    try {
      let liveFollowers = [];
      let tempIds = [...allFollowerIds];

      do {
        let ids = tempIds
          .splice(0, 100)
          .map((id) => `user_id=${id}`)
          .join("&");

        const {
          data: { data: streams },
        } = await twitchAPI(`/streams?${ids}?`);

        if (streams.length) {
          const liveIds = streams.map((d) => `id=${d.user_id}`).join("&");

          const {
            data: { data: users },
          } = await twitchAPI(`/users?${liveIds}`);

          const combinedData = streams.map((stream) => ({
            ...stream,
            ...users.find((user) => user.id === stream.user_id),
          }));

          liveFollowers = [...liveFollowers, ...combinedData];
        }

        console.log(
          `Getting currently live followers: ${
            allFollowerIds.length - tempIds.length
          } / ${allFollowerIds.length}`
        );
      } while (tempIds.length > 0);

      liveFollowers.sort((a, b) => b.viewer_count - a.viewer_count);
      resolve(liveFollowers);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  authenticateWithTwitch,
  getUserDataByLogin,
  getUserFollowerIdsById,
  getAllLiveFollowers,
};
