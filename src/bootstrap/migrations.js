import mongoose from 'mongoose'

export async function ensureBannerIndexes() {
  try {
    const coll = mongoose.connection.collection('banners')
    const indexes = await coll.indexes()
    const hasCreatedBy = indexes.find(i => i.name === 'createdBy_1')
    if (hasCreatedBy) {
      await coll.dropIndex('createdBy_1')
    }
  } catch (_) {}
}

