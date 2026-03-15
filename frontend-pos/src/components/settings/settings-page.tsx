import { Save } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SettingsFormData {
  appName: string;
  defaultLanguage: string;
  logoFile: File | null;
  timezone: string;
  defaultCurrency: string;
  dateFormat: string;
}

const initialFormData: SettingsFormData = {
  appName: 'Mitbis POS',
  defaultLanguage: 'id',
  logoFile: null,
  timezone: 'Asia/Jakarta',
  defaultCurrency: 'IDR',
  dateFormat: 'DD/MM/YYYY',
};

const languages = [
  { value: 'id', label: 'Indonesia' },
  { value: 'en', label: 'English' },
];

const timezones = [
  { value: 'Asia/Jakarta', label: 'GMT +7 Jakarta' },
  { value: 'Asia/Makassar', label: 'GMT +8 Makassar' },
  { value: 'Asia/Jayapura', label: 'GMT +9 Jayapura' },
];

const currencies = [
  { value: 'IDR', label: 'Rupiah (IDR)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
];

const dateFormats = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

export function SettingsPage() {
  const [formData, setFormData] = useState<SettingsFormData>(initialFormData);
  const [logoFileName, setLogoFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof SettingsFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, logoFile: file }));
      setLogoFileName(file.name);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setLogoFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    // TODO: Implement save logic
    console.log('Saving settings:', formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola pengaturan aplikasi untuk semua cabang</p>
      </div>

      {/* Informasi Sistem Card */}
      <Card className="py-5">
        <CardContent className="space-y-6">
          <h2 className="text-base font-semibold text-gray-900">Informasi Sistem</h2>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* Nama Aplikasi */}
            <div className="space-y-1.5">
              <Label htmlFor="app-name">
                Nama Aplikasi <span className="text-red-500">*</span>
              </Label>
              <Input
                id="app-name"
                value={formData.appName}
                onChange={(e) => handleInputChange('appName', e.target.value)}
                placeholder="Nama aplikasi"
              />
            </div>

            {/* Bahasa Default */}
            <div className="space-y-1.5">
              <Label htmlFor="default-language">
                Bahasa Default <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.defaultLanguage}
                onValueChange={(value) => handleInputChange('defaultLanguage', value)}
              >
                <SelectTrigger id="default-language" className="w-full">
                  <SelectValue placeholder="Pilih bahasa" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Logo Sistem */}
            <div className="space-y-1.5">
              <Label htmlFor="logo-system">
                Logo Sistem <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="logo-system"
                  accept=".png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBrowseClick}
                  className="shrink-0"
                >
                  Telusuri File
                </Button>
                <span className="text-xs text-gray-400 truncate">
                  {logoFileName || 'Max 10MB, PNG, JPEG'}
                </span>
              </div>
            </div>

            {/* Zona Waktu */}
            <div className="space-y-1.5">
              <Label htmlFor="timezone">
                Zona Waktu <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => handleInputChange('timezone', value)}
              >
                <SelectTrigger id="timezone" className="w-full">
                  <SelectValue placeholder="Pilih zona waktu" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mata Uang Default */}
            <div className="space-y-1.5">
              <Label htmlFor="default-currency">
                Mata Uang Default <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.defaultCurrency}
                onValueChange={(value) => handleInputChange('defaultCurrency', value)}
              >
                <SelectTrigger id="default-currency" className="w-full">
                  <SelectValue placeholder="Pilih mata uang" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Format Tanggal */}
            <div className="space-y-1.5">
              <Label htmlFor="date-format">
                Format Tanggal <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.dateFormat}
                onValueChange={(value) => handleInputChange('dateFormat', value)}
              >
                <SelectTrigger id="date-format" className="w-full">
                  <SelectValue placeholder="Pilih format tanggal" />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleReset} className="px-6">
              Reset
            </Button>
            <Button type="button" onClick={handleSave} className="gap-2 px-6">
              <Save className="h-4 w-4" />
              Simpan Pengaturan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
