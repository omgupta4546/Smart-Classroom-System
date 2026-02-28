import { useState } from "react";
import { motion } from "framer-motion";
import { LogIn, Loader2, Hash } from "lucide-react";
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

interface JoinClassModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const JoinClassModal = ({ open, onOpenChange, onSuccess }: JoinClassModalProps) => {
    const { api } = useAuth();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) {
            toast.error("Please enter a class code.");
            return;
        }

        setLoading(true);
        try {
            await api.post("/classes/join", { code: trimmed });
            toast.success("🎉 Successfully joined the class!");
            setCode("");
            onOpenChange(false);
            onSuccess?.();
        } catch (err: any) {
            const msg = err?.response?.data?.msg || "Failed to join class.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-display text-lg flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                            <LogIn className="h-4 w-4 text-primary" />
                        </div>
                        Join a Class
                    </DialogTitle>
                    <DialogDescription>
                        Enter the class code provided by your professor to enroll.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="class-code">Class Code</Label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="class-code"
                                placeholder="e.g. CS101A"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                className="pl-9 font-mono tracking-widest uppercase"
                                maxLength={20}
                                autoFocus
                                disabled={loading}
                            />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Class codes are case-insensitive. Ask your professor if you don't have one.
                        </p>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => { onOpenChange(false); setCode(""); }}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
                            <Button type="submit" className="w-full" disabled={loading || !code.trim()}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Joining...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="h-4 w-4 mr-2" />
                                        Join Class
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

export default JoinClassModal;
