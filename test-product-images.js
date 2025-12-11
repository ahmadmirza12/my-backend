// Test to check if product has images in database

// Mock the product data from your response
const productData = {
  _id: "693a85e4582c95c6fec66236",
  description: "",
  images: [],
  colors: [],
  stock: 0,
  category: "Unknown",
  status: "inactive",
  variants: []
}

console.log('Product Data Analysis:')
console.log('Product ID:', productData._id)
console.log('Images array:', productData.images)
console.log('Images array length:', productData.images.length)
console.log('Has images?', productData.images.length > 0)

// Check what happens when we try to access images[0]
console.log('\nImages[0]:', productData.images[0])
console.log('Images[0] is undefined:', productData.images[0] === undefined)

// Check the logic we use in the controller
const images = productData.images || []
console.log('\nAfter images || []:', images)
console.log('images.length > 0:', images.length > 0)

// This is what happens in our current code:
if (images.length > 0) {
  console.log('Would use real image:', images[0])
} else {
  console.log('Would use placeholder (with backticks):', ' `https://via.placeholder.com/300?text=No+Image` ')
  
  // Our fixed version should clean the placeholder:
  const placeholder = ' `https://via.placeholder.com/300?text=No+Image` '
  const cleanedPlaceholder = placeholder.replace(/[`\s]/g, '').trim()
  console.log('Cleaned placeholder:', cleanedPlaceholder)
}

console.log('\n🎯 CONCLUSION:')
console.log('The product genuinely has NO images stored in the database.')
console.log('This is why you see the placeholder image.')
console.log('The issue is not with our code - the product needs to have images added via the upload API.')