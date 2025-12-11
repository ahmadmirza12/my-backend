// Test the fixed toAbs function

function toAbs(u) {
  const placeholder = ' `https://via.placeholder.com/300?text=No+Image` '
  
  if (!u || typeof u !== 'string') {
    // Clean the placeholder before returning it
    return placeholder.replace(/[`\s]/g, '').trim()
  }
  
  // Clean the URL by removing backticks and extra spaces
  const cleanUrl = u.replace(/[`\s]/g, '').trim()
  
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) return cleanUrl
  
  // Handle relative paths
  const cleanBase = 'http://localhost:8000'.replace(/\/$/, '')
  const cleanPath = cleanUrl.startsWith('/') ? cleanUrl : `/uploads/${cleanUrl}`
  return `${cleanBase}${cleanPath}`
}

console.log('Testing fixed toAbs function:\n')

// Test with undefined (when images[0] is undefined)
console.log('Test 1: toAbs(undefined) - should return cleaned placeholder')
const result1 = toAbs(undefined)
console.log('Result:', result1)
console.log('Expected: https://via.placeholder.com/300?text=No+Image')
console.log('✅', result1 === 'https://via.placeholder.com/300?text=No+Image' ? 'PASS' : 'FAIL')
console.log('')

// Test with null
console.log('Test 2: toAbs(null) - should return cleaned placeholder')
const result2 = toAbs(null)
console.log('Result:', result2)
console.log('✅', result2 === 'https://via.placeholder.com/300?text=No+Image' ? 'PASS' : 'FAIL')
console.log('')

// Test with valid URL
console.log('Test 3: toAbs with valid URL - should return cleaned URL')
const result3 = toAbs(' `http://localhost:8000/uploads/image.jpg` ')
console.log('Result:', result3)
console.log('Expected: http://localhost:8000/uploads/image.jpg')
console.log('✅', result3 === 'http://localhost:8000/uploads/image.jpg' ? 'PASS' : 'FAIL')
console.log('')

// Test with relative path
console.log('Test 4: toAbs with relative path - should return full URL')
const result4 = toAbs('image123.jpg')
console.log('Result:', result4)
console.log('Expected: http://localhost:8000/uploads/image123.jpg')
console.log('✅', result4 === 'http://localhost:8000/uploads/image123.jpg' ? 'PASS' : 'FAIL')