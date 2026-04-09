import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Drop-in replacement for window.storage used throughout App.jsx
// The 'shared' parameter is ignored — Supabase is shared by default
export const storage = {
  async get(key, _shared) {
    try {
      const { data, error } = await sb
        .from('cases')
        .select('data')
        .eq('id', key)
        .single()
      if (error || !data) return null
      return { value: JSON.stringify(data.data) }
    } catch {
      return null
    }
  },

  async set(key, value, _shared) {
    try {
      const { error } = await sb
        .from('cases')
        .upsert({ id: key, data: JSON.parse(value), updated_at: new Date() })
      if (error) throw error
      return { value }
    } catch (e) {
      console.error('storage.set error', e)
      return null
    }
  },

  async delete(key, _shared) {
    try {
      await sb.from('cases').delete().eq('id', key)
      return { deleted: true }
    } catch {
      return null
    }
  },

  async list(prefix, _shared) {
    try {
      const { data } = await sb.from('cases').select('id')
      const keys = (data || [])
        .map(r => r.id)
        .filter(k => !prefix || k.startsWith(prefix))
      return { keys }
    } catch {
      return { keys: [] }
    }
  }
}
