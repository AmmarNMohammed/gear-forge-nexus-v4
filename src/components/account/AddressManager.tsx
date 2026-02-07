import { useState } from "react";
import { MapPin, Plus, Trash2, Star, Pencil, Loader2, Phone, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAddresses, AddressFormData } from "@/hooks/useAddresses";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

const emptyForm: AddressFormData = {
  label: "Home",
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "Saudi Arabia",
  is_default: false,
};

export function AddressManager() {
  const { addresses, isLoading, addAddress, updateAddress, deleteAddress, setDefault } = useAddresses();
  const { t, direction } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormData>(emptyForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateAddress(editingId, form);
    } else {
      await addAddress(form);
    }
    resetForm();
  };

  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (address: any) => {
    setForm({
      label: address.label,
      full_name: address.full_name,
      phone: address.phone || "",
      address_line1: address.address_line1,
      address_line2: address.address_line2 || "",
      city: address.city,
      state: address.state || "",
      postal_code: address.postal_code || "",
      country: address.country,
      is_default: address.is_default,
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const updateField = (field: keyof AddressFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={cn("flex items-center justify-between", direction === "rtl" && "flex-row-reverse")}>
        <h3 className="text-lg font-semibold">{t("address.myAddresses")}</h3>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {t("address.addNew")}
          </Button>
        )}
      </div>

      {/* Address Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("address.label")}</Label>
              <Input
                value={form.label}
                onChange={(e) => updateField("label", e.target.value)}
                placeholder={t("address.labelPlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("address.fullName")}</Label>
              <Input
                value={form.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                placeholder={t("address.fullNamePlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("address.phone")}</Label>
              <Input
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+966 5XX XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("address.country")}</Label>
              <Input
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("address.addressLine1")}</Label>
              <Input
                value={form.address_line1}
                onChange={(e) => updateField("address_line1", e.target.value)}
                placeholder={t("address.addressLine1Placeholder")}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("address.addressLine2")}</Label>
              <Input
                value={form.address_line2}
                onChange={(e) => updateField("address_line2", e.target.value)}
                placeholder={t("address.addressLine2Placeholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("address.city")}</Label>
              <Input
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("address.state")}</Label>
              <Input
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("address.postalCode")}</Label>
              <Input
                value={form.postal_code}
                onChange={(e) => updateField("postal_code", e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => updateField("is_default", e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm">{t("address.setAsDefault")}</span>
              </label>
            </div>
          </div>

          <div className={cn("flex gap-3", direction === "rtl" && "flex-row-reverse")}>
            <Button type="submit">{editingId ? t("address.update") : t("address.save")}</Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              {t("address.cancel")}
            </Button>
          </div>
        </form>
      )}

      {/* Address List */}
      {addresses.length === 0 && !showForm ? (
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">{t("address.noAddresses")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={cn(
                "border rounded-lg p-4 relative transition-colors",
                address.is_default
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              {address.is_default && (
                <Badge className="absolute top-3 right-3 bg-primary/20 text-primary border-primary/30">
                  {t("address.default")}
                </Badge>
              )}

              <div className="space-y-1.5">
                <p className="font-semibold text-sm text-muted-foreground">{address.label}</p>
                <p className={cn("font-medium flex items-center gap-1.5", direction === "rtl" && "flex-row-reverse")}>
                  <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  {address.full_name}
                </p>
                {address.phone && (
                  <p className={cn("text-sm text-muted-foreground flex items-center gap-1.5", direction === "rtl" && "flex-row-reverse")}>
                    <Phone className="w-3.5 h-3.5" />
                    {address.phone}
                  </p>
                )}
                <p className="text-sm">
                  {address.address_line1}
                  {address.address_line2 && `, ${address.address_line2}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[address.city, address.state, address.postal_code].filter(Boolean).join(", ")}
                </p>
                <p className="text-sm text-muted-foreground">{address.country}</p>
              </div>

              <div className={cn("flex items-center gap-2 mt-4 pt-3 border-t border-border", direction === "rtl" && "flex-row-reverse")}>
                {!address.is_default && (
                  <Button size="sm" variant="outline" onClick={() => setDefault(address.id)} className="gap-1.5 text-xs">
                    <Star className="w-3.5 h-3.5" />
                    {t("address.makeDefault")}
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => startEdit(address)} className="gap-1.5 text-xs">
                  <Pencil className="w-3.5 h-3.5" />
                  {t("address.edit")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteAddress(address.id)}
                  className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t("address.delete")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
