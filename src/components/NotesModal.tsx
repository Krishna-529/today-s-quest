import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { fetchNoteByScope, upsertNote } from "@/lib/supabaseClient";
import { Pencil } from "lucide-react";

interface NotesModalProps {
  open: boolean;
  onClose: () => void;
  initialDate: string | null; // YYYY-MM-DD
  projectId?: string | null;
  projectName?: string | null;
  viewOnly?: boolean;
}

export const NotesModal = ({ open, onClose, initialDate, projectId, projectName, viewOnly = false }: NotesModalProps) => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const [noteText, setNoteText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isEditingScope, setIsEditingScope] = useState(false);
  const [editDate, setEditDate] = useState<string | null>(initialDate ?? null);
  const [editProjectName, setEditProjectName] = useState<string | null>(projectName ?? null);

  useEffect(() => {
    if (!open) return;
    setEditDate(initialDate ?? null);
    setEditProjectName(projectName ?? null);
    setIsEditingScope(false);
  }, [open, initialDate, projectName]);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    (async () => {
      const { data, error } = await fetchNoteByScope({ user_id: user.id, project_name: projectName ?? null, note_date: initialDate ?? null });
      if (!error && data && data.length > 0) {
        setNoteText(data[0].note_text || "");
      } else {
        setNoteText("");
      }
      setLoading(false);
    })();
  }, [open, initialDate, projectName, user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    
    // Find the project_id for the edited project name
    const selectedProject = projects.find(p => p.name === editProjectName);
    
    const { data, error } = await upsertNote({
      user_id: user.id,
      project_id: selectedProject?.id ?? null,
      project_name: editProjectName ?? null,
      note_date: editDate ?? null,
      note_text: noteText,
    });
    setLoading(false);
    if (!error) {
      onClose();
    } else {
      console.error("Error saving note", error);
    }
  };

  const projectLabel = editProjectName ?? "All Projects";
  const dateLabel = editDate ?? "All Time";

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Notes</span>
            {!viewOnly && !isEditingScope && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingScope(true)}
                className="h-7 w-7 p-0"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {!isEditingScope ? (
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Project: <span className="font-medium text-foreground">{projectLabel}</span></div>
              <div>Date: <span className="font-medium text-foreground">{dateLabel}</span></div>
            </div>
          ) : (
            <div className="space-y-3 p-3 border rounded-md bg-muted/30">
              <div className="space-y-2">
                <label className="text-xs font-medium">Project</label>
                <Select
                  value={editProjectName ?? "all"}
                  onValueChange={(val) => setEditProjectName(val === "all" ? null : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.name}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Date</label>
                <Input
                  type="date"
                  value={editDate ?? ""}
                  onChange={(e) => setEditDate(e.target.value || null)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditDate(null)}
                  className="text-xs"
                >
                  Clear date (All Time)
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingScope(false)}
                className="w-full"
              >
                Done
              </Button>
            </div>
          )}
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={8}
            placeholder="Write your note here..."
            readOnly={viewOnly}
            disabled={loading}
            className="whitespace-pre-wrap"
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Close</Button>
          {!viewOnly && (
            <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotesModal;
