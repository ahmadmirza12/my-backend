import { isCategoryAllowed, isBannerActive, STATIC_ALLOWED_CATEGORIES } from '../controllers/banner.controller.js'

function assert(condition, message) {
  if (!condition) {
    console.error('❌', message)
    process.exitCode = 1
  } else {
    console.log('✅', message)
  }
}

console.log('Running banner unit tests...')

// Category allowed tests
{
  const existing = ['Kids', 'Men', 'Women']
  for (const c of STATIC_ALLOWED_CATEGORIES) {
    assert(isCategoryAllowed(c, [...STATIC_ALLOWED_CATEGORIES, ...existing]) === true, `Category allowed: ${c}`)
  }
  assert(isCategoryAllowed('Kids', [...STATIC_ALLOWED_CATEGORIES, ...existing]) === true, 'Category allowed: Kids')
  assert(isCategoryAllowed('UnknownCat', [...STATIC_ALLOWED_CATEGORIES, ...existing]) === false, 'Category rejected: UnknownCat')
}

// Banner active tests
{
  const now = new Date('2025-01-01T00:00:00.000Z')
  const activeNoDates = { isActive: true }
  assert(isBannerActive(activeNoDates, now) === true, 'Active banner without dates')

  const inactive = { isActive: false }
  assert(isBannerActive(inactive, now) === false, 'Inactive banner')

  const futureStart = { isActive: true, startDate: '2025-02-01T00:00:00.000Z' }
  assert(isBannerActive(futureStart, now) === false, 'Banner not started yet')

  const pastEnd = { isActive: true, endDate: '2024-12-01T00:00:00.000Z' }
  assert(isBannerActive(pastEnd, now) === false, 'Banner already ended')

  const withinRange = { isActive: true, startDate: '2024-12-01T00:00:00.000Z', endDate: '2025-12-31T00:00:00.000Z' }
  assert(isBannerActive(withinRange, now) === true, 'Banner within date range')
}

if (process.exitCode === 1) {
  console.log('❌ Banner tests failed')
  process.exit(1)
} else {
  console.log('🎉 Banner tests passed')
  process.exit(0)
}

