
import React, { useState, useMemo } from "react";
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
  CommandSeparator } from
"@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger } from
"@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  CatalogMaterial,
  MaterialType,
  MATERIAL_CATALOG,
  MATERIAL_TYPE_LABELS,
  MATERIAL_FAMILY_LABELS } from
"./materialCatalog";

interface MaterialComboboxProps {
  value?: string;
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
  placeholder = "Tìm vật liệu...",
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");


  const filteredMaterials = useMemo(() => {
    const query = search.toLowerCase().trim();

    return MATERIAL_CATALOG.filter(
      (m: {status: string;}) => m.status === "active"
    ).
    filter(
      (m: {materialType: any;}) =>
      !materialType || m.materialType === materialType
    ).
    filter(
      (m: {
        displayNameVi: string;
        displayNameEn: string;
        materialFamily: string | string[];
      }) => {
        if (!query) return true;
        return (
          m.displayNameVi.toLowerCase().includes(query) ||
          m.displayNameEn.toLowerCase().includes(query) ||
          m.materialFamily.includes(query));

      }
    ).
    slice(0, 15);
  }, [search, materialType]);


  const groupedMaterials = useMemo(() => {
    const groups: Record<MaterialType, CatalogMaterial[]> = {
      fabric: [],
      trim: [],
      accessory: [],
      packaging: []
    };

    filteredMaterials.forEach((m) => {
      groups[m.materialType].push(m);
    });

    return groups;
  }, [filteredMaterials]);


  const selectedMaterial = value ?
  MATERIAL_CATALOG.find((m) => m.id === value) :
  null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !selectedMaterial && "text-muted-foreground"
          )}
          disabled={disabled}>
          
          {selectedMaterial ?
          <span className="flex items-center gap-2 truncate">
              {selectedMaterial.displayNameVi}
              {selectedMaterial.isRecycled &&
            <Badge variant="secondary" className="text-xs">
                  Tái chế
                </Badge>
            }
            </span> :

          placeholder
          }
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-87.5 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Tìm vật liệu..."
            value={search}
            onValueChange={setSearch} />
          
          <CommandList>
            <CommandEmpty>
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Không tìm thấy vật liệu phù hợp
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    onOtherClick();
                  }}>
                  
                  <Plus className="w-4 h-4 mr-1" />
                  Thêm vật liệu khác
                </Button>
              </div>
            </CommandEmpty>

            
            {Object.entries(groupedMaterials).map(([type, materials]) => {
              if (materials.length === 0) return null;

              return (
                <CommandGroup
                  key={type}
                  heading={MATERIAL_TYPE_LABELS[type as MaterialType]}>
                  
                  {materials.map((material) =>
                  <CommandItem
                    key={material.id}
                    value={material.id}
                    onSelect={() => {
                      onSelect(material);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between">
                    
                      <div className="flex items-center gap-2">
                        <Check
                        className={cn(
                          "h-4 w-4",
                          value === material.id ? "opacity-100" : "opacity-0"
                        )} />
                      
                        <div>
                          <span>{material.displayNameVi}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({MATERIAL_FAMILY_LABELS[material.materialFamily]})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {material.isRecycled &&
                      <Badge variant="secondary" className="text-xs">
                            ♻
                          </Badge>
                      }
                        <span className="text-xs text-muted-foreground">
                          {material.co2Factor} kg CO₂/kg
                        </span>
                      </div>
                    </CommandItem>
                  )}
                </CommandGroup>);

            })}

            <CommandSeparator />

            
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  onOtherClick();
                }}
                className="text-primary">
                
                <Plus className="w-4 h-4 mr-2" />
                <span>Không thấy vật liệu phù hợp? Thêm vật liệu khác</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>);

};

export default MaterialCombobox;