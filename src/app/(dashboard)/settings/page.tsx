'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import {
  User, Download, Upload, Trash2, Cloud, Shield, Info, Check
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useAuth } from '@/providers/AuthProvider'
import { exportWorkspace, downloadWorkspaceFile, validateImportFile, importWorkspace, resetWorkspace } from '@/lib/workspace'
import { toast } from 'sonner'
import Link from 'next/link'

export default function SettingsPage() {
  const preferences = useAppStore((s) => s.preferences)
  const setPreferences = useAppStore((s) => s.setPreferences)
  const setDisplayName = useAppStore((s) => s.setDisplayName)
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importSummary, setImportSummary] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<string | null>(null)

  const handleExport = async () => {
    try {
      const json = await exportWorkspace(preferences)
      downloadWorkspaceFile(json)
      toast.success('Workspace exported successfully.')
    } catch (err) {
      toast.error('Failed to export workspace.')
      console.error(err)
    }
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const json = event.target?.result as string
      const result = validateImportFile(json)
      if (!result.valid) {
        toast.error(result.error || 'Invalid file.')
        return
      }
      setPendingImport(json)
      setImportSummary(
        `${result.summary?.tasks ?? 0} tasks, ${result.summary?.projects ?? 0} projects, ${result.summary?.goals ?? 0} goals, ${result.summary?.habits ?? 0} habits`
      )
    }
    reader.readAsText(file)
    // Reset input
    e.target.value = ''
  }

  const confirmImport = async () => {
    if (!pendingImport) return
    try {
      const result = validateImportFile(pendingImport)
      if (result.valid && result.data) {
        await importWorkspace(result.data)
        // Reload to pick up new data
        toast.success('Workspace imported! Refreshing...')
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch {
      toast.error('Failed to import workspace.')
    }
    setPendingImport(null)
    setImportSummary(null)
  }

  const handleReset = async () => {
    try {
      await resetWorkspace()
      toast.success('Workspace reset. Redirecting...')
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
    } catch {
      toast.error('Failed to reset workspace.')
    }
  }

  return (
    <div className="flex-1 p-6 md:p-8 max-w-3xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground font-medium mt-1">Manage your workspace preferences.</p>
      </div>

      {/* Profile */}
      <Card className="border-border/40 bg-card/60 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <User className="w-4 h-4 text-accent" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Display Name</Label>
            <Input value={preferences.displayName} onChange={e => setDisplayName(e.target.value)} className="rounded-xl max-w-sm" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            {user ? (
              <span>Signed in as <strong className="text-foreground">{user.email}</strong></span>
            ) : (
              <span>Guest workspace · <Link href="/register" className="text-accent hover:underline font-medium">Create account</Link></span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account / Cloud */}
      {!user && (
        <Card className="border-accent/20 bg-accent/5 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Cloud className="w-4 h-4 text-accent" /> Cloud Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Create an account to sync your workspace across devices, enable cloud backups, and never lose your data.
            </p>
            <div className="flex gap-2">
              <Link href="/register">
                <Button className="rounded-xl bg-accent text-white hover:bg-accent/90 cursor-pointer">
                  Create Account
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="rounded-xl cursor-pointer">
                  Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Management */}
      <Card className="border-border/40 bg-card/60 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Download className="w-4 h-4 text-accent" /> Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/30">
            <div>
              <p className="text-sm font-semibold">Export Workspace</p>
              <p className="text-xs text-muted-foreground">Download all your data as a JSON file.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} className="rounded-xl cursor-pointer gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
          </div>

          {/* Import */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/30">
            <div>
              <p className="text-sm font-semibold">Import Workspace</p>
              <p className="text-xs text-muted-foreground">Restore from a previously exported file.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-xl cursor-pointer gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Import
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </div>

          {/* Import Confirmation */}
          {pendingImport && (
            <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 space-y-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-accent" />
                <p className="text-sm font-semibold">Ready to import</p>
              </div>
              <p className="text-xs text-muted-foreground">{importSummary}</p>
              <p className="text-xs text-destructive font-medium">This will replace all current local data.</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={confirmImport} className="rounded-xl bg-accent text-white hover:bg-accent/90 cursor-pointer gap-1">
                  <Check className="w-3.5 h-3.5" /> Confirm Import
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setPendingImport(null); setImportSummary(null) }} className="rounded-xl cursor-pointer">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Reset */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/20">
            <div>
              <p className="text-sm font-semibold text-destructive">Reset Workspace</p>
              <p className="text-xs text-muted-foreground">Delete all local data. This cannot be undone.</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="outline" size="sm" className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 cursor-pointer gap-1.5" />}>
                <Trash2 className="w-3.5 h-3.5" /> Reset
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Workspace?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your local data including tasks, projects, goals, habits, timeline entries, agent configuration, and companion customization. Cloud data (if any) will NOT be affected. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl cursor-pointer">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="rounded-xl bg-destructive text-white hover:bg-destructive/90 cursor-pointer">
                    Reset Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-border/40 bg-card/60 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Info className="w-4 h-4 text-accent" /> About
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Nexora</strong> v2.0.0</p>
            <p>Personal Productivity Operating System</p>
            <p>Local-first · Guest-friendly · Optional cloud sync</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
