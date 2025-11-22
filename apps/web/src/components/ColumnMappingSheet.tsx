// apps/web/src/components/ColumnMappingSheet.tsx
"use client"

import { useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { X, GripVertical } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setColumnMapping } from "@/store/importFlowSlice"
import { CaseRow } from "@caseflow/db"

const requiredFields: { key: keyof CaseRow; label: string }[] = [
  { key: "case_id", label: "Case ID" },
  { key: "applicant_name", label: "Applicant Name" },
  { key: "dob", label: "Date of Birth" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "category", label: "Category" },
  { key: "priority", label: "Priority" },
]

function DraggableHeader({ header }: { header: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: header })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Badge
      ref={setNodeRef}
      style={style}
      variant="outline"
      className="cursor-grab active:cursor-grabbing select-none flex items-center gap-1.5"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-3 w-3" />
      {header}
    </Badge>
  )
}

function DroppableField({
  field,
  mappedHeader,
  onClear,
}: {
  field: { key: keyof CaseRow; label: string }
  mappedHeader: string | undefined
  onClear: () => void
}) {
  const {
    isOver,
    setNodeRef,
  } = useSortable({
    id: field.key,
    data: { type: "field" },
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
        isOver
          ? "border-primary bg-primary/10"
          : "border-dashed border-muted-foreground/30"
      }`}
    >
      <div>
        <p className="font-medium">{field.label}</p>
        {mappedHeader && (
          <p className="text-sm text-muted-foreground mt-1">← {mappedHeader}</p>
        )}
      </div>
      {mappedHeader && (
        <Button size="icon" variant="ghost" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export function ColumnMappingSheet() {
  const dispatch = useAppDispatch()
  const { headers, parsedAt } = useAppSelector((s) => s.import)
  const { columnMapping } = useAppSelector((s) => s.importFlow.present)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const isOpen = parsedAt && Object.keys(columnMapping).length === 0

  // Auto-matching on first open
  useEffect(() => {
    if (!isOpen || headers.length === 0) return

    const autoMap: Partial<Record<keyof CaseRow, string>> = {}

    headers.forEach((header) => {
      const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, "")
      requiredFields.forEach((field) => {
        const fieldKey = field.key.toLowerCase()
        const fieldLabel = field.label.toLowerCase().replace(/[^a-z0-9]/g, "")
        if (
          normalized.includes(fieldKey) ||
          normalized.includes(fieldLabel) ||
          fieldKey.includes(normalized)
        ) {
          autoMap[field.key] = header
        }
      })
    })

    if (Object.keys(autoMap).length > 0) {
      dispatch(setColumnMapping(autoMap))
    }
  }, [headers, isOpen, dispatch])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const headerId = active.id as string
    const fieldId = over.id as keyof CaseRow

    // Only allow dropping headers onto fields
    if (requiredFields.some(f => f.key === fieldId)) {
      dispatch(setColumnMapping({
        ...columnMapping,
        [fieldId]: headerId,
      }))
    }
  }

  const handleClear = (field: keyof CaseRow) => {
    const newMapping = { ...columnMapping }
    delete newMapping[field]
    dispatch(setColumnMapping(newMapping))
  }

  const mappedCount = Object.keys(columnMapping).length

  return (
    <Sheet open={Boolean(isOpen)}>
      <SheetContent side="right" className="w-[600px] sm:max-w-none overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Map CSV Columns</SheetTitle>
          <SheetDescription>
            Drag your CSV headers onto the required fields. Auto-matched where possible.
          </SheetDescription>
        </SheetHeader>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="mt-8 space-y-8">
            {/* Target Fields */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Required Fields</h3>
              <div className="space-y-3">
                <SortableContext
                  items={requiredFields.map(f => f.key)}
                  strategy={verticalListSortingStrategy}
                >
                  {requiredFields.map((field) => (
                    <DroppableField
                      key={field.key}
                      field={field}
                      mappedHeader={columnMapping[field.key]}
                      onClear={() => handleClear(field.key)}
                    />
                  ))}
                </SortableContext>
              </div>
            </div>

            {/* Source Headers */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Your CSV Headers</h3>
              <div className="flex flex-wrap gap-2">
                <SortableContext
                  items={headers}
                  strategy={verticalListSortingStrategy}
                >
                  {headers.map((header) => {
                    const isUsed = Object.values(columnMapping).includes(header)
                    return (
                      <DraggableHeader
                        key={header}
                        header={header}
                        // Optional: disable if already used
                        // disabled={isUsed}
                      />
                    )
                  })}
                </SortableContext>
              </div>
            </div>
          </div>
        </DndContext>

        <div className="mt-10 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {mappedCount} of {requiredFields.length} fields mapped
          </p>
          <Button
            size="lg"
            onClick={() => {}}
            disabled={mappedCount < requiredFields.length}
          >
            Continue to Review
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}