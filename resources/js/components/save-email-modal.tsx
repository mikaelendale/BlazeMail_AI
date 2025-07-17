"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

interface SaveEmailModalProps {
  isOpen: boolean
  onClose: () => void
  emailSubject: string
  emailBody: string
  onSave: (data: { title: string; description: string }) => void
  isSaving: boolean
}

export function SaveEmailModal({ isOpen, onClose, emailSubject, emailBody, onSave, isSaving }: SaveEmailModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({})

  // Auto-populate title with email subject when modal opens
  useEffect(() => {
    if (isOpen && emailSubject && !title) {
      setTitle(emailSubject)
    }
  }, [isOpen, emailSubject, title])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle("")
      setDescription("")
      setErrors({})
    }
  }, [isOpen])

  const validateForm = useCallback(() => {
    const newErrors: { title?: string; description?: string } = {}

    if (!title.trim()) {
      newErrors.title = "Title is required"
    } else if (title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters"
    }

    if (!description.trim()) {
      newErrors.description = "Description is required"
    } else if (description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [title, description])

  const handleSave = useCallback(() => {
    if (!validateForm()) return

    onSave({
      title: title.trim(),
      description: description.trim(),
    })
  }, [title, description, validateForm, onSave])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSave()
      }
    },
    [handleSave],
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            Save Email Template
          </DialogTitle>
          <DialogDescription>
            Save this email as a template for future use. You can find it in your saved templates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Template Title *
            </Label>
            <Input
              id="title"
              placeholder="e.g., Cold Outreach - Product Demo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving}
              className={errors.title ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
            />
            {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe when and how to use this email template..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              rows={3}
              className={errors.description ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
            />
            {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
          </div>

          {/* Email Preview */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-muted-foreground">Subject:</span>
                <p className="text-sm text-foreground line-clamp-1">{emailSubject}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Preview:</span>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {emailBody.substring(0, 120)}
                  {emailBody.length > 120 ? "..." : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="flex-1 sm:flex-none">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !description.trim()}
            className="flex-1 sm:flex-none"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Keyboard Shortcut Hint */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="rounded bg-muted px-1 py-0.5">⌘</kbd> +{" "}
            <kbd className="rounded bg-muted px-1 py-0.5">Enter</kbd> to save
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
