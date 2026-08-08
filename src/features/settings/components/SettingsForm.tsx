'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTheme } from 'next-themes'
import { updatePreferences } from '../actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const accentColors = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Rose' },
]

interface UserPreferences {
  theme?: string;
  accent_color?: string;
  timezone?: string;
  email_notifications?: boolean;
  strict_mode?: boolean;
  ai_insights?: boolean;
  sidebar_collapsed?: boolean;
  dashboard_layout?: string;
  language?: string;
  google_calendar_sync?: boolean;
  outlook_calendar_sync?: boolean;
  pomodoro_duration?: number;
  short_break_duration?: number;
  long_break_duration?: number;
  work_start_time?: string;
  work_end_time?: string;
  auto_reflow?: boolean;
  [key: string]: unknown;
}

export function SettingsForm({ initialPrefs }: { initialPrefs: UserPreferences | null }) {
  const { theme, setTheme } = useTheme()
  const [prefs, setPrefs] = useState<UserPreferences>({
    theme: initialPrefs?.theme || 'system',
    accent_color: initialPrefs?.accent_color || '#3b82f6',
    timezone: initialPrefs?.timezone || 'UTC',
    email_notifications: initialPrefs?.email_notifications ?? true,
    strict_mode: initialPrefs?.strict_mode ?? false,
    ai_insights: initialPrefs?.ai_insights ?? true,
    sidebar_collapsed: initialPrefs?.sidebar_collapsed ?? false,
    dashboard_layout: initialPrefs?.dashboard_layout || 'grid',
    language: initialPrefs?.language || 'en',
    google_calendar_sync: initialPrefs?.google_calendar_sync ?? false,
    outlook_calendar_sync: initialPrefs?.outlook_calendar_sync ?? false,
    pomodoro_duration: initialPrefs?.pomodoro_duration ?? 25,
    short_break_duration: initialPrefs?.short_break_duration ?? 5,
    long_break_duration: initialPrefs?.long_break_duration ?? 15,
    work_start_time: initialPrefs?.work_start_time || '09:00',
    work_end_time: initialPrefs?.work_end_time || '17:00',
    auto_reflow: initialPrefs?.auto_reflow ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updatePreferences(prefs)
      if (prefs.theme && prefs.theme !== theme) {
        setTheme(prefs.theme)
      }
      toast.success('Settings saved successfully!')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleAccentChange = (color: string) => {
    setPrefs(p => ({ ...p, accent_color: color }))
    document.documentElement.style.setProperty('--primary', color)
    document.documentElement.style.setProperty('--ring', color)
    document.documentElement.style.setProperty('--sidebar-primary', color)
    document.documentElement.style.setProperty('--sidebar-ring', color)
  }

  // Update real-time for immediate visual feedback on theme
  const handleThemeChange = (value: string) => {
    setPrefs(p => ({ ...p, theme: value }))
    setTheme(value) // apply immediately for good UX
  }

  if (!mounted) return null

  return (
    <div className="grid gap-6">
      <Card className="glass-card bg-card/40 border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Appearance</CardTitle>
          <CardDescription className="text-muted-foreground">Customize the look and feel of your workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-foreground">Theme</Label>
            <RadioGroup value={prefs.theme} onValueChange={handleThemeChange} className="flex flex-col space-y-2">
              <div className="flex items-center space-x-3 bg-secondary/30 p-2.5 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors">
                <RadioGroupItem value="light" id="theme-light" className="border-muted-foreground/40 text-primary" />
                <Label htmlFor="theme-light" className="font-medium cursor-pointer flex-1">Light</Label>
              </div>
              <div className="flex items-center space-x-3 bg-secondary/30 p-2.5 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors">
                <RadioGroupItem value="dark" id="theme-dark" className="border-muted-foreground/40 text-primary" />
                <Label htmlFor="theme-dark" className="font-medium cursor-pointer flex-1">Dark</Label>
              </div>
              <div className="flex items-center space-x-3 bg-secondary/30 p-2.5 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors">
                <RadioGroupItem value="system" id="theme-system" className="border-muted-foreground/40 text-primary" />
                <Label htmlFor="theme-system" className="font-medium cursor-pointer flex-1">System</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-foreground">Accent Color</Label>
            <div className="flex gap-3">
              {accentColors.map(color => (
                <button 
                  key={color.value} 
                  onClick={() => handleAccentChange(color.value)}
                  className={`w-9 h-9 rounded-full shadow-sm transition-all focus:outline-none ring-offset-2 ring-offset-background ${prefs.accent_color === color.value ? 'ring-2 ring-primary scale-110' : 'hover:scale-110 border-2 border-border/50'}`} 
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional & Time */}
      <Card className="glass-card bg-card/40 border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Date & Time</CardTitle>
          <CardDescription className="text-muted-foreground">Configure how dates and times are displayed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 max-w-sm">
            <Label className="text-foreground">Time Zone</Label>
            <Select value={prefs.timezone} onValueChange={(v) => setPrefs(p => ({ ...p, timezone: v || 'UTC' }))}>
              <SelectTrigger className="bg-card/50 border-border/80 text-foreground h-11">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="UTC">Coordinated Universal Time (UTC)</SelectItem>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 max-w-sm">
            <Label className="text-foreground">Language</Label>
            <Select value={prefs.language} onValueChange={(v) => setPrefs(p => ({ ...p, language: v || 'en' }))}>
              <SelectTrigger className="bg-card/50 border-border/80 text-foreground h-11">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Focus Mode Durations */}
      <Card className="glass-card bg-card/40 border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Focus Mode</CardTitle>
          <CardDescription className="text-muted-foreground">Set your preferred timer durations (in minutes).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label className="text-foreground">Pomodoro</Label>
              <input 
                type="number"
                min={1}
                max={120}
                value={prefs.pomodoro_duration}
                onChange={e => setPrefs(p => ({ ...p, pomodoro_duration: parseInt(e.target.value) || 25 }))}
                className="flex h-11 w-full rounded-md border border-border/80 bg-card/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-foreground">Short Break</Label>
              <input 
                type="number"
                min={1}
                max={60}
                value={prefs.short_break_duration}
                onChange={e => setPrefs(p => ({ ...p, short_break_duration: parseInt(e.target.value) || 5 }))}
                className="flex h-11 w-full rounded-md border border-border/80 bg-card/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-foreground">Long Break</Label>
              <input 
                type="number"
                min={1}
                max={60}
                value={prefs.long_break_duration}
                onChange={e => setPrefs(p => ({ ...p, long_break_duration: parseInt(e.target.value) || 15 }))}
                className="flex h-11 w-full rounded-md border border-border/80 bg-card/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kyro Preferences */}
      <Card className="glass-card bg-card/40 border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Kyro Engine</CardTitle>
          <CardDescription className="text-muted-foreground">Configure how Kyro schedules your tasks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-foreground">Work Start Time</Label>
              <input 
                type="time"
                value={prefs.work_start_time}
                onChange={e => setPrefs(p => ({ ...p, work_start_time: e.target.value }))}
                className="flex h-11 w-full rounded-md border border-border/80 bg-card/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-foreground">Work End Time</Label>
              <input 
                type="time"
                value={prefs.work_end_time}
                onChange={e => setPrefs(p => ({ ...p, work_end_time: e.target.value }))}
                className="flex h-11 w-full rounded-md border border-border/80 bg-card/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-xl border border-border/30 mt-6">
            <div className="space-y-1 mr-4">
              <Label className="text-foreground font-medium text-base">Auto-Reflow</Label>
              <p className="text-sm text-muted-foreground leading-relaxed">Let Kyro continuously optimize your schedule when delays happen.</p>
            </div>
            <Switch 
              checked={prefs.auto_reflow} 
              onCheckedChange={(v) => setPrefs(p => ({ ...p, auto_reflow: v }))} 
              className="data-[state=checked]:bg-brand-emerald"
            />
          </div>
        </CardContent>
      </Card>

      {/* Productivity Preferences */}
      <Card className="glass-card bg-card/40 border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Productivity</CardTitle>
          <CardDescription className="text-muted-foreground">Configure the behavior of your productivity engine.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-xl border border-border/30">
            <div className="space-y-1 mr-4">
              <Label className="text-foreground font-medium text-base">Strict Mode</Label>
              <p className="text-sm text-muted-foreground leading-relaxed">Prevent marking habits complete for past days.</p>
            </div>
            <Switch 
              checked={prefs.strict_mode} 
              onCheckedChange={(v) => setPrefs(p => ({ ...p, strict_mode: v }))} 
              className="data-[state=checked]:bg-brand-rose"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-xl border border-border/30">
            <div className="space-y-1 mr-4">
              <Label className="text-foreground font-medium text-base">Kyro Insights</Label>
              <p className="text-sm text-muted-foreground leading-relaxed">Allow Kyro to generate AI-driven summaries on your dashboard.</p>
            </div>
            <Switch 
              checked={prefs.ai_insights} 
              onCheckedChange={(v) => setPrefs(p => ({ ...p, ai_insights: v }))} 
              className="data-[state=checked]:bg-brand-purple"
            />
          </div>
        </CardContent>
      </Card>

      {/* Interface Preferences */}
      <Card className="glass-card bg-card/40 border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Interface</CardTitle>
          <CardDescription className="text-muted-foreground">Customize layout and navigation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-xl border border-border/30">
            <div className="space-y-1 mr-4">
              <Label className="text-foreground font-medium text-base">Collapse Sidebar</Label>
              <p className="text-sm text-muted-foreground leading-relaxed">Minimize the sidebar by default to save space.</p>
            </div>
            <Switch 
              checked={prefs.sidebar_collapsed} 
              onCheckedChange={(v) => setPrefs(p => ({ ...p, sidebar_collapsed: v }))} 
            />
          </div>

          <div className="space-y-3 max-w-sm">
            <Label className="text-foreground">Dashboard Layout</Label>
            <Select value={prefs.dashboard_layout} onValueChange={(v) => setPrefs(p => ({ ...p, dashboard_layout: v || 'grid' }))}>
              <SelectTrigger className="bg-card/50 border-border/80 text-foreground h-11">
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="grid">Grid View</SelectItem>
                <SelectItem value="list">List View</SelectItem>
                <SelectItem value="focus">Focus Mode</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* External Calendar Integrations */}
      <Card className="glass-card bg-card/40 border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">External Calendars</CardTitle>
          <CardDescription className="text-muted-foreground">Sync external calendars to treat their events as fixed blocks in your timeline.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-xl border border-border/30">
            <div className="space-y-1 mr-4">
              <Label className="text-foreground font-medium text-base">Google Calendar</Label>
              <p className="text-sm text-muted-foreground leading-relaxed">Read-only sync for Google Calendar events.</p>
            </div>
            <Switch 
              checked={prefs.google_calendar_sync} 
              onCheckedChange={(v) => setPrefs(p => ({ ...p, google_calendar_sync: v }))} 
            />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-xl border border-border/30">
            <div className="space-y-1 mr-4">
              <Label className="text-foreground font-medium text-base">Outlook Calendar</Label>
              <p className="text-sm text-muted-foreground leading-relaxed">Read-only sync for Microsoft Outlook events.</p>
            </div>
            <Switch 
              checked={prefs.outlook_calendar_sync} 
              onCheckedChange={(v) => setPrefs(p => ({ ...p, outlook_calendar_sync: v }))} 
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4 mt-2">
        <Button variant="outline" className="border-border hover:bg-secondary/50 text-foreground transition-all h-11 px-6">Reset Defaults</Button>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all h-11 px-8 font-semibold"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
