import { createClient } from '@supabase/supabase-js'
import { Note } from '@/types'
import { buildNoteScopeKey } from '@/lib/noteScope'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Notes helpers
export async function upsertNote({
	user_id,
	project_id,
	project_name,
	note_date,
	note_text,
}: {
	user_id: string;
	project_id?: string | null;
	project_name?: string | null;
	note_date: string | null;
	note_text: string;
}) {
	const scope_key = buildNoteScopeKey(project_name ?? null, note_date);
	const payload = {
		user_id,
		project_id: project_id ?? null,
		project_name: project_name ?? null,
		note_date: note_date ?? null,
		scope_key,
		note_text,
	};
	// Try to insert; on conflict update the note_text and updated_at
	const { data, error } = await supabase
		.from('notes')
		.upsert(payload, { onConflict: 'user_id,scope_key' })
		.select();
	return { data, error };
}

export async function fetchNoteByScope({
	user_id,
	project_name,
	note_date,
}: {
	user_id: string;
	project_name?: string | null;
	note_date: string | null;
}) {
	const scope_key = buildNoteScopeKey(project_name ?? null, note_date);
	const { data, error } = await supabase
		.from('notes')
		.select('*')
		.eq('user_id', user_id)
		.eq('scope_key', scope_key)
		.limit(1);
	return { data, error };
}

export async function fetchNotesByProject({ user_id, project_id }: { user_id: string; project_id: string }) {
	const { data, error } = await supabase
		.from('notes')
		.select('*')
		.eq('user_id', user_id)
		.eq('project_id', project_id)
		.order('note_date', { ascending: false });
	return { data, error };
}

export async function fetchNotesByDate({ user_id, note_date }: { user_id: string; note_date: string }) {
	const { data, error } = await supabase
		.from('notes')
		.select('*')
		.eq('user_id', user_id)
		.eq('note_date', note_date);
	return { data, error };
}
