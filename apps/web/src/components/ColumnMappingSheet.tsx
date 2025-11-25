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
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { X, GripVertical } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setColumnMapping } from "@/store/importSlice"

// -------------------------------------------------------------
// REQUIRED FIELDS — MUST MATCH *CaseRow* keys exactly
// -------------------------------------------------------------
const requiredFields = [
  { key: "caseId" as const, label: "Case ID" },
  { key: "applicantName" as const, label: "Applicant Name" },
  { key: "dob" as const, label: "Date of Birth" },
  { key: "email" as const, label: "Email" },
  { key: "phone" as const, label: "Phone" },
  { key: "category" as const, label: "Category" },
  { key: "priority" as const, label: "Priority" },
] as const

type FieldKey = (typeof requiredFields)[number]["key"]

// -------------------------------------------------------------
// CSV ALIASES: auto-detect CSV headers → internal camelCase fields
// -------------------------------------------------------------
const CSV_ALIAS_MAP: Record<FieldKey, string[]> = {
  caseId: ["caseid", "case_id", "case-id", "case id", "case"],
  applicantName: ["applicantname", "applicant_name", "applicant-name", "applicant name", "name"],
  dob: ["dob", "dateofbirth", "date_of_birth", "date-of-birth", "birthdate"],
  email: ["email", "mail"],
  phone: ["phone", "mobile", "contact"],
  category: ["category", "type"],
  priority: ["priority", "prio"],
}

// -------------------------------------------------------------
// DRAGGABLE HEADER CHIP
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// DROPPABLE FIELD BLOCK (left side)
// -------------------------------------------------------------
function DroppableField({
  field,
  mappedHeader,
  onClear,
}: {
  field: { key: FieldKey; label: string }
  mappedHeader: string | undefined
  onClear: () => void
}) {
  const { isOver, setNodeRef } = useSortable({
    id: field.key, // camelCase IDs
    data: { type: "field" },
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
        isOver ? "border-primary bg-primary/10" : "border-dashed border-muted-foreground/30"
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

// -------------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------------
export function ColumnMappingSheet() {
  const dispatch = useAppDispatch()
  const { headers, parsedAt, columnMapping } = useAppSelector((s) => s.import)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const isOpen = parsedAt && Object.keys(columnMapping).length === 0

  // -------------------------------------------------------------
  // AUTO-MAP on first open
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || headers.length === 0) return

    const autoMap: Partial<Record<FieldKey, string>> = {}

    headers.forEach((header) => {
      const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, "")

      ;(Object.keys(CSV_ALIAS_MAP) as FieldKey[]).forEach((field) => {
        if (CSV_ALIAS_MAP[field].includes(normalized)) {
          autoMap[field] = header
        }
      })
    })

    if (Object.keys(autoMap).length > 0) {
      dispatch(setColumnMapping(autoMap))
    }
  }, [headers, isOpen, dispatch])

  // -------------------------------------------------------------
  // DRAG END — map CSV header → camelCase field
  // -------------------------------------------------------------
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const headerId = active.id as string
    const fieldId = over.id as FieldKey // camelCase

    if (requiredFields.some((f) => f.key === fieldId)) {
      dispatch(
        setColumnMapping({
          ...columnMapping,
          [fieldId]: headerId, // camelCase key stored!
        })
      )
    }
  }

  // -------------------------------------------------------------
  // CLEAR MAPPING
  // -------------------------------------------------------------
  const handleClear = (fieldKey: FieldKey) => {
    const newMapping = { ...columnMapping }
    delete newMapping[fieldKey] // camelCase key
    dispatch(setColumnMapping(newMapping))
  }

  const mappedCount = Object.keys(columnMapping).length

  return (
    <Sheet open={Boolean(isOpen)}>
      <SheetContent side="right" className="w-[600px] sm:max-w-none overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Map CSV Columns</SheetTitle>
          <SheetDescription>
            Drag your CSV headers onto the required fields. Auto-mapped where possible.
          </SheetDescription>
        </SheetHeader>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="mt-8 space-y-8">

            {/* Required Fields */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Required Fields</h3>
              <div className="space-y-3">
                <SortableContext
                  items={requiredFields.map((f) => f.key)}
                  strategy={verticalListSortingStrategy}
                >
                  {requiredFields.map((field) => (
                    <DroppableField
                      key={field.key}
                      field={field}
                      mappedHeader={columnMapping[field.key]} // camelCase OK
                      onClear={() => handleClear(field.key)}
                    />
                  ))}
                </SortableContext>
              </div>
            </div>

            {/* CSV Headers */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Your CSV Headers</h3>
              <div className="flex flex-wrap gap-2">
                <SortableContext items={headers} strategy={verticalListSortingStrategy}>
                  {headers.map((header) => (
                    <DraggableHeader key={header} header={header} />
                  ))}
                </SortableContext>
              </div>
            </div>
          </div>
        </DndContext>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {mappedCount} of {requiredFields.length} fields mapped
          </p>
          <Button size="lg" disabled={mappedCount < requiredFields.length}>
            Continue to Review
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
