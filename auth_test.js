const puppeteer = require('puppeteer');
const axios = require('axios');
const { promises: fs } = require('fs');
const util = require('util');

(async () => {

    let configStr = await fs.readFile("config.json");
    let config = JSON.parse(configStr);

    const browser = await puppeteer.launch({devtools: true});
    const page = await browser.newPage();

    let url = util.format("https://api.ecobee.com/authorize?response_type=code&state=&client_id=%s&scope=smartRead&redirect_uri=https://oauth.pstmn.io/v1/callback", config.apiKey);
    await page.goto(url);

    // Do login
    await page.type('#userName', config.userName);
    await page.type('#password', config.password);
    await page.click('#submit');

    await page.waitForNavigation({waitUntil: 'networkidle2'});

    await page.click('#accept');

    await page.waitForNavigation({waitUntil: 'networkidle2'});

    // Extract the authorization code from the redirect url
    let redirectedUrl = new URL(page.url());
    let authCode = redirectedUrl.searchParams.get('code');
    await browser.close();

    let postData = new URLSearchParams();
    postData.append('grant_type', 'authorization_code');
    postData.append('client_id', config.apiKey);
    postData.append('code', authCode);
    postData.append('redirect_uri', 'https://oauth.pstmn.io/v1/callback');

    let response = await axios.post('https://api.ecobee.com/token', postData);
    if(response.status === 200) {
        console.log("Access token: ", response.data.token_type + " " + response.data.access_token);
        console.log("Expires in: ", response.data.expires_in);
        console.log("Refresh token: ", response.data.refresh_token);
    }
    else {
        console.log("Something went wrong: ", response);
    }
})();