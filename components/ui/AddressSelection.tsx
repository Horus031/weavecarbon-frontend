import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";

export interface AddressData {
  streetAddress: string;
  aptSuite: string;
  city: string;
  state: string;
  zipPostcode: string;
  country: string;
  lat?: string;
  lng?: string;
}

interface AddressSelectionProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  label?: string;
  showCoordinates?: boolean;
  className?: string;
}

const COUNTRIES = [
{ code: "VN", name: "Việt Nam" },
{ code: "US", name: "United States" },
{ code: "CN", name: "China" },
{ code: "JP", name: "Japan" },
{ code: "KR", name: "South Korea" },
{ code: "DE", name: "Germany" },
{ code: "FR", name: "France" },
{ code: "GB", name: "United Kingdom" },
{ code: "AU", name: "Australia" },
{ code: "CA", name: "Canada" },
{ code: "SG", name: "Singapore" },
{ code: "TH", name: "Thailand" },
{ code: "MY", name: "Malaysia" },
{ code: "ID", name: "Indonesia" },
{ code: "PH", name: "Philippines" },
{ code: "IN", name: "India" },
{ code: "NL", name: "Netherlands" },
{ code: "IT", name: "Italy" },
{ code: "ES", name: "Spain" },
{ code: "BR", name: "Brazil" },
{ code: "MX", name: "Mexico" },
{ code: "AE", name: "United Arab Emirates" },
{ code: "SA", name: "Saudi Arabia" },
{ code: "TW", name: "Taiwan" },
{ code: "HK", name: "Hong Kong" }];



const US_STATES = [
{ code: "AL", name: "Alabama" },
{ code: "AK", name: "Alaska" },
{ code: "AZ", name: "Arizona" },
{ code: "AR", name: "Arkansas" },
{ code: "CA", name: "California" },
{ code: "CO", name: "Colorado" },
{ code: "CT", name: "Connecticut" },
{ code: "DE", name: "Delaware" },
{ code: "FL", name: "Florida" },
{ code: "GA", name: "Georgia" },
{ code: "HI", name: "Hawaii" },
{ code: "ID", name: "Idaho" },
{ code: "IL", name: "Illinois" },
{ code: "IN", name: "Indiana" },
{ code: "IA", name: "Iowa" },
{ code: "KS", name: "Kansas" },
{ code: "KY", name: "Kentucky" },
{ code: "LA", name: "Louisiana" },
{ code: "ME", name: "Maine" },
{ code: "MD", name: "Maryland" },
{ code: "MA", name: "Massachusetts" },
{ code: "MI", name: "Michigan" },
{ code: "MN", name: "Minnesota" },
{ code: "MS", name: "Mississippi" },
{ code: "MO", name: "Missouri" },
{ code: "MT", name: "Montana" },
{ code: "NE", name: "Nebraska" },
{ code: "NV", name: "Nevada" },
{ code: "NH", name: "New Hampshire" },
{ code: "NJ", name: "New Jersey" },
{ code: "NM", name: "New Mexico" },
{ code: "NY", name: "New York" },
{ code: "NC", name: "North Carolina" },
{ code: "ND", name: "North Dakota" },
{ code: "OH", name: "Ohio" },
{ code: "OK", name: "Oklahoma" },
{ code: "OR", name: "Oregon" },
{ code: "PA", name: "Pennsylvania" },
{ code: "RI", name: "Rhode Island" },
{ code: "SC", name: "South Carolina" },
{ code: "SD", name: "South Dakota" },
{ code: "TN", name: "Tennessee" },
{ code: "TX", name: "Texas" },
{ code: "UT", name: "Utah" },
{ code: "VT", name: "Vermont" },
{ code: "VA", name: "Virginia" },
{ code: "WA", name: "Washington" },
{ code: "WV", name: "West Virginia" },
{ code: "WI", name: "Wisconsin" },
{ code: "WY", name: "Wyoming" }];



