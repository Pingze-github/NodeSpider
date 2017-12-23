
const cheerio = require('cheerio');
const request = require('request');

function requester(url, headers) {
  return new Promise((resolve, reject) => {
    const options = {
      uri: url,
      headers: headers,
    };
    request(options, (err, res, body) => {
      if (err) return reject(err);
      resolve(body);
    });
  });
}

function parseFinder(finder) {
  let pathes, propName, propKey;
  const pathSplitIndex = finder.indexOf('#');
  const keySplitIndex = finder.indexOf(':');
  if (pathSplitIndex !== -1) {
    pathes = finder.substring(0, pathSplitIndex).split('/');
    pathes = pathes.map(v => v.trim());
  }
  if (keySplitIndex !== -1) {
    propKey = finder.substring(keySplitIndex + 1);
  }
  propName = finder.substring(pathSplitIndex + 1, keySplitIndex !== -1 ? keySplitIndex : void 0).trim();
  return {pathes, propName, propKey};
}

function doDealer(dealers, list) {
  dealers.forEach((dealer) => {
    dname = Object.keys(dealer)[0];
    dbody = dealer[dname];
    if (dname === 'map') list = list.map(dbody);
    else if (dname === 'omit') {
      list = list.map(v => {
        const ov = {};
        for (let k in v) if (!dbody.includes(k)) ov[k] = v[k];
        return ov;
      });
    }
  });
  return list;
}


function recurseSave(base, map) {
  let list = [];
  const $items = base.find(map.item);
  if ($items.length === 0) throw new Error(`Nothing match item selector "${map.item}"`);
  const items = [];
  $items.each((i, item) => items.push(cheerio(item)));
  if (map.filter) items.filter(map.filter);
  if (typeof map.save === 'string') {
    const {pathes, propName, propKey} = parseFinder(map.save);
    for (item of items) {
      let $tag = item;
      if (pathes) {
        pathes.forEach(path => $tag = item.find(path));
      }
      try {
        saveValue = $tag[propName](propKey);
      } catch (err) {
        if (err instanceof TypeError) {
          throw new Error(`UnSupport query function "${propName}"`)
        }
      }
      list.push(saveValue);
    }
  } else {
    for (item of items) {
      const result = {};
      list.push(result);
    }
    for (let saveKey in map.save) {
      if (!map.save.hasOwnProperty(saveKey)) continue;
      const saveFinder = map.save[saveKey];
      if (typeof saveFinder === 'string') {
        const {pathes, propName, propKey} = parseFinder(saveFinder);
        items.forEach((item, i) => {
          let $tag = item;
          if (pathes) {
            pathes.forEach(path => $tag = item.find(path));
          }
          saveValue = $tag[propName](propKey);
          list[i][saveKey] = saveValue;
        });
      } else {
        items.forEach((item, i) => {
          list[i][saveKey] = [];
          list[i][saveKey] = recurseSave(item, saveFinder);
        });
      }
    }
  }
  if (map.dealer) {
    list = doDealer(map.dealer, list);
  }
  return list;
}

async function picker(plan) {
  let resultList = [];
  const html = await requester(plan.url, plan.headers);
  const $ = cheerio.load(html);
  let onlyOne;
  if (Object.prototype.toString.call(plan.list) !== '[object Array]') {
    plan.list = [plan.list];
  }
  plan.list.forEach(map => {
    thisResultList = recurseSave($('html'), map);
    resultList = resultList.concat(thisResultList);
  });
  if (Object.prototype.toString.call(plan.list) !== '[object Array]') return resultList[0];

  return resultList;
}

module.exports = picker;