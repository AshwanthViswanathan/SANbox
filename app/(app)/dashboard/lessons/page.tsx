import { MOCK_LESSONS } from '@/lib/mock-data'
import { PageHeader } from '@/components/app/page-header'
import { BookOpen } from 'lucide-react'

export default function LessonsPage() {
  return (
    <div>
      <PageHeader
        title="Lessons"
        description="Available curriculum modules for TeachBox."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_LESSONS.map((lesson) => (
          <div key={lesson.lesson_id} className="panel p-5 flex flex-col gap-3 group hover:border-accent/50 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="p-2 bg-accent/10 text-accent rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs font-mono rounded-md border border-border">
                {lesson.grade_band}
              </span>
            </div>
            
            <div className="space-y-1 mt-2">
              <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors leading-tight">
                {lesson.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {lesson.topic}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
