'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { SanctuaryCalibrationWizard } from '@/components/auth/SanctuaryCalibrationWizard'

export default function SetupPage() {
  const router = useRouter()

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <SanctuaryCalibrationWizard
        initialStep={1}
        onComplete={() => router.push('/dashboard')}
      />
    </div>
  )
}
