// apps/web/src/components/CaseDetails.tsx
"use client"

import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FileText, Clock, User, ArrowUp, ArrowDown } from "lucide-react"

const PRIORITY_COLOR = {
    HIGH: "bg-red-500",
    MEDIUM: "bg-yellow-500",
    LOW: "bg-green-500",
}

export function CaseDetails({ case: c }: { case: any }) {
    return (
        <div className="container mx-auto py-10 px-4 max-w-5xl space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold">{c.caseId}</h1>
                <p className="text-2xl text-muted-foreground mt-2">{c.applicantName}</p>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Category</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Badge variant="secondary" className="text-lg">{c.category}</Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Priority</CardTitle>
                        <div className={`w-4 h-4 rounded-full ${PRIORITY_COLOR[c.priority as keyof typeof PRIORITY_COLOR]}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{c.priority}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Created</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg">{format(new Date(c.createdAt), "MMM d, yyyy")}</div>
                        <p className="text-xs text-muted-foreground">{format(new Date(c.createdAt), "h:mm a")}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Contact Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span>{c.email || "No email"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-5 w-5" />
                        <span>{c.phone || "No phone"}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Timeline / Audit Trail */}
            <Card>
                <CardHeader>
                    <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {c.logs.map((log: any) => (
                            <div key={log.id} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>{log.actor.name?.[0] || "U"}</AvatarFallback>
                                    </Avatar>
                                    <div className="w-0.5 bg-border flex-1 mt-2" />
                                </div>

                                <div className="flex-1 pb-8">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium">{log.actor.name || log.actor.email}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                        </span>
                                    </div>

                                    <p className="text-sm">
                                        {log.action === "CREATED" && (
                                            <>Created this case</>
                                        )}
                                        {log.field && (
                                            <>
                                                Changed <strong>{log.field}</strong>
                                                {log.oldValue && (
                                                    <> from <code className="bg-muted px-1 rounded">{log.oldValue}</code></>
                                                )}
                                                {log.newValue && (
                                                    <> to <code className="bg-muted px-1 rounded">{log.newValue}</code></>
                                                )}
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}