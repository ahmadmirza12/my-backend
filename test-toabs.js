// Test toAbs function behavior with undefined and placeholder

function toAbs(u) {
  const placeholder = ' `https://via.placeholder.com/300?text=No+Image` '
  
  if (!u || typeof u !== 'string') {
    console.log('Input is undefined or not string, returning placeholder:', placeholder)
    return placeholder
  }
  
  // Clean the URL by removing backticks and extra spaces
  const cleanUrl = u.replace(/[`\s]/g, '').trim()
  console.log('Cleaned URL:', cleanUrl)
  
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    console.log('Returning absolute URL:', cleanUrl)
    return cleanUrl
  }
  
  // Handle relative paths
  const cleanBase = 'http://localhost:8000'.replace(/\/$/, '')
  const cleanPath = cleanUrl.startsWith('/') ? cleanUrl : `/uploads/${cleanUrl}`
  const result = `${cleanBase}${cleanPath}`
  console.log('Returning relative path result:', result)
  return result
}

console.log('Testing toAbs function behavior:\n')

// Test with undefined (what happens when images[0] is undefined)
console.log('Test 1: toAbs(undefined)')
const result1 = toAbs(undefined)
console.log('Result:', result1)
console.log('---')

// Test with placeholder directly
console.log('Test 2: toAbs with placeholder directly')
const placeholder = ' `https://via.placeholder.com/300?text=No+Image` '
const result2 = toAbs(placeholder)
console.log('Result:', result2)
console.log('---')

// Test with null
console.log('Test 3: toAbs(null)')
const result3 = toAbs(null)
console.log('Result:', result3)
console.log('---')

// Test with valid URL
console.log('Test 4: toAbs with valid URL')
const result4 = toAbs('http://localhost:8000/uploads/image.jpg')
console.log('Result:', result4)