import { useState } from "react";
import { motion } from "framer-motion";
import { BookPlus, Loader2, Wand2, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CreateClassModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const generateCode = () => {
    const prefix = ["CS", "MATH", "PHY", "ENG", "BIO", "CHEM", "ECO", "HIS"][Math.floor(Math.random() * 8)];
    const num = Math.floor(100 + Math.random() * 900);
    const suffix = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `${prefix}${num}${suffix}`;
};

const CreateClassModal = ({ open, onOpenChange, onSuccess }: CreateClassModalProps) => {
    const { api } = useAuth();
    const [form, setForm] = useState({ name: "", subjectName: "", code: "" });
    const [loading, setLoading] = useState(false);

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleAutoCode = () => {
        handleChange("code", generateCode());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.code.trim()) {
            toast.error("Class Name and Class Code are required.");
            return;
        }

        setLoading(true);
        try {
            await api.post("/classes/create", {
                name: form.name.trim(),
                subjectName: form.subjectName.trim() || form.name.trim(),
                code: form.code.trim().toUpperCase(),
            });
            toast.success(`🎓 Class "${form.name}" created successfully!`);
            setForm({ name: "", subjectName: "", code: "" });
            onOpenChange(false);
            onSuccess?.();
        } catch (err: any) {
            const msg = err?.response?.data?.msg || err?.response?.data || "Failed to create class.";
            toast.error(typeof msg === "string" ? msg : "Failed to create class. Code may already be taken.");
        } finally {
            setLoading(false);
        }
    };

    const isValid = form.name.trim() && form.code.trim();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-display text-lg flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                            <BookPlus className="h-4 w-4 text-primary" />
                        </div>
                        Create a New Class
                    </DialogTitle>
                    <DialogDescription>
                        Fill in the details below. Share the class code with your students so they can join.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Class Name */}
                    <div className="space-y-2">
                        <Label htmlFor="class-name">
                            Class Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="class-name"
                            placeholder="e.g. Data Structures & Algorithms"
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    {/* Subject Name */}
                    <div className="space-y-2">
                        <Label htmlFor="subject-name">
                            Subject Name{" "}
                            <span className="text-muted-foreground text-xs">(optional)</span>
                        </Label>
                        <Input
                            id="subject-name"
                            placeholder="e.g. Computer Science — defaults to Class Name"
                            value={form.subjectName}
                            onChange={(e) => handleChange("subjectName", e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {/* Class Code */}
                    <div className="space-y-2">
                        <Label htmlFor="class-code">
                            Class Code <span className="text-destructive">*</span>
                        </Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="class-code"
                                    placeholder="e.g. CS301A"
                                    value={form.code}
                                    onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
                                    className="pl-9 font-mono tracking-widest uppercase"
                                    maxLength={20}
                                    disabled={loading}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleAutoCode}
                                disabled={loading}
                                title="Generate a random code"
                                className="shrink-0"
                            >
                                <Wand2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Must be unique. Students will use this code to join your class.
                        </p>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => { onOpenChange(false); setForm({ name: "", subjectName: "", code: "" }); }}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
                            <Button type="submit" className="w-full" disabled={loading || !isValid}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <BookPlus className="h-4 w-4 mr-2" />
                                        Create Class
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateClassModal;
