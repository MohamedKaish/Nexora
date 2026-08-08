'use client'

import dynamic from 'next/dynamic'
import React from 'react'

export const TimelineCalendarView = dynamic(
  () => import('./TimelineCalendarView').then(mod => mod.TimelineCalendarView),
  { ssr: false, loading: () => <div className="animate-pulse h-[800px] w-full bg-secondary/30 rounded-2xl" /> }
)
