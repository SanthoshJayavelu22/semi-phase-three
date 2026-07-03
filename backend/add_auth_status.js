const fs = require('fs');

const collection = JSON.parse(fs.readFileSync('postman_collection.json', 'utf8'));

// Find the Auth folder
const authFolder = collection.item.find(i => i.name === '🔐 Auth');

if (authFolder) {
  // Check if status exists
  const exists = authFolder.item.find(req => req.request.url.path.includes('status'));
  if (!exists) {
    authFolder.item.push({
      name: "GET Auth Status",
      request: {
        method: "GET",
        header: [
          {
            key: "Authorization",
            value: "Bearer {{accessToken}}"
          }
        ],
        url: {
          raw: "{{base_url}}/api/auth/status",
          host: ["{{base_url}}"],
          path: ["api", "auth", "status"]
        },
        description: "Returns the current user's verification status, email, name, and role."
      },
      response: []
    });
    fs.writeFileSync('postman_collection.json', JSON.stringify(collection, null, 2));
    console.log('Added GET /auth/status to postman collection');
  } else {
    console.log('GET /auth/status already exists');
  }
} else {
  console.log('Could not find Auth folder');
}
