// Simple test to verify image URL cleaning functionality

function toAbs(u, base = 'http://localhost:8000') {
  const placeholder = 'https://demofree.sirv.com/nope-not-here.jpg'
  
  if (!u || typeof u !== 'string') return placeholder
  
  // Clean the URL by removing backticks and extra spaces
  const cleanUrl = u.replace(/[`\s]/g, '').trim()
  
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) return cleanUrl
  
  // Handle relative paths
  const cleanBase = base.replace(/\/$/, '') // Remove trailing slash if present
  const cleanPath = cleanUrl.startsWith('/') ? cleanUrl : `/uploads/${cleanUrl}`
  return `${cleanBase}${cleanPath}`
}

// Test cases based on your product API response
const testCases = [
  {
    input: " `http://my-backend-production-cb91.up.railway.app/uploads/1765390121977-32a19aa1f4a5.jpeg` ",
    expected: "http://my-backend-production-cb91.up.railway.app/uploads/1765390121977-32a19aa1f4a5.jpeg",
    description: "URL with backticks and spaces"
  },
  {
    input: "http://localhost:8000/uploads/1765398356070-0a9db0d85c07.png",
    expected: "http://localhost:8000/uploads/1765398356070-0a9db0d85c07.png",
    description: "Clean absolute URL"
  },
  {
    input: "1765390122662-7492f224759e.jpeg",
    expected: "http://localhost:8000/uploads/1765390122662-7492f224759e.jpeg",
    description: "Relative path"
  },
  {
    input: "",
    expected: "https://demofree.sirv.com/nope-not-here.jpg",
    description: "Empty string"
  },
  {
    input: null,
    expected: "https://demofree.sirv.com/nope-not-here.jpg",
    description: "Null value"
  }
]

console.log('Testing image URL cleaning functionality...\n')

let passed = 0
let failed = 0

testCases.forEach((testCase, index) => {
  const result = toAbs(testCase.input)
  const success = result === testCase.expected
  
  if (success) {
    console.log(`✅ Test ${index + 1}: ${testCase.description}`)
    passed++
  } else {
    console.log(`❌ Test ${index + 1}: ${testCase.description}`)
    console.log(`   Input: ${testCase.input}`)
    console.log(`   Expected: ${testCase.expected}`)
    console.log(`   Got: ${result}`)
    failed++
  }
})

console.log(`\nResults: ${passed} passed, ${failed} failed`)

if (failed === 0) {
  console.log('🎉 All tests passed! The image URL cleaning fix is working correctly.')
  process.exit(0)
} else {
  console.log('❌ Some tests failed. Please review the implementation.')
  process.exit(1)
}