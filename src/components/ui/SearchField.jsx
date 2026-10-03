import { forwardRef } from "react";
import { Search } from "lucide-react";

// Champ de recherche avec loupe. Le placeholder sert aussi de libellé accessible.
const SearchField = forwardRef(function SearchField({ value, onChange, placeholder, ...props }, ref) {
  return (
    <div className="relative st-search">
      <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground st-search-icon" />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-2xl border border-input bg-popover pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring st-input"
        {...props}
      />
    </div>
  );
});

export default SearchField;
