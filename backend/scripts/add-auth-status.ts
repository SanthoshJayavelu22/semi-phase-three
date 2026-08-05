import fs from 'fs';
import path from 'path';

const postmanPath = path.join(__dirname, '../../postman_collection.json');

if (fs.existsSync(postmanPath)) {
  const collection = JSON.parse(fs.readFileSync(postmanPath, 'utf8'));

  // Find the Auth folder
  const authFolder = collection.item.find((i: any) => i.name === '🔐 Auth');

  if (authFolder) {
    // Check if status exists
    const exists = authFolder.item.find((req: any) => req.request.url.path.includes('status'));
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
      fs.writeFileSync(postmanPath, JSON.stringify(collection, null, 2));
      console.log('Added GET /auth/status to postman collection');
    } else {
      console.log('GET /auth/status already exists in postman collection');
    }
  } else {
    console.log('Could not find Auth folder');
  }
} else {
  console.log('Postman collection file not found');
}
