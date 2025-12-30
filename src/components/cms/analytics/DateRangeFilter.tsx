import { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

const DateRangeFilter = ({ dateRange, onDateRangeChange }: DateRangeFilterProps) => {
  const [isCustom, setIsCustom] = useState(false);

  const presets = [
    { label: 'Last 7 days', value: '7d', from: subDays(new Date(), 7), to: new Date() },
    { label: 'Last 30 days', value: '30d', from: subDays(new Date(), 30), to: new Date() },
    { label: 'Last 90 days', value: '90d', from: subDays(new Date(), 90), to: new Date() },
    { label: 'This month', value: 'this-month', from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    { label: 'Last month', value: 'last-month', from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) },
    { label: 'All time', value: 'all', from: new Date(2024, 0, 1), to: new Date() },
  ];

  const handlePresetChange = (value: string) => {
    if (value === 'custom') {
      setIsCustom(true);
      return;
    }
    setIsCustom(false);
    const preset = presets.find(p => p.value === value);
    if (preset) {
      onDateRangeChange({ from: preset.from, to: preset.to });
    }
  };

  const getCurrentPreset = () => {
    if (isCustom) return 'custom';
    for (const preset of presets) {
      if (
        format(preset.from, 'yyyy-MM-dd') === format(dateRange.from, 'yyyy-MM-dd') &&
        format(preset.to, 'yyyy-MM-dd') === format(dateRange.to, 'yyyy-MM-dd')
      ) {
        return preset.value;
      }
    }
    return 'custom';
  };

  return (
    <div className="flex items-center gap-3">
      <Select value={getCurrentPreset()} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {presets.map(preset => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom range</SelectItem>
        </SelectContent>
      </Select>

      {isCustom && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[140px] justify-start text-left font-normal',
                  !dateRange.from && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? format(dateRange.from, 'MMM dd, yyyy') : 'From'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.from}
                onSelect={(date) => date && onDateRangeChange({ ...dateRange, from: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[140px] justify-start text-left font-normal',
                  !dateRange.to && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.to ? format(dateRange.to, 'MMM dd, yyyy') : 'To'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.to}
                onSelect={(date) => date && onDateRangeChange({ ...dateRange, to: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      <span className="text-sm text-muted-foreground">
        {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd, yyyy')}
      </span>
    </div>
  );
};

export default DateRangeFilter;
