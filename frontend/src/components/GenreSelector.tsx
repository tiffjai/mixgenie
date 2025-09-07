import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const genres = [
  "Classical",
  "Electronic/Fusion", 
  "Jazz",
  "Musical Theatre",
  "Pop",
  "Rap", 
  "Rock",
  "Singer/Songwriter",
  "World/Folk",
  "Unknown"
];

interface GenreSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

const GenreSelector = ({ value, onValueChange }: GenreSelectorProps) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        Select Genre
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a music genre..." />
        </SelectTrigger>
        <SelectContent>
          {genres.map((genre) => (
            <SelectItem key={genre} value={genre}>
              {genre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default GenreSelector;