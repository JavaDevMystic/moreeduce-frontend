import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPlatformSettings,
  updatePlatformSetting,
  PlatformSetting,
} from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Settings, Edit2, Check, X, Loader2 } from "lucide-react";

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: getPlatformSettings,
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      updatePlatformSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      toast.success("Sozlama yangilandi");
      setEditingKey(null);
    },
    onError: (err: any) => {
      console.error("Update error:", err);
      toast.error(err.message || "Yangilashda xatolik yuz berdi");
    },
  });

  const startEdit = (setting: PlatformSetting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const saveEdit = (key: string) => {
    updateMutation.mutate({ key, value: editValue });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        Yuklanmoqda...
      </div>
    );
  }

  if (!settings && !isLoading) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="h-40 flex flex-col items-center justify-center gap-4 text-destructive">
          <Settings className="h-10 w-10 opacity-20" />
          <p className="font-medium">
            Sozlamalarni yuklashda xatolik yuz berdi
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["platform-settings"] })
            }
          >
            Qayta urinish
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Platforma Sozlamalari</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Platforma konfiguratsiyasini boshqarish
          </p>
        </div>
      </div>

      {!settings || settings.length === 0 ? (
        <Card>
          <CardContent className="h-40 flex items-center justify-center text-muted-foreground">
            Sozlamalar topilmadi
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(settings) &&
            settings.map((setting) => (
              <Card
                key={setting.key}
                className="overflow-hidden border-border/50 hover:border-primary/20 transition-all shadow-sm hover:shadow-md"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wide">
                    {setting.key}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editingKey === setting.key ? (
                    <div className="flex gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 font-medium"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(setting.key);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => saveEdit(setting.key)}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={cancelEdit}
                        disabled={updateMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-base font-semibold break-all">
                        {setting.value}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="shrink-0 hover:bg-muted"
                        onClick={() => startEdit(setting)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
