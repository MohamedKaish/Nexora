'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      if (!result.valid) { toast.error(result.error || 'Invalid file.'); return }
      setPendingImport(json)
      setImportSummary(`${result.summary?.tasks ?? 0} tasks, ${result.summary?.projects ?? 0} projects, ${result.summary?.goals ?? 0} goals, ${result.summary?.habits ?? 0} habits`)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const confirmImport = async () => {
    if (!pendingImport) return
    try {
      const result = validateImportFile(pendingImport)
      if (result.valid && result.data) {
        await importWorkspace(result.data)
        toast.success('Workspace imported! Refreshing...')
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch { toast.error('Failed to import workspace.') }
    setPendingImport(null); setImportSummary(null)
  }

  const handleReset = async () => {
    try {
      await resetWorkspace()
      toast.success('Workspace reset. Redirecting...')
      setTimeout(() => { window.location.href = '/' }, 1000)
    } catch { toast.error('Failed to reset workspace.') }
  }

  return (
    <div className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full space-y-5">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-gradient">Settings</h1>
        <p className="text-muted-foreground font-medium mt-1 text-sm">Manage your workspace preferences.</p>
      </div>

      {/* Profile */}
      <div className="world-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-xl bg-accent/8">
            <User className="w-4 h-4 text-accent" />
          </div>
          <h2 className="text-sm font-bold text-foreground">Profile</h2>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Display Name</Label>
          <Input value={preferences.displayName} onChange={e => setDisplayName(e.target.value)} className="rounded-xl max-w-sm bg-background/60 border-border/30" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4" />
          {user ? (
            <span>Signed in as <strong className="text-foreground">{user.email}</strong></span>
          ) : (
            <span>Guest workspace · <Link href="/register" className="text-accent hover:underline font-semibold">Create account</Link></span>
          )}
        </div>
      </div>

      {/* Cloud Sync */}
      {!user && (
        <div className="world-card p-5 border-accent/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-xl bg-accent/8">
              <Cloud className="w-4 h-4 text-accent" />
            </div>
            <h2 className="text-sm font-bold text-foreground">Cloud Sync</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Create an account to sync your workspace across devices.</p>
          <div className="flex gap-2">
            <Link href="/register">
              <Button className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 cursor-pointer font-semibold">Create Account</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="rounded-xl cursor-pointer font-semibold border-border/30">Sign In</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Data Management */}
      <div className="world-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-xl bg-accent/8">
            <Download className="w-4 h-4 text-accent" />
          </div>
          <h2 className="text-sm font-bold text-foreground">Data Management</h2>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-foreground/[0.02] border border-border/15">
          <div>
            <p className="text-sm font-semibold">Export Workspace</p>
            <p className="text-[11px] text-muted-foreground">Download all your data as a JSON file.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="rounded-xl cursor-pointer gap-1.5 font-semibold border-border/30">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-foreground/[0.02] border border-border/15">
          <div>
            <p className="text-sm font-semibold">Import Workspace</p>
            <p className="text-[11px] text-muted-foreground">Restore from a previously exported file.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-xl cursor-pointer gap-1.5 font-semibold border-border/30">
            <Upload className="w-3.5 h-3.5" /> Import
          </Button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
        </div>

        {pendingImport && (
          <div className="p-3.5 rounded-xl bg-accent/[0.03] border border-accent/15 space-y-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-accent" />
              <p className="text-sm font-semibold">Ready to import</p>
            </div>
            <p className="text-[11px] text-muted-foreground">{importSummary}</p>
            <p className="text-[11px] text-destructive font-semibold">This will replace all current local data.</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={confirmImport} className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 cursor-pointer gap-1 font-semibold">
                <Check className="w-3.5 h-3.5" /> Confirm Import
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setPendingImport(null); setImportSummary(null) }} className="rounded-xl cursor-pointer border-border/30">
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-destructive/[0.03] border border-destructive/15">
          <div>
            <p className="text-sm font-semibold text-destructive">Reset Workspace</p>
            <p className="text-[11px] text-muted-foreground">Delete all local data. This cannot be undone.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="outline" size="sm" className="rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 cursor-pointer gap-1.5 font-semibold" />}>
              <Trash2 className="w-3.5 h-3.5" /> Reset
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl world-glass border-border/20">
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Workspace?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your local data including tasks, projects, goals, habits, timeline entries, agent configuration, and companion customization. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl cursor-pointer">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="rounded-xl bg-destructive text-white hover:bg-destructive/90 cursor-pointer font-semibold">
                  Reset Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* About */}
      <div className="world-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-xl bg-accent/8">
            <Info className="w-4 h-4 text-accent" />
          </div>
          <h2 className="text-sm font-bold text-foreground">About</h2>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Nexora</strong> v2.0.0</p>
          <p>Personal Productivity World</p>
          <p className="text-[11px]">Local-first · Guest-friendly · Optional cloud sync</p>
        </div>
      </div>
    </div>
  )
}
