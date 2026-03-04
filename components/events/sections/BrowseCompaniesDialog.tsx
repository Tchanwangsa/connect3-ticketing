"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PRESET_COMPANIES,
  COMPANY_CATEGORIES,
  type CompanyCategory,
} from "./company-logos";
import type { Company } from "./types";

interface BrowseCompaniesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Companies already in the section — used to grey-out duplicates */
  existingCompanies: Company[];
  /** Called with the selected preset companies */
  onAdd: (companies: Company[]) => void;
  isDark?: boolean;
}

export function BrowseCompaniesDialog({
  open,
  onOpenChange,
  existingCompanies,
  onAdd,
  isDark,
}: BrowseCompaniesDialogProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CompanyCategory>("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Names already in the section (case-insensitive)
  const existingNames = useMemo(
    () => new Set(existingCompanies.map((c) => c.name.toLowerCase())),
    [existingCompanies],
  );

  // Filtered list
  const filtered = useMemo(() => {
    return PRESET_COMPANIES.filter((c) => {
      if (activeCategory !== "All" && c.category !== activeCategory)
        return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [activeCategory, search]);

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () => {
    const allNames = filtered
      .filter((c) => !existingNames.has(c.name.toLowerCase()))
      .map((c) => c.name);
    setSelected((prev) => {
      const next = new Set(prev);
      for (const n of allNames) next.add(n);
      return next;
    });
  };

  const deselectAll = () => {
    const filteredNames = new Set(filtered.map((c) => c.name));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const n of filteredNames) next.delete(n);
      return next;
    });
  };

  const allFilteredSelected = filtered
    .filter((c) => !existingNames.has(c.name.toLowerCase()))
    .every((c) => selected.has(c.name));

  const handleAdd = () => {
    const toAdd: Company[] = [];
    for (const name of selected) {
      const preset = PRESET_COMPANIES.find((c) => c.name === name);
      if (preset) toAdd.push({ name: preset.name, logoUrl: preset.logoUrl });
    }
    onAdd(toAdd);
    setSelected(new Set());
    setSearch("");
    setActiveCategory("All");
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelected(new Set());
      setSearch("");
      setActiveCategory("All");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[85vh] flex-col sm:max-w-lg",
          isDark && "border-neutral-700 bg-neutral-800 text-neutral-100",
        )}
      >
        <DialogHeader>
          <DialogTitle>Browse Companies</DialogTitle>
          <DialogDescription>
            Select companies to add to your event.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div
          className={cn(
            "flex items-center gap-2 rounded-md border px-3 py-2",
            isDark && "border-neutral-600 bg-neutral-700",
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground",
              isDark && "text-neutral-100 placeholder:text-neutral-400",
            )}
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          {COMPANY_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <Badge
                key={cat}
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "cursor-pointer select-none transition-colors",
                  !isActive && isDark && "border-neutral-600 text-neutral-300",
                )}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Badge>
            );
          })}
        </div>

        {/* Select all / deselect */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {selected.size} selected
            {filtered.length > 0 && ` · ${filtered.length} shown`}
          </span>
          <button
            type="button"
            onClick={allFilteredSelected ? deselectAll : selectAll}
            className="text-xs font-medium text-primary hover:underline"
          >
            {allFilteredSelected ? "Deselect all" : "Select all"}
          </button>
        </div>

        {/* Company grid */}
        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {filtered.map((company) => {
              const alreadyAdded = existingNames.has(
                company.name.toLowerCase(),
              );
              const isSelected = selected.has(company.name);
              return (
                <button
                  key={company.name}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => toggle(company.name)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors",
                    isSelected && !alreadyAdded
                      ? "border-primary bg-primary/10"
                      : isDark
                        ? "border-neutral-600 hover:border-neutral-500"
                        : "border-border hover:border-primary/40",
                    alreadyAdded && "cursor-not-allowed opacity-40",
                  )}
                >
                  {/* Check indicator */}
                  {isSelected && !alreadyAdded && (
                    <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  <Avatar className="h-10 w-10 rounded-lg">
                    <AvatarImage
                      src={company.logoUrl}
                      alt={company.name}
                      className="rounded-lg object-contain"
                    />
                    <AvatarFallback className="rounded-lg text-xs">
                      {company.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium leading-tight">
                    {company.name}
                  </span>
                  {alreadyAdded && (
                    <span className="text-[10px] text-muted-foreground">
                      Already added
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <p
              className={cn(
                "py-8 text-center text-sm text-muted-foreground",
                isDark && "text-neutral-400",
              )}
            >
              No companies match your search.
            </p>
          )}
        </div>

        {/* Footer */}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className={cn(
              isDark &&
                "border-neutral-600 text-neutral-300 hover:bg-neutral-700",
            )}
          >
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={selected.size === 0}>
            Add {selected.size > 0 ? `${selected.size} ` : ""}
            {selected.size === 1 ? "Company" : "Companies"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
