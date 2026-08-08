'use client'

import dynamic from 'next/dynamic'
import React from 'react'

export const AnalyticsDashboard = dynamic(
  () => import('./AnalyticsDashboard').then(mod => mod.AnalyticsDashboard),
  { ssr: false, loading: () => <div className="animate-pulse h-[600px] bg-secondary/30 rounded-xl" /> }
)