const VN_PROVINCES = [
{ code: "HN", name: "Hà Nội" },
{ code: "HCM", name: "TP. Hồ Chí Minh" },
{ code: "DN", name: "Đà Nẵng" },
{ code: "HP", name: "Hải Phòng" },
{ code: "CT", name: "Cần Thơ" },
{ code: "BD", name: "Bình Dương" },
{ code: "DDN", name: "Đồng Nai" },
{ code: "BT", name: "Bình Thuận" },
{ code: "KH", name: "Khánh Hòa" },
{ code: "HG", name: "Hà Giang" },
{ code: "CB", name: "Cao Bằng" },
{ code: "LS", name: "Lạng Sơn" },
{ code: "QN", name: "Quảng Ninh" },
{ code: "TH", name: "Thanh Hóa" },
{ code: "NA", name: "Nghệ An" },
{ code: "HT", name: "Hà Tĩnh" },
{ code: "QB", name: "Quảng Bình" },
{ code: "QT", name: "Quảng Trị" },
{ code: "TT", name: "Thừa Thiên Huế" },
{ code: "QNA", name: "Quảng Nam" },
{ code: "QNG", name: "Quảng Ngãi" },
{ code: "BDI", name: "Bình Định" },
{ code: "PY", name: "Phú Yên" },
{ code: "GL", name: "Gia Lai" },
{ code: "DL", name: "Đắk Lắk" },
{ code: "LDD", name: "Lâm Đồng" },
{ code: "NT", name: "Ninh Thuận" },
{ code: "TNI", name: "Tây Ninh" },
{ code: "BP", name: "Bình Phước" },
{ code: "VT", name: "Bà Rịa - Vũng Tàu" },
{ code: "LA", name: "Long An" },
{ code: "TG", name: "Tiền Giang" },
{ code: "BT2", name: "Bến Tre" },
{ code: "TV", name: "Trà Vinh" },
{ code: "VL", name: "Vĩnh Long" },
{ code: "DDT", name: "Đồng Tháp" },
{ code: "AG", name: "An Giang" },
{ code: "KG", name: "Kiên Giang" },
{ code: "HGI", name: "Hậu Giang" },
{ code: "ST", name: "Sóc Trăng" },
{ code: "BL", name: "Bạc Liêu" },
{ code: "CM", name: "Cà Mau" }];


const AddressSelection: React.FC<AddressSelectionProps> = ({
  value,
  onChange,
  label,
  showCoordinates = false,
  className = ""
}) => {
  const updateField = (field: keyof AddressData, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const getStateProvinceOptions = () => {
    if (value.country === "US") {
      return US_STATES;
    }
    if (value.country === "VN") {
      return VN_PROVINCES;
    }
    return [];
  };

  const stateProvinceOptions = getStateProvinceOptions();
  const showStateDropdown = stateProvinceOptions.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {label && <Label className="text-sm font-medium">{label}</Label>}

      
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Địa chỉ / Street Address *
        </Label>
        <Input
          placeholder="123 Main Street"
          value={value.streetAddress}
          onChange={(e) => updateField("streetAddress", e.target.value)}
          className="bg-background border border-foreground/10" />

      </div>

      
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Apt, Suite, etc (optional)
        </Label>
        <Input
          placeholder="Apt 4B, Suite 100, Floor 2..."
          value={value.aptSuite}
          onChange={(e) => updateField("aptSuite", e.target.value)}
          className="bg-background border border-foreground/10" />

      </div>

      
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Thành phố / City *
        </Label>
        <Input
          placeholder="Ho Chi Minh City"
          value={value.city}
          onChange={(e) => updateField("city", e.target.value)}
          className="bg-background border border-foreground/10" />

      </div>

      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {value.country === "VN" ? "Tỉnh/Thành phố" : "State / Province"}
          </Label>
          {showStateDropdown ?
          <Select
            value={value.state}
            onValueChange={(v) => updateField("state", v)}>

              <SelectTrigger className="bg-background border border-foreground/10">
                <SelectValue placeholder="Chọn..." />
              </SelectTrigger>
              <SelectContent className="max-h-60 bg-background border shadow-lg z-50">
                {stateProvinceOptions.map((item) =>
              <SelectItem key={item.code} value={item.code}>
                    {item.name}
                  </SelectItem>
              )}
              </SelectContent>
            </Select> :

          <Input
            placeholder="State or Province"
            value={value.state}
            onChange={(e) => updateField("state", e.target.value)}
            className="bg-background border border-foreground/10" />

          }
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Zip / Postcode
          </Label>
          <Input
            placeholder="700000"
            value={value.zipPostcode}
            onChange={(e) => updateField("zipPostcode", e.target.value)}
            className="bg-background border border-foreground/10" />

        </div>
      </div>

      
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Quốc gia / Country *
        </Label>
        <Select
          value={value.country}
          onValueChange={(v) => {

            onChange({ ...value, country: v, state: "" });
          }}>

          <SelectTrigger className="bg-background border border-foreground/10">
            <SelectValue placeholder="Chọn quốc gia..." />
          </SelectTrigger>
          <SelectContent className="max-h-60 bg-background border shadow-lg z-50">
            {COUNTRIES.map((country) =>
            <SelectItem key={country.code} value={country.code}>
                {country.name}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      
      {showCoordinates &&
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Latitude</Label>
            <Input
            placeholder="10.7769"
            value={value.lat || ""}
            onChange={(e) => updateField("lat", e.target.value)}
            className="bg-background border border-foreground/10" />

          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Longitude</Label>
            <Input
            placeholder="106.7009"
            value={value.lng || ""}
            onChange={(e) => updateField("lng", e.target.value)}
            className="bg-background border border-foreground/10" />

          </div>
        </div>
      }
    </div>);

};

export default AddressSelection;