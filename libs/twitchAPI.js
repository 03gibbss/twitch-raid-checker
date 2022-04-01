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

  getUserDataById = (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        await this.#checkTokenExpiration();

        let idParams = "";

        if (Array.isArray(id)) {
          idParams = id.map((i) => `id=${i}`).join("&");
        } else {
          idParams = `id=${id}`;
        }

        const { data } = await this.twitchAPI({
          method: "GET",
          url: `/users?${idParams}`,
        });

        if (!data) reject("Users not found");

        resolve(data);
      } catch (err) {
        reject(err);
      }
    });
  };

  getUserDataByLogin = (login) => {
    return new Promise(async (resolve, reject) => {
      try {
        await this.#checkTokenExpiration();
        const { data } = await this.twitchAPI({
          method: "GET",
          url: `/users?login=${login}`,
        });

        if (!data) reject("User not found");

        console.log(`Retrieved data for ${data.data[0].login}`);

        resolve(data);
      } catch (err) {
        reject(err);
      }
    });
  };

  getUserFollowerIdsById = (to_id, first, after) => {
    return new Promise(async (resolve, reject) => {
      try {
        await this.#checkTokenExpiration();

        const { data } = await this.twitchAPI(
          `/users/follows?to_id=${to_id}&first=${first}&after=${after}`
        );

        if (!data) reject("Followers not found");

        resolve(data);
      } catch (err) {
        reject(err);
      }
    });
  };

  getStreamDataById = (user_id) => {
    return new Promise(async (resolve, reject) => {
      try {
        await this.#checkTokenExpiration();

        let userIdParams = "";

        if (Array.isArray(user_id)) {
          userIdParams = user_id.map((i) => `user_id=${i}`).join("&");
        } else {
          userIdParams = `user_id=${user_id}`;
        }

        const { data } = await this.twitchAPI(`/streams?${userIdParams}`);

        resolve(data);
      } catch (err) {
        reject(err);
      }
    });
  };
};
