const axios = require("axios");

module.exports = class TwitchAPI {
  constructor() {
    this.twitchAPI = axios.create({
      baseURL: "https://api.twitch.tv/helix/",
      headers: {
        "Client-Id": process.env.TWITCH_CLIENT_ID,
      },
    });
    this.expiresAt = null;
  }

  authenticateWithTwitch = () => {
    return new Promise(async (resolve, reject) => {
      try {
        const {
          data: { access_token: accessToken, expires_in: expiresIn },
        } = await axios({
          method: "POST",
          url: "https://id.twitch.tv/oauth2/token",
          data: {
            client_id: process.env.TWITCH_CLIENT_ID,
            client_secret: process.env.TWITCH_CLIENT_SECRET,
            grant_type: "client_credentials",
          },
        });

        this.expiresAt = new Date(Date.now() + expiresIn);

        this.twitchAPI.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${accessToken}`;

        console.log(
          `Sucessfully authenticated with Twitch! Access token will expire at ${this.expiresAt}`
        );

        resolve();
      } catch (err) {
        reject(err);
      }
    });
  };

  #checkTokenExpiration = () => {
    return new Promise(async (resolve, reject) => {
      if (Date.now() > this.expiresAt) {
        console.log("Access token has expired, requesting new token");
        await this.authenticateWithTwitch();
        resolve();
      } else {
        resolve();
      }
    });
  };

  getUserDataByLogin = (login) => {
    return new Promise(async (resolve, reject) => {
      try {
        await this.#checkTokenExpiration();
        const {
          data: {
            data: [user],
          },
        } = await this.twitchAPI({
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

  getUserFollowerIdsById = (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        await this.#checkTokenExpiration();
        let after = "";
        let followerIds = [];

        do {
          const {
            data: {
              data,
              pagination: { cursor },
              total,
            },
          } = await this.twitchAPI(
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

  getAllLiveFollowers = (allFollowerIds) => {
    return new Promise(async (resolve, reject) => {
      try {
        await this.#checkTokenExpiration();
        let liveFollowers = [];
        let tempIds = [...allFollowerIds];

        do {
          let ids = tempIds
            .splice(0, 100)
            .map((id) => `user_id=${id}`)
            .join("&");

          const {
            data: { data: streams },
          } = await this.twitchAPI(`/streams?${ids}?`);

          if (streams.length) {
            const liveIds = streams.map((d) => `id=${d.user_id}`).join("&");

            const {
              data: { data: users },
            } = await this.twitchAPI(`/users?${liveIds}`);

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
};
