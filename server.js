require("dotenv").config();
const axios = require("axios");

const twitchAPI = axios.create({
  baseURL: "https://api.twitch.tv/helix/",
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

    console.log("User ID:", id);
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
      } = await twitchAPI({
        method: "GET",
        url: `/users?login=${login}`,
      });

      if (!id) reject("User not found");

      resolve(id);
    } catch (err) {
      reject(err);
    }
  });
};

init();
