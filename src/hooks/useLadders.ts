import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useLadders() {
  const [ladders, setLadders] = useState<unknown[]>([])

  useEffect(() => {
    fetchLadders()
  }, [])

  async function fetchLadders() {
  const { data, error } = await supabase.from('ladders').select('*').order('id', { ascending: true })
  if (error) console.error(error)
  else setLadders((data as unknown[]) || [])
  }

  async function addLadder(title: string, description = '', deadline?: string) {
  const { error } = await supabase.from('ladders').insert([{ title, description, deadline, completed: false }])
  if (error) console.error(error)
    else fetchLadders()
  }

  async function deleteLadder(id: number) {
  const { error } = await supabase.from('ladders').delete().eq('id', id)
  if (error) console.error(error)
    else fetchLadders()
  }

  async function toggleComplete(id: number, completed: boolean) {
  const { error } = await supabase.from('ladders').update({ completed }).eq('id', id)
  if (error) console.error(error)
    else fetchLadders()
  }

  return { ladders, addLadder, deleteLadder, toggleComplete }
}
