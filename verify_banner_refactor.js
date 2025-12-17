
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MmZmMDA2YzcxYWM0MzQ1YzEyMzgxMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2NTg4NDM1NywiZXhwIjoxNzY1OTcwNzU3fQ.2J6F_1O-aDVGOBWa45Jt3PfNS_Q0g8uMhD3HTaXMwtY";
const bannerImage = "https://res.cloudinary.com/dbnkcdvua/image/upload/v1765560820/products/bojl4i2oswp7tidwzn2k.png";
const category = "summer";
const baseUrl = "http://localhost:8000/api/v1";

async function runTests() {
  console.log("Starting Banner API verification (After Refactor)...");

  // 1. Create Banner (POST /banners)
  console.log("\n1. Testing POST /banners...");
  let createdBannerId;
  try {
    const res = await fetch(`${baseUrl}/banners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        productCategory: category,
        bannerImage: bannerImage
      })
    });
    
    if (res.ok) {
        const data = await res.json();
        console.log("✅ Create Banner Success:", data);
        createdBannerId = data.item._id;
    } else {
        const text = await res.text();
        console.error("❌ Create Banner Failed:", res.status, text);
        return;
    }
  } catch (e) {
    console.error("❌ Create Banner Error:", e.message);
    return;
  }

  // 2. List Banners (GET /banners) - Previously /user/products/banners
  console.log("\n2. Testing GET /banners...");
  try {
    const res = await fetch(`${baseUrl}/banners?category=${category}`, {
      method: 'GET',
    });

    if (res.ok) {
        const data = await res.json();
        console.log("✅ List Banners Success. Count:", data.items.length);
        const found = data.items.find(b => b._id === createdBannerId);
        if (found) {
            console.log("✅ Created banner found in list.");
        } else {
            console.error("❌ Created banner NOT found in list.");
        }
    } else {
        const text = await res.text();
        console.error("❌ List Banners Failed:", res.status, text);
    }
  } catch (e) {
    console.error("❌ List Banners Error:", e.message);
  }

  // 3. Update Banner (PUT /banners/:id)
  console.log(`\n3. Testing PUT /banners/${createdBannerId}...`);
  try {
    const res = await fetch(`${baseUrl}/banners/${createdBannerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        productCategory: "winter"
      })
    });

    if (res.ok) {
        const data = await res.json();
        console.log("✅ Update Banner Success:", data);
    } else {
        const text = await res.text();
        console.error("❌ Update Banner Failed:", res.status, text);
    }
  } catch (e) {
    console.error("❌ Update Banner Error:", e.message);
  }

  // 4. Delete Banner (DELETE /banners/:id)
  console.log(`\n4. Testing DELETE /banners/${createdBannerId}...`);
  try {
    const res = await fetch(`${baseUrl}/banners/${createdBannerId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
        const data = await res.json();
        console.log("✅ Delete Banner Success:", data);
    } else {
        const text = await res.text();
        console.error("❌ Delete Banner Failed:", res.status, text);
    }
  } catch (e) {
    console.error("❌ Delete Banner Error:", e.message);
  }
}

runTests();
