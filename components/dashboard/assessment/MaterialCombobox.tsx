/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  CatalogMaterial,
  MaterialType,
  MATERIAL_CATALOG,
  MATERIAL_TYPE_LABELS,
  MATERIAL_FAMILY_LABELS,
} from "./materialCatalog";

interface MaterialComboboxProps {
  value?: string; // catalogMaterialId
  onSelect: (material: CatalogMaterial | null) => void;
  onOtherClick: () => void;
  materialType?: MaterialType;
  placeholder?: string;
  disabled?: boolean;
}

const MaterialCombobox: React.FC<MaterialComboboxProps> = ({
  value,
  onSelect,
  onOtherClick,
  materialType,
  placeholder,
  disabled = false,
}) => {
  const t = useTranslations("assessment.step2");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Filter materials
  const filteredMaterials = useMemo(() => {
    const query = search.toLowerCase().trim();

    return MATERIAL_CATALOG.filter(
      (m: { status: string }) => m.status === "active",
    )
      .filter(
        (m: { materialType: any }) =>
          !materialType || m.materialType === materialType,
      )
      .filter(
        (m: {
          displayNameVi: string;
          displayNameEn: string;
          materialFamily: string | string[];
        }) => {
          if (!query) return true;
          return (
            m.displayNameVi.toLowerCase().includes(query) ||
            m.displayNameEn.toLowerCase().includes(query) ||
            m.materialFamily.includes(query)
          );
        },
      )
      .slice(0, 15);
  }, [search, materialType]);

  // Group by type
  const groupedMaterials = useMemo(() => {
    const groups: Record<MaterialType, CatalogMaterial[]> = {
      fabric: [],
      trim: [],
      accessory: [],
      packaging: [],
    };

    filteredMaterials.forEach((m) => {
      groups[m.materialType].push(m);
    });

    return groups;
  }, [filteredMaterials]);

  // Get selected material
  const selectedMaterial = value
    ? MATERIAL_CATALOG.find((m) => m.id === value)
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !selectedMaterial && "text-muted-foreground",
          )}
          disabled={disabled}
        >
          {selectedMaterial ? (
            <span className="flex items-center gap-2 truncate">
              {selectedMaterial.displayNameVi}
              {selectedMaterial.isRecycled && (
                <Badge variant="secondary" className="text-xs">
                  {t("recycled")}
                </Badge>
              )}
            </span>
          ) : (
            placeholder || t("searchMaterial")
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-87.5 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("searchMaterial")}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {t("noMaterialFound")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    onOtherClick();
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t("addOtherMaterial")}
                </Button>
              </div>
            </CommandEmpty>

            {/* Grouped materials */}
            {Object.entries(groupedMaterials).map(([type, materials]) => {
              if (materials.length === 0) return null;

              return (
                <CommandGroup
                  key={type}
                  heading={MATERIAL_TYPE_LABELS[type as MaterialType]}
                >
                  {materials.map((material) => (
                    <CommandItem
                      key={material.id}
                      value={material.id}
                      onSelect={() => {
                        onSelect(material);
                        setOpen(false);
                      }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value === material.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <div>
                          <span>{material.displayNameVi}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({MATERIAL_FAMILY_LABELS[material.materialFamily]})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {material.isRecycled && (
                          <Badge variant="secondary" className="text-xs">
                            ♻
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {material.co2Factor} kg CO₂/kg
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}

            <CommandSeparator />

            {/* "Other" option */}
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  onOtherClick();
                }}
                className="text-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span>{t("noMaterialHint")}</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default MaterialCombobox;
