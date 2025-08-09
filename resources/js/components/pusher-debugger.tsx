"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PusherDebugger() {
  const [connectionStatus, setConnectionStatus] = useState('checking...')
  const [userId, setUserId] = useState<string | null>(null)
  const [lastEvent, setLastEvent] = useState<any>(null)
  const [eventCount, setEventCount] = useState(0)

  useEffect(() => {
    // Get user ID
    const userIdMeta = document.querySelector('meta[name="user-id"]')?.getAttribute("content")
    setUserId(userIdMeta)

    if (!userIdMeta) {
      setConnectionStatus('❌ No user-id meta tag found')
      return
    }

    if (!window.Echo) {
      setConnectionStatus('❌ Echo not initialized')
      return
    }

    // Test Pusher connection
    const pusher = window.Echo.connector.pusher
    
    if (pusher.connection.state === 'connected') {
      setConnectionStatus('✅ Connected')
    } else {
      setConnectionStatus(`🔄 ${pusher.connection.state}`)
    }

    // Listen for connection changes
    pusher.connection.bind('state_change', (states: any) => {
      setConnectionStatus(`🔄 ${states.current}`)
    })

    pusher.connection.bind('connected', () => {
      setConnectionStatus('✅ Connected')
    })

    pusher.connection.bind('disconnected', () => {
      setConnectionStatus('❌ Disconnected')
    })

    // Listen for job progress events
    const channel = window.Echo.private(`job-progress.${userIdMeta}`)
    
    channel.listen('.job.progress.updated', (data: any) => {
      console.log('🎉 RECEIVED JOB UPDATE:', data)
      setLastEvent(data)
      setEventCount(prev => prev + 1)
    })

    // Test channel subscription
    channel.subscribed(() => {
      console.log('✅ Successfully subscribed to job-progress channel')
    })

    channel.error((error: any) => {
      console.error('❌ Channel subscription error:', error)
      setConnectionStatus('❌ Channel error: ' + error.message)
    })

    return () => {
      channel.stopListening('.job.progress.updated')
      window.Echo.leaveChannel(`job-progress.${userIdMeta}`)
    }
  }, [])

  return (
    <Card className="fixed top-4 right-4 w-96 z-50 bg-background border">
      <CardHeader>
        <CardTitle className="text-sm">🔧 Pusher Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>User ID:</span>
          <Badge variant="outline">{userId || 'Not found'}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Connection:</span>
          <Badge variant="outline">{connectionStatus}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Events Received:</span>
          <Badge variant="outline">{eventCount}</Badge>
        </div>
        {lastEvent && (
          <div className="mt-4 p-2 bg-muted rounded text-xs">
            <div className="font-semibold">Last Event:</div>
            <div>Job ID: {lastEvent.job?.job_id}</div>
            <div>Status: {lastEvent.job?.status}</div>
            <div>Progress: {lastEvent.job?.progress_percentage}%</div>
            <div>Items: {lastEvent.job?.processed_items}/{lastEvent.job?.total_items}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
