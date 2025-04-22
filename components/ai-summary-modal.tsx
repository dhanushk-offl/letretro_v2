"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Sparkles } from "lucide-react"

interface AISummaryModalProps {
  isOpen: boolean
  onClose: () => void
  loading: boolean
  summary: string
  roomName: string
}

export default function AISummaryModal({ isOpen, onClose, loading, summary, roomName }: AISummaryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#118AB2]" />
            AI Summary for {roomName}
          </DialogTitle>
          <DialogDescription>AI-generated summary of all retrospective notes by contributor</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[#118AB2]"></div>
              <p className="mt-4 text-center text-sm text-gray-500">Analyzing retrospective notes with Llama 3...</p>
            </div>
          ) : (
            <div className="rounded-md border-2 border-black bg-[#f8f9fa] p-4">
              {summary.split("\n").map((paragraph, index) => {
                // Check if this is a heading
                if (paragraph.startsWith("# ")) {
                  return (
                    <h1 key={index} className="mb-4 text-2xl font-bold">
                      {paragraph.replace("# ", "")}
                    </h1>
                  )
                }

                // Check if this is a subheading
                if (paragraph.startsWith("## ")) {
                  return (
                    <h2 key={index} className="mb-3 mt-4 text-xl font-bold text-[#118AB2]">
                      {paragraph.replace("## ", "")}
                    </h2>
                  )
                }

                // Check if this is a contributor heading
                if (paragraph.match(/^[A-Za-z0-9]+ contributed:/)) {
                  const [name, content] = paragraph.split(" contributed:")
                  return (
                    <div key={index} className="mb-4">
                      <h3 className="font-bold text-[#118AB2]">{name} contributed:</h3>
                      <p>{content}</p>
                    </div>
                  )
                }

                // Regular paragraph
                return paragraph ? (
                  <p key={index} className="mb-2">
                    {paragraph}
                  </p>
                ) : (
                  <br key={index} />
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="bg-[#118AB2] font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

