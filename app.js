const got = require('got');
const map = require('p-map');
const path = require('path');
const express = require('express');

var app = express();
var port = process.env.PORT || 8080;

app.get('/', function (req, res) {
  res.sendFile('index.html', { root: path.join(__dirname, '/public') });
});

app.get('/api/v1', function (req, res) {

  var names = req.param('names').split(',');
  var appid = req.param('appid');
  var currency = req.param('currency');

  getItemsPrices(appid, names, currency).then(item => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(item));
  });
});

app.listen(port, function () {
  console.log(`Example app listening on port ${port}`);
});









/**
 * Retrieve price for single item.
 *
 * @param {number} appid - Steam application id
 * @param {String} name - Item name, market hashed
 * @param {number} [currency=1] - Currency code number, default USD (https://github.com/SteamRE/SteamKit/blob/master/Resources/SteamLanguage/enums.steamd#L696)
 */
async function getItemPrice(appid, name, currency = 1) {
  const response = await got('http://steamcommunity.com//market/priceoverview', {
    json: true,
    query: {
      currency: currency,
      appid: appid,
      market_hash_name: name
    }
  });

  return { body: response.body, market_hash_name: name };
}

/**
 * Retrieve prices for list of items.
 *
 * @param {number} appid - Steam application id
 * @param {Array} names - List of item names, market hashed
 * @param {number} [currency=1] - Currency code number, default USD (https://github.com/SteamRE/SteamKit/blob/master/Resources/SteamLanguage/enums.steamd#L696)
 * @param {number} [concurrency=1] - Number of concurrently running requests
 */
async function getItemsPrices(appid, names, currency = 1, concurrency = 1) {
  if (!Array.isArray(names)) {
    if (typeof names === 'string') return getItemsPrices(appid, [names], currency);
    throw new Error(`Invalid argument names, expected array got ${typeof names}`);
  }

  const result = {};
  const items = await map(names, name => getItemPrice(appid, name, currency).catch(err => ({ success: false, market_hash_name: name, err })), { concurrency });
  items.forEach(item => result[item.market_hash_name] = item);

  return result;
}
