const fs = require('fs');

const collection = JSON.parse(fs.readFileSync('postman_collection.json', 'utf8'));

const extractEndpoints = (items, prefix = '') => {
  let endpoints = [];
  items.forEach(item => {
    if (item.item) {
      endpoints = endpoints.concat(extractEndpoints(item.item, prefix + item.name + ' > '));
    } else if (item.request) {
      endpoints.push({
        name: item.name,
        method: item.request.method,
        url: item.request.url.raw.replace('{{base_url}}/api', '')
      });
    }
  });
  return endpoints;
};

const endpoints = extractEndpoints(collection.item);
endpoints.forEach(ep => console.log(`${ep.method} ${ep.url} (${ep.name})`));
